"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaGem, FaAward, FaRegCircleCheck } from "react-icons/fa6";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 15 } }
};

export default function LoyaltyCardPage() {
  const t = useTranslations("LoyaltyPage");

  const tiers = [
    {
      key: "silver",
      bg: "from-slate-400 to-slate-200",
      textColor: "text-slate-800",
      accentColor: "border-slate-300",
      badge: "Silver"
    },
    {
      key: "gold",
      bg: "from-amber-600 via-amber-500 to-yellow-200",
      textColor: "text-amber-950",
      accentColor: "border-amber-400",
      badge: "Gold"
    },
    {
      key: "platinum",
      bg: "from-stone-800 via-stone-700 to-stone-400",
      textColor: "text-white",
      accentColor: "border-stone-500",
      badge: "Platinum"
    }
  ];

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary pt-32 pb-24 font-sans">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 space-y-16">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold">
            Membership Privileges
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-vamika-charcoal uppercase tracking-wider">
            {t("title")}
          </h1>
          <div className="w-12 h-px bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light text-sm md:text-base">
            {t("tagline")}
          </p>
        </div>

        {/* Intro Grid */}
        <div className="bg-white border border-luxury-border p-8 md:p-12 rounded-sm shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-xl md:text-2xl font-serif text-vamika-charcoal uppercase tracking-wider">
              Exclusive Recognition
            </h2>
            <p className="text-sm text-luxury-text-secondary leading-relaxed font-light">
              {t("intro")}
            </p>
          </div>
          <div className="lg:col-span-4 flex justify-center">
            {/* Visual Glassmorphic Loyalty Card */}
            <div className="relative w-72 h-44 rounded-xl bg-gradient-to-tr from-amber-800 via-vamika-gold to-yellow-100 p-6 shadow-2xl text-white flex flex-col justify-between overflow-hidden border border-white/20">
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/70 block">Loyalty Privilege</span>
                  <span className="font-serif text-lg tracking-wider font-semibold">VAMIKA JEWELS</span>
                </div>
                <FaGem className="text-2xl text-white/80" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[8px] uppercase tracking-widest text-white/50 block">Card Member</span>
                  <span className="font-mono text-xs tracking-widest">**** **** **** 2026</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                  PLATINUM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tiers Title */}
        <div className="text-center space-y-2 pt-6">
          <h2 className="text-2xl font-serif uppercase tracking-wider text-vamika-charcoal">
            {t("tiersTitle")}
          </h2>
          <div className="w-8 h-px bg-vamika-gold mx-auto" />
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <motion.div
              key={tier.key}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white border border-luxury-border rounded-sm shadow-sm flex flex-col overflow-hidden hover:shadow-xl hover:border-vamika-gold-light/35 transition-all duration-300 group"
            >
              {/* Virtual Loyalty Card Preview */}
              <div className={`p-8 bg-gradient-to-br ${tier.bg} text-white flex flex-col justify-between h-48 relative overflow-hidden border-b border-luxury-border`}>
                <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-white/10 blur-xl" />
                <div className="flex justify-between items-start z-10">
                  <span className="font-serif text-base tracking-widest uppercase font-semibold">VAMIKA JEWELS</span>
                  <FaAward className="text-2xl text-white/90" />
                </div>
                <div className="flex justify-between items-end z-10">
                  <span className="font-mono text-[10px] tracking-widest opacity-80">CARD ID: VJ-{tier.badge.toUpperCase()}</span>
                  <span className="text-xs uppercase font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {tier.badge}
                  </span>
                </div>
              </div>

              {/* Perks List */}
              <div className="p-8 flex-grow flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className={`font-serif text-lg uppercase tracking-wider font-semibold ${tier.textColor}`}>
                    {t(`${tier.key}.name`)}
                  </h3>
                  <p className="text-xs text-luxury-text-secondary leading-relaxed font-light">
                    {t(`${tier.key}.desc`)}
                  </p>
                </div>
                <div className="border-t border-luxury-border pt-4">
                  <span className="text-[10px] font-sans font-bold tracking-widest text-vamika-gold uppercase block group-hover:text-vamika-gold-light transition-colors">
                    Unlock Benefits
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
