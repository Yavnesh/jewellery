import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ConsentState {
  hasConsented: boolean;
  preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  setConsent: (preferences: { analytics: boolean; marketing: boolean }) => void;
  acceptAll: () => void;
  rejectAll: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      hasConsented: false,
      preferences: {
        necessary: true, // Always true
        analytics: false,
        marketing: false,
      },
      setConsent: (prefs) =>
        set(() => ({
          hasConsented: true,
          preferences: {
            necessary: true,
            analytics: prefs.analytics,
            marketing: prefs.marketing,
          },
        })),
      acceptAll: () =>
        set(() => ({
          hasConsented: true,
          preferences: {
            necessary: true,
            analytics: true,
            marketing: true,
          },
        })),
      rejectAll: () =>
        set(() => ({
          hasConsented: true,
          preferences: {
            necessary: true,
            analytics: false,
            marketing: false,
          },
        })),
    }),
    {
      name: "cookie-consent-storage",
      // Using localStorage so consent persists across tabs/sessions
      storage: createJSONStorage(() => localStorage),
    }
  )
);
