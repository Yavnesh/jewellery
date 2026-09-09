"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaMagnifyingGlass,
  FaPlus,
  FaStar,
  FaFileExport,
  FaCheck,
  FaTrashCan,
  FaBoxOpen,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  mainImage: string;
  price: number;
  originalPrice?: number;
  inStock: number;
  rating: number;
  category: string;
  categoryId: string;
  merchant: string;
  metalType?: string;
  purity?: string;
  featured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  variantCount: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        categoryId: categoryFilter,
        stockStatus: stockFilter,
        search,
      });

      const res = await fetch(`/api/admin/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error("Failed to load products");
      }
    } catch (err) {
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, stockFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleBulkAction = async (action: string, value: any) => {
    if (selected.length === 0) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selected,
          action,
          value,
        }),
      });
      if (res.ok) {
        toast.success(`Updated ${selected.length} products`);
        setSelected([]);
        fetchProducts();
      }
    } catch (err) {
      toast.error("Bulk action failed");
    }
  };

  return (
    <AdminAppShell>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Product Catalog <span className="text-luxury-gold">& Taxonomy</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Manage high-jewelry inventory, variant matrix, specifications and pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black shadow-xs transition-colors"
          >
            <FaPlus size={12} />
            <span>Create Product</span>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-luxury-border p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="w-full md:w-80 flex items-center relative">
            <input
              type="text"
              placeholder="Search by title, SKU, metal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal placeholder:text-luxury-text-secondary focus:outline-none focus:border-luxury-gold"
            />
            <FaMagnifyingGlass className="absolute left-3 text-luxury-gold text-xs pointer-events-none" />
          </form>

          <div className="w-full md:w-auto flex flex-wrap gap-2.5 items-center">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-luxury-border bg-white text-vamika-charcoal focus:border-luxury-gold"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-luxury-border bg-white text-vamika-charcoal focus:border-luxury-gold"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="inStock">In Stock (&gt; 5)</option>
              <option value="lowStock">Low Stock (1 - 5)</option>
              <option value="outOfStock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="pt-3 border-t border-luxury-border flex items-center justify-between bg-luxury-bg/60 p-2 rounded-lg text-xs">
            <span className="font-semibold text-vamika-charcoal">{selected.length} items selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("FEATURE", true)}
                className="px-2.5 py-1.5 rounded bg-white border border-luxury-border text-vamika-charcoal hover:border-luxury-gold text-xs font-medium"
              >
                Mark Featured
              </button>
              <button
                onClick={() => handleBulkAction("BESTSELLER", true)}
                className="px-2.5 py-1.5 rounded bg-white border border-luxury-border text-vamika-charcoal hover:border-luxury-gold text-xs font-medium"
              >
                Mark Bestseller
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selected.length === products.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? products.map((p) => p.id) : [])
                    }
                    className="rounded border-luxury-border text-luxury-gold focus:ring-luxury-gold"
                  />
                </th>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Variants</th>
                <th className="py-3.5 px-4">Tags</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-luxury-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() =>
                          setSelected(
                            selected.includes(p.id)
                              ? selected.filter((id) => id !== p.id)
                              : [...selected, p.id]
                          )
                        }
                        className="rounded border-luxury-border text-luxury-gold focus:ring-luxury-gold"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.mainImage || "/placeholder.jpg"}
                          alt={p.title}
                          className="w-12 h-12 rounded-lg object-cover border border-luxury-border shrink-0"
                        />
                        <div>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="font-semibold text-vamika-charcoal hover:text-luxury-gold transition-colors line-clamp-1"
                          >
                            {p.title}
                          </Link>
                          <div className="text-[11px] text-luxury-text-secondary">
                            {p.metalType || "Fine Jewelry"} • {p.purity || "Certified"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-vamika-charcoal">{p.category}</td>
                    <td className="py-4 px-4">
                      <div className="font-serif font-bold text-luxury-gold">
                        ₹{p.price.toLocaleString("en-IN")}
                      </div>
                      {p.originalPrice && (
                        <div className="text-[10px] text-luxury-text-secondary line-through">
                          ₹{p.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.inStock <= 0
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : p.inStock <= 5
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                      >
                        {p.inStock} in stock
                      </span>
                    </td>
                    <td className="py-4 px-4 text-luxury-text-secondary">
                      {p.variantCount > 0 ? `${p.variantCount} SKUs` : "Single SKU"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {p.featured && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-luxury-gold/15 text-luxury-gold">
                            Featured
                          </span>
                        )}
                        {p.isBestseller && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 text-purple-700">
                            Bestseller
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-luxury-bg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold hover:text-luxury-gold text-xs font-semibold transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-luxury-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <FaBoxOpen className="text-3xl text-luxury-gold/40" />
                      <p className="font-serif text-base text-vamika-charcoal">No products found</p>
                      <p className="text-xs">Click Create Product or Seed Demo DB</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-luxury-border bg-luxury-bg/30 flex items-center justify-between text-xs text-luxury-text-secondary">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded bg-white border border-luxury-border disabled:opacity-40 hover:bg-luxury-bg transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded bg-white border border-luxury-border disabled:opacity-40 hover:bg-luxury-bg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
