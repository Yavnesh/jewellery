import { Money } from "@/src/modules/payments/domain/payment.types";

export type PricingInput = {
  items: Array<{
    variantId: string;
    quantity: number;
    unitPriceMinor: number;
    discountMinor?: number;
  }>;
  currency: string;
  shippingCountryCode?: string;
};

export type PricingResult = {
  subtotal: Money;
  discount: Money;
  tax: Money;
  shipping: Money;
  total: Money;
};

export class PricingService {
  async calculate(input: PricingInput): Promise<PricingResult> {
    const currency = input.currency || "USD";
    
    let subtotalMinor = 0;
    let totalDiscountMinor = 0;

    for (const item of input.items) {
      const lineSubtotal = item.unitPriceMinor * item.quantity;
      const lineDiscount = (item.discountMinor || 0) * item.quantity;
      
      subtotalMinor += lineSubtotal;
      totalDiscountMinor += lineDiscount;
    }

    // Example fixed shipping (could be dynamic based on shippingCountryCode)
    const shippingMinor = subtotalMinor > 0 ? 0 : 0; // Free shipping for now
    
    // Example fixed tax rate (could be dynamic based on shippingCountryCode)
    const taxRate = 0.08; // 8% tax
    const taxableAmount = Math.max(0, subtotalMinor - totalDiscountMinor);
    const taxMinor = Math.round(taxableAmount * taxRate);

    const totalMinor = taxableAmount + taxMinor + shippingMinor;

    return {
      subtotal: { amountMinor: subtotalMinor, currency },
      discount: { amountMinor: totalDiscountMinor, currency },
      tax: { amountMinor: taxMinor, currency },
      shipping: { amountMinor: shippingMinor, currency },
      total: { amountMinor: totalMinor, currency },
    };
  }
}

export const pricingService = new PricingService();
