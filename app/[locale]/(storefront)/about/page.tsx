"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaGem, FaAward, FaHammer } from "react-icons/fa6";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 60, damping: 15 },
  },
};

export default function AboutUsPage() {
  const t = useTranslations("AboutPage");

  const pillars = [
    {
      key: "manufacturer",
      icon: <FaHammer className="text-3xl text-vamika-gold-light" />,
      tag: "Craft",
    },
    {
      key: "trader",
      icon: <FaGem className="text-3xl text-vamika-gold-light" />,
      tag: "Authenticity",
    },
    {
      key: "specialist",
      icon: <FaAward className="text-3xl text-vamika-gold-light" />,
      tag: "Bespoke",
    },
  ];

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary overflow-x-hidden font-sans">
      {/* 1. Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="/hero-banner.png"
          alt="Fine luxury jewelry background"
          fill
          priority
          className="object-cover object-center scale-105 filter brightness-[0.4]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-luxury-bg/90" />
        
        <div className="relative z-10 text-center max-w-4xl px-6">
          <motion.span
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-vamika-gold-light uppercase tracking-[0.3em] text-xs font-semibold block mb-4"
          >
            {t("title")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-serif font-light text-white uppercase tracking-wide leading-tight mb-6"
          >
            {t("introTitle")}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-24 h-0.5 bg-vamika-gold mx-auto mb-6 origin-center"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-white/80 font-serif italic text-lg md:text-xl tracking-wider max-w-2xl mx-auto"
          >
            &ldquo;{t("tagline")}&rdquo;
          </motion.p>
        </div>
      </section>

      {/* 2. Brand Story / Intro Section */}
      <section className="py-24 max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="space-y-2">
              <span className="text-vamika-gold uppercase tracking-[0.2em] text-[11px] font-semibold">
                Our Heritage
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-light uppercase tracking-widest text-vamika-charcoal">
                Exquisite Vision & Legacy
              </h2>
              <div className="w-12 h-px bg-vamika-gold mt-3" />
            </div>
            
            <p className="text-luxury-text-secondary leading-relaxed text-base font-light">
              {t("paragraph1")}
            </p>
            <p className="text-luxury-text-secondary leading-relaxed text-base font-light">
              {t("paragraph2")}
            </p>
            <p className="text-luxury-text-secondary leading-relaxed text-base font-light">
              {t("paragraph3")}
            </p>

            <div className="pt-4">
              <div className="border-l-2 border-vamika-gold/50 pl-6 py-2 italic font-serif text-lg text-vamika-charcoal/80 bg-vamika-gold/5 rounded-r-sm">
                &ldquo;{t("missionText")}&rdquo;
              </div>
            </div>
          </motion.div>

          {/* Feature Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: 45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative h-[500px] w-full rounded-sm overflow-hidden shadow-2xl group">
              <Image
                src="/necklace-lifestyle.png"
                alt="Exquisite necklace details"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white text-xs tracking-widest uppercase font-semibold">
                Bespoke Excellence
              </div>
            </div>
            {/* Absolute accent card */}
            <div className="absolute -bottom-8 -left-8 bg-white p-6 shadow-xl border border-luxury-border rounded-sm max-sm:hidden">
              <span className="text-vamika-gold text-2xl font-serif font-light block">100%</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 block mt-1">Certified Diamonds</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Three Pillars Section */}
      <section className="py-24 bg-[#FAF7F2] border-y border-luxury-border">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold">
              Capabilities
            </span>
            <h2 className="text-3xl font-serif font-light uppercase tracking-widest mt-2">
              Three Pillars of Excellence
            </h2>
            <div className="w-12 h-px bg-vamika-gold mx-auto mt-4" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {pillars.map((pillar) => (
              <motion.div
                key={pillar.key}
                variants={itemVariants}
                className="bg-white p-8 rounded-sm shadow-md border border-luxury-border hover:shadow-xl hover:border-vamika-gold-light/40 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 inline-block bg-[#FAF8F5] p-5 rounded-full group-hover:bg-vamika-gold-light/10 transition-colors duration-300">
                    {pillar.icon}
                  </div>
                  <span className="block text-[10px] text-vamika-gold uppercase font-bold tracking-widest mb-2">
                    {pillar.tag}
                  </span>
                  <h3 className="font-serif font-medium text-xl uppercase tracking-wider text-vamika-charcoal mb-4">
                    {t(`features.${pillar.key}.title`)}
                  </h3>
                  <p className="text-sm text-luxury-text-secondary leading-relaxed font-light">
                    {t(`features.${pillar.key}.desc`)}
                  </p>
                </div>
                <div className="w-8 h-0.5 bg-luxury-border group-hover:bg-vamika-gold-light transition-colors duration-300 mt-8" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Craftsmanship Focus & Asymmetric Grid */}
      <section className="py-24 max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Asymmetric Imagery */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[320px] rounded-sm overflow-hidden shadow-lg group"
            >
              <Image
                src="/editorial-grid-1.png"
                alt="Diamond testing and selection"
                fill
                className="object-cover transition-transform duration-750 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[320px] rounded-sm overflow-hidden shadow-lg mt-8 group"
            >
              <Image
                src="/editorial-grid-2.png"
                alt="Jewelry polish and setting"
                fill
                className="object-cover transition-transform duration-750 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </motion.div>
          </div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 space-y-6"
          >
            <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold">
              Quality First
            </span>
            <h2 className="text-3xl font-serif font-light uppercase tracking-widest text-vamika-charcoal">
              End-to-End Solutions
            </h2>
            <div className="w-12 h-px bg-vamika-gold mt-3" />
            <p className="text-luxury-text-secondary leading-relaxed font-light">
              From sourcing to creation, we maintain complete control over the entire supply chain. Our raw materials are scrutinized under multi-phase gemological examinations to ensure that only the most radiant diamonds, pristine platinum, and BIS hallmarked gold are integrated into our timeless designs.
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-luxury-border">
              <div>
                <h4 className="font-serif text-lg text-vamika-charcoal uppercase tracking-wider">Ethical Sourcing</h4>
                <p className="text-xs text-stone-500 leading-relaxed mt-1 font-light">Conflict-free materials verified via international standards.</p>
              </div>
              <div>
                <h4 className="font-serif text-lg text-vamika-charcoal uppercase tracking-wider">Tailored Precision</h4>
                <p className="text-xs text-stone-500 leading-relaxed mt-1 font-light">CAD designs and detailed manual prototyping for customization.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
