import { PaymentProvider } from "./payment-provider";

export class UnsupportedPaymentCurrencyError extends Error {
  constructor(public readonly currency: string) {
    super(`Unsupported payment currency: ${currency}`);
    this.name = "UnsupportedPaymentCurrencyError";
  }
}

export class PaymentProviderNotConfiguredError extends Error {
  constructor(public readonly provider: PaymentProvider) {
    super(`Payment provider not configured: ${provider}`);
    this.name = "PaymentProviderNotConfiguredError";
  }
}

export class PaymentProcessingError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "PaymentProcessingError";
  }
}
