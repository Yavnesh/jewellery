"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useFilterStore, FilterState } from "@/app/_zustand/filterStore";

const filterSections = [
  {
    id: "jewelryTypes" as keyof FilterState,
    title: "Jewelry Type",
    options: ["Gold", "Diamond", "Platinum", "Gemstone", "Pearl"],
  },
  {
    id: "metalColors" as keyof FilterState,
    title: "Metal Color",
    options: ["Yellow Gold", "White Gold", "Rose Gold", "Two Tone"],
  },
  {
    id: "occasions" as keyof FilterState,
    title: "Occasion",
    options: ["Wedding", "Daily Wear", "Office", "Party", "Festive", "Gift"],
  },
  {
    id: "collections" as keyof FilterState,
    title: "Collection",
    options: ["Bridal", "Modern", "Heritage", "Minimal", "Signature", "Gemstone"],
  },
  {
    id: "purities" as keyof FilterState,
    title: "Purity",
    options: ["14K", "18K", "22K", "24K"],
  },
  {
    id: "genders" as keyof FilterState,
    title: "Gender",
    options: ["Women", "Men", "Kids", "Unisex"],
  },
];

export const FilterSidebar = () => {
  const store = useFilterStore();
  const [openSections, setOpenSections] = useState<string[]>(
    filterSections.map((s) => s.id)
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-12 px-6 pt-6">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <h2 className="font-serif text-2xl text-[#333333]">Filters</h2>
          <button 
            onClick={store.clearAll}
            className="text-[13px] font-sans font-medium text-gray-500 hover:text-[#8B2C33] underline underline-offset-4"
          >
            Clear All
          </button>
        </div>

        {filterSections.map((section) => {
          const isOpen = openSections.includes(section.id);
          const activeValues = store[section.id as keyof Omit<FilterState, 'priceRange' | 'setPriceRange' | 'toggleFilter' | 'clearAll' | 'removeFilter'>] as string[];

          return (
            <div key={section.id} className="mb-6 border-b border-gray-100 pb-6">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full text-left group"
              >
                <span className="font-sans font-medium text-sm text-[#333333] uppercase tracking-widest group-hover:text-[#8B2C33] transition-colors">
                  {section.title}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 flex flex-col gap-3">
                      {section.options.map((option) => {
                        const isActive = activeValues.includes(option);
                        return (
                          <label
                            key={option}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <div
                              className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                                isActive
                                  ? "bg-[#8B2C33] border-[#8B2C33]"
                                  : "border-gray-300 group-hover:border-[#8B2C33]"
                              }`}
                              onClick={() => store.toggleFilter(section.id as any, option)}
                            >
                              {isActive && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span
                              className={`font-sans text-[14px] transition-colors ${
                                isActive
                                  ? "text-[#8B2C33] font-medium"
                                  : "text-gray-500 group-hover:text-[#333333]"
                              }`}
                              onClick={() => store.toggleFilter(section.id as any, option)}
                            >
                              {option}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
