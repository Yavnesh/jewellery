import { NextRequest, NextResponse } from "next/server";
import { paymentProviderRegistry } from "@/src/modules/payments/application/payment-provider-registry";
import { webhookProcessor } from "@/src/modules/payments/application/payment-verification.service";
import { PaymentProvider } from "@/src/modules/payments/domain/payment-provider";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const adapter = paymentProviderRegistry.get(PaymentProvider.RAZORPAY);

    const event = await adapter.parseWebhook(rawBody, req.headers);

    await webhookProcessor.process(event);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook Error", message: error.message },
      { status: 400 }
    );
  }
}
