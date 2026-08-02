"use client";

import { useEffect, useState } from "react";
import { useConsentStore } from "@/app/_zustand/consentStore";

export default function CookieConsentBanner() {
  const { hasConsented, acceptAll, rejectAll } = useConsentStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || hasConsented) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50 pointer-events-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-4 rounded-lg shadow-2xl bg-white border border-gray-200 pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-serif text-gray-900 mb-1">Your Privacy</h3>
            <p className="text-sm text-gray-600">
              We use cookies to enhance your luxury shopping experience, analyze site traffic, and assist in our marketing efforts. 
              By clicking "Accept All", you agree to the storing of cookies on your device. 
              <a href="/cookie-policy" className="text-blue-600 hover:underline ml-1">
                Read our Cookie Policy.
              </a>
            </p>
          </div>
          <div className="flex shrink-0 gap-3 w-full sm:w-auto">
            <button
              onClick={rejectAll}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
