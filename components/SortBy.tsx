// *********************
// Role of the component: SortBy
// Name of the component: SortBy.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SortBy />
// Input parameters: no input parameters
// Output: select input with options for sorting by a-z, z-a, price low, price high
// *********************

"use client";
import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SortBy = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "defaultSort";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "defaultSort") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <select
      value={currentSort}
      onChange={(e) => handleSortChange(e.target.value)}
      className="border border-gray-200 rounded-full py-2 px-4 text-xs font-sans focus:outline-none outline-none bg-white hover:border-[#8B2C33] transition-colors cursor-pointer text-[#333333]"
      name="sort"
    >
      <option value="defaultSort">Default</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
};

export default SortBy;
