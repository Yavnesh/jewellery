import { PaymentProvider } from './payment.provider';
import { CreatePaymentInput, PaymentIntentResult, WebhookVerificationInput, VerifiedWebhookEvent } from './payment.types';
import crypto from 'crypto';

/**
 * A dummy payment provider since the exact provider (Stripe, Razorpay, etc.) is unconfirmed.
 * This simulates a secure server-side intent creation.
 */
export class DummyPaymentProvider implements PaymentProvider {
  async createPaymentIntent(input: CreatePaymentInput): Promise<PaymentIntentResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      providerIntentId: `pi_dummy_${crypto.randomUUID()}`,
      clientSecret: `sec_dummy_${crypto.randomBytes(16).toString('hex')}`,
      status: 'requires_payment_method'
    };
  }

  async verifyWebhook(input: WebhookVerificationInput): Promise<VerifiedWebhookEvent> {
    // In a real provider, we would verify `input.signature` against `input.rawBody` using the provider SDK.
    // For this dummy, we just parse the body.
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const payload = JSON.parse(input.rawBody);
      
      return {
        providerEventId: payload.id || `evt_dummy_${crypto.randomUUID()}`,
        type: payload.type || 'payment_intent.succeeded',
        data: payload
      };
    } catch (e: any) {
      throw new Error(`Invalid dummy webhook payload: ${e.message}`);
    }
  }
}
