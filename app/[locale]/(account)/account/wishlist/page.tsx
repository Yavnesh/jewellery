"use client";
import { WishlistModule } from "@/components/modules/wishlist";

export default function WishlistPage() {
  return (
    <div>
      <h2 className="text-2xl font-medium text-gray-900 mb-6">My Wishlist</h2>
      <WishlistModule />
    </div>
  );
}
