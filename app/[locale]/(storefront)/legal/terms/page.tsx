"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaScaleBalanced } from "react-icons/fa6";

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 70, damping: 15 }
  }
};

export default function TermsOfServicePage() {
  const t = useTranslations("TermsPage");

  const sectionsKeys = ["acceptance", "customOrders", "pricing", "intellectual"] as const;

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary pt-32 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title block */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-block p-4 rounded-full bg-vamika-gold/5 text-vamika-gold mb-2">
            <FaScaleBalanced className="text-4xl text-vamika-gold-light" />
          </div>
          <h1 className="text-4xl font-serif font-light text-vamika-charcoal uppercase tracking-wider">
            {t("title")}
          </h1>
          <div className="w-12 h-px bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light text-sm">
            {t("tagline")}
          </p>
        </div>

        {/* Contents Wrapper */}
        <div className="bg-white border border-luxury-border p-8 md:p-12 rounded-sm shadow-md space-y-10">
          <p className="text-sm text-stone-500 leading-relaxed font-light italic border-b border-luxury-border pb-6">
            {t("intro")}
          </p>

          <div className="space-y-10">
            {sectionsKeys.map((sectionKey) => (
              <motion.section
                key={sectionKey}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={itemVariants}
                className="space-y-3"
              >
                <h2 className="text-xl font-serif text-vamika-charcoal uppercase tracking-wide border-l-2 border-vamika-gold/40 pl-4 py-0.5">
                  {t(`sections.${sectionKey}.title`)}
                </h2>
                <p className="text-sm text-luxury-text-secondary leading-relaxed font-light pl-5">
                  {t(`sections.${sectionKey}.desc`)}
                </p>
              </motion.section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
