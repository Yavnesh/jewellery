"use client";

import React, { useState, useEffect, useTransition } from "react";
import { addToCart } from "@/app/actions/cart.actions";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/routing";

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

interface ParsedRingSize {
  whole: number;
  fractionKey: string;
  fractionLabel: string;
  rawValue: string;
}

const FRACTIONS = [
  { key: "0.00", label: "0.00 (Exact / Whole)", display: ".00" },
  { key: "0.25", label: "0.25 (1/4)", display: ".25" },
  { key: "0.50", label: "0.50 (1/2)", display: ".50" },
  { key: "0.75", label: "0.75 (3/4)", display: ".75" },
];

function parseRingSize(valStr: string): ParsedRingSize | null {
  if (!valStr) return null;
  const trimmed = valStr.trim();

  // Pattern: "5 1/4", "5 1/2", "5 3/4", "5 1/8", etc.
  const fracMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:(?:US|UK|EU)\s*)?(1\/4|1\/2|3\/4|¼|½|¾)/i);
  if (fracMatch) {
    const whole = parseInt(fracMatch[1], 10);
    const fracText = fracMatch[2];
    let fractionKey = "0.00";
    if (fracText === "1/4" || fracText === "¼") fractionKey = "0.25";
    else if (fracText === "1/2" || fracText === "½") fractionKey = "0.50";
    else if (fracText === "3/4" || fracText === "¾") fractionKey = "0.75";
    
    return {
      whole,
      fractionKey,
      fractionLabel: fractionKey === "0.25" ? "0.25 (1/4)" : fractionKey === "0.50" ? "0.50 (1/2)" : "0.75 (3/4)",
      rawValue: valStr
    };
  }

  // Pattern: "5.25", "5.5", "5.50", "5.75"
  const decMatch = trimmed.match(/^(\d+)\.(\d+)/);
  if (decMatch) {
    const whole = parseInt(decMatch[1], 10);
    const dec = decMatch[2];
    let fractionKey = "0.00";
    if (dec.startsWith("25")) fractionKey = "0.25";
    else if (dec.startsWith("5")) fractionKey = "0.50";
    else if (dec.startsWith("75")) fractionKey = "0.75";
    
    return {
      whole,
      fractionKey,
      fractionLabel: fractionKey === "0.25" ? "0.25 (1/4)" : fractionKey === "0.50" ? "0.50 (1/2)" : fractionKey === "0.75" ? "0.75 (3/4)" : "0.00 (Exact)",
      rawValue: valStr
    };
  }

  // Pattern: "5", "6", "16"
  const wholeMatch = trimmed.match(/^(\d+)(?:\s*(?:US|UK|EU))?$/i);
  if (wholeMatch) {
    return {
      whole: parseInt(wholeMatch[1], 10),
      fractionKey: "0.00",
      fractionLabel: "0.00 (Exact)",
      rawValue: valStr
    };
  }

  return null;
}

const isRingSizeOption = (option: { name: string; values: { id: string; value: string }[] }) => {
  const nameLower = option.name.toLowerCase();
  const nameMatches = nameLower.includes("ring") || nameLower.includes("size");
  const parsedCount = option.values.filter(v => parseRingSize(v.value) !== null).length;
  return nameMatches || (parsedCount > 0 && parsedCount >= Math.min(3, option.values.length));
};

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
      if (result.success && result.cart) {
        useProductStore.getState().syncCart(result.cart);
        toast.success("Added to cart");
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

  const { products } = useProductStore();
  const cartItem = products.find(p => p.id === selectedVariant?.id);
  const cartAmount = cartItem ? cartItem.amount : 0;
  
  const currentPrice = selectedVariant?.price || basePrice;
  const currentCompareAtPrice = selectedVariant?.compareAtPrice || baseCompareAtPrice;
  const stock = selectedVariant ? (selectedVariant.stockQuantity - selectedVariant.reservedQuantity) : 0;
  const availableToBuy = Math.max(0, stock - cartAmount);
  const isOutOfStock = stock <= 0;
  const isMaxReached = availableToBuy <= 0 && stock > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Options Rendering */}
      {options && options.length > 0 && options.map(option => {
        const isRing = isRingSizeOption(option);

        if (isRing) {
          const parsedList = option.values
            .map(v => parseRingSize(v.value))
            .filter((p): p is ParsedRingSize => p !== null);

          const wholeNumbers = Array.from(new Set(parsedList.map(p => p.whole))).sort((a, b) => a - b);
          const currentSelected = selections[option.name] || (parsedList[0] ? parsedList[0].rawValue : "");
          const currentParsed = parseRingSize(currentSelected) || parsedList[0];
          const currentWhole = currentParsed ? currentParsed.whole : (wholeNumbers[0] || 5);
          const currentFraction = currentParsed ? currentParsed.fractionKey : "0.00";

          return (
            <div key={option.id} className="flex flex-col gap-3 p-4 bg-[#FAF8F5] border border-[#EBE3D7] rounded-sm shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-[13px] font-bold text-[#333333] uppercase tracking-wider flex items-center gap-2">
                  <span>{option.name}</span>
                  <span className="text-[11px] font-normal text-gray-500 normal-case">(US Standard)</span>
                </label>
                {currentSelected && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-[#8B2C33] text-white rounded">
                    Selected: {currentSelected}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Dropdown 1: Whole Number */}
                <div className="relative">
                  <select
                    value={currentWhole}
                    onChange={(e) => {
                      const newWhole = parseInt(e.target.value, 10);
                      const matchExact = parsedList.find(p => p.whole === newWhole && p.fractionKey === currentFraction);
                      const fallback = parsedList.find(p => p.whole === newWhole);
                      const target = matchExact || fallback;
                      if (target) {
                        handleSelection(option.name, target.rawValue);
                      }
                    }}
                    className="w-full bg-white border border-[#D5C7B3] hover:border-[#8B2C33] focus:border-[#8B2C33] focus:ring-1 focus:ring-[#8B2C33] text-[#333333] text-sm py-2.5 px-3 rounded-none outline-none appearance-none font-medium cursor-pointer transition-colors shadow-sm"
                  >
                    {wholeNumbers.map(num => (
                      <option key={num} value={num}>
                        Size {num}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Dropdown 2: Fractional Value */}
                <div className="relative">
                  <select
                    value={currentFraction}
                    onChange={(e) => {
                      const newFrac = e.target.value;
                      const match = parsedList.find(p => p.whole === currentWhole && p.fractionKey === newFrac);
                      if (match) {
                        handleSelection(option.name, match.rawValue);
                      }
                    }}
                    className="w-full bg-white border border-[#D5C7B3] hover:border-[#8B2C33] focus:border-[#8B2C33] focus:ring-1 focus:ring-[#8B2C33] text-[#333333] text-sm py-2.5 px-3 rounded-none outline-none appearance-none font-medium cursor-pointer transition-colors shadow-sm"
                  >
                    {FRACTIONS.map(frac => {
                      const isAvailable = parsedList.some(p => p.whole === currentWhole && p.fractionKey === frac.key);
                      return (
                        <option key={frac.key} value={frac.key} disabled={!isAvailable}>
                          {frac.label} {!isAvailable ? "(Unavailable)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
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
        );
      })}

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
        ) : isMaxReached ? (
          <div className="flex gap-4">
            <button 
              disabled
              className="flex-1 py-3.5 bg-gray-200 text-gray-600 font-bold text-sm tracking-wide text-center cursor-not-allowed"
            >
              MAX QUANTITY IN CART
            </button>
            <button 
              onClick={() => router.push("/cart")}
              className="flex-1 py-3.5 bg-[#8B2C33] text-white font-bold text-sm tracking-wide hover:bg-[#6e2329] transition-colors"
            >
              GO TO CART
            </button>
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
        
        {availableToBuy > 0 && availableToBuy <= 3 && (
          <p className="text-[12px] text-orange-600 font-bold">
            Only {availableToBuy} left in stock!
          </p>
        )}
      </div>
    </div>
  );
};
