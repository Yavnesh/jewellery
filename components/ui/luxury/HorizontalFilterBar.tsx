"use client";

import React, { useState } from "react";
import { Filter, ChevronDown, Plus, X } from "lucide-react";
import { SortBy } from "@/components";
import { FilterSidebar } from "@/components/ui/luxury/FilterSidebar";
import { AnimatePresence, motion } from "framer-motion";

export const HorizontalFilterBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const quickFilters = [
    { label: "₹25,000 - ₹50,000", active: false },
    { label: "Gifts For Him", active: false },
    { label: "Women", active: false },
    { label: "Gold Jewellery", active: false },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between py-6 border-b border-gray-100 mb-8 gap-4 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Filter Button (Opens Drawer) */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-6 py-2 border border-gray-200 rounded-full hover:border-[#8B2C33] transition-colors font-sans text-sm text-[#333333]"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          <div className="hidden md:block w-[1px] h-6 bg-gray-200 mx-2" />

          {/* Quick Filter Pills */}
          {quickFilters.map((filter) => (
            <button 
              key={filter.label}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-full transition-all font-sans text-[13px] ${
                filter.active 
                  ? "border-gray-200 bg-[#F9F9F9] text-[#333333]" 
                  : "border-gray-200 text-gray-600 hover:border-[#8B2C33] hover:text-[#8B2C33]"
              }`}
            >
              {filter.active ? (
                <span className="flex items-center justify-center bg-gray-200 rounded-full p-0.5">
                  <X className="w-2.5 h-2.5 text-gray-500" />
                </span>
              ) : (
                <Plus className="w-3 h-3 text-[#8B2C33]" />
              )}
              {filter.label}
            </button>
          ))}
          
          <button className="text-[13px] font-sans text-[#D62D20] font-medium ml-2 hover:underline">
            +Show More
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[13px] font-sans text-gray-500">Sort By:</span>
          <div className="scale-90 origin-right">
            <SortBy />
          </div>
        </div>
      </div>

      {/* Filter Slide-out Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-start">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="relative w-full max-w-sm h-full bg-white shadow-2xl z-10 flex flex-col"
            >
              {/* Close Button Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="font-serif text-2xl text-[#333333]">Filters</h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Scrollable Filter Content */}
              <div className="flex-1 overflow-y-auto">
                <FilterSidebar />
              </div>
              
              {/* Bottom Apply Buttons */}
              <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-3 border border-gray-300 rounded font-sans text-[#333333] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-3 bg-[#8B2C33] text-white rounded font-sans hover:bg-[#6e2329] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
