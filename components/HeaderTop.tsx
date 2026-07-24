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

const HeaderTop = () => {
  const { data: session }: any = useSession();

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
                  <span>Login</span>
                </Link>
              </li>
              <li className="flex items-center">
                <Link href="/register" className="flex items-center gap-x-2 text-white/85 hover:text-luxury-gold transition-colors duration-200">
                  <FaRegUser className="text-xs" />
                  <span>Register</span>
                </Link>
              </li>
            </>
          ) : (
            <>
              <span className="text-white/70 normal-case hidden sm:inline">{session.user?.email}</span>
              <li className="flex items-center">
                <button onClick={handleLogout} className="flex items-center gap-x-2 text-white/85 hover:text-luxury-gold transition-colors duration-200">
                  <FaRegUser className="text-xs" />
                  <span>Log out</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default HeaderTop;
