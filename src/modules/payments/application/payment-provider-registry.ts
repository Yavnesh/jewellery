import { PaymentProvider } from "../domain/payment-provider";
import { PaymentProviderAdapter } from "../domain/payment.types";
import { PaymentProviderNotConfiguredError } from "../domain/payment.errors";

export class PaymentProviderRegistry {
  private readonly providers = new Map<PaymentProvider, PaymentProviderAdapter>();

  register(adapter: PaymentProviderAdapter): void {
    this.providers.set(adapter.provider, adapter);
  }

  get(provider: PaymentProvider): PaymentProviderAdapter {
    const adapter = this.providers.get(provider);

    if (!adapter) {
      throw new PaymentProviderNotConfiguredError(provider);
    }

    return adapter;
  }
}

// Export a singleton instance of the registry
export const paymentProviderRegistry = new PaymentProviderRegistry();

// Initialize registry (avoids circular dependency if done carefully)
// In a real DI setup (like NestJS), this would be injected.
import { RazorpayPaymentAdapter } from "../infrastructure/razorpay/razorpay-payment.adapter";
import { SkydoPaymentAdapter } from "../infrastructure/skydo/skydo-payment.adapter";

paymentProviderRegistry.register(new RazorpayPaymentAdapter());
paymentProviderRegistry.register(new SkydoPaymentAdapter());
