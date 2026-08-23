"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaBagShopping, FaCompass, FaChevronRight, FaRegCreditCard, FaTruckFast } from "react-icons/fa6";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 70, damping: 15 } }
};

export default function HowToBuyPage() {
  const t = useTranslations("HowToBuyPage");

  const steps = [
    {
      key: "step1",
      icon: <FaCompass className="text-3xl text-vamika-gold-light" />
    },
    {
      key: "step2",
      icon: <FaBagShopping className="text-3xl text-vamika-gold-light" />
    },
    {
      key: "step3",
      icon: <FaRegCreditCard className="text-3xl text-vamika-gold-light" />
    },
    {
      key: "step4",
      icon: <FaTruckFast className="text-3xl text-vamika-gold-light" />
    }
  ];

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary pt-32 pb-24 font-sans">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 space-y-16">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold">
            Buying Guide
          </span>
          <h1 className="text-4xl font-serif font-light text-vamika-charcoal uppercase tracking-wider">
            {t("title")}
          </h1>
          <div className="w-12 h-px bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light text-sm md:text-base">
            {t("tagline")}
          </p>
        </div>

        {/* Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto items-stretch">
          {steps.map((step, index) => (
            <motion.div
              key={step.key}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white border border-luxury-border p-8 rounded-sm shadow-sm hover:shadow-md hover:border-vamika-gold-light/35 transition-all duration-300 flex flex-col justify-between relative group"
            >
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 text-stone-300 hidden lg:block group-hover:text-vamika-gold-light transition-colors">
                  <FaChevronRight className="text-xl" />
                </div>
              )}
              <div className="space-y-6">
                <div className="mb-6 inline-block bg-[#FAF8F5] p-5 rounded-full group-hover:bg-vamika-gold-light/10 transition-colors duration-300">
                  {step.icon}
                </div>
                <h3 className="font-serif font-medium text-lg uppercase tracking-wider text-vamika-charcoal">
                  {t(`${step.key}.title`)}
                </h3>
                <p className="text-xs text-luxury-text-secondary leading-relaxed font-light">
                  {t(`${step.key}.desc`)}
                </p>
              </div>
              <div className="w-8 h-0.5 bg-luxury-border group-hover:bg-vamika-gold-light transition-colors duration-300 mt-8" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
