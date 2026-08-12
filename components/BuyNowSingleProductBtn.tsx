// *********************
// Role of the component: Buy Now button that adds product to the cart and redirects to the checkout page
// Name of the component: BuyNowSingleProductBtn.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <BuyNowSingleProductBtn product={product} quantityCount={quantityCount} />
// Input parameters: SingleProductBtnProps interface
// Output: Button with buy now functionality
// *********************

"use client";
import { useProductStore } from "@/app/_zustand/store";
import React, { useTransition } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/actions/cart.actions";

const BuyNowSingleProductBtn = ({
  product,
  quantityCount,
}: SingleProductBtnProps) => {
  const router = useRouter();
  const { syncCart } = useProductStore();
  const [isPending, startTransition] = useTransition();

  const handleBuyNow = () => {
    startTransition(async () => {
      const variantId = product?.variants?.[0]?.id;
      if (!variantId) {
        toast.error("No variant found for this product.");
        return;
      }
      
      const result = await addToCart(variantId, quantityCount);
      if (result.success && result.cart) {
        syncCart(result.cart);
        router.push("/cart"); // Usually Buy Now goes to cart or checkout. The user is having issues with cart, so let's redirect to cart for now.
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    });
  };

  return (
    <button
      onClick={handleBuyNow}
      disabled={isPending}
      className="btn w-[200px] text-[13px] tracking-wide border border-luxury-gold font-bold bg-luxury-gold text-white hover:bg-luxury-gold/90 transition-colors uppercase max-[500px]:w-full disabled:opacity-50"
    >
      {isPending ? "Adding..." : "Buy Now"}
    </button>
  );
};

export default BuyNowSingleProductBtn;
