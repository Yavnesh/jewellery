import { Money } from "@/src/modules/payments/domain/payment.types";
import { gstService } from "./gst.service";

export type PricingInput = {
  items: Array<{
    variantId: string;
    quantity: number;
    unitPriceMinor: number;
    discountMinor?: number;
    isJewelry?: boolean;
  }>;
  currency: string;
  shippingState?: string;
  shippingCountryCode?: string;
  couponDiscountMinor?: number;
};

export type PricingResult = {
  subtotal: Money;
  discount: Money;
  cgst: Money;
  sgst: Money;
  igst: Money;
  tax: Money;
  shipping: Money;
  total: Money;
};

export class PricingService {
  async calculate(input: PricingInput): Promise<PricingResult> {
    const currency = input.currency || "INR";
    
    let subtotalMinor = 0;
    let totalDiscountMinor = 0;

    for (const item of input.items) {
      const lineSubtotal = item.unitPriceMinor * item.quantity;
      const lineDiscount = (item.discountMinor || 0) * item.quantity;
      
      subtotalMinor += lineSubtotal;
      totalDiscountMinor += lineDiscount;
    }

    const couponDiscountMinor = input.couponDiscountMinor || 0;
    const taxableAmount = Math.max(0, subtotalMinor - totalDiscountMinor - couponDiscountMinor);

    // Dynamic Shipping
    const shippingMinor = subtotalMinor > 0 ? 0 : 0; // Free shipping

    // Calculate Indian GST if currency is INR and state is provided
    let cgstMinor = 0;
    let sgstMinor = 0;
    let igstMinor = 0;
    let totalTaxMinor = 0;

    if (currency === "INR" && input.shippingState) {
      // Calculate GST using the GST service
      const gstCalculation = gstService.calculateGST({
        subtotalMinor: taxableAmount,
        shippingState: input.shippingState,
        isJewelryItem: true, // Default to true for jewelry store variants
      });
      cgstMinor = gstCalculation.cgstMinor;
      sgstMinor = gstCalculation.sgstMinor;
      igstMinor = gstCalculation.igstMinor;
      totalTaxMinor = gstCalculation.totalTaxMinor;
    } else {
      // Fallback standard tax rate (8%)
      const taxRate = 0.08;
      totalTaxMinor = Math.round(taxableAmount * taxRate);
    }

    const totalMinor = taxableAmount + totalTaxMinor + shippingMinor;

    return {
      subtotal: { amountMinor: subtotalMinor, currency },
      discount: { amountMinor: totalDiscountMinor + couponDiscountMinor, currency },
      cgst: { amountMinor: cgstMinor, currency },
      sgst: { amountMinor: sgstMinor, currency },
      igst: { amountMinor: igstMinor, currency },
      tax: { amountMinor: totalTaxMinor, currency },
      shipping: { amountMinor: shippingMinor, currency },
      total: { amountMinor: totalMinor, currency },
    };
  }
}

export const pricingService = new PricingService();
