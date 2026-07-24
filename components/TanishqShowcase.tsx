import React from "react";
import Image from "next/image";
import Link from "next/link";

export const TanishqShowcase = () => {
  return (
    <div className="py-20 bg-[#FAF7F2]">
      {/* Section header */}
      <div className="text-center mb-14">
        <span className="text-tanishq-gold uppercase tracking-[0.3em] text-[10px] font-sans font-semibold">
          Curated For You
        </span>
        <h2 className="text-luxury-text-primary text-4xl font-serif font-light uppercase tracking-widest mt-3 max-lg:text-3xl">
          The Lookbook
        </h2>
        <div className="w-12 h-px bg-tanishq-gold mx-auto mt-4" />
      </div>
      
      <div className="max-w-screen-2xl mx-auto px-16 max-md:px-6">
        {/* Editorial Grid — asymmetric mosaic */}
        <div className="grid grid-cols-12 gap-4 max-md:grid-cols-1">
          
          {/* Large left panel — Bridal */}
          <Link 
            href="/shop?occasion=Wedding"
            className="col-span-7 max-md:col-span-1 relative h-[520px] overflow-hidden rounded-sm group"
          >
            <Image
              src="/bridal-occasion.png"
              alt="Bridal Collection"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <span className="text-tanishq-gold-light text-[10px] font-sans tracking-[0.25em] uppercase font-semibold">
                Wedding Edit
              </span>
              <h3 className="text-white text-3xl font-serif font-light uppercase tracking-wide mt-2">
                The Bridal Trousseau
              </h3>
              <p className="text-white/70 text-sm mt-2 font-sans max-w-md">
                Grand bridal sets handcrafted with heritage artistry for the most precious day of your life.
              </p>
              <span className="inline-block mt-4 text-white text-[10px] font-sans tracking-widest uppercase font-semibold border-b border-white/50 pb-1 group-hover:text-tanishq-gold-light group-hover:border-tanishq-gold-light transition-colors">
                Explore Bridal →
              </span>
            </div>
          </Link>
          
          {/* Right column — stacked */}
          <div className="col-span-5 max-md:col-span-1 grid grid-rows-2 gap-4">
            {/* Top right — flat lay editorial */}
            <Link 
              href="/shop?collection=Diamond"
              className="relative h-[252px] overflow-hidden rounded-sm group"
            >
              <Image
                src="/editorial-grid-1.png"
                alt="Diamond Collection"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-tanishq-gold-light text-[10px] font-sans tracking-[0.2em] uppercase font-semibold">
                  Trending
                </span>
                <h3 className="text-white text-xl font-serif font-light uppercase tracking-wide mt-1">
                  Diamond Essentials
                </h3>
                <span className="inline-block mt-2 text-white/80 text-[10px] font-sans tracking-widest uppercase font-medium group-hover:text-tanishq-gold-light transition-colors">
                  Shop Now →
                </span>
              </div>
            </Link>
            
            {/* Bottom right — lifestyle */}
            <Link 
              href="/shop?collection=Gold"
              className="relative h-[252px] overflow-hidden rounded-sm group"
            >
              <Image
                src="/editorial-grid-2.png"
                alt="Gold Collection"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-tanishq-gold-light text-[10px] font-sans tracking-[0.2em] uppercase font-semibold">
                  Heritage
                </span>
                <h3 className="text-white text-xl font-serif font-light uppercase tracking-wide mt-1">
                  Gold Traditions
                </h3>
                <span className="inline-block mt-2 text-white/80 text-[10px] font-sans tracking-widest uppercase font-medium group-hover:text-tanishq-gold-light transition-colors">
                  Discover →
                </span>
              </div>
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TanishqShowcase;
