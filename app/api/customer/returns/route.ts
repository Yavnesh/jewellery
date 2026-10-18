import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, reason, exchangeCta } = body;

    if (!orderId || !reason) {
      return NextResponse.json({ error: "Order ID and return reason are required" }, { status: 400 });
    }

    const currentUserId = (session.user as any).id;
    const currentUserEmail = session.user.email;

    // Verify order exists and belongs to the authenticated customer
    const order = await prisma.customer_order.findFirst({
      where: {
        id: orderId,
        OR: [
          ...(currentUserId ? [{ userId: currentUserId }] : []),
          ...(currentUserEmail ? [{ email: currentUserEmail }] : []),
        ],
      },
      include: {
        returns: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or does not belong to your account" }, { status: 404 });
    }

    // Check if order is eligible for return (delivered, paid, and within 15-day return window)
    const existingActiveReturn = order.returns.find(
      (r) => r.status === "REQUESTED" || r.status === "PENDING" || r.status === "APPROVED"
    );
    if (existingActiveReturn) {
      return NextResponse.json(
        { error: "A return request is already in progress for this order", returnId: existingActiveReturn.id },
        { status: 409 }
      );
    }

    // Create the Return Record in Prisma
    const newReturn = await prisma.orderReturn.create({
      data: {
        orderId: order.id,
        reason: reason.trim(),
        exchangeCta: exchangeCta ? Boolean(exchangeCta) : false,
        status: "REQUESTED",
      },
    });

    // Enqueue an outbox event to alert admin & customer
    await prisma.outboxEvent.create({
      data: {
        eventType: "RETURN_REQUESTED",
        aggregateType: "ORDER_RETURN",
        aggregateId: newReturn.id,
        payload: {
          orderId: order.id,
          returnId: newReturn.id,
          customerName: `${order.name} ${order.lastname}`.trim(),
          customerEmail: order.email,
          reason,
          exchangeCta,
        },
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Return request submitted successfully. Our concierge team will review your request within 24 hours.",
      return: newReturn,
    });
  } catch (error: any) {
    console.error("[Customer Return API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to submit return request" }, { status: 500 });
  }
}
