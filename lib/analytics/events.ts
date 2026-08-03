// Basic GTM/GA4 dataLayer integration

export type AnalyticsEvent = {
  event: string;
  [key: string]: any;
};

// Check for consent (dummy implementation for now)
const hasAnalyticsConsent = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("cookie_consent_analytics") === "true";
};

export function trackEvent(eventName: string, payload: any) {
  if (typeof window === "undefined") return;
  
  if (!hasAnalyticsConsent()) {
    console.log(`[Analytics Blocked] ${eventName}`, payload);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...payload,
  });
}
