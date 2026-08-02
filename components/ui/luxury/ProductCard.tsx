"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, BoxSelect, View } from "lucide-react";
import { useSession } from "next-auth/react";
import { WishlistPopup } from "./WishlistPopup";

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
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Format image path
  const imageSrc = product.mainImage.startsWith('/') || product.mainImage.startsWith('http') 
    ? product.mainImage 
    : `/${product.mainImage}`;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      setIsWishlistPopupOpen(true);
    } else {
      setIsWishlisted(!isWishlisted);
    }
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isBestseller = product.rating && product.rating >= 4.5;
  const stockCount = product.inStock || 5;

  return (
    <>
      <div className="group flex flex-col w-full font-serif bg-white">
        {/* Image Container */}
        <div className="relative w-full aspect-square bg-[#F9F9F9] rounded-sm overflow-hidden mb-4 border border-transparent group-hover:border-gray-100 transition-colors">
          
          {/* Top Left Ribbon */}
          {isBestseller && (
            <div className="absolute top-0 left-0 bg-[#8B2C33] text-white text-[9px] uppercase font-sans font-semibold tracking-wider px-2 py-[2px] flex items-center gap-1 z-20 shadow-sm rounded-br-sm">
              <Sparkles className="w-2.5 h-2.5" />
              BESTSELLERS
            </div>
          )}

          {/* Heart Icon */}
          <button 
            onClick={handleWishlistClick}
            className="absolute top-4 right-4 z-20 text-gray-400 hover:text-[#8B2C33] transition-colors bg-white/50 rounded-full p-1.5 backdrop-blur-sm"
          >
            <Heart className={`w-[18px] h-[18px] ${isWishlisted ? "fill-[#8B2C33] text-[#8B2C33]" : ""}`} strokeWidth={1.5} />
          </button>

          {/* Product Image */}
          <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10 p-6 flex items-center justify-center">
            <Image
              src={imageSrc}
              alt={product.title}
              width={400}
              height={400}
              className="object-contain w-full h-full mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
            />
          </Link>

          {/* Floating Actions (Similar & Try It) */}
          <div className="absolute bottom-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="flex items-center gap-1 bg-white text-[10px] font-sans font-medium px-2 py-1 rounded shadow-sm text-gray-700 hover:text-[#8B2C33]">
              <BoxSelect className="w-3 h-3 text-[#8B2C33]" /> Quick View
            </button>
            <button className="flex items-center gap-1 bg-white text-[10px] font-sans font-medium px-2 py-1 rounded shadow-sm text-gray-700 hover:text-[#8B2C33]">
              <View className="w-3 h-3 text-[#8B2C33]" /> Add
            </button>
          </div>
        </div>

        {/* Product Details */}
        <Link href={`/product/${product.slug}`} className="flex flex-col gap-1.5 px-1">
          <h3 className="font-serif text-[#333333] text-[18px] font-bold leading-tight line-clamp-1">
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

      <WishlistPopup 
        isOpen={isWishlistPopupOpen} 
        onClose={() => setIsWishlistPopupOpen(false)} 
      />
    </>
  );
};
