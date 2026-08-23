"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaGem, FaAward, FaHammer, FaRegEnvelope } from "react-icons/fa6";

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

export default function WorkWithUsPage() {
  const t = useTranslations("CareersPage");

  const valuesList = [
    {
      key: "quality",
      icon: <FaAward className="text-3xl text-vamika-gold-light" />,
    },
    {
      key: "authenticity",
      icon: <FaGem className="text-3xl text-vamika-gold-light" />,
    },
    {
      key: "precision",
      icon: <FaHammer className="text-3xl text-vamika-gold-light" />,
    },
  ];

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary overflow-x-hidden font-sans">
      {/* 1. Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="/editorial-grid-2.png"
          alt="Luxury jewellery crafting background"
          fill
          priority
          className="object-cover object-center scale-105 filter brightness-[0.35]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-luxury-bg/90" />

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
            className="text-white/85 font-serif italic text-lg md:text-xl tracking-wider max-w-3xl mx-auto"
          >
            &ldquo;{t("tagline")}&rdquo;
          </motion.p>
        </div>
      </section>

      {/* 2. Brand Legacy Section */}
      <section className="py-24 max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Asymmetric Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: -45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative h-[480px] w-full rounded-sm overflow-hidden shadow-2xl group">
              <Image
                src="/rings-lifestyle.png"
                alt="Exquisite engagement rings craftsmanship"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white text-xs tracking-widest uppercase font-semibold">
                Established 2018
              </div>
            </div>
            {/* Absolute accent card */}
            <div className="absolute -bottom-8 -right-8 bg-white p-6 shadow-xl border border-luxury-border rounded-sm max-sm:hidden">
              <span className="text-vamika-gold text-2xl font-serif font-light block">Bespoke</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 block mt-1">Jewellery Solutions</span>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="space-y-2">
              <span className="text-vamika-gold uppercase tracking-[0.2em] text-[11px] font-semibold">
                Join Vamika Jewels
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-light uppercase tracking-widest text-vamika-charcoal">
                Our Craft & Vision
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
            <p className="text-luxury-text-secondary leading-relaxed text-base font-light">
              {t("paragraph4")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. Core Values Section */}
      <section className="py-24 bg-[#FAF7F2] border-y border-luxury-border">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold">
              Our Principles
            </span>
            <h2 className="text-3xl font-serif font-light uppercase tracking-widest mt-2">
              Why We Create
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
            {valuesList.map((item) => (
              <motion.div
                key={item.key}
                variants={itemVariants}
                className="bg-white p-8 rounded-sm shadow-md border border-luxury-border hover:shadow-xl hover:border-vamika-gold-light/40 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 inline-block bg-[#FAF8F5] p-5 rounded-full group-hover:bg-vamika-gold-light/10 transition-colors duration-300">
                    {item.icon}
                  </div>
                  <h3 className="font-serif font-medium text-xl uppercase tracking-wider text-vamika-charcoal mb-4">
                    {t(`values.${item.key}.title`)}
                  </h3>
                  <p className="text-sm text-luxury-text-secondary leading-relaxed font-light">
                    {t(`values.${item.key}.desc`)}
                  </p>
                </div>
                <div className="w-8 h-0.5 bg-luxury-border group-hover:bg-vamika-gold-light transition-colors duration-300 mt-8" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Application CTA Section */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white p-12 md:p-16 rounded-sm border border-luxury-border shadow-xl space-y-6"
        >
          <div className="inline-block p-4 rounded-full bg-vamika-gold/5 text-vamika-gold mb-2">
            <FaRegEnvelope className="text-4xl text-vamika-gold-light animate-pulse" />
          </div>
          <h2 className="text-3xl font-serif font-light uppercase tracking-widest text-vamika-charcoal">
            {t("applyTitle")}
          </h2>
          <div className="w-12 h-0.5 bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light max-w-xl mx-auto text-sm md:text-base">
            {t("applyDesc")}
          </p>
          <div className="pt-4">
            <a
              href="mailto:careers@vamikajewels.com"
              className="inline-block bg-vamika-charcoal text-white hover:bg-vamika-gold-light hover:text-white transition-all duration-300 tracking-widest px-8 py-4 uppercase text-xs font-semibold rounded-sm shadow-md"
            >
              {t("emailLabel")}
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
