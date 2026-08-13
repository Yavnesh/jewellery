"use client";
// *********************
// Role of the component: Helper component for seperating dynamic client component from server component on the single product page with the intention to preserve SEO benefits of Next.js
// Name of the component: SingleProductDynamicFields.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SingleProductDynamicFields product={product} />
// Input parameters: { product: Product }
// Output: Quantity, add to cart and buy now component on the single product page
// *********************

import React, { useState } from "react";
import QuantityInput from "./QuantityInput";
import AddToCartSingleProductBtn from "./AddToCartSingleProductBtn";
import BuyNowSingleProductBtn from "./BuyNowSingleProductBtn";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import toast from "react-hot-toast";

const SingleProductDynamicFields = ({ product }: { product: Product }) => {
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const isInWishlist = wishlist.some((item) => item.id === product.id);

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.mainImage,
        slug: product.slug,
        stockAvailabillity: product.inStock,
      });
      toast.success("Added to wishlist");
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleWishlistToggle}
        className={`w-full flex items-center justify-center gap-x-2 border py-3.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
          isInWishlist
            ? "bg-[#FFF0F0] border-red-100 text-red-600 hover:bg-red-100"
            : "border-gray-200 text-gray-500 hover:border-black hover:text-black"
        }`}
      >
        {isInWishlist ? <FaHeart className="text-sm" /> : <FaRegHeart className="text-sm" />}
        {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
      </button>
    </div>
  );
};

export default SingleProductDynamicFields;
