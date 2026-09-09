import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";

export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "dateTime";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const shippingStatus = searchParams.get("shippingStatus") || "";
    const carrier = searchParams.get("carrier") || "";

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      where.paymentStatus = paymentStatus;
    }

    if (carrier && carrier !== "ALL") {
      where.shipments = {
        some: { courier: { contains: carrier } },
      };
    }

    if (shippingStatus && shippingStatus !== "ALL") {
      if (shippingStatus === "NOT_SHIPPED") {
        where.shipments = { none: {} };
      } else {
        where.shipments = {
          some: { status: shippingStatus },
        };
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { name: { contains: search } },
        { lastname: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { city: { contains: search } },
        { shipments: { some: { trackingNumber: { contains: search } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.customer_order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          products: {
            include: {
              product: { select: { title: true, mainImage: true } },
              variant: { select: { sku: true, title: true } },
            },
          },
          shipments: {
            orderBy: { createdAt: "desc" },
            include: {
              events: { orderBy: { eventAt: "desc" }, take: 1 },
            },
          },
          refunds: true,
          returns: true,
        },
      }),
      prisma.customer_order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => {
        const latestShipment = o.shipments[0];
        const primaryCarrier = latestShipment?.courier || (o.shipments.length > 0 ? "Multiple Carriers" : "—");
        const primaryTracking = latestShipment?.trackingNumber || "—";
        const primaryShippingStatus = latestShipment?.status || "NOT_SHIPPED";
        const primaryEta = latestShipment?.estimatedDeliveryAt;

        return {
          id: o.id,
          customerName: `${o.name} ${o.lastname}`.trim(),
          email: o.email,
          phone: o.phone,
          total: o.total,
          status: o.status,
          paymentStatus: o.paymentStatus,
          dateTime: o.dateTime,
          city: o.city,
          country: o.country,
          itemCount: o.products.reduce((acc, p) => acc + p.quantity, 0),
          products: o.products.map((p) => ({
            title: p.product?.title || "Item",
            quantity: p.quantity,
            price: p.priceAtPurchase,
            sku: p.variant?.sku,
            image: p.product?.mainImage,
          })),
          shipmentCount: o.shipments.length,
          carrier: primaryCarrier,
          trackingNumber: primaryTracking,
          shippingStatus: primaryShippingStatus,
          estimatedDeliveryAt: primaryEta,
          lastTrackingUpdate: latestShipment?.events[0]?.description || (latestShipment ? "Shipment active" : "Awaiting dispatch"),
          hasRefund: o.refunds.length > 0,
          hasReturn: o.returns.length > 0,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Orders list error:", error);
    return NextResponse.json({ error: error.message || "Failed to load orders" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { orderIds, status, paymentStatus, action } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "No orders selected" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const result = await prisma.customer_order.updateMany({
      where: { id: { in: orderIds } },
      data: updateData,
    });

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: `BULK_UPDATE_ORDERS_${action || "STATUS"}`,
      entityType: "ORDER",
      entityId: orderIds.join(","),
      newValue: updateData,
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error: any) {
    console.error("Bulk update orders error:", error);
    return NextResponse.json({ error: error.message || "Failed to update orders" }, { status: 500 });
  }
}
