import prisma from '@/utils/db';
import { VariantStatus } from '@prisma/client';

export interface GetVariantAvailabilityParams {
  productId: string;
  selectedOptions: Record<string, string>; // e.g., { "Ring Size": "Size 6", "Metal": "18K Gold" }
}

export interface VariantAvailabilityResponse {
  valid: boolean;
  variantId: string | null;
  available: boolean;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNAVAILABLE";
  price: {
    amount: number | null;
    compareAt: number | null;
  };
}

/**
 * Variant Availability Engine (Step 1.5)
 * Server-authoritative check for variant availability and pricing based on selected options.
 */
export async function getVariantAvailability(
  params: GetVariantAvailabilityParams
): Promise<VariantAvailabilityResponse> {
  const { productId, selectedOptions } = params;

  // Find all variants for this product with their option values
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        where: { status: VariantStatus.ACTIVE },
        include: {
          optionValues: {
            include: {
              optionValue: {
                include: {
                  option: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!product) {
    return {
      valid: false,
      variantId: null,
      available: false,
      stockStatus: "UNAVAILABLE",
      price: { amount: null, compareAt: null }
    };
  }

  // Find the exact variant matching the selected options
  let matchedVariant = null;

  for (const variant of product.variants) {
    // Map this variant's options (e.g. { "Ring Size": "Size 6", "Metal": "18K Gold" })
    const variantOptionsMap: Record<string, string> = {};
    for (const ov of variant.optionValues) {
      variantOptionsMap[ov.optionValue.option.name] = ov.optionValue.value;
    }

    // Check if the passed selectedOptions matches the variantOptionsMap perfectly
    const passedKeys = Object.keys(selectedOptions);
    const variantKeys = Object.keys(variantOptionsMap);

    if (passedKeys.length === variantKeys.length) {
      const isMatch = passedKeys.every(k => variantOptionsMap[k] === selectedOptions[k]);
      if (isMatch) {
        matchedVariant = variant;
        break;
      }
    }
  }

  if (!matchedVariant) {
    return {
      valid: false,
      variantId: null,
      available: false,
      stockStatus: "UNAVAILABLE",
      price: { amount: null, compareAt: null }
    };
  }

  const availableQuantity = matchedVariant.stockQuantity - matchedVariant.reservedQuantity;
  const isAvailable = availableQuantity > 0;
  
  let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "OUT_OF_STOCK";
  if (availableQuantity > 3) stockStatus = "IN_STOCK";
  else if (availableQuantity > 0) stockStatus = "LOW_STOCK";

  return {
    valid: true,
    variantId: matchedVariant.id,
    available: isAvailable,
    stockStatus,
    price: {
      amount: matchedVariant.price,
      compareAt: matchedVariant.compareAtPrice
    }
  };
}
