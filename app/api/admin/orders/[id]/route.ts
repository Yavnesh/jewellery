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

    const order = await prisma.customer_order.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
            variant: {
              include: { optionValues: { include: { optionValue: true } } },
            },
          },
        },
        shipments: {
          orderBy: { createdAt: "desc" },
          include: {
            events: { orderBy: { eventAt: "desc" } },
            items: {
              include: {
                orderProduct: {
                  include: {
                    product: true,
                    variant: true,
                  },
                },
              },
            },
          },
        },
        refunds: true,
        returns: true,
        coupons: { include: { coupon: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          include: { attempts: true },
        },
        addressSnapshot: true,
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch customer profile & lifetime value if userId exists
    let customerStats = {
      orderCount: 1,
      totalSpent: order.total,
      profile: null as any,
    };

    if (order.userId) {
      const [userOrders, userProfile] = await Promise.all([
        prisma.customer_order.findMany({
          where: { userId: order.userId },
          select: { total: true },
        }),
        prisma.user.findUnique({
          where: { id: order.userId },
          include: { profile: true, addresses: true },
        }),
      ]);

      customerStats = {
        orderCount: userOrders.length,
        totalSpent: userOrders.reduce((sum, o) => sum + o.total, 0),
        profile: userProfile,
      };
    }

    return NextResponse.json({
      order,
      customerStats,
    });
  } catch (error: any) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: error.message || "Failed to load order details" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus, orderNotice, trackingNumber, courier } = body;

    const existingOrder = await prisma.customer_order.findUnique({ where: { id } });
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.customer_order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(orderNotice !== undefined && { orderNotice }),
      },
    });

    // Handle shipment creation or update if tracking provided
    if (trackingNumber && courier) {
      const existingShipment = await prisma.orderShipment.findFirst({
        where: { orderId: id },
      });

      if (existingShipment) {
        await prisma.orderShipment.update({
          where: { id: existingShipment.id },
          data: {
            courier,
            trackingNumber,
            status: "IN_TRANSIT",
          },
        });
      } else {
        await prisma.orderShipment.create({
          data: {
            orderId: id,
            courier,
            trackingNumber,
            status: "IN_TRANSIT",
            events: {
              create: {
                status: "IN_TRANSIT",
                description: `Shipment dispatched via ${courier}`,
                source: "ADMIN",
              },
            },
          },
        });
      }
    }

    await recordAuditLog({
      actorId: (auth.user as any)?.id || "admin",
      action: "UPDATE_ORDER",
      entityType: "ORDER",
      entityId: id,
      oldValue: existingOrder,
      newValue: updatedOrder,
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: error.message || "Failed to update order" }, { status: 500 });
  }
}
