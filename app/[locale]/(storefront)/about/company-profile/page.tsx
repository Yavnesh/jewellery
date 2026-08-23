"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaGem, FaAward, FaHammer, FaCheck, FaStar } from "react-icons/fa6";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 60, damping: 15 },
  },
};

export default function CompanyProfilePage() {
  const t = useTranslations("CompanyProfilePage");

  // Read the expertiseItems array using translation keys or map indexes
  const expertiseKeys = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="bg-luxury-bg min-h-screen text-luxury-text-primary overflow-x-hidden font-sans">
      {/* 1. Hero Section */}
      <section className="relative h-[65vh] min-h-[450px] flex items-center justify-center overflow-hidden">
        <Image
          src="/anniversary-lifestyle.png"
          alt="Luxury diamond selection"
          fill
          priority
          className="object-cover object-center scale-105 filter brightness-[0.35]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-luxury-bg/95" />

        <div className="relative z-10 text-center max-w-5xl px-6">
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
            className="text-5xl md:text-7xl font-serif font-light text-white uppercase tracking-wide leading-none mb-6"
          >
            {t("headerTitle")}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-32 h-0.5 bg-vamika-gold mx-auto mb-6 origin-center"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-stone-300 font-sans tracking-widest text-[10px] md:text-xs uppercase font-medium max-w-3xl mx-auto leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      {/* 2. About & Founder Intro */}
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
                Established 2018
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-light uppercase tracking-widest text-vamika-charcoal">
                {t("introTitle")}
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
          </motion.div>

          {/* Feature Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: 45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative h-[480px] w-full rounded-sm overflow-hidden shadow-2xl group">
              <Image
                src="/bridal-occasion.png"
                alt="Beautiful diamond set detail"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white text-xs tracking-widest uppercase font-semibold">
                20 Years of Expertise
              </div>
            </div>
            {/* Absolute accent card */}
            <div className="absolute -bottom-8 -left-8 bg-white p-6 shadow-xl border border-luxury-border rounded-sm max-sm:hidden">
              <span className="text-vamika-gold text-2xl font-serif font-light block">Professional</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 block mt-1">Managed Atelier</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Expertise Section */}
      <section className="py-24 bg-[#FAF7F2] border-y border-luxury-border">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold">
              Atelier
            </span>
            <h2 className="text-3xl font-serif font-light uppercase tracking-widest mt-2">
              {t("expertiseTitle")}
            </h2>
            <div className="w-12 h-px bg-vamika-gold mx-auto mt-4" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {expertiseKeys.map((idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white p-6 rounded-sm shadow-sm border border-luxury-border hover:shadow-md hover:border-vamika-gold-light/40 transition-all duration-300 group flex items-center gap-4"
              >
                <div className="p-3 bg-vamika-gold/5 rounded-full text-vamika-gold group-hover:bg-vamika-gold-light/10 transition-colors">
                  <FaCheck className="text-lg text-vamika-gold-light" />
                </div>
                <span className="font-serif text-sm uppercase tracking-wider text-vamika-charcoal">
                  {t(`expertiseItems.${idx}`)}
                </span>
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
                src="/bracelet-lifestyle.png"
                alt="Exquisite Gold Bracelet details"
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
                src="/rings-lifestyle.png"
                alt="Luxury Diamond Rings details"
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
              Atelier Philosophy
            </span>
            <h2 className="text-3xl font-serif font-light uppercase tracking-widest text-vamika-charcoal">
              {t("craftTitle")}
            </h2>
            <div className="w-12 h-px bg-vamika-gold mt-3" />
            <p className="text-luxury-text-secondary leading-relaxed font-light">
              {t("craftParagraph1")}
            </p>
            <p className="text-luxury-text-secondary leading-relaxed font-light">
              {t("craftParagraph2")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. Values & Commitment Section */}
      <section className="py-24 bg-[#FAF7F2] border-y border-luxury-border">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <span className="text-vamika-gold uppercase tracking-[0.25em] text-[10px] font-semibold block">
            Values
          </span>
          <h2 className="text-3xl font-serif font-light uppercase tracking-widest text-vamika-charcoal">
            {t("commitmentTitle")}
          </h2>
          <div className="w-12 h-px bg-vamika-gold mx-auto" />
          <p className="text-luxury-text-secondary leading-relaxed font-light max-w-2xl mx-auto">
            {t("commitmentParagraph")}
          </p>

          <div className="py-6 border-y border-luxury-border max-w-xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-3">
              {t("commitmentSub")}
            </span>
            <span className="text-xl md:text-2xl font-serif font-medium tracking-wider text-vamika-gold-light block">
              {t("commitmentValues")}
            </span>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed font-light max-w-2xl mx-auto">
            {t("commitmentBottom")}
          </p>
        </div>
      </section>

      {/* 6. Vision & Promise Section */}
      <section className="py-24 max-w-screen-2xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <span className="text-vamika-gold uppercase tracking-[0.2em] text-[10px] font-semibold block">
            Future
          </span>
          <h3 className="text-2xl font-serif font-light uppercase tracking-wider text-vamika-charcoal">
            {t("visionTitle")}
          </h3>
          <div className="w-12 h-px bg-vamika-gold mt-3" />
          <p className="text-sm text-luxury-text-secondary leading-relaxed font-light pt-2">
            {t("visionParagraph")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white p-10 border border-luxury-border rounded-sm shadow-lg text-center space-y-4"
        >
          <span className="text-vamika-gold uppercase tracking-[0.2em] text-[10px] font-semibold block">
            Trust
          </span>
          <h3 className="text-2xl font-serif font-light uppercase tracking-wider text-vamika-charcoal">
            {t("promiseTitle")}
          </h3>
          <div className="w-12 h-0.5 bg-vamika-gold mx-auto" />
          <div className="space-y-1 py-2">
            <span className="block text-base font-serif italic text-vamika-gold-light">{t("promiseLine1")}</span>
            <span className="block text-sm uppercase tracking-widest font-semibold text-stone-500">{t("promiseLine2")}</span>
          </div>
          <p className="text-xs text-luxury-text-secondary leading-relaxed font-light">
            {t("promiseBottom")}
          </p>
        </motion.div>
      </section>

      {/* 7. Signature Footer */}
      <section className="py-20 bg-white border-t border-luxury-border text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="space-y-4"
        >
          <span className="text-2xl font-serif tracking-widest uppercase text-vamika-charcoal">{t("bottomLogo")}</span>
          <p className="text-xs text-stone-500 uppercase tracking-[0.25em] font-semibold">{t("bottomTagline")}</p>
        </motion.div>
      </section>
    </div>
  );
}
