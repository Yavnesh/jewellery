import { PaymentProvider } from "./payment-provider";

export type Money = {
  amountMinor: number;
  currency: string;
};

export type CreatePaymentInput = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amount: Money;
  customer: {
    id: string;
    email: string;
    name: string;
  };
  metadata: Record<string, string>;
  idempotencyKey: string;
  returnUrl: string;
};

export type CreatePaymentResult = {
  provider: PaymentProvider;
  providerPaymentId: string;
  status:
    | "REQUIRES_ACTION"
    | "PROCESSING"
    | "PENDING"
    | "SUCCEEDED"
    | "FAILED";

  clientAction:
    | {
        type: "REDIRECT";
        redirectUrl: string;
      }
    | {
        type: "SDK";
        publicKey: string;
        sessionId: string;
      }
    | {
        type: "NONE";
      };

  providerMetadata?: Record<string, string>;
};

export type VerifyPaymentInput = {
  paymentId: string;
  providerPaymentId?: string;
  providerPayload?: Record<string, unknown>;
};

export type PaymentVerificationResult = {
  success: boolean;
  status: string;
  providerPaymentId?: string;
};

export type CancelPaymentInput = {
  paymentId: string;
  providerPaymentId: string;
  reason?: string;
};

export type CancelPaymentResult = {
  success: boolean;
  status: string;
};

export type ProviderWebhookEvent = {
  eventId: string;
  type: string;
  payload: any;
  provider: PaymentProvider;
};

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;

  createPayment(
    input: CreatePaymentInput,
  ): Promise<CreatePaymentResult>;

  verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<PaymentVerificationResult>;

  cancelPayment(
    input: CancelPaymentInput,
  ): Promise<CancelPaymentResult>;

  parseWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<ProviderWebhookEvent>;
}
