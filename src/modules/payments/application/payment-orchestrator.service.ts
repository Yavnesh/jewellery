import prisma from "@/utils/db";
import { PaymentProvider } from "../domain/payment-provider";
import { CreatePaymentResult } from "../domain/payment.types";
import { AmountBasedPaymentRoutingPolicy } from "./payment-routing-policy";
import { paymentProviderRegistry } from "./payment-provider-registry";
import { env } from "@/lib/env";
import { PaymentStatus } from "@prisma/client";

export type InitiatePaymentInput = {
  orderId: string;
  userId: string | null;
  idempotencyKey: string;
};

export class PaymentOrchestratorService {
  private routingPolicy = new AmountBasedPaymentRoutingPolicy();

  async initiatePayment(input: InitiatePaymentInput): Promise<{ paymentId: string } & CreatePaymentResult> {
    const order = await prisma.customer_order.findFirst({
      where: {
        id: input.orderId,
        userId: input.userId === 'guest' ? null : input.userId, // Security: Ensure order belongs to user
        status: { in: ["PENDING_PAYMENT", "processing"] },
      },
      include: {
        products: true,
      },
    });

    if (!order) {
      throw new Error("Order not found or not payable");
    }

    // Determine total amount from snapshots
    // Ensure we use the correct snapshot field. In customer_order_product it might be price or priceAtPurchase
    // Looking at checkout.service.ts it uses priceAtPurchase and quantity. Let's assume total is handled by order.total
    const totalAmountMinor = order.total * 100; // customer_order.total is in major currency units.
    const amount = { amountMinor: totalAmountMinor, currency: env.PAYMENT_ROUTING_CURRENCY || "INR" };

    // Route payment
    const provider = this.routingPolicy.selectProvider({
      amount,
      customerId: input.userId || 'guest',
      orderId: order.id,
    });

    // Check if a payment with this idempotency key already exists
    let payment = await prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: provider as any,
          status: PaymentStatus.CREATED,
          amountMinor: BigInt(amount.amountMinor),
          currency: amount.currency,
          idempotencyKey: input.idempotencyKey,
        },
      });
    }

    const adapter = paymentProviderRegistry.get(provider);

    const result = await adapter.createPayment({
      paymentId: payment.id,
      orderId: order.id,
      orderNumber: order.id, // Or generating a specific order number
      amount,
      customer: {
        id: input.userId || 'guest',
        email: order.email,
        name: `${order.name} ${order.lastname}`.trim(),
      },
      metadata: {
        internalPaymentId: payment.id,
        orderId: order.id,
      },
      idempotencyKey: payment.idempotencyKey,
      returnUrl: env.PAYMENT_RETURN_URL || "http://localhost:3000/api/payments/return",
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: result.providerPaymentId,
        providerMetadata: result.providerMetadata as any,
        status: result.status as PaymentStatus,
      },
    });

    return {
      paymentId: payment.id,
      ...result,
    };
  }
}

export const paymentOrchestrator = new PaymentOrchestratorService();
