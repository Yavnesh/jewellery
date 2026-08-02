"use client";

import Script from "next/script";
import { useConsentStore } from "@/app/_zustand/consentStore";
import { useEffect, useState } from "react";

export default function GoogleAnalytics({ ga_id }: { ga_id: string }) {
  const { hasConsented, preferences } = useConsentStore();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Only load GA if the user has explicitly consented to analytics cookies
    if (hasConsented && preferences.analytics) {
      setShouldLoad(true);
    } else {
      setShouldLoad(false);
    }
  }, [hasConsented, preferences.analytics]);

  if (!shouldLoad || !ga_id) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${ga_id}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga_id}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
