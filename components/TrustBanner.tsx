import React from "react";
import { FaGem, FaAward, FaLock, FaRotateLeft } from "react-icons/fa6";
import { BRAND_NAME } from "@/utils/brand";

import { useTranslations } from "next-intl";

const trustItems = [
  {
    key: "certified",
    icon: <FaAward className="text-2xl text-vamika-gold-light" />,
  },
  {
    key: "gold",
    icon: <FaGem className="text-2xl text-vamika-gold-light" />,
  },
  {
    key: "returns",
    icon: <FaRotateLeft className="text-2xl text-vamika-gold-light" />,
  },
  {
    key: "checkout",
    icon: <FaLock className="text-2xl text-vamika-gold-light" />,
  }
];

export const TrustBanner = () => {
  const t = useTranslations("TrustBanner");

  return (
    <div className="py-20 bg-[#2B0E0A]">
      {/* Section header */}
      <div className="text-center mb-14">
        <span className="text-vamika-gold-light uppercase tracking-[0.3em] text-[10px] font-sans font-semibold">
          {t("commitment")}
        </span>
        <h2 className="text-white text-4xl font-serif font-light uppercase tracking-widest mt-3 max-lg:text-3xl">
          {t("promise", { brand: BRAND_NAME })}
        </h2>
        <div className="w-12 h-px bg-vamika-gold-light/50 mx-auto mt-4" />
      </div>
      
      <div className="max-w-screen-2xl mx-auto px-16 max-md:px-8 grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-10">
        {trustItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center text-center p-6 border border-[#441913] rounded-sm hover:border-vamika-gold-light/30 transition-all duration-300 group">
            <div className="mb-5 bg-[#441913] p-4 rounded-full group-hover:bg-vamika-gold-light/10 transition-colors duration-300">
              {item.icon}
            </div>
            <h3 className="font-serif font-medium text-lg uppercase tracking-wider text-white mb-2">
              {t(`items.${item.key}.title`)}
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed font-sans max-w-xs">
              {t(`items.${item.key}.desc`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustBanner;
