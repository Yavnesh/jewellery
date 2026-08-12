import Razorpay from "razorpay";
import crypto from "crypto";
import { PaymentProvider } from "../../domain/payment-provider";
import {
  PaymentProviderAdapter,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifyPaymentInput,
  PaymentVerificationResult,
  CancelPaymentInput,
  CancelPaymentResult,
  ProviderWebhookEvent,
} from "../../domain/payment.types";
import { env } from "@/lib/env";

export class RazorpayPaymentAdapter implements PaymentProviderAdapter {
  public readonly provider = PaymentProvider.RAZORPAY;
  private client: Razorpay;

  constructor() {
    this.client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const order = await this.client.orders.create({
        amount: input.amount.amountMinor,
        currency: input.amount.currency,
        receipt: input.paymentId, // Link internal payment ID
        notes: {
          orderId: input.orderId,
          ...input.metadata,
        },
      });

      return {
        provider: this.provider,
        providerPaymentId: order.id,
        status: "REQUIRES_ACTION", // Requires client to complete the payment via SDK
        clientAction: {
          type: "SDK",
          publicKey: env.RAZORPAY_KEY_ID,
          sessionId: order.id, // In Razorpay, order.id acts as session
        },
        providerMetadata: {
          receipt: order.receipt as string,
        },
      };
    } catch (error) {
      console.error("Razorpay create payment failed", error);
      throw new Error("Failed to create Razorpay payment");
    }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    try {
      // Typically verified via Razorpay signature in payload
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input.providerPayload as any;
      
      const generatedSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return { success: false, status: "FAILED", providerPaymentId: razorpay_payment_id };
      }

      return {
        success: true,
        status: "SUCCEEDED",
        providerPaymentId: razorpay_payment_id,
      };
    } catch (error) {
      return { success: false, status: "FAILED" };
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentResult> {
    // Razorpay doesn't formally 'cancel' unpaid orders. They simply expire or are ignored.
    return { success: true, status: "CANCELLED" };
  }

  async parseWebhook(rawBody: string, headers: Headers): Promise<ProviderWebhookEvent> {
    const signature = headers.get("x-razorpay-signature");
    if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) {
      throw new Error("Missing Razorpay signature or webhook secret not configured");
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      throw new Error("Invalid Razorpay webhook signature");
    }

    const payload = JSON.parse(rawBody);

    return {
      eventId: payload.id ?? crypto.randomUUID(), // Extract real ID if exists
      type: payload.event,
      payload: payload,
      provider: this.provider,
    };
  }
}
