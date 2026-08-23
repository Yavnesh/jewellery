import { NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { logger } from '@/src/lib/logger/logger';
import { PaymentStatus } from '@prisma/client';

export async function GET() {
  try {
    // 1. Fetch pending webhook events in FIFO order
    const pendingEvents = await prisma.incomingWebhookEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 10 // process in batches of 10
    });

    for (const webhook of pendingEvents) {
      try {
        const event = JSON.parse(webhook.payload);

        // Process webhook business logic inside an atomic transaction
        await prisma.$transaction(async (tx) => {
          // Double check idempotency inside transaction
          const existingProcessed = await tx.paymentEvent.findUnique({
            where: {
              provider_providerEventId: {
                provider: 'PAYMENT_EVENT_RAZORPAY', // unique key namespace prefix
                providerEventId: event.providerEventId
              }
            }
          });

          if (existingProcessed) {
            logger.warn({ eventId: event.providerEventId }, 'Event already processed inside transaction lock');
            return;
          }

          // 2. Persist to PaymentEvent (Marks as processed)
          await tx.paymentEvent.create({
            data: {
              provider: 'RAZORPAY',
              providerEventId: event.providerEventId,
              eventType: event.type,
              payload: event.data,
              processedAt: new Date()
            }
          });

          // 3. Handle Business Logic (e.g. updating order status to PAID)
          if (event.type === 'payment_intent.succeeded') {
            const orderId = event.data.metadata?.orderId;
            if (!orderId) {
              throw new Error('Missing orderId in payment intent metadata');
            }

            // Lock Order row for updates (FOR UPDATE)
            const lockedOrders = await tx.$queryRaw<any[]>`
              SELECT id, total, paymentStatus FROM Customer_order WHERE id = ${orderId} FOR UPDATE
            `;
            const lockedOrder = lockedOrders[0];
            if (!lockedOrder) {
              throw new Error('Order not found');
            }

            // Prevent Price Tampering: Verify total matches paid amount
            // Gateways report payment amount in minor units (cents/paise)
            const paymentAmount = Number(event.data.amount);
            if (paymentAmount !== lockedOrder.total) {
              throw new Error(`Anti-tampering alert: Amount mismatch (Paid: ${paymentAmount}, Order: ${lockedOrder.total})`);
            }

            if (lockedOrder.paymentStatus !== PaymentStatus.SUCCEEDED) {
              // Update order to PAID
              await tx.customer_order.update({
                where: { id: orderId },
                data: {
                  paymentStatus: PaymentStatus.SUCCEEDED,
                  status: 'PAID'
                }
              });

              // 4. Finalize Inventory from RESERVATION to PURCHASE
              const items = await tx.customer_order_product.findMany({
                where: { customerOrderId: orderId }
              });

              for (const item of items) {
                if (item.variantId) {
                  // Decrement reserve and decrement onHand stock
                  await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                      reservedQuantity: { decrement: item.quantity },
                      stockQuantity: { decrement: item.quantity }
                    }
                  });

                  // Update Inventory aggregate row
                  const inventory = await tx.inventory.findUnique({
                    where: { variantId: item.variantId }
                  });

                  if (inventory) {
                    await tx.inventory.update({
                      where: { id: inventory.id },
                      data: {
                        reserved: { decrement: item.quantity },
                        onHand: { decrement: item.quantity }
                      }
                    });
                  }

                  // Write Finalization event to InventoryEvent audit log
                  await tx.inventoryEvent.create({
                    data: {
                      variantId: item.variantId,
                      type: 'ORDER_FULFILLMENT',
                      quantity: item.quantity,
                      referenceId: orderId,
                      reason: 'Order paid successfully - inventory fulfilled'
                    }
                  });
                }
              }

              // 5. Create Transactional Outbox Event for notification delivery
              await tx.outboxEvent.create({
                data: {
                  eventType: 'ORDER_PAID',
                  aggregateType: 'Customer_order',
                  aggregateId: orderId,
                  payload: {
                    orderId: orderId,
                    email: event.data.receipt_email || 'customer@test.com',
                    amount: paymentAmount
                  },
                  status: 'PENDING'
                }
              });
            }
          }
        });

        // Mark webhook event as processed successfully
        await prisma.incomingWebhookEvent.update({
          where: { id: webhook.id },
          data: { status: 'PROCESSED' }
        });
      } catch (err: any) {
        logger.error({ webhookId: webhook.id, error: err.message }, 'Failed to process individual webhook event from queue');
        await prisma.incomingWebhookEvent.update({
          where: { id: webhook.id },
          data: { status: 'FAILED' }
        });
      }
    }

    return NextResponse.json({ processedCount: pendingEvents.length });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Payment queue processor job failed');
    return NextResponse.json({ error: 'Queue Processor Failed' }, { status: 500 });
  }
}
