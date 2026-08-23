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

    // Calculate USD equivalent
    let amountInUSD = input.amount.amountMinor / 100;
    if (input.amount.currency === "INR") {
      const exchangeRate = 83;
      amountInUSD = amountInUSD / exchangeRate;
    }

    // If the price of item when converted to dollar is more than 1000
    if (amountInUSD >= 1000) {
      return PaymentProvider.SKYDO;
    }

    return PaymentProvider.RAZORPAY;
  }
}
