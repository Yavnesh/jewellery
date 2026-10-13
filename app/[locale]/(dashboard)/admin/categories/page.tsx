"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaPlus,
  FaFolderTree,
  FaPenToSquare,
  FaTrashCan,
  FaCheck,
  FaXmark,
  FaTriangleExclamation,
  FaArrowRight,
  FaRotate,
  FaBoxOpen,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Quick Add State
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [creating, setCreating] = useState(false);

  // Inline Edit State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete / Reassign Modal State
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
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

  // Handle Quick Add
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;

    try {
      setCreating(true);
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          slug: newCatSlug.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (res.ok) {
        toast.success(`Category "${newCatName}" created`);
        setNewCatName("");
        setNewCatSlug("");
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create category");
      }
    } catch (err) {
      toast.error("Error creating category");
    } finally {
      setCreating(false);
    }
  };

  // Start inline editing
  const handleStartEdit = (category: CategoryItem) => {
    setEditingCategoryId(category.id);
    setEditName(category.name);
  };

  // Submit Category Update with Product Cascade
  const handleSaveEdit = async (categoryId: string) => {
    if (!editName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update category");
      } else {
        toast.success(
          data.message || `Category renamed to "${editName}". Cascaded updates across products!`
        );
        setEditingCategoryId(null);
        fetchCategories();
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating category");
    } finally {
      setUpdating(false);
    }
  };

  // Submit Delete / Reassign
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);

    try {
      const productCount = deletingCategory._count?.products || 0;
      let url = `/api/categories/${deletingCategory.id}`;
      if (productCount > 0) {
        if (!reassignTargetId) {
          toast.error("Please select a target category to reassign existing products.");
          setIsDeleting(false);
          return;
        }
        url += `?reassignToCategoryId=${reassignTargetId}`;
      }

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete category");
      } else {
        toast.success(data.message || "Category deleted successfully");
        setDeletingCategory(null);
        setReassignTargetId("");
        fetchCategories();
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting category");
    } finally {
      setIsDeleting(false);
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
            Manage collections, update category titles with automatic product cascades, and safe re-assignments.
          </p>
        </div>

        <button
          onClick={fetchCategories}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-luxury-border bg-white text-luxury-text-secondary hover:text-vamika-charcoal hover:border-luxury-gold transition cursor-pointer self-start sm:self-auto"
          title="Refresh taxonomy"
        >
          <FaRotate />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Category List (Left 2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-luxury-border flex items-center justify-between">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Active Taxonomy Hierarchy
            </h2>
            <div className="flex items-center gap-3">
              {/* Page Size Selector: 20, 50, 100 */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-luxury-border px-2.5 py-1.5 rounded-lg text-xs">
                <span className="text-luxury-text-secondary font-medium">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-transparent font-semibold text-vamika-charcoal focus:outline-none cursor-pointer"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <span className="text-xs text-luxury-gold font-bold">{categories.length} Categories</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4">URL Slug</th>
                  <th className="py-3.5 px-4 font-center text-center">Products</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-luxury-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <span className="w-5 h-5 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
                        <span>Loading categories...</span>
                      </div>
                    </td>
                  </tr>
                ) : categories.length > 0 ? (
                  categories.slice((page - 1) * limit, page * limit).map((c) => {
                    const isEditing = editingCategoryId === c.id;
                    const count = c._count?.products || 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4 font-semibold text-vamika-charcoal">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-2.5 py-1 text-xs border border-luxury-gold rounded focus:outline-none focus:ring-1 focus:ring-luxury-gold bg-white w-52"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(c.id)}
                                disabled={updating}
                                className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                                title="Save changes (cascades to all products)"
                              >
                                <FaCheck size={11} />
                              </button>
                              <button
                                onClick={() => setEditingCategoryId(null)}
                                className="p-1.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer"
                                title="Cancel"
                              >
                                <FaXmark size={11} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FaFolderTree className="text-luxury-gold shrink-0" />
                              <span className="truncate max-w-56">{c.name}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 font-mono text-luxury-text-secondary text-[11px]">
                          /{c.slug}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-luxury-sand/30 text-vamika-charcoal">
                            {count.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right space-x-1.5">
                          {/* Port to /admin/products with category filter */}
                          <Link
                            href={`/admin/products?categoryId=${c.id}`}
                            className="px-2.5 py-1 bg-luxury-bg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold hover:text-luxury-gold rounded font-medium text-[11px] transition-colors inline-block"
                            title="Inspect all products in this category in the Verification Queue"
                          >
                            Inspect
                          </Link>

                          {/* Inline Edit Button */}
                          {!isEditing && (
                            <button
                              onClick={() => handleStartEdit(c)}
                              className="p-1.5 border border-luxury-border rounded text-luxury-text-secondary hover:text-luxury-gold hover:border-luxury-gold transition cursor-pointer inline-block"
                              title="Edit Category Name & Cascade to Products"
                            >
                              <FaPenToSquare size={12} />
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setDeletingCategory(c);
                              setReassignTargetId("");
                            }}
                            className="p-1.5 border border-luxury-border rounded text-luxury-text-secondary hover:text-rose-600 hover:border-rose-300 transition cursor-pointer inline-block"
                            title="Delete or Reassign Category"
                          >
                            <FaTrashCan size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-luxury-text-secondary">
                      No categories found. Create one using the panel on the right.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-4 border-t border-luxury-border bg-luxury-bg/30 flex flex-col sm:flex-row items-center justify-between text-xs text-luxury-text-secondary gap-3">
            <div>
              Showing{" "}
              <strong>
                {categories.length === 0 ? 0 : (page - 1) * limit + 1}
              </strong>{" "}
              to{" "}
              <strong>
                {Math.min(page * limit, categories.length)}
              </strong>{" "}
              of <strong>{categories.length}</strong> categories
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded bg-white border border-luxury-border disabled:opacity-40 hover:bg-luxury-bg transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2">
                Page <strong>{page}</strong> of <strong>{Math.max(1, Math.ceil(categories.length / limit))}</strong>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(categories.length / limit)), p + 1))}
                disabled={page >= Math.ceil(categories.length / limit)}
                className="px-3 py-1.5 rounded bg-white border border-luxury-border disabled:opacity-40 hover:bg-luxury-bg transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Quick Add Form (Right Col) */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
          <h2 className="font-serif font-semibold text-base text-vamika-charcoal flex items-center gap-2">
            <FaPlus className="text-luxury-gold text-xs" />
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
              className="w-full py-2.5 bg-vamika-charcoal text-luxury-gold hover:bg-black font-semibold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Category"}
            </button>
          </form>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <FaTriangleExclamation className="text-amber-600 text-xs" />
              Automated Cascade Guarantee
            </div>
            <p className="text-amber-800/80">
              Editing any category name automatically recalculates its URL slug and updates catalog associations across all attached products.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: SAFE DELETE & REASSIGNMENT */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-luxury-border space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-700">
              <FaTrashCan size={16} />
              <h3 className="font-serif font-bold text-base text-vamika-charcoal">
                Delete Category: {deletingCategory.name}
              </h3>
            </div>

            {/* Check if category has products */}
            {(deletingCategory._count?.products || 0) > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <FaTriangleExclamation />
                    Warning: Category contains {deletingCategory._count?.products} products!
                  </p>
                  <p className="text-[11px] text-rose-800">
                    To prevent orphaned products, choose a target category to safely reassign all existing products before deletion.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-vamika-charcoal mb-1">
                    Reassign all {deletingCategory._count?.products} products to:
                  </label>
                  <select
                    required
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-luxury-border rounded-lg bg-white focus:ring-1 focus:ring-luxury-gold"
                  >
                    <option value="">Select Target Reassignment Category</option>
                    {categories
                      .filter((c) => c.id !== deletingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c._count?.products || 0} items)
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-luxury-text-secondary">
                This category contains 0 products and can be deleted immediately. This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-luxury-border">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-3.5 py-1.5 text-xs text-luxury-text-secondary hover:text-vamika-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || ((deletingCategory._count?.products || 0) > 0 && !reassignTargetId)}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold transition cursor-pointer disabled:opacity-40"
              >
                {isDeleting
                  ? "Processing..."
                  : (deletingCategory._count?.products || 0) > 0
                  ? "Reassign & Delete Category"
                  : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
