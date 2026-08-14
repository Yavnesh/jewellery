"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaGem, FaRing } from "react-icons/fa6";

// ─── Category Data ───────────────────────────────────────────────
interface SubCategory {
  name: string;
  href: string;
  icon: string; // emoji or small icon
}

interface FilterItem {
  name: string;
}

interface MegaCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  subcategories: SubCategory[];
  filters: FilterItem[];
  banner: {
    title: string;
    subtitle: string;
    href: string;
  };
  lifestyle: {
    image: string;
    tagline: string;
    cta: string;
    href: string;
  };
}

const megaCategories: MegaCategory[] = [
  {
    id: "all",
    label: "All Jewellery",
    icon: <span className="text-sm">💎</span>,
    subcategories: [
      { name: "All Jewellery", href: "/shop", icon: "✨" },
      { name: "Earrings", href: "/shop/earrings", icon: "👂" },
      { name: "Pendants", href: "/shop?collection=Diamond", icon: "📿" },
      { name: "Finger Rings", href: "/shop/rings", icon: "💍" },
      { name: "Mangalsutra", href: "/shop?occasion=Wedding", icon: "🪷" },
      { name: "Chains", href: "/shop/necklaces", icon: "⛓️" },
      { name: "Nose Pins", href: "/shop?collection=Gold", icon: "👃" },
      { name: "Necklaces", href: "/shop/necklaces", icon: "📿" },
      { name: "Necklace Sets", href: "/shop/necklaces", icon: "💐" },
      { name: "Bangles", href: "/shop/bracelets", icon: "⭕" },
      { name: "Bracelets", href: "/shop/bracelets", icon: "🔗" },
      { name: "Pendant & Earring Sets", href: "/shop?collection=Diamond", icon: "🎁" },
    ],
    filters: [
      { name: "Category" },
      { name: "Price" },
      { name: "Occasion" },
      { name: "Gender" },
    ],
    banner: {
      title: "Jewellery for Every Moment — See It All Here!",
      subtitle: "14,000+ designs to choose from",
      href: "/shop",
    },
    lifestyle: {
      image: "/necklace-lifestyle.png",
      tagline: "Elegance redefined for the modern woman.",
      cta: "Explore Now",
      href: "/shop",
    },
  },
  {
    id: "gold",
    label: "Gold",
    icon: <span className="text-sm">🪙</span>,
    subcategories: [
      { name: "All Gold", href: "/shop?collection=Gold", icon: "✨" },
      { name: "Gold Bangles", href: "/shop/bracelets", icon: "⭕" },
      { name: "Gold Bracelets", href: "/shop/bracelets", icon: "🔗" },
      { name: "Gold Earrings", href: "/shop/earrings", icon: "👂" },
      { name: "Gold Chains", href: "/shop/necklaces", icon: "⛓️" },
      { name: "Gold Pendants", href: "/shop?collection=Gold", icon: "📿" },
      { name: "Gold Rings", href: "/shop/rings", icon: "💍" },
      { name: "Gold Engagement Rings", href: "/shop?occasion=Engagement", icon: "💎" },
      { name: "Gold Necklaces", href: "/shop/necklaces", icon: "📿" },
      { name: "Gold Nose Pins", href: "/shop?collection=Gold", icon: "👃" },
      { name: "Gold Kadas", href: "/shop/bracelets", icon: "⭕" },
      { name: "Gold Mangalsutras", href: "/shop?occasion=Wedding", icon: "🪷" },
    ],
    filters: [
      { name: "Category" },
      { name: "Price" },
      { name: "Occasion" },
      { name: "Gold Coin" },
      { name: "Men" },
      { name: "Metal" },
    ],
    banner: {
      title: "From Classic to Contemporary.",
      subtitle: "Explore 6000+ Stunning Designs.",
      href: "/shop?collection=Gold",
    },
    lifestyle: {
      image: "/hero-banner.png",
      tagline: "Intricately handcrafted gold masterpieces that inspire new narratives.",
      cta: "Explore Now",
      href: "/shop?collection=Gold",
    },
  },
  {
    id: "diamond",
    label: "Diamond",
    icon: <span className="text-sm">💎</span>,
    subcategories: [
      { name: "All Diamond", href: "/shop?collection=Diamond", icon: "💎" },
      { name: "Diamond Rings", href: "/shop/rings", icon: "💍" },
      { name: "Diamond Earrings", href: "/shop/earrings", icon: "👂" },
      { name: "Diamond Pendants", href: "/shop?collection=Diamond", icon: "📿" },
      { name: "Diamond Necklaces", href: "/shop/necklaces", icon: "📿" },
      { name: "Diamond Bracelets", href: "/shop/bracelets", icon: "🔗" },
      { name: "Diamond Bangles", href: "/shop/bracelets", icon: "⭕" },
      { name: "Solitaire Rings", href: "/shop/rings", icon: "✨" },
      { name: "Tennis Bracelets", href: "/shop/bracelets", icon: "⭐" },
    ],
    filters: [
      { name: "Category" },
      { name: "Price" },
      { name: "Occasion" },
      { name: "Gender" },
      { name: "Metal & Stones" },
    ],
    banner: {
      title: "Diamonds that Tell Your Story.",
      subtitle: "3000+ certified diamond designs.",
      href: "/shop?collection=Diamond",
    },
    lifestyle: {
      image: "/editorial-grid-1.png",
      tagline: "Singular brilliance, infinite charm.",
      cta: "Shop Now",
      href: "/shop?collection=Diamond",
    },
  },
  {
    id: "earrings",
    label: "Earrings",
    icon: <span className="text-sm">👂</span>,
    subcategories: [
      { name: "All Earrings", href: "/shop/earrings", icon: "👂" },
      { name: "Drop & Danglers", href: "/shop/earrings", icon: "💧" },
      { name: "Hoop & Huggies", href: "/shop/earrings", icon: "⭕" },
      { name: "Jhumkas", href: "/shop/earrings", icon: "🔔" },
      { name: "Studs & Tops", href: "/shop/earrings", icon: "✨" },
    ],
    filters: [
      { name: "Category" },
      { name: "Price" },
      { name: "Occasion" },
      { name: "Gender" },
      { name: "Metal & Stones" },
    ],
    banner: {
      title: "Earrings for You — Crafted with Precision, Designed for Elegance.",
      subtitle: "Explore 3500+ Stunning Styles.",
      href: "/shop/earrings",
    },
    lifestyle: {
      image: "/earrings-lifestyle.png",
      tagline: "Singular brilliance, infinite charm.",
      cta: "Shop Now",
      href: "/shop/earrings",
    },
  },
  {
    id: "rings",
    label: "Rings",
    icon: <span className="text-sm">💍</span>,
    subcategories: [
      { name: "All Rings", href: "/shop/rings", icon: "💍" },
      { name: "Engagement Rings", href: "/shop?occasion=Engagement", icon: "💎" },
      { name: "Couple Bands", href: "/shop/rings", icon: "💕" },
      { name: "Cocktail Rings", href: "/shop/rings", icon: "🍸" },
      { name: "Eternity Bands", href: "/shop/rings", icon: "♾️" },
      { name: "Statement Rings", href: "/shop/rings", icon: "⭐" },
    ],
    filters: [
      { name: "Category" },
      { name: "Price" },
      { name: "Occasion" },
      { name: "Gender" },
      { name: "Metal & Stones" },
    ],
    banner: {
      title: "Rings That Speak Volumes.",
      subtitle: "2500+ designs for every moment.",
      href: "/shop/rings",
    },
    lifestyle: {
      image: "/rings-lifestyle.png",
      tagline: "A ring for every promise, every celebration.",
      cta: "Shop Now",
      href: "/shop/rings",
    },
  },
  {
    id: "daily",
    label: "Daily Wear",
    icon: <span className="text-sm">☀️</span>,
    subcategories: [
      { name: "All Daily Wear", href: "/shop?occasion=Daily+Wear", icon: "☀️" },
      { name: "Lightweight Earrings", href: "/shop/earrings", icon: "👂" },
      { name: "Thin Chains", href: "/shop/necklaces", icon: "⛓️" },
      { name: "Simple Rings", href: "/shop/rings", icon: "💍" },
      { name: "Delicate Bracelets", href: "/shop/bracelets", icon: "🔗" },
      { name: "Stud Earrings", href: "/shop/earrings", icon: "✨" },
    ],
    filters: [
      { name: "Category" },
      { name: "Price" },
      { name: "Style" },
      { name: "Gender" },
    ],
    banner: {
      title: "From Everyday Glow to Extraordinary Sparkle.",
      subtitle: "3000+ Designs Await.",
      href: "/shop?occasion=Daily+Wear",
    },
    lifestyle: {
      image: "/daily-wear-lifestyle.png",
      tagline: "Effortless style to make everyday sparkle.",
      cta: "Shop Now",
      href: "/shop?occasion=Daily+Wear",
    },
  },
  {
    id: "wedding",
    label: "Wedding",
    icon: <span className="text-sm">💒</span>,
    subcategories: [
      { name: "All Wedding", href: "/shop?occasion=Wedding", icon: "💒" },
      { name: "Bridal Sets", href: "/shop?occasion=Wedding", icon: "👑" },
      { name: "Choker Necklaces", href: "/shop/necklaces", icon: "📿" },
      { name: "Bridal Bangles", href: "/shop/bracelets", icon: "⭕" },
      { name: "Maang Tikka", href: "/shop?occasion=Wedding", icon: "✨" },
      { name: "Bridal Earrings", href: "/shop/earrings", icon: "👂" },
    ],
    filters: [
      { name: "Category" },
      { name: "Price" },
      { name: "Occasion" },
      { name: "Metal & Stones" },
    ],
    banner: {
      title: "For the Most Precious Day of Your Life.",
      subtitle: "Explore our bridal trousseau.",
      href: "/shop?occasion=Wedding",
    },
    lifestyle: {
      image: "/bridal-occasion.png",
      tagline: "Grand bridal ornaments handcrafted with heritage artistry.",
      cta: "Explore Bridal",
      href: "/shop?occasion=Wedding",
    },
  },
  {
    id: "gifting",
    label: "Gifting",
    icon: <span className="text-sm">🎁</span>,
    subcategories: [
      { name: "All Gifts", href: "/shop", icon: "🎁" },
      { name: "Anniversary Gifts", href: "/shop?occasion=Anniversary", icon: "💕" },
      { name: "Birthday Gifts", href: "/shop", icon: "🎂" },
      { name: "Engagement Gifts", href: "/shop?occasion=Engagement", icon: "💍" },
      { name: "Festive Gifts", href: "/shop", icon: "🪔" },
      { name: "Gifts Under ₹10,000", href: "/shop", icon: "💰" },
    ],
    filters: [
      { name: "Category" },
      { name: "Price" },
      { name: "Occasion" },
      { name: "Gender" },
    ],
    banner: {
      title: "Gift a Moment of Joy.",
      subtitle: "Curated gifting collections.",
      href: "/shop",
    },
    lifestyle: {
      image: "/anniversary-lifestyle.png",
      tagline: "Mark every moment in gold.",
      cta: "Explore Gifts",
      href: "/shop",
    },
  },
];

import { useTranslations } from "next-intl";

// ─── MegaMenu Component ─────────────────────────────────────────
const MegaMenu = () => {
  const tHeader = useTranslations("Header");
  const tMega = useTranslations("MegaMenu");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("Category");

  const handleCategoryHover = (id: string) => {
    setActiveCategory(id);
    setActiveFilter("Category"); // reset to default filter when category changes
  };

  return (
    <nav className="relative border-t border-luxury-border/40 hidden lg:block">
      {/* Category Tab Bar */}
      <div 
        className="flex justify-center gap-x-1 max-w-screen-2xl mx-auto"
        onMouseLeave={() => setActiveCategory(null)}
      >
        {megaCategories.map((cat) => (
          <button
            key={cat.id}
            onMouseEnter={() => handleCategoryHover(cat.id)}
            className={`flex items-center gap-x-1.5 px-4 py-3 text-[11px] font-sans tracking-widest uppercase font-medium transition-all duration-200 border-b-2 ${
              activeCategory === cat.id
                ? "text-[#832729] border-[#832729]"
                : "text-luxury-text-primary border-transparent hover:text-[#832729]"
            }`}
          >
            {cat.icon}
            <span>{cat.id === "all" ? tHeader("allJewellery") : tHeader(cat.id)}</span>
          </button>
        ))}
      </div>

      {/* Mega Menu Panel */}
      {activeCategory && (
        <div
          className="absolute top-full left-0 right-0 bg-white border-t border-luxury-border/40 shadow-xl z-[60] animate-in fade-in duration-200"
          onMouseEnter={() => setActiveCategory(activeCategory)}
          onMouseLeave={() => setActiveCategory(null)}
        >
          {megaCategories
            .filter((cat) => cat.id === activeCategory)
            .map((cat) => (
              <div key={cat.id} className="max-w-screen-2xl mx-auto flex">
                {/* Left Sidebar — Filters */}
                <div className="w-44 shrink-0 border-r border-luxury-border/40 py-6 px-5">
                  {cat.filters.map((filter, idx) => (
                    <button
                      key={filter.name}
                      onMouseEnter={() => setActiveFilter(filter.name)}
                      className={`block w-full text-left text-[13px] font-sans py-2.5 px-3 rounded transition-all duration-150 ${
                        activeFilter === filter.name
                          ? "bg-[#832729]/8 text-[#832729] font-semibold border-l-2 border-[#832729]"
                          : "text-luxury-text-secondary hover:text-luxury-text-primary hover:bg-luxury-ivory"
                      }`}
                    >
                      {tMega(`filters.${filter.name.toLowerCase()}`)}
                    </button>
                  ))}
                </div>

                {/* Center — Subcategory Grid */}
                <div className="flex-1 py-6 px-8 flex flex-col justify-between">
                  {activeFilter === "Category" && (
                    <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className="flex items-center gap-x-3 group"
                          onClick={() => setActiveCategory(null)}
                        >
                          <span className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-luxury-border/40 flex items-center justify-center text-base group-hover:bg-[#832729]/5 group-hover:border-[#832729]/20 transition-all duration-200">
                            {sub.icon}
                          </span>
                          <span className="text-[13px] font-sans text-luxury-text-primary group-hover:text-[#832729] transition-colors duration-200 font-medium">
                            {tMega(`subcategories.${sub.name.replace(/\s+/g, "").toLowerCase()}`)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {activeFilter === "Price" && (
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: "<25K", img: "/product1.webp" },
                        { label: "25K-50K", img: "/product2.webp" },
                        { label: "50K-1L", img: "/product4.webp" },
                        { label: "1L & Above", img: "/product7.webp" },
                      ].map((item) => (
                        <Link href="/shop" key={item.label} onClick={() => setActiveCategory(null)} className="group flex flex-col items-center gap-3">
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-luxury-ivory relative">
                            <Image src={item.img} alt={item.label} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <span className="text-[13px] font-serif text-luxury-text-primary">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {activeFilter === "Occasion" && (
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: "Office Wear", img: "/daily-wear-lifestyle.png" },
                        { label: "Modern Wear", img: "/earrings-lifestyle.png" },
                        { label: "Casual Wear", img: "/necklace-lifestyle.png" },
                        { label: "Traditional Wear", img: "/bridal-occasion.png" },
                      ].map((item) => (
                        <Link href="/shop" key={item.label} onClick={() => setActiveCategory(null)} className="group flex flex-col items-center gap-3">
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-luxury-ivory relative">
                            <Image src={item.img} alt={item.label} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <span className="text-[13px] font-serif text-luxury-text-primary">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {activeFilter === "Gender" && (
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: "Women", img: "/rings-lifestyle.png" },
                        { label: "Men", img: "/hero-banner.png" },
                        { label: "Kids & Teens", img: "/anniversary-lifestyle.png" },
                      ].map((item) => (
                        <Link href="/shop" key={item.label} onClick={() => setActiveCategory(null)} className="group flex flex-col items-center gap-3">
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-luxury-ivory relative">
                            <Image src={item.img} alt={item.label} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <span className="text-[13px] font-serif text-luxury-text-primary">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Fallback for other filters */}
                  {["Category", "Price", "Occasion", "Gender"].includes(activeFilter) === false && (
                    <div className="flex items-center justify-center h-full text-luxury-text-secondary text-sm">
                      More options for {activeFilter} coming soon.
                    </div>
                  )}

                  {/* Promotional Banner */}
                  <div className="mt-8 bg-[#FAF7F2] border border-luxury-border/40 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-x-4">
                      {/* Small product image thumbnails */}
                      <div className="flex -space-x-2">
                        <div className="w-10 h-10 rounded-sm overflow-hidden border border-white">
                          <Image src="/product1.webp" alt="" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="w-10 h-10 rounded-sm overflow-hidden border border-white">
                          <Image src="/product6.webp" alt="" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="w-10 h-10 rounded-sm overflow-hidden border border-white">
                          <Image src="/product9.webp" alt="" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-sans font-semibold text-luxury-text-primary">{tMega(`banners.${cat.id}.title`)}</p>
                        <p className="text-[11px] font-sans text-luxury-text-secondary">{tMega(`banners.${cat.id}.subtitle`)}</p>
                      </div>
                    </div>
                    <Link
                      href={cat.banner.href}
                      onClick={() => setActiveCategory(null)}
                      className="bg-[#832729] text-white text-[11px] font-sans font-semibold tracking-wider uppercase px-5 py-2.5 rounded-sm hover:bg-[#6b1f21] transition-colors duration-200 shrink-0"
                    >
                      {tMega("viewAll")}
                    </Link>
                  </div>
                </div>

                {/* Right — Lifestyle Image */}
                <div className="w-60 shrink-0 border-l border-luxury-border/40 p-4 flex flex-col">
                  <div className="relative flex-1 rounded-sm overflow-hidden mb-3">
                    <Image
                      src={cat.lifestyle.image}
                      alt={tMega(`lifestyles.${cat.id}.tagline`)}
                      fill
                      className="object-cover"
                      sizes="240px"
                    />
                  </div>
                  <p className="text-[13px] font-sans text-luxury-text-primary leading-snug font-medium">
                    {tMega(`lifestyles.${cat.id}.tagline`)}
                  </p>
                  <Link
                    href={cat.lifestyle.href}
                    onClick={() => setActiveCategory(null)}
                    className="text-[12px] font-sans text-[#832729] underline underline-offset-2 mt-1.5 hover:text-[#6b1f21] transition-colors inline-flex items-center gap-x-1"
                  >
                    {tMega(`lifestyles.${cat.id}.cta`)} <span className="text-xs">↗</span>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      )}
    </nav>
  );
};

export default MegaMenu;
