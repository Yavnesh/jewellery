// *********************
// Role of the component: Showing products on the shop page with applied filter and sort
// Name of the component: Products.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Products params={params} searchParams={searchParams} />
// Input parameters: { params, searchParams }: { params: { slug?: string[] }, searchParams: { [key: string]: string | string[] | undefined } }
// Output: products grid
// *********************

import React from "react";
import ProductItem from "./ProductItem";
import apiClient from "@/lib/api";

const Products = async ({ params, searchParams }: { params: { slug?: string[] }, searchParams: { [key: string]: string | string[] | undefined } }) => {
  // getting all data from URL slug and preparing everything for sending GET request
  const inStockNum = searchParams?.inStock === "true" ? 1 : 0;
  const outOfStockNum = searchParams?.outOfStock === "true" ? 1 : 0;
  const page = searchParams?.page ? Number(searchParams?.page) : 1;

  let stockFilter = "filters[inStock][$gte]=0";
  if (inStockNum === 1 && outOfStockNum === 0) {
    stockFilter = "filters[inStock][$gt]=0";
  } else if (outOfStockNum === 1 && inStockNum === 0) {
    stockFilter = "filters[inStock][$equals]=0";
  }

  let products = [];

  try {
    // sending API request with filtering, sorting and pagination for getting all products
    const data = await apiClient.get(`/api/products?filters[price][$lte]=${
        searchParams?.price || 10000
      }&filters[rating][$gte]=${
        Number(searchParams?.rating) || 0
      }&${stockFilter}&${
        params?.slug?.length! > 0
          ? `filters[category][$equals]=${params?.slug}&`
          : ""
      }sort=${searchParams?.sort}&page=${page}`
    );

    if (!data.ok) {
      console.error('Failed to fetch products:', data.statusText);
      products = [];
    } else {
      const result = await data.json();
      let filteredProducts = Array.isArray(result) ? result : [];
      
      if (searchParams?.collection) {
        filteredProducts = filteredProducts.filter((p: any) => p.collection?.toLowerCase() === (searchParams.collection as string).toLowerCase());
      }
      if (searchParams?.occasion) {
        filteredProducts = filteredProducts.filter((p: any) => p.occasion?.toLowerCase() === (searchParams.occasion as string).toLowerCase());
      }
      
      products = filteredProducts;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    products = [];
  }

  return (
    <div className="grid grid-cols-3 justify-items-center gap-x-2 gap-y-5 max-[1300px]:grid-cols-3 max-lg:grid-cols-2 max-[500px]:grid-cols-1">
      {products.length > 0 ? (
        products.map((product: any) => (
          <ProductItem key={product.id} product={product} color="black" />
        ))
      ) : (
        <h3 className="text-3xl mt-5 text-center w-full col-span-full max-[1000px]:text-2xl max-[500px]:text-lg">
          No products found for specified query
        </h3>
      )}
    </div>
  );
};

export default Products;
