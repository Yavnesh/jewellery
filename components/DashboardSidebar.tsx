// *********************
// Role of the component: Sidebar on admin dashboard page
// Name of the component: DashboardSidebar.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <DashboardSidebar />
// Input parameters: no input parameters
// Output: sidebar for admin dashboard page
// *********************

"use client";
import React from "react";
import { MdDashboard, MdCategory } from "react-icons/md";
import { FaTable, FaRegUser, FaGear, FaBagShopping, FaStore, FaUpload } from "react-icons/fa6";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const DashboardSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: MdDashboard, exact: true },
    { name: "Orders", href: "/admin/orders", icon: FaBagShopping },
    { name: "Products", href: "/admin/products", icon: FaTable },
    { name: "Categories", href: "/admin/categories", icon: MdCategory },
    { name: "Users", href: "/admin/users", icon: FaRegUser },
    { name: "Merchant", href: "/admin/merchant", icon: FaStore },
    { name: "Bulk Upload", href: "/admin/bulk-upload", icon: FaUpload },
    { name: "Settings", href: "/admin/settings", icon: FaGear },
  ];

  return (
    <div className="xl:w-[280px] bg-white border-r border-luxury-border shadow-sm h-[calc(100vh-80px)] sticky top-[80px] max-xl:w-full max-xl:h-auto max-xl:static max-xl:border-b max-xl:border-r-0 flex flex-col font-sans">
      <div className="p-6 hidden xl:block border-b border-luxury-border/50">
        <h2 className="font-serif text-2xl text-vamika-charcoal tracking-wide">Admin <span className="text-luxury-gold">Portal</span></h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 max-xl:flex max-xl:overflow-x-auto max-xl:py-2 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href}>
              <div 
                className={clsx(
                  "flex items-center gap-x-4 w-full cursor-pointer py-3 pl-8 max-xl:pl-4 max-xl:pr-4 text-sm font-medium uppercase tracking-wider transition-all duration-300 border-l-4 max-xl:border-l-0 max-xl:border-b-4 max-xl:flex-shrink-0",
                  isActive 
                    ? "bg-vamika-ivory text-luxury-gold border-luxury-gold" 
                    : "text-luxury-text-secondary border-transparent hover:bg-vamika-ivory/50 hover:text-vamika-charcoal"
                )}
              >
                <Icon className={clsx("text-xl", isActive ? "text-luxury-gold" : "text-luxury-text-secondary/70")} />
                <span className="whitespace-nowrap">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardSidebar;
