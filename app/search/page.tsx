import { ProductItem, SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import React from "react";
import { sanitize } from "@/lib/sanitize";

interface Props {
  searchParams: Promise<{ search: string }>;
}

// sending api request for search results for a given search text
const SearchPage = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  let products = [];

  try {
    const data = await apiClient.get(
      `/api/search?query=${sp?.search || ""}`
    );

    if (!data.ok) {
      console.error('Failed to fetch search results:', data.statusText);
      products = [];
    } else {
      const result = await data.json();
      products = Array.isArray(result) ? result : [];
    }
  } catch (error) {
    console.error('Error fetching search results:', error);
    products = [];
  }

  return (
    <div className="bg-white py-8">
      <SectionTitle title="Search Page" path="Home | Search" />
      <div className="max-w-screen-2xl mx-auto px-12 max-sm:px-6">
        {sp?.search && (
          <h3 className="text-3xl font-serif font-light text-center py-10 max-sm:text-2xl uppercase tracking-widest text-luxury-text-primary">
            Showing results for <span className="text-luxury-gold italic">"{sanitize(sp?.search)}"</span>
          </h3>
        )}
        <div className="grid grid-cols-4 justify-items-center gap-x-6 gap-y-10 max-[1300px]:grid-cols-3 max-lg:grid-cols-2 max-[500px]:grid-cols-1">
          {products.length > 0 ? (
            products.map((product: any) => (
              <ProductItem key={product.id} product={product} color="black" />
            ))
          ) : (
            <h3 className="text-xl font-serif font-light mt-8 text-center w-full col-span-full text-luxury-text-secondary uppercase tracking-widest">
              No products found for specified query
            </h3>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

/*

*/
