"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { useTranslations } from "next-intl";

const Hero = () => {
  const t = useTranslations("Hero");
  const [current, setCurrent] = useState(0);

  const slides = [
    {
      id: 1,
      title: t("slide1.title"),
      subtitle: t("slide1.subtitle"),
      description: t("slide1.description"),
      image: "/bridal-occasion.png",
      ctaText: t("slide1.ctaText"),
      ctaLink: "/shop?occasion=Wedding",
    },
    {
      id: 2,
      title: t("slide2.title"),
      subtitle: t("slide2.subtitle"),
      description: t("slide2.description"),
      image: "/hero-banner.png",
      ctaText: t("slide2.ctaText"),
      ctaLink: "/shop",
    },
    {
      id: 3,
      title: t("slide3.title"),
      subtitle: t("slide3.subtitle"),
      description: t("slide3.description"),
      image: "/daily-wear-lifestyle.png",
      ctaText: t("slide3.ctaText"),
      ctaLink: "/shop?occasion=Daily+Wear",
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[85vh] min-h-[550px] max-h-[750px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"
          }`}
        >
          {/* Full-bleed background image */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            fetchPriority={index === 0 ? "high" : "auto"}
            className="object-cover object-center"
            sizes="100vw"
          />
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          
          {/* Content */}
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-screen-2xl mx-auto px-16 max-md:px-8 w-full">
              <div className="max-w-xl">
                <span className="inline-block text-vamika-gold-light uppercase tracking-[0.3em] text-[10px] font-sans font-semibold mb-4 border border-vamika-gold-light/30 px-4 py-1.5 rounded-full backdrop-blur-sm bg-white/5">
                  {slide.subtitle}
                </span>
                <h1 className="text-6xl max-xl:text-5xl max-md:text-4xl text-white font-serif font-light uppercase tracking-wide leading-[1.15] mb-5">
                  {slide.title}
                </h1>
                <p className="text-white/75 font-sans leading-relaxed text-sm md:text-base max-w-md mb-8">
                  {slide.description}
                </p>
                <div className="flex gap-4">
                  <Link
                    href={slide.ctaLink}
                    className="inline-block bg-white text-vamika-charcoal tracking-widest px-10 py-4 hover:bg-vamika-gold-light hover:text-white transition-all duration-300 uppercase text-xs font-semibold rounded-sm shadow-lg"
                  >
                    {slide.ctaText}
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-block bg-transparent text-white border border-white/40 tracking-widest px-10 py-4 hover:bg-white/10 hover:border-white/70 transition-all duration-300 uppercase text-xs font-semibold rounded-sm backdrop-blur-sm"
                  >
                    {t("viewAll")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Slide Indicators — vertical on right side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-y-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-300 rounded-full ${
              index === current 
                ? "bg-vamika-gold-light w-2.5 h-8" 
                : "bg-white/40 hover:bg-white/60 w-2.5 h-2.5"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vamika-gold-light/40 to-transparent z-20" />
    </div>
  );
};

export default Hero;
