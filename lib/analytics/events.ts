export type EcommerceEvent =
  | "view_home"
  | "view_category"
  | "view_collection"
  | "view_product"
  | "select_product"
  | "search"
  | "apply_filter"
  | "add_to_cart"
  | "remove_from_cart"
  | "update_cart_quantity"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_information"
  | "add_payment_information"
  | "purchase"
  | "add_to_wishlist"
  | "remove_from_wishlist"
  | "sign_up"
  | "login"
  | "newsletter_signup";

export interface EventPayload {
  userId?: string;
  sessionId?: string;
  productId?: string;
  productName?: string;
  category?: string;
  collection?: string;
  quantity?: number;
  price?: number;
  currency?: string;
  orderId?: string;
  searchTerm?: string;
  filters?: Record<string, any>;
  [key: string]: any;
}

/**
 * Centralized analytics tracking function.
 * Ensures consistent event taxonomy and delegates to window.dataLayer for GA4/GTM.
 */
export function trackEvent(eventName: EcommerceEvent, payload?: EventPayload) {
  // Only track in browser
  if (typeof window === "undefined") return;

  const timestamp = new Date().toISOString();
  
  const fullPayload = {
    event: eventName,
    timestamp,
    ...payload,
  };

  // Push to GTM/GA4 dataLayer if available
  if (window.dataLayer) {
    window.dataLayer.push(fullPayload);
  }

  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.debug(`[Analytics Event]: ${eventName}`, fullPayload);
  }
}

// Ensure window.dataLayer exists for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
  }
}
