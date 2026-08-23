"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaHandshake, FaEnvelopeOpenText } from "react-icons/fa6";

export default function PartnersPage() {
  const t = useTranslations("PartnersPage");

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary pt-32 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-6 space-y-16">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block p-4 rounded-full bg-vamika-gold/5 text-vamika-gold mb-2">
            <FaHandshake className="text-4xl text-vamika-gold-light" />
          </div>
          <h1 className="text-4xl font-serif font-light text-vamika-charcoal uppercase tracking-wider">
            {t("title")}
          </h1>
          <div className="w-12 h-px bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light text-sm md:text-base">
            {t("tagline")}
          </p>
        </div>

        {/* Intro Grid */}
        <div className="bg-white border border-luxury-border p-8 md:p-12 rounded-sm shadow-md grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-3xl mx-auto">
          <div className="md:col-span-8 space-y-4">
            <h2 className="text-xl md:text-2xl font-serif text-vamika-charcoal uppercase tracking-wider">
              {t("silverTitle")}
            </h2>
            <p className="text-sm text-luxury-text-secondary leading-relaxed font-light">
              {t("desc")}
            </p>
          </div>
          <div className="md:col-span-4 flex justify-center">
            <div className="border border-vamika-gold/30 p-4 rounded-sm bg-vamika-gold/5 text-center max-w-xs">
              <span className="text-xs uppercase tracking-widest font-semibold text-vamika-gold-light block">Ethical Supply</span>
              <span className="text-[10px] text-stone-500 block mt-1">Global Trade Network</span>
            </div>
          </div>
        </div>

        {/* Application CTA */}
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
            {t("apply")}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light font-sans">
            Become an authorized retailer or B2B sourcing partner. Send your company profile and business credentials to our trade email.
          </p>
          <div className="pt-2">
            <a
              href="mailto:partners@vamikajewels.com"
              className="inline-block bg-vamika-charcoal text-white hover:bg-vamika-gold-light hover:text-white transition-all duration-300 tracking-widest px-8 py-3.5 uppercase text-xs font-semibold rounded-sm shadow-sm"
            >
              Email partners@vamikajewels.com
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
