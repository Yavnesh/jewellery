import prisma from "@/utils/db";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  try {
    // Check authorization for cron job (optional if using Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find orders stuck in PENDING_PAYMENT for more than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const expiredOrders = await prisma.customer_order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        dateTime: {
          lt: fifteenMinutesAgo
        }
      },
      include: {
        products: true
      }
    });

    let releasedCount = 0;

    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        // Mark order as cancelled
        await tx.customer_order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' }
        });

        // Release reserved stock for each product in the order
        for (const item of order.products) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { reservedQuantity: { decrement: item.quantity } }
            });

            await tx.inventoryEvent.create({
              data: {
                variantId: item.variantId,
                type: "RESERVATION_RELEASE",
                quantity: item.quantity,
                referenceId: order.id,
                reason: "Order expired (15 min timeout)"
              }
            });
            releasedCount++;
          }
        }
      });
    }

    return new NextResponse(JSON.stringify({ 
      success: true, 
      releasedReservations: releasedCount,
      expiredOrdersCount: expiredOrders.length
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Failed to release expired reservations:", error);
    return new NextResponse(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};
