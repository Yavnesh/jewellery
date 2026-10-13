import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";
import { verifyElevatedSession } from "@/lib/elevatedAuthHelper";
import prisma from "@/utils/db";

// POST: Execute or Preview bulk operations (e.g., category-wide discount)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      previewOnly = false,
      scope, // "CATEGORY" | "SELECTED_PRODUCTS"
      categoryId,
      productIds,
      discountPercentage,
      setDiscountActive = true,
      updateSellingPrice = true,
      requireReverification = true,
    } = body;

    // Build product filter
    const where: any = { deletedAt: null };
    if (scope === "CATEGORY") {
      if (!categoryId) return NextResponse.json({ error: "Category ID required for category scope" }, { status: 400 });
      where.categoryId = categoryId;
    } else if (scope === "SELECTED_PRODUCTS") {
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return NextResponse.json({ error: "Product IDs array required" }, { status: 400 });
      }
      where.id = { in: productIds };
    } else {
      return NextResponse.json({ error: "Invalid scope. Must be CATEGORY or SELECTED_PRODUCTS" }, { status: 400 });
    }

    const pct = parseFloat(discountPercentage || "0");
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json({ error: "Discount percentage must be between 0 and 100" }, { status: 400 });
    }

    // Fetch matching products
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        originalPrice: true,
        discountPercentage: true,
        discountActive: true,
        verificationStatus: true,
        version: true,
      },
    });

    // Calculate simulation preview
    const previewList = products.map((p) => {
      // Base original price (use originalPrice if set, or current price as fallback)
      const baseOriginal = p.originalPrice || p.price;
      const newCalculatedSellingPrice = updateSellingPrice
        ? Math.round(baseOriginal * (1 - pct / 100))
        : p.price;

      return {
        id: p.id,
        title: p.title,
        currentOriginalPrice: baseOriginal,
        currentPrice: p.price,
        newPrice: newCalculatedSellingPrice,
        newDiscountPercentage: pct,
        newDiscountActive: setDiscountActive,
        currentVerificationStatus: p.verificationStatus,
        newVerificationStatus: "VERIFIED",
      };
    });

    if (previewOnly) {
      // Regular admin or DBA can preview simulation without elevated credentials
      const auth = await verifyAdminAuth();
      if (!auth.authorized) return auth.response;

      return NextResponse.json({
        success: true,
        summary: {
          totalMatched: products.length,
          discountPercentage: pct,
          setDiscountActive,
          updateSellingPrice,
          requireReverification: false,
        },
        previewSample: previewList.slice(0, 15),
      });
    }

    // Direct Execution requires elevated DBA session!
    const elevated = await verifyElevatedSession(req);
    if (!elevated.authorized) return elevated.response;

    // Execute atomic batch transaction
    await prisma.$transaction(async (tx) => {
      for (const item of previewList) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            originalPrice: item.currentOriginalPrice,
            price: item.newPrice,
            discountPercentage: item.newDiscountPercentage,
            discountActive: item.newDiscountActive,
            verificationStatus: "VERIFIED",
            verifiedAt: new Date(),
            verifiedById: (elevated.user as any).id,
            version: { increment: 1 },
          },
        });
      }
    });

    await recordAuditLog({
      actorId: (elevated.user as any).id,
      action: "BULK_DISCOUNT_APPLIED",
      entityType: "ProductBulk",
      entityId: categoryId || "SELECTED_PRODUCTS",
      newValue: {
        totalAffected: products.length,
        discountPercentage: pct,
        scope,
        categoryId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully executed bulk update on ${products.length} products.`,
      affectedCount: products.length,
    });
  } catch (error: any) {
    console.error("Error executing bulk operation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
