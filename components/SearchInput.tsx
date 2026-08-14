// *********************
// Role of the component: Search input element located in the header but it can be used anywhere in your application
// Name of the component: SearchInput.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SearchInput />
// Input parameters: no input parameters
// Output: form with search input and button
// *********************

"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { sanitize } from "@/lib/sanitize";

import { useTranslations } from "next-intl";

const SearchInput = () => {
  const [searchInput, setSearchInput] = useState<string>("");
  const router = useRouter();
  const t = useTranslations("Header");

  // function for modifying URL for searching products
  const searchProducts = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Sanitize the search input before using it in URL
    const sanitizedSearch = sanitize(searchInput);
    router.push(`/search?search=${encodeURIComponent(sanitizedSearch)}`);
    setSearchInput("");
  };

  return (
    <form className="flex w-full justify-center" onSubmit={searchProducts}>
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="bg-luxury-ivory text-luxury-text-primary border border-luxury-border border-r-0 w-[70%] px-4 py-2 rounded-l focus:outline-none focus:border-luxury-gold max-sm:w-full font-sans text-sm transition-colors duration-200"
      />
      <button type="submit" className="bg-luxury-text-primary text-white border border-luxury-text-primary px-6 py-2 rounded-r hover:bg-luxury-gold hover:border-luxury-gold transition-colors duration-300 font-sans text-sm tracking-wider uppercase">
        {t("searchButton")}
      </button>
    </form>
  );
};

export default SearchInput;
