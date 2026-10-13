import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, parentId } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Atomic cascade transaction: update category & sync products
    const result = await prisma.$transaction(async (tx) => {
      const updatedCat = await tx.category.update({
        where: { id },
        data: {
          name: trimmedName,
          slug,
          parentId: parentId || null,
        },
      });

      // Update products of this category (touch version and mark required re-verification)
      const affectedProducts = await tx.product.updateMany({
        where: { categoryId: id },
        data: {
          version: { increment: 1 },
          verificationStatus: "VERIFICATION_REQUIRED",
        },
      });

      return { updatedCat, affectedCount: affectedProducts.count };
    });

    await recordAuditLog({
      actorId: (auth.user as any).id,
      action: "CATEGORY_UPDATED_CASCADE",
      entityType: "Category",
      entityId: id,
      oldValue: { name: existingCategory.name, slug: existingCategory.slug },
      newValue: {
        name: trimmedName,
        slug,
        affectedProducts: result.affectedCount,
      },
    });

    return NextResponse.json({
      success: true,
      category: result.updatedCat,
      affectedProducts: result.affectedCount,
      message: `Category updated to "${trimmedName}". Cascaded updates across ${result.affectedCount} products.`,
    });
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reassignToCategoryId = searchParams.get("reassignToCategoryId");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const productCount = existingCategory._count.products;

    if (productCount > 0 && !reassignToCategoryId) {
      return NextResponse.json(
        {
          error: `Cannot delete category containing ${productCount} products without reassigning them. Provide a reassignToCategoryId or move products first.`,
          hasProducts: true,
          productCount,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // If reassign target specified, move products first
      if (reassignToCategoryId) {
        const targetCategory = await tx.category.findUnique({
          where: { id: reassignToCategoryId },
        });

        if (!targetCategory) {
          throw new Error("Target reassignment category does not exist");
        }

        await tx.product.updateMany({
          where: { categoryId: id },
          data: {
            categoryId: reassignToCategoryId,
            version: { increment: 1 },
            verificationStatus: "VERIFICATION_REQUIRED",
          },
        });
      }

      // Delete the category
      await tx.category.delete({
        where: { id },
      });
    });

    await recordAuditLog({
      actorId: (auth.user as any).id,
      action: "CATEGORY_DELETED",
      entityType: "Category",
      entityId: id,
      oldValue: { name: existingCategory.name, productCount },
      newValue: { reassignedTo: reassignToCategoryId || "NONE" },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${existingCategory.name}" deleted successfully.${
        reassignToCategoryId ? ` ${productCount} products reassigned.` : ""
      }`,
    });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}

