import { NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { logger } from '@/src/lib/logger/logger';
import { PaymentStatus } from '@prisma/client';

export async function GET() {
  try {
    // 1. Fetch pending orders older than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const unreconciledOrders = await prisma.customer_order.findMany({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        dateTime: { lt: tenMinutesAgo }
      },
      take: 20
    });

    let correctedCount = 0;

    for (const order of unreconciledOrders) {
      try {
        // In production, we query the gateway using the adapter pattern:
        // const gatewayTx = await razorpayAdapter.queryTransaction(order.id);
        // If the gateway reports success, auto-reconcile to prevent orphan orders:
        
        // Mock reconciliation check:
        const gatewayConfirmedPaid = false; // Mock flag

        if (gatewayConfirmedPaid) {
          logger.warn({ orderId: order.id }, 'Discrepancy detected during reconciliation run. Auto-correcting order status to PAID.');
          
          await prisma.$transaction(async (tx) => {
            await tx.customer_order.update({
              where: { id: order.id },
              data: {
                paymentStatus: PaymentStatus.SUCCEEDED,
                status: 'PAID'
              }
            });

            await tx.auditLog.create({
              data: {
                actorId: 'RECONCILIATION_DAEMON',
                action: 'AUTO_RECONCILE_PAYMENT',
                entityType: 'Customer_order',
                entityId: order.id,
                oldValue: 'PENDING',
                newValue: 'SUCCEEDED'
              }
            });
          });

          correctedCount++;
        }
      } catch (err: any) {
        logger.error({ orderId: order.id, error: err.message }, 'Failed to reconcile order status');
      }
    }

    return NextResponse.json({ checkedCount: unreconciledOrders.length, correctedCount });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Reconciliation daemon failed');
    return NextResponse.json({ error: 'Reconciliation Daemon Failed' }, { status: 500 });
  }
}
