// *********************
// Role of the component: Button for adding product to the cart on the single product page
// Name of the component: AddToCartSingleProductBtn.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <AddToCartSingleProductBtn product={product} quantityCount={quantityCount}  />
// Input parameters: SingleProductBtnProps interface
// Output: Button with adding to cart functionality
// *********************
"use client";

import React, { useTransition } from "react";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import { addToCart } from "@/app/actions/cart.actions";

const AddToCartSingleProductBtn = ({ product, quantityCount } : SingleProductBtnProps) => {
  const { syncCart } = useProductStore();
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = () => {
    startTransition(async () => {
      // Find the first variant to add, assuming default or legacy setup
      const variantId = product?.variants?.[0]?.id;
      if (!variantId) {
        toast.error("No variant found for this product.");
        return;
      }
      
      const result = await addToCart(variantId, quantityCount);
      if (result.success && result.cart) {
        syncCart(result.cart);
        toast.success("Product added to the cart");
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    });
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isPending}
      className="btn w-[200px] text-[13px] tracking-wide border border-luxury-gold font-bold bg-white text-luxury-gold hover:bg-luxury-gold hover:text-white transition-colors uppercase max-[500px]:w-full disabled:opacity-50"
    >
      {isPending ? "Adding..." : "Add to cart"}
    </button>
  );
};

export default AddToCartSingleProductBtn;
