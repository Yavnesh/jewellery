"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import { FaPlus, FaFolderTree, FaBoxOpen } from "react-icons/fa6";
import toast from "react-hot-toast";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  products?: any[];
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;

    try {
      setCreating(true);
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName,
          slug: newCatSlug.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (res.ok) {
        toast.success(`Category "${newCatName}" created`);
        setNewCatName("");
        setNewCatSlug("");
        fetchCategories();
      } else {
        toast.error("Failed to create category");
      }
    } catch (err) {
      toast.error("Error creating category");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Taxonomy & <span className="text-luxury-gold">Categories</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Organize fine jewellery collections, navigation hierarchy and storefront catalogs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Category List (Left 2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-luxury-border flex items-center justify-between">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Active Taxonomy Hierarchy
            </h2>
            <span className="text-xs text-luxury-gold font-bold">{categories.length} Categories</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4">URL Slug</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-luxury-text-secondary">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length > 0 ? (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-vamika-ivory/50 transition-colors">
                      <td className="py-4 px-4 font-semibold text-vamika-charcoal flex items-center gap-2">
                        <FaFolderTree className="text-luxury-gold" />
                        <span>{c.name}</span>
                      </td>
                      <td className="py-4 px-4 font-mono text-luxury-text-secondary">/{c.slug}</td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/products?categoryId=${c.id}`}
                          className="px-3 py-1 bg-luxury-bg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold hover:text-luxury-gold rounded font-semibold text-xs transition-colors"
                        >
                          View Products
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-luxury-text-secondary">
                      No categories found. Create one using the panel on the right.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Add Form (Right Col) */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
          <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
            Quick Add Category
          </h2>

          <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
            <div>
              <label className="block text-luxury-text-secondary font-semibold mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Solitaire Pendants"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }}
                className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal focus:border-luxury-gold"
              />
            </div>

            <div>
              <label className="block text-luxury-text-secondary font-semibold mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                placeholder="solitaire-pendants"
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-mono focus:border-luxury-gold"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-lg bg-vamika-charcoal text-luxury-gold font-semibold hover:bg-black transition-colors disabled:opacity-50"
            >
              {creating ? "Creating..." : "Save Category"}
            </button>
          </form>
        </div>
      </div>
    </AdminAppShell>
  );
}
