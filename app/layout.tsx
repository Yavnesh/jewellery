import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth/next";
import 'svgmap/dist/svgMap.min.css';
import SessionProvider from "@/utils/SessionProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/Providers";
import SessionTimeoutWrapper from "@/components/SessionTimeoutWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

import { BRAND_NAME } from "@/utils/brand";

export const metadata: Metadata = {
  title: `${BRAND_NAME} - Fine Luxury Jewelry`,
  description: `Experience premium fine jewelry and custom gemstones curated in a luxury storefront.`,
};

import CookieConsentBanner from "@/components/CookieConsentBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  // Safe default or fallback for GA ID
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "";
  
  return (
    <html lang="en" data-theme="light">
      <body className={`${inter.variable} ${cormorant.variable} font-sans bg-luxury-bg text-luxury-text-primary antialiased`}>
        <SessionProvider session={session}>
          <SessionTimeoutWrapper />
          <Header />
          <Providers>
            {children}
          </Providers>
          <Footer />
          <CookieConsentBanner />
          <GoogleAnalytics ga_id={gaId} />
        </SessionProvider>
      </body>
    </html>
  );
}
