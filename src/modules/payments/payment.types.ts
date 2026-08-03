export interface CreatePaymentInput {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
}

export interface PaymentIntentResult {
  providerIntentId: string;
  clientSecret: string; // The token the browser uses to complete checkout securely
  status: string;
}

export interface WebhookVerificationInput {
  rawBody: string;
  signature: string;
}

export interface VerifiedWebhookEvent {
  providerEventId: string;
  type: string;
  data: any;
}
