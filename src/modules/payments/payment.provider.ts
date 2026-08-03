import { CreatePaymentInput, PaymentIntentResult, WebhookVerificationInput, VerifiedWebhookEvent } from './payment.types';

export interface PaymentProvider {
  createPaymentIntent(input: CreatePaymentInput): Promise<PaymentIntentResult>;
  verifyWebhook(input: WebhookVerificationInput): Promise<VerifiedWebhookEvent>;
}
