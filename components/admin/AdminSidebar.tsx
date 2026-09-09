"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  MdDashboard,
  MdOutlineCategory,
  MdOutlineReviews,
  MdOutlineDiscount,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowRight,
  MdClose,
  MdMenu,
} from "react-icons/md";
import {
  FaBagShopping,
  FaTable,
  FaWarehouse,
  FaUsers,
  FaRotateLeft,
  FaChartLine,
  FaScroll,
  FaGear,
  FaUpload,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";

interface NavGroup {
  title: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string | number;
    exact?: boolean;
  }[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: MdDashboard, exact: true },
      { name: "Analytics", href: "/admin/analytics", icon: FaChartLine },
    ],
  },
  {
    title: "Sales & Fulfillment",
    items: [
      { name: "Orders", href: "/admin/orders", icon: FaBagShopping },
      { name: "Returns & RMA", href: "/admin/returns", icon: FaRotateLeft },
    ],
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/admin/products", icon: FaTable },
      { name: "Categories", href: "/admin/categories", icon: MdOutlineCategory },
      { name: "Reviews", href: "/admin/reviews", icon: MdOutlineReviews },
      { name: "Bulk Import", href: "/admin/bulk-upload", icon: FaUpload },
    ],
  },
  {
    title: "Operations & Stock",
    items: [
      { name: "Inventory", href: "/admin/inventory", icon: FaWarehouse },
      { name: "Customers", href: "/admin/customers", icon: FaUsers },
      { name: "Discounts & Promos", href: "/admin/discounts", icon: MdOutlineDiscount },
    ],
  },
  {
    title: "System & Governance",
    items: [
      { name: "Audit Trail", href: "/admin/audit-logs", icon: FaScroll },
      { name: "Store Settings", href: "/admin/settings", icon: FaGear },
    ],
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-vamika-charcoal text-luxury-gold p-3.5 rounded-full shadow-xl border border-luxury-gold/30 flex items-center justify-center focus:outline-none"
        aria-label="Open Admin Menu"
      >
        <MdMenu className="text-2xl" />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          "bg-vamika-charcoal text-luxury-ivory transition-all duration-300 flex flex-col z-50 border-r border-luxury-gold/15 shrink-0",
          // Desktop sizing
          collapsed ? "lg:w-20" : "lg:w-68",
          // Mobile drawer sizing & positioning
          "max-lg:fixed max-lg:top-0 max-lg:bottom-0 max-lg:left-0 max-lg:w-72 max-lg:shadow-2xl",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        {/* Brand & Store Header */}
        <div className="h-18 flex items-center justify-between px-5 border-b border-luxury-gold/15 bg-black/20">
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-wider text-luxury-gold font-light flex items-center gap-1.5">
                VAMIKA <span className="text-xs uppercase tracking-widest px-1.5 py-0.5 bg-luxury-gold/15 text-luxury-gold rounded font-sans">OPS</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-luxury-ivory/50">Enterprise Admin</span>
            </div>
          ) : (
            <span className="font-serif text-xl font-bold text-luxury-gold mx-auto">V</span>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-luxury-ivory/60 hover:text-luxury-gold p-1.5 rounded-md hover:bg-white/5 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <FaChevronRight size={13} /> : <FaChevronLeft size={13} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-luxury-ivory/60 hover:text-white p-1"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Store Context Quick Switcher */}
        {!collapsed && (
          <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-white/5 border border-luxury-gold/10 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-luxury-gold font-semibold">Store Context</div>
            <div className="text-luxury-ivory font-medium truncate mt-0.5">Vamika Flagship (Mumbai)</div>
          </div>
        )}

        {/* Nav Groups Navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-6 scrollbar-thin scrollbar-thumb-luxury-gold/20">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] uppercase font-bold tracking-widest text-luxury-ivory/40">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={clsx(
                      "flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all group relative",
                      isActive
                        ? "bg-gradient-to-r from-luxury-gold/25 to-luxury-gold/10 text-luxury-gold border-l-2 border-luxury-gold font-semibold shadow-xs"
                        : "text-luxury-ivory/70 hover:bg-white/5 hover:text-luxury-ivory"
                    )}
                  >
                    <Icon
                      className={clsx(
                        "text-lg shrink-0 transition-colors",
                        isActive ? "text-luxury-gold" : "text-luxury-ivory/50 group-hover:text-luxury-gold"
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {item.badge && !collapsed && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-luxury-gold text-vamika-charcoal">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-luxury-gold/15 bg-black/30 text-center">
          {!collapsed ? (
            <div className="flex items-center justify-between text-[11px] text-luxury-ivory/50 px-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live v2.4
              </span>
              <span>MySQL 8.0</span>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" title="System Live" />
          )}
        </div>
      </aside>
    </>
  );
};
