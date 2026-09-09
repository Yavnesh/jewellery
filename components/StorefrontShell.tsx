"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsentBanner from "@/components/CookieConsentBanner";

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin");

  if (isAdmin) {
    return <main id="main-content" className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
