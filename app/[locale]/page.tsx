import { CategoryMenu, Hero, IntroducingSection, ProductsSection, OccasionGrid, TrustBanner, Newsletter, VamikaShowcase, CheckoutSuccessPopup } from "@/components";

import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <Hero />
      <IntroducingSection />
      <CategoryMenu />
      <VamikaShowcase />
      <OccasionGrid />
      <ProductsSection />
      <Newsletter />
      <TrustBanner />
      <Suspense fallback={null}>
        <CheckoutSuccessPopup />
      </Suspense>
    </>
  );
}
