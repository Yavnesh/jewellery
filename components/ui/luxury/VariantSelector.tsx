"use client";

import React, { useState, useEffect, useTransition } from "react";
import { addToCart } from "@/app/actions/cart.actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface VariantSelectorProps {
  options: {
    id: string;
    name: string;
    values: { id: string; value: string }[];
  }[];
  variants: {
    id: string;
    price: number;
    compareAtPrice: number | null;
    stockQuantity: number;
    reservedQuantity: number;
    optionValues: { optionValue: { option: { name: string }, value: string } }[];
  }[];
  basePrice: number;
  baseCompareAtPrice: number | null;
}

export const VariantSelector = ({ options, variants, basePrice, baseCompareAtPrice }: VariantSelectorProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Default selections
  const initialSelections: Record<string, string> = {};
  if (options && options.length > 0) {
    options.forEach(opt => {
      if (opt.values && opt.values.length > 0) {
        initialSelections[opt.name] = opt.values[0].value;
      }
    });
  }

  const [selections, setSelections] = useState<Record<string, string>>(initialSelections);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    // Find the variant that matches the selections
    if (!variants || variants.length === 0) return;

    const matchedVariant = variants.find(variant => {
      const variantOptions: Record<string, string> = {};
      variant.optionValues.forEach(ov => {
        variantOptions[ov.optionValue.option.name] = ov.optionValue.value;
      });

      return Object.keys(selections).every(
        key => selections[key] === variantOptions[key]
      );
    });

    setSelectedVariant(matchedVariant || variants[0]);
  }, [selections, variants]);

  const handleSelection = (optionName: string, value: string) => {
    setSelections(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    startTransition(async () => {
      const result = await addToCart(selectedVariant.id, 1);
      if (result.success) {
        toast.success("Added to cart");
        // Optionally open a minicart or navigate
        // router.push("/cart");
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    });
  };

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    
    startTransition(async () => {
      const result = await addToCart(selectedVariant.id, 1);
      if (result.success) {
        router.push("/cart");
      } else {
        toast.error(result.error || "Failed to initiate checkout");
      }
    });
  };

  const currentPrice = selectedVariant?.price || basePrice;
  const currentCompareAtPrice = selectedVariant?.compareAtPrice || baseCompareAtPrice;
  const stock = selectedVariant ? (selectedVariant.stockQuantity - selectedVariant.reservedQuantity) : 0;
  const isOutOfStock = stock <= 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Options Rendering */}
      {options && options.length > 0 && options.map(option => (
        <div key={option.id} className="flex flex-col gap-2">
          <label className="text-[13px] font-bold text-[#333333] uppercase tracking-wider">
            {option.name}
          </label>
          <div className="flex flex-wrap gap-3">
            {option.values.map(val => (
              <button
                key={val.id}
                onClick={() => handleSelection(option.name, val.value)}
                className={`border py-2 px-4 text-sm transition-colors ${
                  selections[option.name] === val.value
                    ? 'border-[#8B2C33] bg-[#8B2C33] text-white'
                    : 'border-gray-200 text-gray-700 hover:border-[#8B2C33]'
                }`}
              >
                {val.value}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Price */}
      <div className="flex items-end gap-3 my-4">
        <span className="font-serif text-[28px] font-bold text-[#333333] leading-none">
          ₹ {Number(currentPrice || 0).toLocaleString('en-IN')}
        </span>
        {currentCompareAtPrice && (
          <span className="text-sm text-gray-400 font-serif line-through mb-1">
            ₹ {Number(currentCompareAtPrice || 0).toLocaleString('en-IN')}
          </span>
        )}
      </div>

      <p className="text-[11px] text-gray-500 border-b border-gray-100 pb-4">
        Price inclusive of all taxes.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-4 mt-4">
        {isOutOfStock ? (
          <div className="py-3.5 bg-gray-200 text-gray-500 font-bold text-sm tracking-wide text-center">
            OUT OF STOCK
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={handleAddToCart}
              disabled={isPending}
              className="flex-1 py-3.5 border border-[#8B2C33] text-[#8B2C33] font-bold text-sm tracking-wide hover:bg-[#8B2C33] hover:text-white transition-colors disabled:opacity-50"
            >
              {isPending ? "ADDING..." : "ADD TO CART"}
            </button>
            <button 
              onClick={handleBuyNow}
              disabled={isPending}
              className="flex-1 py-3.5 bg-[#8B2C33] text-white font-bold text-sm tracking-wide hover:bg-[#6e2329] transition-colors disabled:opacity-50"
            >
              BUY NOW
            </button>
          </div>
        )}
        
        {stock > 0 && stock <= 3 && (
          <p className="text-[12px] text-orange-600 font-bold">
            Only {stock} left in stock!
          </p>
        )}
      </div>
    </div>
  );
};
