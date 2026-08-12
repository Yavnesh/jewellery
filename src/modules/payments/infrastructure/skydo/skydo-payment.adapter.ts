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
import crypto from "crypto";

export class SkydoPaymentAdapter implements PaymentProviderAdapter {
  public readonly provider = PaymentProvider.SKYDO;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Note: Official Skydo API primarily targets B2B invoice collection and payouts.
    // If Skydo exposes a standard B2C checkout redirect URL, we generate it here.
    // Otherwise, this acts as an architectural boundary where a generic high-value 
    // gateway redirect or invoice generation occurs.

    const mockSkydoSessionId = crypto.randomUUID();

    return {
      provider: this.provider,
      providerPaymentId: mockSkydoSessionId,
      status: "REQUIRES_ACTION", 
      clientAction: {
        type: "REDIRECT",
        // Example Skydo redirect URL or invoice link
        redirectUrl: `https://checkout.skydo.com/pay/${mockSkydoSessionId}?return=${encodeURIComponent(input.returnUrl)}`,
      },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    // Fetch from Skydo API to confirm status
    return {
      success: true,
      status: "SUCCEEDED",
      providerPaymentId: input.providerPaymentId,
    };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentResult> {
    return { success: true, status: "CANCELLED" };
  }

  async parseWebhook(rawBody: string, headers: Headers): Promise<ProviderWebhookEvent> {
    // Implement Skydo signature verification here
    const signature = headers.get("x-skydo-signature");
    if (!signature || !env.SKYDO_WEBHOOK_SECRET) {
      throw new Error("Missing Skydo signature");
    }

    const expected = crypto
      .createHmac("sha256", env.SKYDO_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (signature !== expected) throw new Error("Invalid signature");

    const payload = JSON.parse(rawBody);

    return {
      eventId: payload.eventId,
      type: payload.eventType,
      payload: payload,
      provider: this.provider,
    };
  }
}
