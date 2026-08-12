// *********************
// Role of the component: Product table component on admin dashboard page
// Name of the component: DashboardProductTable.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <DashboardProductTable />
// Input parameters: no input parameters
// Output: products table
// *********************

"use client";
import { nanoid } from "nanoid";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CustomButton from "./CustomButton";
import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import { getImagePath } from "@/lib/utils";

const DashboardProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    apiClient.get("/api/products?mode=admin", {cache: "no-store"})
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setProducts(data);
      });
  }, []);

  return (
    <div className="flex-1 w-full bg-white rounded-lg shadow-sm border border-luxury-border p-6 overflow-hidden max-xl:mt-5">
      <div className="flex justify-between items-center mb-6 border-b border-luxury-border/50 pb-4">
        <h1 className="text-2xl font-serif text-vamika-charcoal">All Products</h1>
        <Link href="/admin/products/new">
          <CustomButton
            buttonType="button"
            customWidth="150px"
            paddingX={20}
            paddingY={10}
            textSize="sm"
            text="Add New Product"
          />
        </Link>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-luxury-border">
              <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Product</th>
              <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Stock Status</th>
              <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Price</th>
              <th className="py-4 px-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {products && products.length > 0 ? (
              products.map((product) => (
                <tr key={nanoid()} className="border-b border-luxury-border/30 hover:bg-vamika-ivory/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 relative rounded overflow-hidden border border-luxury-border/50 bg-luxury-bg flex-shrink-0">
                        <Image
                          fill
                          src={getImagePath(product?.mainImage)}
                          alt={sanitize(product?.title) || "Product image"}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-vamika-charcoal line-clamp-1">{sanitize(product?.title)}</div>
                        <div className="text-xs text-luxury-text-secondary mt-1 tracking-wider uppercase">
                          {sanitize(product?.manufacturer)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase ${
                      product?.inStock 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                        : "bg-rose-50 text-rose-600 border border-rose-200"
                    }`}>
                      {product?.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-luxury-gold tracking-wide">₹{product?.price}</p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/admin/products/${product?.id}`}
                      className="text-xs font-medium tracking-widest uppercase text-luxury-gold hover:text-luxury-gold-dark transition-colors border border-luxury-gold hover:bg-luxury-gold/5 px-4 py-2 rounded"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-luxury-text-secondary">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
          {/* foot */}
          <tfoot>
            <tr>
              <th></th>
              <th>Product</th>
              <th>Stock Availability</th>
              <th>Price</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DashboardProductTable;
