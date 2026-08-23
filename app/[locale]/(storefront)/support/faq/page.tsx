"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { FaCircleQuestion, FaPlus, FaMinus } from "react-icons/fa6";

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 70, damping: 15 }
  }
};

export default function FaqPage() {
  const t = useTranslations("FaqPage");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = [
    { qKey: "q1", aKey: "a1" },
    { qKey: "q2", aKey: "a2" },
    { qKey: "q3", aKey: "a3" },
    { qKey: "q4", aKey: "a4" }
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary pt-32 pb-24 font-sans">
      <div className="max-w-3xl mx-auto px-6 space-y-16">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block p-4 rounded-full bg-vamika-gold/5 text-vamika-gold mb-2">
            <FaCircleQuestion className="text-4xl text-vamika-gold-light" />
          </div>
          <h1 className="text-4xl font-serif font-light text-vamika-charcoal uppercase tracking-wider">
            {t("title")}
          </h1>
          <div className="w-12 h-px bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light text-sm md:text-base">
            {t("tagline")}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={itemVariants}
                className="bg-white border border-luxury-border rounded-sm shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* Header/Question Trigger */}
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 focus:outline-none"
                >
                  <span className="font-serif text-base font-medium text-vamika-charcoal uppercase tracking-wider">
                    {t(item.qKey)}
                  </span>
                  <span className="p-1 rounded-full bg-luxury-bg text-vamika-gold-light">
                    {isOpen ? <FaMinus className="text-xs" /> : <FaPlus className="text-xs" />}
                  </span>
                </button>

                {/* Answer Content Dropdown */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.3 }, opacity: { duration: 0.3 } } }}
                      exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.25 }, opacity: { duration: 0.2 } } }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm text-luxury-text-secondary leading-relaxed font-light border-t border-luxury-border/40">
                        {t(item.aKey)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
