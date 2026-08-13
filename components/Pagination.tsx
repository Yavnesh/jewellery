// *********************
// Role of the component: Pagination for navigating the shop page
// Name of the component: Pagination.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Pagination />
// Input parameters: no input parameters
// Output: Component with the current page and buttons for incrementing and decrementing page
// *********************

"use client";
import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  totalProducts: number;
  limit: number;
}

const Pagination = ({ totalProducts, limit }: PaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") || "1");
  const totalPages = Math.ceil(totalProducts / limit);

  if (totalPages <= 1) return null;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Generate range of page numbers to show (e.g. max 5 around current page)
  const range = [];
  const maxVisiblePages = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let end = Math.min(totalPages, start + maxVisiblePages - 1);
  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return (
    <div className="join flex justify-center gap-2 py-8">
      <button
        className="join-item btn bg-white text-gray-700 hover:bg-[#8B2C33] hover:text-white border border-gray-200 transition-colors duration-300 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-700 font-sans"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        « Prev
      </button>

      {start > 1 && (
        <>
          <button
            className="join-item btn bg-white text-gray-700 hover:bg-[#8B2C33] hover:text-white border border-gray-200 transition-colors duration-300 font-sans"
            onClick={() => handlePageChange(1)}
          >
            1
          </button>
          {start > 2 && <span className="join-item btn btn-disabled bg-white text-gray-400 border border-gray-200 font-sans">...</span>}
        </>
      )}

      {range.map((p) => (
        <button
          key={p}
          className={`join-item btn border transition-colors duration-300 font-sans ${
            currentPage === p
              ? "bg-[#8B2C33] text-white border-[#8B2C33]"
              : "bg-white text-gray-700 hover:bg-[#8B2C33] hover:text-white border-gray-200"
          }`}
          onClick={() => handlePageChange(p)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="join-item btn btn-disabled bg-white text-gray-400 border border-gray-200 font-sans">...</span>}
          <button
            className="join-item btn bg-white text-gray-700 hover:bg-[#8B2C33] hover:text-white border border-gray-200 transition-colors duration-300 font-sans"
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className="join-item btn bg-white text-gray-700 hover:bg-[#8B2C33] hover:text-white border border-gray-200 transition-colors duration-300 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-700 font-sans"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next »
      </button>
    </div>
  );
};

export default Pagination;
