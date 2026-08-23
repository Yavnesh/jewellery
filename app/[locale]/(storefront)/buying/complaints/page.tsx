"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaFileShield, FaEnvelopeOpenText } from "react-icons/fa6";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 70, damping: 15 } }
};

export default function ComplaintsPage() {
  const t = useTranslations("ComplaintsPage");

  const stepsKeys = ["step1", "step2", "step3"] as const;

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary pt-32 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-6 space-y-16">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block p-4 rounded-full bg-vamika-gold/5 text-vamika-gold mb-2">
            <FaFileShield className="text-4xl text-vamika-gold-light" />
          </div>
          <h1 className="text-4xl font-serif font-light text-vamika-charcoal uppercase tracking-wider">
            {t("title")}
          </h1>
          <div className="w-12 h-px bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light text-sm md:text-base">
            {t("tagline")}
          </p>
        </div>

        {/* Intro Section */}
        <div className="bg-white border border-luxury-border p-8 md:p-12 rounded-sm shadow-md text-center max-w-3xl mx-auto">
          <p className="text-sm text-luxury-text-secondary leading-relaxed font-light">
            {t("intro")}
          </p>
        </div>

        {/* Timeline Steps Title */}
        <div className="text-center space-y-2 pt-6">
          <h2 className="text-2xl font-serif uppercase tracking-wider text-vamika-charcoal">
            {t("stepTitle")}
          </h2>
          <div className="w-8 h-px bg-vamika-gold mx-auto" />
        </div>

        {/* Timeline Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stepsKeys.map((stepKey) => (
            <motion.div
              key={stepKey}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white border border-luxury-border p-8 rounded-sm shadow-sm hover:shadow-md hover:border-vamika-gold-light/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <h3 className="font-serif font-semibold text-lg uppercase tracking-wider text-vamika-charcoal">
                  {t(`${stepKey}.title`)}
                </h3>
                <p className="text-xs text-luxury-text-secondary leading-relaxed font-light">
                  {t(`${stepKey}.desc`)}
                </p>
              </div>
              <div className="w-8 h-0.5 bg-luxury-border group-hover:bg-vamika-gold-light transition-colors mt-6" />
            </motion.div>
          ))}
        </div>

        {/* Contact/Submit CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white p-10 border border-luxury-border rounded-sm shadow-md text-center max-w-xl mx-auto space-y-6"
        >
          <div className="inline-block p-3 rounded-full bg-vamika-gold/5 text-vamika-gold">
            <FaEnvelopeOpenText className="text-3xl text-vamika-gold-light" />
          </div>
          <h3 className="text-xl font-serif font-light uppercase tracking-wider text-vamika-charcoal">
            Direct Resolution Inquiry
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            If you have an urgent inquiry regarding custom castings or precious stone settings, please reach out to our dedicated support.
          </p>
          <div className="pt-2">
            <a
              href="mailto:support@vamikajewels.com"
              className="inline-block bg-vamika-charcoal text-white hover:bg-vamika-gold-light hover:text-white transition-all duration-300 tracking-widest px-8 py-3.5 uppercase text-xs font-semibold rounded-sm shadow-sm"
            >
              Email support@vamikajewels.com
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
