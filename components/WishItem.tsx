"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import { FaTrashCan } from "react-icons/fa6";
import { sanitize } from "@/lib/sanitize";

interface WishItemProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  stockAvailabillity: number;
}

const WishItem = ({
  id,
  title,
  price,
  image,
  slug,
  stockAvailabillity,
}: WishItemProps) => {
  const { removeFromWishlist } = useWishlistStore();
  const { addToCart, calculateTotals } = useProductStore();

  const handleAddToCart = () => {
    addToCart({
      id: id,
      title,
      price,
      image,
      amount: 1,
    });
    calculateTotals();
    toast.success("Product added to the cart");
  };

  const handleRemove = () => {
    removeFromWishlist(id);
    toast.success("Product removed from wishlist");
  };

  return (
    <tr className="border-b border-luxury-border/60 hover:bg-luxury-ivory/30 transition-colors duration-200 text-luxury-text-primary">
      <td className="py-4">
        <button
          onClick={handleRemove}
          className="text-luxury-text-secondary hover:text-red-500 transition-colors duration-200"
          title="Remove item"
        >
          <FaTrashCan className="text-lg" />
        </button>
      </td>
      <td className="py-4 flex justify-center">
        <Link href={`/product/${slug}`} className="block w-20 h-20 bg-luxury-ivory rounded p-1 border border-luxury-border/40">
          <Image
            src={image ? `/${image}` : "/product_placeholder.jpg"}
            width={80}
            height={80}
            alt={sanitize(title)}
            className="w-full h-full object-contain"
          />
        </Link>
      </td>
      <td className="py-4 font-serif font-light text-base uppercase tracking-wider text-left">
        <Link href={`/product/${slug}`} className="hover:text-luxury-gold transition-colors duration-200">
          {sanitize(title)}
        </Link>
      </td>
      <td className="py-4 text-sm font-sans">
        {stockAvailabillity > 0 ? (
          <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">In Stock</span>
        ) : (
          <span className="text-red-500 bg-red-50 px-2.5 py-1 rounded-full font-medium">Out of Stock</span>
        )}
      </td>
      <td className="py-4">
        <button
          onClick={handleAddToCart}
          disabled={stockAvailabillity <= 0}
          className="bg-luxury-text-primary text-white border border-luxury-text-primary hover:bg-luxury-gold hover:border-luxury-gold disabled:opacity-40 disabled:hover:bg-luxury-text-primary disabled:hover:border-luxury-text-primary tracking-widest px-6 py-2.5 text-xs font-semibold uppercase transition-all duration-300 rounded shadow-sm"
        >
          Add to Cart
        </button>
      </td>
    </tr>
  );
};

export default WishItem;
