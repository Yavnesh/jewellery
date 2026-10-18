"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import { trackEvent } from "@/lib/analytics/events";
import { WishlistPopup } from "./WishlistPopup";
import { getImagePath } from "@/lib/utils";

import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import { useProductStore } from "@/app/_zustand/store";
import { addToCart } from "@/app/actions/cart.actions";
import toast from "react-hot-toast";
import apiClient from "@/lib/api";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    originalPrice?: number | null;
    mainImage: string;
    category?: { name: string };
    purity?: string | null;
    rating?: number;
    reviews?: number;
    features?: string | null;
    inStock?: number;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { data: session } = useSession();
  const [isWishlistPopupOpen, setIsWishlistPopupOpen] = useState(false);
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { syncCart } = useProductStore();
  const [isAddingToCart, startTransition] = useTransition();

  const isWishlisted = wishlist.some((item) => item.id === product.id);
  
  // Format image path
  const imageSrc = getImagePath(product.mainImage);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      setIsWishlistPopupOpen(true);
    } else {
      const userId = (session.user as any).id;
      if (isWishlisted) {
        removeFromWishlist(product.id);
        toast.success("Removed from wishlist");
        try {
          await apiClient.delete(`/api/wishlist/${userId}?productId=${product.id}`);
        } catch (err) {
          console.error("Failed to sync wishlist deletion to db:", err);
        }
      } else {
        addToWishlist({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.mainImage,
          slug: product.slug,
          stockAvailabillity: product.inStock || 5,
        });
        toast.success("Added to wishlist");
        try {
          await apiClient.post(`/api/wishlist/${userId}`, { productId: product.id });
        } catch (err) {
          console.error("Failed to sync wishlist addition to db:", err);
        }
      }
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        const result = await addToCart(product.id, 1);
        if (result.success && result.cart) {
          syncCart(result.cart);
          toast.success("Added to cart");
          trackEvent("add_to_cart", {
            productId: product.id,
            productName: product.title,
            price: product.price,
            quantity: 1
          });
        } else {
          toast.error(result.error || "Failed to add to cart");
        }
      } catch (err: any) {
        console.error("Add to cart error:", err);
        toast.error("Failed to add to cart");
      }
    });
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isBestseller = !!(product.rating && product.rating >= 4.5);
  const stockCount = product.inStock || 5;

  const handleProductClick = () => {
    trackEvent("select_product", {
      productId: product.id,
      productName: product.title,
      price: product.price,
      category: product.category?.name
    });
  };

  return (
    <>
      <div className="group flex flex-col justify-between h-full w-full font-serif bg-white">
        <div>
          {/* Image Container */}
          <div className="relative w-full aspect-square bg-[#F9F9F9] rounded-sm overflow-hidden mb-4 border border-transparent group-hover:border-gray-100 transition-colors">
            
            {/* Top Left Ribbon */}
            {isBestseller && (
              <div className="absolute top-0 left-0 bg-[#8B2C33] text-white text-[9px] uppercase font-sans font-semibold tracking-wider px-2 py-[2px] flex items-center gap-1 z-20 shadow-sm rounded-br-sm">
                <Sparkles className="w-2.5 h-2.5" />
                BESTSELLERS
              </div>
            )}

            {/* Product Image */}
            <Link 
              href={`/product/${product.slug}`} 
              onClick={handleProductClick} 
              className="absolute inset-0 z-10 p-6 flex items-center justify-center"
              title={product.title}
            >
              <Image
                src={imageSrc}
                alt={product.title}
                width={400}
                height={400}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain w-full h-full mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Product Details */}
          <Link 
            href={`/product/${product.slug}`} 
            onClick={handleProductClick} 
            className="flex flex-col gap-1.5 px-1 relative group/title block"
            title={product.title}
          >
            <h3 className="font-serif text-[#333333] text-[18px] font-bold leading-tight truncate group-hover/title:text-luxury-gold transition-colors">
              {product.title}
            </h3>
            
            <div className="flex items-end gap-2 flex-wrap mt-1">
              <span className="font-serif text-[20px] font-bold text-[#333333]">
                ₹ {product.price.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-[13px] text-gray-400 line-through font-serif mb-[2px]">
                  ₹ {product.originalPrice!.toLocaleString('en-IN')}
                </span>
              )}
              {stockCount <= 3 && (
                <span className="text-[11px] font-sans text-[#D62D20] ml-auto mb-[3px]">
                  Only {stockCount} left!
                </span>
              )}
            </div>

            {/* Promotional Banner */}
            {hasDiscount && (
              <div className="bg-[#FFF8E7] w-full text-center text-[#9C7740] text-[10px] font-sans py-1.5 mt-1 font-medium flex items-center justify-center gap-1 rounded-sm">
                <span>%</span> 20% off on stone charges
              </div>
            )}
          </Link>
        </div>

        {/* CTAs: Add to Cart and Add to Wishlist */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingToCart || stockCount <= 0}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-luxury-text-primary text-white text-[11px] font-sans font-medium uppercase tracking-wider rounded hover:bg-luxury-gold transition-colors duration-200 disabled:opacity-50"
            title="Add to Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
          </button>

          <button
            type="button"
            onClick={handleWishlistClick}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-sans font-medium uppercase tracking-wider rounded border transition-colors duration-200 ${
              isWishlisted
                ? "border-[#8B2C33] text-[#8B2C33] bg-[#8B2C33]/5 hover:bg-[#8B2C33]/10"
                : "border-gray-200 text-gray-700 bg-white hover:border-luxury-gold hover:text-luxury-gold"
            }`}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 shrink-0 ${isWishlisted ? "fill-[#8B2C33] text-[#8B2C33]" : ""}`} strokeWidth={1.8} />
            <span className="truncate">{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
          </button>
        </div>
      </div>

      <WishlistPopup 
        isOpen={isWishlistPopupOpen} 
        onClose={() => setIsWishlistPopupOpen(false)} 
      />
    </>
  );
};
