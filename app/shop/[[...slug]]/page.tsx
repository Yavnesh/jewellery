import React from "react";
import { getProducts } from "@/src/modules/catalog/catalog.service";
import type { Metadata } from "next";
import { CategoryBanner } from "@/components/ui/luxury/CategoryBanner";
import { HorizontalFilterBar } from "@/components/ui/luxury/HorizontalFilterBar";
import { FilterSidebar } from "@/components/ui/luxury/FilterSidebar";
import { ProductCard } from "@/components/ui/luxury/ProductCard";
import { FilterSync } from "@/components/ui/luxury/FilterSync";
import { Pagination } from "@/components";
import { sanitize } from "@/lib/sanitize";

// Phase 2 caching foundation: We will rely on built-in fetch/unstable_cache next
// Remove force-dynamic to allow ISR or native route caching to work correctly.

type Props = { params: Promise<{ slug?: string[] }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  const categorySlug = awaitedParams?.slug?.[0];
  const collection = awaitedSearchParams?.collection as string;
  const occasion = awaitedSearchParams?.occasion as string;
  
  let title = "Shop Fine Luxury Jewelry | Tanishq";
  let description = "Discover our exclusive collection of luxury jewelry, crafted with precision and elegance.";

  if (categorySlug) {
    const cleanCat = sanitize(categorySlug.replace("-", " "));
    title = `${cleanCat} | Tanishq`;
    description = `Shop the finest ${cleanCat} jewelry designed for timeless moments.`;
  } else if (collection) {
    title = `${sanitize(collection)} Collection | Tanishq`;
    description = `Explore the beautiful ${sanitize(collection)} collection at Tanishq.`;
  } else if (occasion) {
    title = `${sanitize(occasion)} Jewelry | Tanishq`;
    description = `Find the perfect jewelry for your ${sanitize(occasion)} celebration.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/shop${categorySlug ? `/${categorySlug}` : ''}`
    }
  };
}

const ShopPage = async ({ params, searchParams }: Props) => {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  
  // Parse Search Params for Prisma Query
  const categorySlug = awaitedParams?.slug?.[0];
  const sort = awaitedSearchParams?.sort as string;
  const page = awaitedSearchParams?.page ? Number(awaitedSearchParams.page) : 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  // Helper to parse comma-separated arrays from URL
  const parseArrayParam = (paramName: string) => {
    const val = awaitedSearchParams?.[paramName] as string;
    return val ? val.split(",") : undefined;
  };

  const collections = parseArrayParam("collections");
  const occasions = parseArrayParam("occasions");
  const purities = parseArrayParam("purities");
  const metalColors = parseArrayParam("metalColors");
  const genders = parseArrayParam("genders");
  const jewelryTypes = parseArrayParam("jewelryTypes");

  // Build Prisma Where Clause
  const where: any = {};
  
  if (categorySlug) {
    where.category = { name: { equals: categorySlug } };
  }
  if (collections) {
    where.collection = { in: collections };
  } else if (awaitedSearchParams?.collection) {
    where.collection = { equals: awaitedSearchParams.collection as string };
  }
  
  if (occasions) {
    where.occasion = { in: occasions };
  } else if (awaitedSearchParams?.occasion) {
    where.occasion = { equals: awaitedSearchParams.occasion as string };
  }

  if (purities) {
    where.purity = { in: purities };
  }
  
  if (metalColors) {
    where.metalType = { in: metalColors };
  }
  
  if (genders) {
    where.gender = { in: genders };
  }

  if (jewelryTypes) {
    // Jewelry Types (e.g. Gold, Diamond, Platinum) span across multiple fields in our dummy data schema
    const typeConditions = jewelryTypes.map(type => ({
      OR: [
        { title: { contains: type } },
        { metalType: { contains: type } },
        { collection: { contains: type } },
      ]
    }));
    
    where.AND = [
      ...(where.AND || []),
      { OR: typeConditions } // If multiple are selected, match any of them (OR)
    ];
  }
  
  // Execute via service
  const { products, totalProducts } = await getProducts(where, skip, limit, sort);

  const displayTitle = categorySlug 
    ? sanitize(categorySlug.replace("-", " "))
    : awaitedSearchParams?.collection
    ? `${sanitize(awaitedSearchParams.collection as string)} Collection`
    : "All Jewellery";

  return (
    <div className="bg-white min-h-screen pb-24">
      <FilterSync />
      
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pt-8">
        {/* Breadcrumb / Title area matching Tanishq style */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 font-sans mb-6 flex items-center gap-2">
            <span>Home</span> <span className="text-gray-300">{'>'}</span> <span className="text-[#8B2C33]">{displayTitle}</span>
          </div>
          <div className="flex items-end gap-2">
            <h1 className="font-serif text-3xl text-[#333333] capitalize">
              {displayTitle}
            </h1>
            <span className="font-sans text-sm text-gray-500 mb-1">
              ({totalProducts} results)
            </span>
          </div>
        </div>

        <div className="mt-6">
          <HorizontalFilterBar />
          
          {/* Product Grid (3 Columns Max) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-24 text-center">
                  <h3 className="font-serif text-2xl text-[#333333] mb-4">No pieces found</h3>
                  <p className="font-sans text-gray-500">Try adjusting your filters or search criteria.</p>
                </div>
              )}
            </div>
            
            {totalProducts > limit && (
              <div className="mt-20 flex justify-center border-t border-gray-100 pt-10">
                <Pagination />
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default ShopPage;
