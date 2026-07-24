// *********************
// Role of the component: Category wrapper with large image-driven cards
// Name of the component: CategoryMenu.tsx
// *********************

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Heading from "./Heading";

const categories = [
  {
    id: 1,
    title: "Rings",
    subtitle: "Solitaires & Bands",
    href: "/shop/rings",
    image: "/rings-lifestyle.png",
  },
  {
    id: 2,
    title: "Necklaces",
    subtitle: "Chokers & Pendants",
    href: "/shop/necklaces",
    image: "/necklace-lifestyle.png",
  },
  {
    id: 3,
    title: "Earrings",
    subtitle: "Jhumkas & Studs",
    href: "/shop/earrings",
    image: "/earrings-lifestyle.png",
  },
  {
    id: 4,
    title: "Bracelets",
    subtitle: "Bangles & Chains",
    href: "/shop/bracelets",
    image: "/bracelet-lifestyle.png",
  },
];

const CategoryMenu = () => {
  return (
    <div className="py-20 bg-white">
      <Heading title="SHOP BY CATEGORY" />
      <p className="text-center text-xs text-luxury-text-secondary tracking-widest uppercase -mt-4 mb-12 font-sans">
        Explore our curated collections
      </p>
      <div className="max-w-screen-2xl mx-auto px-16 max-md:px-6 grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="group relative h-[420px] max-lg:h-[340px] overflow-hidden rounded-sm"
          >
            {/* Background Image */}
            <Image
              src={cat.image}
              alt={cat.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/80" />
            
            {/* Content at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <span className="text-tanishq-gold-light text-[10px] font-sans tracking-[0.2em] uppercase font-semibold">
                {cat.subtitle}
              </span>
              <h3 className="text-white text-2xl font-serif font-light uppercase tracking-wider mt-1 group-hover:text-tanishq-gold-light transition-colors duration-300">
                {cat.title}
              </h3>
              <span className="inline-block mt-3 text-white/80 text-[10px] font-sans tracking-widest uppercase font-medium border-b border-white/40 pb-0.5 group-hover:border-tanishq-gold-light group-hover:text-tanishq-gold-light transition-all duration-300">
                Explore →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryMenu;
