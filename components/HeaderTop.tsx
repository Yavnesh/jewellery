// *********************
// Role of the component: Topbar of the header
// Name of the component: HeaderTop.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <HeaderTop />
// Input parameters: no input parameters
// Output: topbar with phone, email and login and register links
// *********************

"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import toast from "react-hot-toast";
import { FaHeadphones, FaRegEnvelope, FaRegUser, FaShieldHalved } from "react-icons/fa6";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

import { useTranslations } from "next-intl";
import { COMPANY_EMAIL, COMPANY_PHONE, COMPANY_PHONE_FORMATTED } from "@/utils/brand";

const HeaderTop = () => {
  const { data: session }: any = useSession();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Header");

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname, { locale: nextLocale });
    router.refresh();
  };

  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  };

  return (
    <div className="h-10 text-white bg-luxury-text-primary border-b border-luxury-border/10 max-lg:px-5 max-lg:h-12 max-[573px]:px-0 text-xs tracking-wider uppercase font-sans">
      <div className="flex justify-between items-center h-full max-lg:flex-row max-w-screen-2xl mx-auto px-12 max-[573px]:px-4">
        <ul className="flex items-center h-full gap-x-6 max-[480px]:hidden">
          <li className="flex items-center gap-x-2 text-white/80 hover:text-luxury-gold transition-colors duration-200">
            <a href={`tel:${COMPANY_PHONE}`} className="flex items-center gap-x-2 hover:text-luxury-gold">
              <FaHeadphones className="text-sm" />
              <span>{COMPANY_PHONE_FORMATTED}</span>
            </a>
          </li>
          <li className="flex items-center gap-x-2 text-white/80 hover:text-luxury-gold transition-colors duration-200">
            <a href={`mailto:${COMPANY_EMAIL}`} className="flex items-center gap-x-2 hover:text-luxury-gold">
              <FaRegEnvelope className="text-sm" />
              <span className="lowercase">{COMPANY_EMAIL}</span>
            </a>
          </li>
        </ul>
        <ul className="flex items-center gap-x-6 h-full ml-auto">
          {!session ? (
            <>
              <li className="flex items-center">
                <Link href="/login" className="flex items-center gap-x-2 text-white/85 hover:text-luxury-gold transition-colors duration-200">
                  <FaRegUser className="text-xs" />
                  <span>{t("login")}</span>
                </Link>
              </li>
              <li className="flex items-center">
                <Link href="/register" className="flex items-center gap-x-2 text-white/85 hover:text-luxury-gold transition-colors duration-200">
                  <FaRegUser className="text-xs" />
                  <span>{t("register")}</span>
                </Link>
              </li>
            </>
          ) : (
            <>
              {(() => {
                const role = ((session.user as any)?.role || "").toLowerCase();
                const email = (session.user?.email || "").toLowerCase();
                const isAdministrator = role === "admin" || role === "superadmin" || email === "admin@vamikajewels.com" || email === "admin@vamiexports.com";
                return isAdministrator ? (
                  <li className="flex items-center">
                    <Link
                      href="/admin"
                      className="flex items-center gap-x-1.5 px-2.5 py-1 rounded bg-luxury-gold text-vamika-charcoal font-bold text-[11px] hover:bg-amber-400 transition-colors shadow-2xs tracking-wider"
                    >
                      <FaShieldHalved className="text-xs" />
                      <span>Admin Panel</span>
                    </Link>
                  </li>
                ) : null;
              })()}
              <li className="flex items-center">
                <Link
                  href="/account"
                  className="flex items-center gap-x-1.5 text-white/90 hover:text-luxury-gold transition-colors font-medium normal-case"
                  title="Open Customer Dashboard, Orders & Saved Addresses"
                >
                  <FaRegUser className="text-xs text-luxury-gold" />
                  <span>My Account</span>
                  <span className="text-white/60 text-[11px] hidden md:inline">({session.user?.email})</span>
                </Link>
              </li>
              <li className="flex items-center">
                <button onClick={handleLogout} className="flex items-center gap-x-1 text-white/80 hover:text-luxury-gold transition-colors duration-200">
                  <span>{t("logout")}</span>
                </button>
              </li>
            </>
          )}
          
          <li className="flex items-center gap-x-2 border-l border-white/20 pl-4 h-full">
            <select
              value={locale}
              onChange={handleLanguageChange}
              className="bg-transparent text-white/85 text-[11px] font-sans outline-none cursor-pointer hover:text-luxury-gold uppercase border-none focus:ring-0 focus:outline-none"
            >
              <option value="en" className="bg-[#2E2E2D] text-white">EN</option>
              <option value="es" className="bg-[#2E2E2D] text-white">ES</option>
              <option value="fr" className="bg-[#2E2E2D] text-white">FR</option>
              <option value="de" className="bg-[#2E2E2D] text-white">DE</option>
            </select>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HeaderTop;
