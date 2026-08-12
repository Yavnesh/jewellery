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
        <div className="p-5 rounded-sm shadow-xl bg-luxury-ivory border border-luxury-border/60 pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-serif text-luxury-text-primary mb-1">Your Privacy</h3>
            <p className="text-[13px] font-sans text-luxury-text-secondary">
              We use cookies to enhance your luxury shopping experience, analyze site traffic, and assist in our marketing efforts.
              By clicking "Accept All", you agree to the storing of cookies on your device.
              <a href="/cookie-policy" className="text-luxury-gold hover:text-luxury-gold/80 transition-colors ml-1 underline underline-offset-2">
                Read our Cookie Policy.
              </a>
            </p>
          </div>
          <div className="flex shrink-0 gap-3 w-full sm:w-auto">
            <button
              onClick={rejectAll}
              className="flex-1 sm:flex-none px-6 py-2.5 text-[11px] uppercase tracking-widest font-semibold text-luxury-text-primary bg-transparent border border-luxury-border/40 hover:bg-white transition-colors"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none px-6 py-2.5 text-[11px] uppercase tracking-widest font-bold text-white bg-luxury-gold hover:bg-luxury-gold/90 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
