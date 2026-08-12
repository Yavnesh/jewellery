import { PaymentProvider } from "../domain/payment-provider";
import { Money } from "../domain/payment.types";
import { UnsupportedPaymentCurrencyError } from "../domain/payment.errors";
import { env } from "@/lib/env";

export interface PaymentRoutingPolicy {
  selectProvider(input: {
    amount: Money;
    customerId: string;
    orderId: string;
  }): PaymentProvider;
}

export class AmountBasedPaymentRoutingPolicy implements PaymentRoutingPolicy {
  selectProvider(input: {
    amount: Money;
    customerId: string;
    orderId: string;
  }): PaymentProvider {
    if (input.amount.currency !== env.PAYMENT_ROUTING_CURRENCY) {
      throw new UnsupportedPaymentCurrencyError(input.amount.currency);
    }

    // Assuming currency is INR, calculate USD equivalent
    // 1 USD is approximately 83 INR (using a fixed conversion for now)
    const exchangeRate = 83;
    const amountInINR = input.amount.amountMinor / 100;
    const amountInUSD = amountInINR / exchangeRate;

    // If the price of item when converted to dollar is more than 2000
    if (amountInUSD > 2000) {
      return PaymentProvider.SKYDO;
    }

    return PaymentProvider.RAZORPAY;
  }
}
