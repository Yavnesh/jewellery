import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const [product, categories, merchants] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: {
            include: {
              inventory: true,
              optionValues: { include: { optionValue: true } },
            },
          },
          options: { include: { values: true } },
          translations: true,
          reviews: { take: 5, orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.category.findMany(),
      prisma.merchant.findMany(),
    ]);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product,
      categories,
      merchants,
    });
  } catch (error: any) {
    console.error("Product detail error:", error);
    return NextResponse.json({ error: error.message || "Failed to load product" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const {
      title,
      slug,
      price,
      originalPrice,
      description,
      categoryId,
      merchantId,
      mainImage,
      inStock,
      manufacturer,
      metalType,
      purity,
      weight,
      occasion,
      collection,
      featured,
      isBestseller,
      isNewArrival,
    } = body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(price !== undefined && { price: parseInt(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseInt(originalPrice) : null }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId }),
        ...(merchantId && { merchantId }),
        ...(mainImage && { mainImage }),
        ...(inStock !== undefined && { inStock: parseInt(inStock) }),
        ...(manufacturer && { manufacturer }),
        ...(metalType !== undefined && { metalType }),
        ...(purity !== undefined && { purity }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(occasion !== undefined && { occasion }),
        ...(collection !== undefined && { collection }),
        ...(featured !== undefined && { featured: Boolean(featured) }),
        ...(isBestseller !== undefined && { isBestseller: Boolean(isBestseller) }),
        ...(isNewArrival !== undefined && { isNewArrival: Boolean(isNewArrival) }),
      },
    });

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "UPDATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: id,
      oldValue: existingProduct,
      newValue: updated,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "DELETE_PRODUCT",
      entityType: "PRODUCT",
      entityId: id,
      oldValue: existingProduct,
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
