import { CategoryMenu, Hero, IntroducingSection, ProductsSection, OccasionGrid, TrustBanner, Newsletter, VamikaShowcase } from "@/components";

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
    </>
  );
}
