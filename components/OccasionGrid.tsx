import React from "react";
import Image from "next/image";
import Link from "next/link";

import { useTranslations } from "next-intl";

const occasions = [
  {
    key: "wedding",
    link: "/shop?occasion=Wedding",
    image: "/bridal-occasion.png",
  },
  {
    key: "anniversary",
    link: "/shop?occasion=Anniversary",
    image: "/anniversary-lifestyle.png",
  },
  {
    key: "engagement",
    link: "/shop?occasion=Engagement",
    image: "/rings-lifestyle.png",
  },
  {
    key: "dailywear",
    link: "/shop?occasion=Daily+Wear",
    image: "/daily-wear-lifestyle.png",
  }
];

export const OccasionGrid = () => {
  const t = useTranslations("OccasionGrid");

  return (
    <div className="py-20 bg-white">
      {/* Section header */}
      <div className="text-center mb-14">
        <span className="text-vamika-gold uppercase tracking-[0.3em] text-[10px] font-sans font-semibold">
          {t("moment")}
        </span>
        <h2 className="text-luxury-text-primary text-4xl font-serif font-light uppercase tracking-widest mt-3 max-lg:text-3xl">
          {t("title")}
        </h2>
        <div className="w-12 h-px bg-vamika-gold mx-auto mt-4" />
      </div>
      
      <div className="max-w-screen-2xl mx-auto px-16 max-md:px-6 grid grid-cols-4 max-lg:grid-cols-2 max-[450px]:grid-cols-1 gap-5">
        {occasions.map((occ) => (
          <Link
            href={occ.link}
            key={occ.key}
            className="relative h-[300px] overflow-hidden rounded-sm group"
          >
            {/* Background image */}
            <Image
              src={occ.image}
              alt={t(`items.${occ.key}.name`)}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 450px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 transition-all duration-500 group-hover:from-black/80" />
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <span className="text-vamika-gold-light text-[9px] font-sans tracking-[0.2em] uppercase font-semibold">
                {t(`items.${occ.key}.tagline`)}
              </span>
              <h3 className="font-serif font-light text-2xl uppercase tracking-wider text-white mt-1 group-hover:text-vamika-gold-light transition-colors duration-300">
                {t(`items.${occ.key}.name`)}
              </h3>
              <p className="text-white/60 text-xs mt-1 font-sans tracking-wide">
                {t(`items.${occ.key}.desc`)}
              </p>
              <span className="inline-block mt-3 text-[10px] font-sans font-semibold tracking-widest uppercase text-white/80 group-hover:text-vamika-gold-light transition-colors duration-300">
                {t("browse")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OccasionGrid;
