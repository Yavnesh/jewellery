"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

// Inactivity timeout for elevated administrative roles only (15 minutes).
// Customers have standard persistent 30-day sessions without client-side inactivity timeouts.
const ADMIN_INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useSessionTimeout() {
  const { data: session, status } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if the user is authenticated and holds an elevated role
    const userRole = ((session?.user as any)?.role || "").toLowerCase();
    const isAdmin = userRole === "admin" || userRole === "superadmin";

    // Only apply inactivity auto-logout to administrative accounts
    if (status === "authenticated" && session && isAdmin) {
      const startTimeout = () => {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout for admin inactivity
        timeoutRef.current = setTimeout(() => {
          signOut({ 
            callbackUrl: "/login?expired=true",
            redirect: true 
          });
        }, ADMIN_INACTIVITY_TIMEOUT);
      };

      // Start the initial timeout
      startTimeout();

      // Reset timeout on user activity
      const resetTimeout = () => {
        startTimeout();
      };

      // Listen for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.addEventListener(event, resetTimeout, true);
      });

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        events.forEach(event => {
          document.removeEventListener(event, resetTimeout, true);
        });
      };
    }
  }, [session, status]);
}
