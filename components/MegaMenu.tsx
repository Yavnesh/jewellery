"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface SubCategoryItem {
  name: string;
  slug: string;
  href: string;
}

interface NavCategory {
  id: string;
  slug: string;
  label: string;
  subcategories: SubCategoryItem[];
}

const defaultParentCategories: NavCategory[] = [
  { id: "bangles", slug: "bangles", label: "Bangles", subcategories: [] },
  { id: "bracelets", slug: "bracelets", label: "Bracelets", subcategories: [] },
  { id: "broches", slug: "broches", label: "Broches", subcategories: [] },
  { id: "charms", slug: "charms", label: "Charms", subcategories: [] },
  { 
    id: "earrings", 
    slug: "earrings", 
    label: "Earrings", 
    subcategories: [
      { name: "Hanging", slug: "hanging", href: "/shop/earrings/hanging" },
      { name: "Tops", slug: "tops", href: "/shop/earrings/tops" },
    ] 
  },
  { id: "necklace", slug: "necklace", label: "Necklace", subcategories: [] },
  { id: "pendants", slug: "pendants", label: "Pendants", subcategories: [] },
  { id: "rings", slug: "rings", label: "Rings", subcategories: [] },
  { id: "salt-and-pepper", slug: "salt-and-pepper", label: "Salt & Pepper", subcategories: [] },
  { id: "white-loose-diamond", slug: "white-loose-diamond", label: "White Loose Diamond", subcategories: [] },
];

const MegaMenu = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => console.error("Error loading categories in menu:", err));
  }, []);

  const navCategories: NavCategory[] = React.useMemo(() => {
    if (!categories || categories.length === 0) {
      return defaultParentCategories;
    }

    const parentCategories = categories.filter(
      (c: any) => !c.parentId && c.name !== "REPLACE_WITH_CATEGORY_ID"
    );

    if (parentCategories.length === 0) {
      return defaultParentCategories;
    }

    return parentCategories.map((parent: any) => {
      const subcats = categories.filter((c: any) => c.parentId === parent.id);
      return {
        id: parent.id,
        slug: parent.slug,
        label: parent.name,
        subcategories: subcats.map((sub: any) => {
          const shortName = sub.name.includes("-") ? sub.name.split("-").pop()! : sub.name;
          const formattedName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
          return {
            name: formattedName,
            slug: sub.slug,
            href: `/shop/${parent.slug}/${sub.slug}`,
          };
        }),
      };
    });
  }, [categories]);

  return (
    <nav className="relative border-t border-luxury-border/40 hidden lg:block bg-white">
      {/* Category Tab Bar */}
      <div className="flex justify-center gap-x-1 max-w-screen-2xl mx-auto px-4">
        {navCategories.map((cat) => {
          const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
          const isActive = activeCategory === cat.slug;

          return (
            <div
              key={cat.slug}
              className="relative"
              onMouseEnter={() => {
                if (hasSubcategories) {
                  setActiveCategory(cat.slug);
                } else {
                  setActiveCategory(null);
                }
              }}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <Link
                href={`/shop/${cat.slug}`}
                className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-sans tracking-widest uppercase font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                  isActive
                    ? "text-[#832729] border-[#832729]"
                    : "text-luxury-text-primary border-transparent hover:text-[#832729] hover:border-[#832729]/40"
                }`}
              >
                <span>{cat.label}</span>
                {hasSubcategories && (
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      isActive ? "rotate-180 text-[#832729]" : "text-gray-400 group-hover:text-[#832729]"
                    }`}
                  />
                )}
              </Link>

              {/* Compact Subcategories Dropdown Menu */}
              {hasSubcategories && isActive && (
                <div 
                  className="absolute top-full left-0 min-w-[190px] bg-white border border-luxury-border/50 shadow-xl rounded-b-md py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={sub.href}
                      onClick={() => setActiveCategory(null)}
                      className="block px-4 py-2.5 text-xs font-sans tracking-wider uppercase text-luxury-text-primary hover:text-[#832729] hover:bg-[#832729]/5 transition-colors duration-150"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default MegaMenu;
