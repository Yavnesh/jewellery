import prisma from "@/utils/db";
import { ProviderWebhookEvent } from "../domain/payment.types";
import { PaymentStatus, OrderStatus, PaymentProvider } from "@prisma/client";

export class PaymentWebhookProcessor {
  async process(event: ProviderWebhookEvent): Promise<void> {
    // 1. Idempotency Check
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: event.provider,
          providerEventId: event.eventId,
        },
      },
    });

    if (existingEvent) {
      console.log("Webhook already processed:", event.eventId);
      return;
    }

    // 2. Persist event initially
    const savedEvent = await prisma.paymentEvent.create({
      data: {
        provider: event.provider,
        providerEventId: event.eventId,
        eventType: event.type,
        payload: event.payload as any,
      },
    });

    // 3. Process the event transactionally
    await prisma.$transaction(async (tx) => {
      let providerPaymentId: string | undefined;
      let newPaymentStatus: PaymentStatus | undefined;
      let newOrderStatus: OrderStatus | undefined;

      // Extract provider payment ID based on provider logic
      if (event.provider === "RAZORPAY") {
        providerPaymentId = event.payload.payload?.payment?.entity?.order_id;
        if (event.type === "payment.captured") {
          newPaymentStatus = "SUCCEEDED";
          newOrderStatus = "PAID";
        } else if (event.type === "payment.failed") {
          newPaymentStatus = "FAILED";
          newOrderStatus = "PAYMENT_FAILED";
        }
      } else if (event.provider === "SKYDO") {
        providerPaymentId = event.payload.paymentId;
        if (event.type === "PAYMENT_SUCCESS") {
          newPaymentStatus = "SUCCEEDED";
          newOrderStatus = "PAID";
        }
      }

      if (!providerPaymentId || !newPaymentStatus) return;

      const payment = await tx.payment.findFirst({
        where: { providerPaymentId, provider: event.provider as any },
        include: { order: { include: { products: true } } },
      });

      if (!payment) {
        throw new Error("Payment record not found for webhook");
      }

      // 4. Update Payment State
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: newPaymentStatus },
      });

      // 5. Update Order State
      if (newOrderStatus) {
        await tx.customer_order.update({
          where: { id: payment.orderId },
          data: { status: newOrderStatus as string }, // Coerce string if enum not yet fully migrated
        });
      }

      // 6. Commit Inventory (if success) or Release (if failed)
      if (newPaymentStatus === "SUCCEEDED") {
        for (const item of payment.order.products) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                reservedQuantity: { decrement: item.quantity },
                stockQuantity: { decrement: item.quantity },
              },
            });
            // Write to ledger
            await tx.inventoryEvent.create({
              data: {
                variantId: item.variantId,
                type: "ORDER_FULFILLMENT",
                quantity: -item.quantity,
                referenceId: payment.order.id,
                reason: "Payment verified and order paid"
              }
            });
          }
        }

        // Clear Cart
        if (payment.order.cartId) {
          await tx.cart.update({
            where: { id: payment.order.cartId },
            data: { status: "CONVERTED", sessionId: null, userId: null }
          });
        }

        // Queue order confirmation email
        await tx.outboxEvent.create({
          data: {
            eventType: "ORDER_PAID",
            aggregateType: "ORDER",
            aggregateId: payment.order.id,
            payload: { orderId: payment.order.id }
          }
        });
      } else if (newPaymentStatus === "FAILED" || newPaymentStatus === "CANCELLED") {
        // Release reservation
        for (const item of payment.order.products) {
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
                referenceId: payment.order.id,
                reason: "Payment failed/cancelled"
              }
            });
          }
        }
      }
    });

    // Mark processed
    await prisma.paymentEvent.update({
      where: { id: savedEvent.id },
      data: { processedAt: new Date() },
    });
  }
}

export const webhookProcessor = new PaymentWebhookProcessor();

import { paymentProviderRegistry } from "./payment-provider-registry";
import { VerifyPaymentInput } from "../domain/payment.types";

export class ClientPaymentVerificationService {
  async verifyPayment(input: VerifyPaymentInput & { provider: PaymentProvider }) {
    const adapter = paymentProviderRegistry.get(input.provider as any);
    
    // 1. Verify cryptographic signature via adapter
    const verification = await adapter.verifyPayment(input);
    
    if (!verification.success || !verification.providerPaymentId) {
      return { success: false, error: "Signature verification failed" };
    }

    // 2. Perform DB updates (similar to webhook processor but for frontend success)
    // We construct a synthetic event to reuse the webhook processor logic for DB updates!
    // This ensures cart clearing, inventory deduction, and emails trigger identically.
    const syntheticEvent: ProviderWebhookEvent = {
      eventId: `client_verify_${input.paymentId}_${Date.now()}`,
      type: "payment.captured", // Razorpay specific success event type mapping
      provider: input.provider as any,
      payload: {
        payload: {
          payment: {
            entity: {
              order_id: input.paymentId // We passed razorpay_order_id as paymentId in the server action
            }
          }
        }
      }
    };

    if (input.provider === "SKYDO") {
        syntheticEvent.type = "PAYMENT_SUCCESS";
        syntheticEvent.payload = { paymentId: verification.providerPaymentId };
    }

    try {
      await webhookProcessor.process(syntheticEvent);
      return { success: true };
    } catch (e: any) {
      console.error("Error processing client payment verification:", e);
      return { success: false, error: "Failed to finalize order in database" };
    }
  }
}

export const paymentVerificationService = new ClientPaymentVerificationService();
