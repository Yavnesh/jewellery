// *********************
// Role of the component: Premium brand introduction section
// Name of the component: IntroducingSection.tsx
// *********************

import { BRAND_NAME } from "@/utils/brand";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { useTranslations } from "next-intl";

const IntroducingSection = () => {
  const t = useTranslations("Introducing");

  return (
    <div className="relative py-28 overflow-hidden">
      {/* Background lifestyle image */}
      <Image
        src="/hero-banner.png"
        alt="Vamika Jewels"
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      {/* Dark warm overlay */}
      <div className="absolute inset-0 bg-[#1C1B1A]/85" />
      
      {/* Decorative border lines */}
      <div className="absolute inset-6 border border-vamika-gold-light/15 rounded pointer-events-none" />
      
      <div className="relative z-10 text-center flex flex-col gap-y-6 items-center px-8">
        <span className="text-vamika-gold-light uppercase tracking-[0.4em] text-[10px] font-sans font-semibold">
          {t("since")}
        </span>
        <h2 className="text-white text-7xl font-serif font-light text-center mb-2 max-md:text-5xl max-[480px]:text-3xl uppercase tracking-wide leading-tight">
          {t("welcome")} <span className="text-vamika-gold-light">{BRAND_NAME}</span>
        </h2>
        <div className="w-16 h-px bg-vamika-gold-light/50 mx-auto" />
        <div className="flex flex-col gap-y-2 items-center">
          <p className="text-white/65 text-center text-lg max-md:text-base font-sans leading-relaxed max-w-2xl">
            {t("description")}
          </p>
          <Link href="/shop" className="block text-vamika-charcoal bg-vamika-gold-light hover:bg-white hover:text-vamika-charcoal font-sans font-semibold tracking-widest px-14 py-4 text-xs mt-8 transition-all duration-300 w-auto mx-auto rounded-sm uppercase shadow-lg">
            {t("cta")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default IntroducingSection;
