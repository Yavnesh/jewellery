import { env } from "@/lib/env";

export type GSTInput = {
  subtotalMinor: number;
  shippingState: string;
  isJewelryItem?: boolean; // Jewelry has 3% GST, services/shipping/accessories have 18%
};

export type GSTCalculationResult = {
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  totalTaxMinor: number;
  taxRate: number;
  taxType: "INTRA_STATE" | "INTER_STATE";
};

export class GSTService {
  private getMerchantState(): string {
    return (process.env.MERCHANT_GST_STATE || "DELHI").toUpperCase().trim();
  }

  calculateGST(input: GSTInput): GSTCalculationResult {
    const merchantState = this.getMerchantState();
    const customerState = input.shippingState.toUpperCase().trim();
    
    // 3% for precious metals/jewelry, 18% for other goods/services/handling fees
    const taxRate = input.isJewelryItem ? 0.03 : 0.18;
    const isIntraState = merchantState === customerState;

    const totalTaxMinor = Math.round(input.subtotalMinor * taxRate);
    
    let cgstMinor = 0;
    let sgstMinor = 0;
    let igstMinor = 0;

    if (isIntraState) {
      // CGST and SGST are split evenly 50/50
      cgstMinor = Math.round(totalTaxMinor / 2);
      sgstMinor = totalTaxMinor - cgstMinor; // Ensure no rounding loss
    } else {
      // Inter-state gets full IGST
      igstMinor = totalTaxMinor;
    }

    return {
      cgstMinor,
      sgstMinor,
      igstMinor,
      totalTaxMinor,
      taxRate,
      taxType: isIntraState ? "INTRA_STATE" : "INTER_STATE"
    };
  }
}

export const gstService = new GSTService();
