export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  Breadcrumb,
  Filters,
  Pagination,
  Products,
  SortBy,
} from "@/components";
import React from "react";
import { sanitize } from "@/lib/sanitize";

// improve readabillity of category text, for example category text "smart-watches" will be "smart watches"
const improveCategoryText = (text: string): string => {
  if (text.indexOf("-") !== -1) {
    let textArray = text.split("-");

    return textArray.join(" ");
  } else {
    return text;
  }
};

const ShopPage = async ({ params, searchParams }: { params: Promise<{ slug?: string[] }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  // Await both params and searchParams
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  
  return (
    <div className="text-luxury-text-primary bg-white py-8">
      <div className="max-w-screen-2xl mx-auto px-12 max-sm:px-6">
        <Breadcrumb />
        <div className="grid grid-cols-[240px_1fr] gap-x-12 max-md:grid-cols-1 max-md:gap-y-8 mt-6">
          <Filters />
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-luxury-border/60 max-lg:flex-col max-lg:gap-y-4">
              <h2 className="text-3xl font-serif font-light uppercase tracking-widest text-luxury-text-primary">
                {awaitedParams?.slug && awaitedParams?.slug[0]?.length > 0
                  ? sanitize(improveCategoryText(awaitedParams?.slug[0]))
                  : awaitedSearchParams?.collection
                  ? `${sanitize(awaitedSearchParams.collection as string)} Collection`
                  : awaitedSearchParams?.occasion
                  ? `${sanitize(awaitedSearchParams.occasion as string)} Wear`
                  : "All products"}
              </h2>

              <SortBy />
            </div>
            <div className="mt-8">
              <Products params={awaitedParams} searchParams={awaitedSearchParams} />
            </div>
            <div className="mt-12 flex justify-center">
              <Pagination />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
