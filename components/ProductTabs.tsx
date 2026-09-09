"use client";

import React from "react";
import { formatCategoryName } from "@/utils/categoryFormating";
import { sanitize, sanitizeHtml } from "@/lib/sanitize";

export const ProductTabs = ({ product }: { product: any }) => {
  return (
    <div className="border-t border-gray-100 pt-16 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        
        {/* Left Column: Description Story */}
        <div className="lg:col-span-7 space-y-6">
          <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold block">
            Design Story
          </span>
          <h2 className="font-serif text-2xl text-vamika-charcoal uppercase tracking-wider">
            Story & Craftsmanship
          </h2>
          <div className="w-8 h-px bg-vamika-gold" />
          <div 
            className="text-stone-600 font-sans font-light leading-relaxed text-sm md:text-base space-y-4 prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(product?.description) 
            }}
          />
        </div>

        {/* Right Column: Specifications Table */}
        <div className="lg:col-span-5 space-y-6 bg-[#FAF8F5] p-8 rounded-sm border border-luxury-border/50">
          <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold block">
            Details & Dimensions
          </span>
          <h2 className="font-serif text-xl text-vamika-charcoal uppercase tracking-wider">
            Product Specifications
          </h2>
          <div className="w-8 h-px bg-vamika-gold" />
          
          <div className="pt-4">
            <table className="w-full text-left font-sans text-xs">
              <tbody className="divide-y divide-gray-200/50">
                {product?.metalType && (
                  <tr className="group">
                    <td className="py-3 font-semibold text-stone-500 uppercase tracking-wider">Metal Type</td>
                    <td className="py-3 text-vamika-charcoal font-medium text-right">{sanitize(product.metalType)}</td>
                  </tr>
                )}
                {product?.purity && (
                  <tr className="group">
                    <td className="py-3 font-semibold text-stone-500 uppercase tracking-wider">Purity Stamp</td>
                    <td className="py-3 text-vamika-charcoal font-medium text-right">{sanitize(product.purity)}</td>
                  </tr>
                )}
                {product?.weight && (
                  <tr className="group">
                    <td className="py-3 font-semibold text-stone-500 uppercase tracking-wider">Approx. Metal Weight</td>
                    <td className="py-3 text-vamika-charcoal font-medium text-right">{product.weight} g</td>
                  </tr>
                )}
                {product?.category?.name && (
                  <tr className="group">
                    <td className="py-3 font-semibold text-stone-500 uppercase tracking-wider">Category</td>
                    <td className="py-3 text-vamika-charcoal font-medium text-right">
                      {sanitize(formatCategoryName(product.category.name))}
                    </td>
                  </tr>
                )}
                {product?.manufacturer && (
                  <tr className="group">
                    <td className="py-3 font-semibold text-stone-500 uppercase tracking-wider">Manufacturer</td>
                    <td className="py-3 text-vamika-charcoal font-medium text-right">{sanitize(product.manufacturer)}</td>
                  </tr>
                )}
                {product?.features && (
                  <tr className="group">
                    <td className="py-3 font-semibold text-stone-500 uppercase tracking-wider align-top">Gemstone & Styling</td>
                    <td className="py-3 text-vamika-charcoal font-light text-right leading-relaxed max-w-[200px] break-words">
                      {sanitize(product.features)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductTabs;
