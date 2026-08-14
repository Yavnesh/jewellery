// *********************
// Role of the component: Header component
// Name of the component: Header.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Header />
// Input parameters: no input parameters
// Output: Header component
// *********************

"use client";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import HeaderTop from "./HeaderTop";
import Image from "next/image";
import SearchInput from "./SearchInput";
import Link from "next/link";
import { FaBell } from "react-icons/fa6";

import CartElement from "./CartElement";
import NotificationBell from "./NotificationBell";
import HeartElement from "./HeartElement";
import MegaMenu from "./MegaMenu";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";
import { Menu, X } from "lucide-react";

import { useTranslations } from "next-intl";
import { BRAND_NAME } from "@/utils/brand";

const Header = () => {
  const t = useTranslations("Header");
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { wishlist, setWishlist, wishQuantity } = useWishlistStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    toast.success("Logout successful!");
  };

  // getting all wishlist items by user id
  const getWishlistByUserId = async (id: string) => {
    const response = await apiClient.get(`/api/wishlist/${id}`, {
      cache: "no-store",
    });
    const wishlistData = await response.json();
    const productArray: {
      id: string;
      title: string;
      price: number;
      image: string;
      slug: string;
      stockAvailabillity: number;
    }[] = [];

    if (Array.isArray(wishlistData)) {
      wishlistData.forEach((item: any) => {
        if (item?.product) {
          productArray.push({
            id: item.product.id,
            title: item.product.title,
            price: item.product.price,
            image: item.product.mainImage,
            slug: item.product.slug,
            stockAvailabillity: item.product.inStock || 5,
          });
        }
      });
    }
    setWishlist(productArray);
  };

  useEffect(() => {
    if (session && status === "authenticated") {
      apiClient.get(`/api/users?email=${session.user?.email}`).then(async (response) => {
        const data = await response.json();
        if (data?.id) {
          getWishlistByUserId(data.id);
        }
      });
    }
  }, [session, status]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-luxury-border/60 shadow-sm transition-all duration-300">
      <HeaderTop />
      {pathname.startsWith("/admin") === false && (
        <>
          {/* Desktop & Laptop Header */}
          <div className="hidden lg:flex h-24 items-center justify-between px-16 max-w-screen-2xl mx-auto gap-8">
            <Link href="/" className="transition-opacity duration-200 hover:opacity-80 flex items-center shrink-0">
              <span className="text-2xl font-serif font-semibold tracking-widest text-vamika-gold uppercase">{BRAND_NAME}</span>
            </Link>
            <div className="flex-1 max-w-xl mx-auto">
              <SearchInput />
            </div>
            <div className="flex gap-x-8 items-center shrink-0">
              <NotificationBell />
              <HeartElement wishQuantity={wishQuantity} />
              <CartElement />
            </div>
          </div>

          {/* Mobile & Tablet Header */}
          <div className="flex lg:hidden flex-col px-4 md:px-8 py-3 gap-3 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              {/* Hamburger Menu Trigger */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-luxury-text-primary" />
              </button>

              {/* Logo */}
              <Link href="/" className="transition-opacity duration-200 hover:opacity-80 flex items-center">
                <span className="text-xl font-serif font-semibold tracking-widest text-vamika-gold uppercase">{BRAND_NAME}</span>
              </Link>

              {/* Actions */}
              <div className="flex gap-x-3 items-center">
                <HeartElement wishQuantity={wishQuantity} />
                <CartElement />
              </div>
            </div>

            {/* Mobile Search Input */}
            <div className="w-full">
              <SearchInput />
            </div>
          </div>
          
          <MegaMenu />

          {/* Mobile Drawer Menu */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[100] flex lg:hidden">
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Drawer Container */}
              <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-white h-screen flex flex-col shadow-2xl transition-transform animate-in slide-in-from-left duration-250">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <span className="font-serif font-semibold text-lg tracking-widest text-vamika-gold uppercase">{BRAND_NAME}</span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
                  <div className="px-4 py-2 text-xs font-sans text-gray-400 uppercase tracking-widest font-semibold">{t("collections")}</div>
                  <Link 
                    href="/shop" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-luxury-ivory font-sans text-sm font-medium text-luxury-text-primary transition-colors"
                  >
                    ✨ {t("allJewellery")}
                  </Link>
                  <Link 
                    href="/shop?collection=Gold" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-luxury-ivory font-sans text-sm font-medium text-luxury-text-primary transition-colors"
                  >
                    🪙 {t("gold")}
                  </Link>
                  <Link 
                    href="/shop?collection=Diamond" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-luxury-ivory font-sans text-sm font-medium text-luxury-text-primary transition-colors"
                  >
                    💎 {t("diamond")}
                  </Link>
                  <Link 
                    href="/shop/rings" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-luxury-ivory font-sans text-sm font-medium text-luxury-text-primary transition-colors"
                  >
                    💍 {t("rings")}
                  </Link>
                  <Link 
                    href="/shop/earrings" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-luxury-ivory font-sans text-sm font-medium text-luxury-text-primary transition-colors"
                  >
                    👂 {t("earrings")}
                  </Link>
                  <Link 
                    href="/shop/necklaces" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-luxury-ivory font-sans text-sm font-medium text-luxury-text-primary transition-colors"
                  >
                    ⛓️ {t("necklaces")}
                  </Link>

                  <div className="border-t border-gray-100 my-4" />

                  <div className="px-4 py-2 text-xs font-sans text-gray-400 uppercase tracking-widest font-semibold">{t("user")}</div>
                  {!session ? (
                    <>
                      <Link 
                        href="/login" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center px-4 py-3 rounded-lg hover:bg-luxury-ivory font-sans text-sm font-medium text-luxury-text-primary transition-colors"
                      >
                        {t("login")}
                      </Link>
                      <Link 
                        href="/register" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center px-4 py-3 rounded-lg hover:bg-luxury-ivory font-sans text-sm font-medium text-luxury-text-primary transition-colors"
                      >
                        {t("register")}
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs text-gray-500 font-sans truncate">{session.user?.email}</div>
                      <button 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-red-50 text-red-500 font-sans text-sm font-medium transition-colors text-left"
                      >
                        {t("logout")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {pathname.startsWith("/admin") === true && (
        <div className="flex justify-between h-20 items-center px-12 max-[1320px]:px-8 max-w-screen-2xl mx-auto max-[400px]:px-4">
          <Link href="/" className="transition-opacity duration-200 hover:opacity-80 flex items-center">
            <span className="text-xl font-serif font-semibold tracking-widest text-luxury-text-primary uppercase">{BRAND_NAME}</span>
          </Link>
          <div className="flex gap-x-6 items-center">
            <NotificationBell />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="w-9 h-9 rounded-full ring-2 ring-luxury-gold/30 hover:ring-luxury-gold transition-all duration-200">
                <Image
                  src="/randomuser.jpg"
                  alt="random profile photo"
                  width={36}
                  height={36}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content mt-2 z-[1] menu p-2 shadow-lg bg-white border border-luxury-border rounded-box w-52 text-sm text-luxury-text-primary"
              >
                <li>
                  <Link href="/admin" className="hover:bg-luxury-ivory hover:text-luxury-gold">Dashboard</Link>
                </li>
                <li>
                  <a className="hover:bg-luxury-ivory hover:text-luxury-gold">Profile</a>
                </li>
                <li onClick={handleLogout}>
                  <a href="#" className="hover:bg-luxury-ivory text-red-500 hover:text-red-600">Logout</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
