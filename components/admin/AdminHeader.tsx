"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaMagnifyingGlass,
  FaBell,
  FaArrowUpRightFromSquare,
  FaCircleUser,
  FaDatabase,
  FaPlus,
} from "react-icons/fa6";
import { GlobalSearchModal } from "./GlobalSearchModal";
import toast from "react-hot-toast";

export const AdminHeader = () => {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Generate dynamic breadcrumb elements
  const pathSegments = pathname.replace(/^\/[a-z]{2}\/admin/, "").split("/").filter(Boolean);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Demo catalog, inventory & orders seeded successfully!");
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to seed demo data");
      }
    } catch (err: any) {
      toast.error("Error seeding data");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <header className="h-18 bg-white border-b border-luxury-border px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs">
          <Link href="/admin" className="font-semibold text-vamika-charcoal hover:text-luxury-gold transition-colors">
            Admin
          </Link>
          {pathSegments.map((segment, idx) => (
            <React.Fragment key={segment + idx}>
              <span className="text-luxury-text-secondary">/</span>
              <span className="capitalize font-medium text-luxury-text-secondary">
                {decodeURIComponent(segment).replace(/-/g, " ")}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Center: Global Search Trigger */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-luxury-bg border border-luxury-border text-xs text-luxury-text-secondary hover:border-luxury-gold/50 transition-all group"
          >
            <span className="flex items-center gap-2">
              <FaMagnifyingGlass className="text-luxury-gold group-hover:scale-110 transition-transform" />
              <span>Search orders, products, SKUs, customers...</span>
            </span>
            <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white border border-luxury-border rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Seed Button (for instant demo data load) */}
          <button
            onClick={handleSeedData}
            disabled={seeding}
            title="Seed demo products, orders & metrics to database"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gold hover:text-vamika-charcoal transition-all disabled:opacity-50"
          >
            <FaDatabase className={seeding ? "animate-spin" : ""} size={12} />
            <span>{seeding ? "Seeding..." : "Seed Demo DB"}</span>
          </button>

          {/* New Product Quick Action */}
          <Link
            href="/admin/products/new"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-vamika-charcoal text-luxury-ivory hover:bg-black transition-colors"
          >
            <FaPlus size={11} />
            <span>Add Product</span>
          </Link>

          {/* Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="p-2 text-luxury-text-secondary hover:text-luxury-gold rounded-lg hover:bg-luxury-bg transition-colors"
            title="Open Live Storefront"
          >
            <FaArrowUpRightFromSquare size={14} />
          </Link>

          {/* Search icon on mobile */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 text-luxury-text-secondary hover:text-luxury-gold rounded-lg hover:bg-luxury-bg transition-colors"
          >
            <FaMagnifyingGlass size={16} />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-luxury-border">
            <div className="w-8 h-8 rounded-full bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/40 flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-vamika-charcoal">Operations Lead</div>
              <div className="text-[10px] text-emerald-600 font-medium">Super Admin</div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
