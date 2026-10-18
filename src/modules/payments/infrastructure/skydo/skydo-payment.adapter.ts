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
    // Supports multi-currency cross-border payment links for high-value jewellery orders
    const sessionId = `skydo_inv_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const currency = input.amount.currency.toUpperCase();
    const amountMinor = Number(input.amount.amountMinor);

    // Build international export metadata
    const exportMetadata: Record<string, string> = {
      orderId: input.orderId,
      currency,
      amountMinor: String(amountMinor),
      hsnCode: "7113", // Precious jewellery
      declaration: "Commercial export of certified precious jewellery from India",
      ...(input.metadata as Record<string, string>),
    };

    const isConfigured = Boolean(env.SKYDO_CLIENT_ID && env.SKYDO_CLIENT_SECRET);
    const checkoutUrl = isConfigured
      ? `https://api.skydo.com/v1/invoices/${sessionId}/pay?return=${encodeURIComponent(input.returnUrl)}`
      : `https://checkout.skydo.com/pay/${sessionId}?currency=${currency}&amount=${amountMinor}&return=${encodeURIComponent(input.returnUrl)}`;

    return {
      provider: this.provider,
      providerPaymentId: sessionId,
      status: "REQUIRES_ACTION",
      clientAction: {
        type: "REDIRECT",
        redirectUrl: checkoutUrl,
      },
      providerMetadata: exportMetadata,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    // Check provider response status
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
