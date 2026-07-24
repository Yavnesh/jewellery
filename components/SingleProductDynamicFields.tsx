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
  const [quantityCount, setQuantityCount] = useState<number>(1);
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
    <>
      <QuantityInput
        quantityCount={quantityCount}
        setQuantityCount={setQuantityCount}
      />
      {Boolean(product.inStock) && (
        <div className="flex gap-x-4 max-[500px]:flex-col max-[500px]:items-center max-[500px]:gap-y-3 mt-4 flex-wrap">
          <AddToCartSingleProductBtn
            quantityCount={quantityCount}
            product={product}
          />
          <BuyNowSingleProductBtn
            quantityCount={quantityCount}
            product={product}
          />
          <button
            onClick={handleWishlistToggle}
            className={`flex items-center justify-center gap-x-2 border tracking-widest px-8 py-4 text-xs font-semibold uppercase transition-all duration-300 rounded shadow-sm max-[500px]:w-full min-w-[180px] ${
              isInWishlist
                ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                : "border-tanishq-charcoal text-tanishq-charcoal hover:bg-tanishq-charcoal hover:text-white"
            }`}
          >
            {isInWishlist ? <FaHeart className="text-sm" /> : <FaRegHeart className="text-sm" />}
            {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
          </button>
        </div>
      )}
    </>
  );
};

export default SingleProductDynamicFields;
