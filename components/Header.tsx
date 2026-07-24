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

import { BRAND_NAME } from "@/utils/brand";

const Header = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { wishlist, setWishlist, wishQuantity } = useWishlistStore();

  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  };

  // getting all wishlist items by user id
  const getWishlistByUserId = async (id: string) => {
    const response = await apiClient.get(`/api/wishlist/${id}`, {
      cache: "no-store",
    });
    const wishlist = await response.json();
    const productArray: {
      id: string;
      title: string;
      price: number;
      image: string;
      slug:string
      stockAvailabillity: number;
    }[] = [];

    return; // temporary disable wishlist fetching while the issue is being resolved
    
    wishlist.map((item: any) => productArray.push({id: item?.product?.id, title: item?.product?.title, price: item?.product?.price, image: item?.product?.mainImage, slug: item?.product?.slug, stockAvailabillity: item?.product?.inStock}));
    
    setWishlist(productArray);
  };

  // getting user by email so I can get his user id
  const getUserByEmail = async () => {
    if (session?.user?.email) {
      
      apiClient.get(`/api/users/email/${session?.user?.email}`, {
        cache: "no-store",
      })
        .then((response) => response.json())
        .then((data) => {
          getWishlistByUserId(data?.id);
        });
    }
  };

  useEffect(() => {
    getUserByEmail();
  }, [session?.user?.email, wishlist.length]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-luxury-border/60 shadow-sm transition-all duration-300">
      <HeaderTop />
      {pathname.startsWith("/admin") === false && (
        <>
          <div className="h-24 flex items-center justify-between px-16 max-[1320px]:px-12 max-md:px-6 max-lg:flex-col max-lg:gap-y-4 max-lg:justify-center max-lg:h-52 max-w-screen-2xl mx-auto">
            <Link href="/" className="transition-opacity duration-200 hover:opacity-80 flex items-center">
              <span className="text-2xl font-serif font-semibold tracking-widest text-tanishq-gold uppercase">{BRAND_NAME}</span>
            </Link>
            <div className="w-[45%] max-lg:w-full">
              <SearchInput />
            </div>
            <div className="flex gap-x-8 items-center">
              <NotificationBell />
              <HeartElement wishQuantity={wishQuantity} />
              <CartElement />
            </div>
          </div>
          
          <MegaMenu />
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
