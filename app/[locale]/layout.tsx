import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "../globals.css";
import { getServerSession } from "next-auth/next";
import SessionProvider from "@/utils/SessionProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/Providers";
import SessionTimeoutWrapper from "@/components/SessionTimeoutWrapper";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

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
import DatadogInit from "@/components/DatadogInit";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const session = await getServerSession();
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "";
  
  return (
    <html lang={locale} data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans bg-luxury-bg text-luxury-text-primary antialiased`} suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-black p-4 z-50 rounded-sm outline-2 outline-black outline-offset-2">
          Skip to main content
        </a>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider session={session}>
            <SessionTimeoutWrapper />
            <Header />
            <Providers>
              <main id="main-content">
                {children}
              </main>
            </Providers>
            <Footer />
            <CookieConsentBanner />
            <GoogleAnalytics ga_id={gaId} />
            <DatadogInit />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
