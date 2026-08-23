import { describe, it, expect, vi } from "vitest";
import { AmountBasedPaymentRoutingPolicy } from "../../src/modules/payments/application/payment-routing-policy";
import { PaymentProvider } from "../../src/modules/payments/domain/payment-provider";

vi.mock("@/lib/env", () => ({
  env: {
    PAYMENT_ROUTING_CURRENCY: "USD"
  }
}));

describe("AmountBasedPaymentRoutingPolicy", () => {
  const policy = new AmountBasedPaymentRoutingPolicy();

  it("routes < $1000 to Razorpay", () => {
    const provider = policy.selectProvider({
      amount: { amountMinor: 99999, currency: "USD" },
      customerId: "user_1",
      orderId: "order_1",
    });
    expect(provider).toBe(PaymentProvider.RAZORPAY);
  });

  it("routes >= $1000 to Skydo", () => {
    const provider = policy.selectProvider({
      amount: { amountMinor: 100000, currency: "USD" },
      customerId: "user_1",
      orderId: "order_1",
    });
    expect(provider).toBe(PaymentProvider.SKYDO);
  });

  it("throws error on unsupported currency", () => {
    expect(() => {
      policy.selectProvider({
        amount: { amountMinor: 100000, currency: "EUR" },
        customerId: "user_1",
        orderId: "order_1",
      });
    }).toThrow("Unsupported payment currency: EUR");
  });
});
