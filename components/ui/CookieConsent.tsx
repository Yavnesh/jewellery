"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ analytics: true, marketing: true }));
    setShowBanner(false);
    // In a real implementation, you would trigger GTM/GA4 initialization here or dispatch an event
    window.dispatchEvent(new Event('cookie-consent-updated'));
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ analytics: false, marketing: false }));
    setShowBanner(false);
    window.dispatchEvent(new Event('cookie-consent-updated'));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-safe">
      <div className="max-w-7xl mx-auto bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-6">
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">We value your privacy</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies. Read our <Link href="/legal/privacy" className="text-[#D4AF37] hover:underline underline-offset-2">Privacy Policy</Link> for more information.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          <button 
            onClick={handleRejectNonEssential}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors w-full sm:w-auto"
          >
            Reject Non-Essential
          </button>
          <button 
            onClick={handleAcceptAll}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#232f3e] hover:bg-[#1a232e] rounded-md transition-colors w-full sm:w-auto shadow-sm"
          >
            Accept All
          </button>
        </div>

      </div>
    </div>
  );
}
