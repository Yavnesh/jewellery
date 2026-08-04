// *********************
// Role of the component: products section intended to be on the home page
// Name of the component: ProductsSection.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <ProductsSection slug={slug} />
// Input parameters: no input parameters
// Output: products grid
// *********************

import React from "react";
import ProductItem from "./ProductItem";
import Heading from "./Heading";
import apiClient from "@/lib/api";

const ProductsSection = async () => {
  let products = [];
  
  try {
    // sending API request for getting all products
    const data = await apiClient.get("/api/products");
    
    if (!data.ok) {
      console.error('Failed to fetch products:', data.statusText);
      products = [];
    } else {
      const result = await data.json();
      // Ensure products is an array
      products = Array.isArray(result) ? result : [];
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    products = [];
  }

  return (
    <div className="bg-[#FAF7F2] py-20">
      <div className="max-w-screen-2xl mx-auto">
        {/* Editorial section header */}
        <div className="text-center mb-14">
          <span className="text-vamika-gold uppercase tracking-[0.3em] text-[10px] font-sans font-semibold">
            Handpicked For You
          </span>
          <h2 className="text-luxury-text-primary text-4xl font-serif font-light uppercase tracking-widest mt-3 max-lg:text-3xl">
            Featured Products
          </h2>
          <div className="w-12 h-px bg-vamika-gold mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-4 justify-items-center max-w-screen-2xl mx-auto py-10 gap-x-6 px-10 gap-y-12 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {products.length > 0 ? (
            products.map((product: any) => (
              <ProductItem key={product.id} product={product} color="white" />
            ))
          ) : (
            <div className="col-span-full text-center text-luxury-text-secondary py-12 font-sans">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsSection;
