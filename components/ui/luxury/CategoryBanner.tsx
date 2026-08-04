"use client";

import React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export const CategoryBanner = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  return (
    <div className="relative w-full h-[420px] overflow-hidden bg-vamika-charcoal flex items-center justify-center">
      <motion.div style={{ y: y1, opacity }} className="absolute inset-0 z-0">
        <Image
          src="/hero-banner.png"
          alt="Luxury Jewelry Collection"
          fill
          priority
          className="object-cover opacity-60"
        />
      </motion.div>
      
      <div className="relative z-10 text-center max-w-2xl px-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 drop-shadow-md tracking-wide"
        >
          Timeless Jewelry Collection
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-white/90 font-sans text-lg md:text-xl font-light mb-8 tracking-wide drop-shadow-sm"
        >
          Discover handcrafted pieces designed for every occasion.
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="bg-white/10 backdrop-blur-md border border-white/30 text-white font-sans font-medium uppercase tracking-widest text-sm px-8 py-3.5 hover:bg-white hover:text-vamika-charcoal transition-all duration-300"
        >
          Explore New Arrivals
        </motion.button>
      </div>
    </div>
  );
};
