"use client";

import React from "react";
import { useFilterStore } from "@/app/_zustand/filterStore";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const StickyFilterSummary = () => {
  const { 
    jewelryTypes, 
    categories, 
    metalColors, 
    occasions, 
    collections, 
    purities, 
    genders, 
    availabilities, 
    features,
    removeFilter,
    clearAll 
  } = useFilterStore();

  const allActiveFilters = [
    ...jewelryTypes.map(v => ({ category: "jewelryTypes" as const, value: v })),
    ...categories.map(v => ({ category: "categories" as const, value: v })),
    ...metalColors.map(v => ({ category: "metalColors" as const, value: v })),
    ...occasions.map(v => ({ category: "occasions" as const, value: v })),
    ...collections.map(v => ({ category: "collections" as const, value: v })),
    ...purities.map(v => ({ category: "purities" as const, value: v })),
    ...genders.map(v => ({ category: "genders" as const, value: v })),
    ...availabilities.map(v => ({ category: "availabilities" as const, value: v })),
    ...features.map(v => ({ category: "features" as const, value: v })),
  ];

  if (allActiveFilters.length === 0) return null;

  return (
    <div className="w-full bg-luxury-bg border-b border-luxury-border/60 py-3 sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <span className="text-sm font-sans font-medium text-luxury-text-primary mr-2">
            Active Filters:
          </span>
          <AnimatePresence>
            {allActiveFilters.map((filter) => (
              <motion.button
                key={`${filter.category}-${filter.value}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => removeFilter(filter.category, filter.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-luxury-border rounded-full text-[13px] font-sans text-luxury-text-primary hover:border-luxury-gold hover:text-luxury-gold transition-colors group shadow-sm"
              >
                {filter.value}
                <X className="w-3.5 h-3.5 text-luxury-text-secondary group-hover:text-luxury-gold" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        
        <button
          onClick={clearAll}
          className="text-[13px] font-sans font-medium text-luxury-text-secondary hover:text-luxury-sale underline underline-offset-4 transition-colors shrink-0 ml-4"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};
