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
import { FaHeadphones, FaRegEnvelope, FaRegUser } from "react-icons/fa6";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

import { useTranslations } from "next-intl";

const HeaderTop = () => {
  const { data: session }: any = useSession();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Header");

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    router.push(pathname, { locale: nextLocale });
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
            <FaHeadphones className="text-sm" />
            <span>+381 61 123 321</span>
          </li>
          <li className="flex items-center gap-x-2 text-white/80 hover:text-luxury-gold transition-colors duration-200">
            <FaRegEnvelope className="text-sm" />
            <span className="lowercase">test@email.com</span>
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
              <span className="text-white/70 normal-case hidden sm:inline">{session.user?.email}</span>
              <li className="flex items-center">
                <button onClick={handleLogout} className="flex items-center gap-x-2 text-white/85 hover:text-luxury-gold transition-colors duration-200">
                  <FaRegUser className="text-xs" />
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
              <option value="hi" className="bg-[#2E2E2D] text-white">HI</option>
              <option value="es" className="bg-[#2E2E2D] text-white">ES</option>
              <option value="fr" className="bg-[#2E2E2D] text-white">FR</option>
              <option value="de" className="bg-[#2E2E2D] text-white">DE</option>
              <option value="ar" className="bg-[#2E2E2D] text-white">AR</option>
            </select>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HeaderTop;
