import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const filter = searchParams.get("filter") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { product: { title: { contains: search } } },
      ];
    }

    if (filter === "low") {
      where.stockQuantity = { lte: 5, gt: 0 };
    } else if (filter === "out") {
      where.stockQuantity = { lte: 0 };
    }

    const variants = await prisma.productVariant.findMany({
      where,
      orderBy: { stockQuantity: "asc" },
      include: {
        product: { select: { id: true, title: true, mainImage: true, category: { select: { name: true } } } },
        inventory: true,
        inventoryEvents: { take: 3, orderBy: { createdAt: "desc" } },
      },
    });

    const totalStockUnits = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    const totalStockValue = variants.reduce((sum, v) => sum + (v.stockQuantity * v.price), 0);
    const lowStockCount = variants.filter((v) => v.stockQuantity <= 5 && v.stockQuantity > 0).length;
    const outOfStockCount = variants.filter((v) => v.stockQuantity <= 0).length;

    return NextResponse.json({
      summary: {
        totalStockUnits,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
        totalTrackedSkus: variants.length,
      },
      items: variants.map((v) => ({
        id: v.id,
        productId: v.productId,
        productTitle: v.product?.title || "Product",
        productImage: v.product?.mainImage,
        category: v.product?.category?.name || "General",
        sku: v.sku,
        barcode: v.barcode,
        price: v.price,
        stockQuantity: v.stockQuantity,
        reservedQuantity: v.reservedQuantity,
        available: Math.max(0, v.stockQuantity - v.reservedQuantity),
        status: v.status,
        updatedAt: v.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load inventory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { variantId, quantityChange, reason, notes } = body;

    if (!variantId || quantityChange === undefined) {
      return NextResponse.json({ error: "Missing variantId or quantity change" }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const newStock = Math.max(0, variant.stockQuantity + parseInt(quantityChange));

    // Update variant & create inventory event
    const [updatedVariant] = await prisma.$transaction([
      prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: newStock },
      }),
      prisma.inventoryEvent.create({
        data: {
          variantId,
          type: "STOCK_ADJUSTMENT",
          quantity: parseInt(quantityChange),
          reason: reason || "Manual Admin Adjustment",
        },
      }),
      // Also update main product inStock count
      prisma.product.update({
        where: { id: variant.productId },
        data: { inStock: newStock },
      }),
    ]);

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "ADJUST_STOCK",
      entityType: "INVENTORY",
      entityId: variantId,
      oldValue: { previousStock: variant.stockQuantity },
      newValue: { newStock, change: quantityChange, reason, notes },
    });

    return NextResponse.json({ success: true, variant: updatedVariant });
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return NextResponse.json({ error: error.message || "Failed to adjust stock" }, { status: 500 });
  }
}
