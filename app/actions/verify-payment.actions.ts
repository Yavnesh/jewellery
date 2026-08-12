"use server";

import { paymentVerificationService } from "@/src/modules/payments/application/payment-verification.service";
import { PaymentProvider } from "@/src/modules/payments/domain/payment-provider";

export async function verifyPaymentSignatureAction(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  try {
    const result = await paymentVerificationService.verifyPayment({
      provider: PaymentProvider.RAZORPAY,
      paymentId: payload.razorpay_order_id, // Dummy paymentId as it's required by type but Razorpay uses order_id
      providerPayload: payload,
    });
    
    return { success: result.success };
  } catch (error: any) {
    console.error("Verification Action Error:", error);
    return { success: false, error: error.message };
  }
}
