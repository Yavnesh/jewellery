import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const returns = await prisma.orderReturn.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            products: {
              include: { product: { select: { title: true, mainImage: true } } },
            },
            refunds: true,
          },
        },
      },
    });

    return NextResponse.json({
      returns: returns.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        customerName: `${r.order?.name} ${r.order?.lastname}`.trim(),
        customerEmail: r.order?.email,
        reason: r.reason,
        status: r.status,
        exchangeCta: r.exchangeCta,
        orderTotal: r.order?.total || 0,
        createdAt: r.createdAt,
        products: r.order?.products.map((p) => ({
          title: p.product?.title || "Product",
          image: p.product?.mainImage,
          quantity: p.quantity,
          price: p.priceAtPurchase,
        })),
        refunds: r.order?.refunds || [],
      })),
    });
  } catch (error: any) {
    console.error("Returns fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load returns" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { returnId, status, refundAmount, reason } = body;

    if (!returnId || !status) {
      return NextResponse.json({ error: "Missing returnId or status" }, { status: 400 });
    }

    const orderReturn = await prisma.orderReturn.findUnique({
      where: { id: returnId },
      include: { order: true },
    });

    if (!orderReturn) {
      return NextResponse.json({ error: "Return record not found" }, { status: 404 });
    }

    const updated = await prisma.orderReturn.update({
      where: { id: returnId },
      data: { status },
    });

    // If status is REFUNDED or APPROVED_REFUND, record an OrderRefund if amount specified
    if (status === "REFUNDED" && refundAmount) {
      await prisma.orderRefund.create({
        data: {
          orderId: orderReturn.orderId,
          gatewayRefundId: `rfnd_man_${Date.now()}`,
          amount: parseInt(refundAmount),
          status: "COMPLETED",
          reason: reason || orderReturn.reason,
        },
      });

      await prisma.customer_order.update({
        where: { id: orderReturn.orderId },
        data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
      });
    }

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "PROCESS_RETURN",
      entityType: "RETURN",
      entityId: returnId,
      newValue: { status, refundAmount },
    });

    return NextResponse.json({ success: true, return: updated });
  } catch (error: any) {
    console.error("Update return status error:", error);
    return NextResponse.json({ error: error.message || "Failed to update return" }, { status: 500 });
  }
}
