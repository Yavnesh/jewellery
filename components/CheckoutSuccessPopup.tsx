"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccessPopup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("checkout_success") === "guest") {
      setIsOpen(true);
      // Clean up the URL so it doesn't show on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Order Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your order has been placed successfully. Since you checked out as a guest, please create an account or log in with your email to track your order details.
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-luxury-gold text-white py-3 rounded-md font-bold hover:bg-luxury-gold/90 transition-colors uppercase tracking-wider"
          >
            Log In / Register
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="block w-full text-gray-500 py-2 hover:text-gray-800 transition-colors uppercase tracking-wider text-sm font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
