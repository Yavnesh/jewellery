"use client";
import { CustomButton, DashboardSidebar } from "@/components";
import { nanoid } from "nanoid";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { formatCategoryName } from "../../../../utils/categoryFormating";
import apiClient from "@/lib/api";

const DashboardCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiClient.get("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
      });
  }, []);

  return (
    <div className="bg-luxury-bg min-h-screen flex max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex-1 p-8 max-xl:p-4">
        
        <div className="bg-white rounded-lg shadow-sm border border-luxury-border p-6">
          <div className="flex justify-between items-center mb-6 border-b border-luxury-border/50 pb-4">
            <h1 className="text-2xl font-serif text-vamika-charcoal">All Categories</h1>
            <Link href="/admin/categories/new">
              <CustomButton
                buttonType="button"
                customWidth="160px"
                paddingX={20}
                paddingY={10}
                textSize="sm"
                text="Add New Category"
              />
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-luxury-border">
                  <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Name</th>
                  <th className="py-4 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {categories && categories.length > 0 ? (
                  categories.map((category: Category) => (
                    <tr key={nanoid()} className="border-b border-luxury-border/30 hover:bg-vamika-ivory/30 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-medium text-vamika-charcoal tracking-wide">{formatCategoryName(category?.name)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/categories/${category?.id}`}
                          className="text-xs font-medium tracking-widest uppercase text-luxury-gold hover:text-luxury-gold-dark transition-colors border border-luxury-gold hover:bg-luxury-gold/5 px-4 py-2 rounded"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-luxury-text-secondary">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCategory;
