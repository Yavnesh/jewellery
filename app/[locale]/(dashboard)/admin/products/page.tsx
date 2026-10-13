"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaBoxOpen,
  FaMagnifyingGlass,
  FaRotate,
  FaCheck,
  FaXmark,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaPenToSquare,
  FaImage,
  FaTriangleExclamation,
  FaCodeCompare,
  FaFloppyDisk,
  FaShieldHalved,
  FaLock,
  FaLockOpen,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface ProductItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  manufacturer?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  discountActive?: boolean;
  metalType?: string;
  purity?: string;
  weight?: number;
  occasion?: string;
  collection?: string;
  inStock: number;
  verificationStatus: string;
  version: number;
  verifiedAt?: string;
  categoryId: string;
  category: { id: string; name: string };
  verifiedBy?: { email: string };
  mainImage?: string;
  images?: string;
}

function AdminProductsVerificationContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoryId") || "";

  // Elevated DBA Session State
  const [isElevated, setIsElevated] = useState(false);
  const [elevatedLoading, setElevatedLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dbaPassword, setDbaPassword] = useState("");

  // Product Inspection & Lazy Loading Pagination State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [stats, setStats] = useState({
    pending: 0,
    verified: 0,
    verificationRequired: 0,
    changesProposed: 0,
    total: 0,
  });

  // Expanded Product Row for In-line Inspection & Editing
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ProductItem>>({});
  const [editReason, setEditReason] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  useEffect(() => {
    checkElevatedStatus();
    fetchCategories();
  }, []);

  // Synchronize categoryFilter if URL query parameter changes
  useEffect(() => {
    const urlCat = searchParams.get("categoryId");
    if (urlCat !== null && urlCat !== categoryFilter) {
      setCategoryFilter(urlCat);
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, statusFilter, categoryFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const checkElevatedStatus = async () => {
    try {
      const res = await fetch("/api/admin/database/auth");
      const data = await res.json();
      setIsElevated(!!data.isElevated);
    } catch {
      setIsElevated(false);
    }
  };

  const handleElevateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setElevatedLoading(true);
    try {
      const res = await fetch("/api/admin/database/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: dbaPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Elevation failed");
      } else {
        toast.success("Database Administrator write access unlocked");
        setIsElevated(true);
        setAuthModalOpen(false);
        setDbaPassword("");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setElevatedLoading(false);
    }
  };

  const handleRevokeElevation = async () => {
    try {
      await fetch("/api/admin/database/auth", { method: "DELETE" });
      setIsElevated(false);
      toast.success("Returned to Staff Proposer mode");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch {}
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());
      if (statusFilter) params.append("status", statusFilter);
      if (categoryFilter) params.append("categoryId", categoryFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/database/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalProductsCount(data.pagination.total || 0);
        }
        if (data.stats) setStats(data.stats);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleExpandProduct = (product: ProductItem) => {
    if (expandedProductId === product.id) {
      setExpandedProductId(null);
      setEditFormData({});
    } else {
      setExpandedProductId(product.id);
      setEditFormData({
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        purity: product.purity || "",
        metalType: product.metalType || "",
        weight: product.weight || 0,
        inStock: product.inStock,
        categoryId: product.categoryId,
        description: product.description || "",
        occasion: product.occasion || "",
        collection: product.collection || "",
      });
      setEditReason("");
    }
  };

  const handleSaveProductDetails = async (productId: string) => {
    setIsSavingProduct(true);
    try {
      const res = await fetch("/api/admin/database/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          updates: {
            title: editFormData.title,
            price: Number(editFormData.price),
            originalPrice: editFormData.originalPrice ? Number(editFormData.originalPrice) : null,
            purity: editFormData.purity || null,
            metalType: editFormData.metalType || null,
            weight: editFormData.weight ? Number(editFormData.weight) : null,
            inStock: Number(editFormData.inStock),
            categoryId: editFormData.categoryId,
            description: editFormData.description || "",
            occasion: editFormData.occasion || null,
            collection: editFormData.collection || null,
          },
          reason: editReason || "Details updated via Product Verification Queue",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Save failed");
      } else {
        if (data.mode === "DIRECT_APPLIED") {
          toast.success("Product directly updated in database! (Elevated DBA)");
        } else {
          toast.success("Changes submitted as Change Proposal for DBA review!");
        }
        setExpandedProductId(null);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving product");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDirectVerification = async (productId: string, action: "VERIFY" | "REJECT" | "REQUEST_REVERIFY") => {
    try {
      const res = await fetch("/api/admin/database/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed");
      } else {
        toast.success(`Product verification updated: ${action}`);
        fetchProducts();
      }
    } catch {
      toast.error("Failed to update verification");
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified
          </span>
        );
      case "VERIFICATION_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <FaTriangleExclamation className="text-[10px]" />
            Verification Required
          </span>
        );
      case "CHANGES_PROPOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FaCodeCompare className="text-[10px]" />
            Changes Proposed
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <FaXmark className="text-[10px]" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            Pending Inspection
          </span>
        );
    }
  };

  return (
    <AdminAppShell>
      <div className="space-y-6">
        {/* Header & Access Control Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-luxury-gold/20 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-luxury-gold/10 text-luxury-gold">
                <FaBoxOpen className="text-xl" />
              </span>
              <h1 className="text-2xl font-serif font-bold text-vamika-charcoal">
                Product Verification Queue & Catalog Inspector
              </h1>
            </div>
            <p className="text-xs text-luxury-text-secondary mt-1">
              Field-level catalog verification, visual gallery preview, and dual-tier change proposal editing.
            </p>
          </div>

          {/* Access Mode Pill */}
          <div className="flex items-center gap-3">
            {isElevated ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <FaLockOpen className="text-emerald-600" />
                  <span>DBA Mode (Elevated Write Access)</span>
                </div>
                <button
                  onClick={handleRevokeElevation}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer"
                >
                  Exit Mode
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
                  <FaLock className="text-slate-400" />
                  <span>Proposer Mode (Read-Only)</span>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-vamika-charcoal text-luxury-gold hover:bg-black px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Elevate Privileges
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Verification Status KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-luxury-border">
            <p className="text-xs text-luxury-text-secondary font-medium">Pending Inspection</p>
            <p className="text-2xl font-bold text-vamika-charcoal mt-1">{stats.pending.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-luxury-border">
            <p className="text-xs text-emerald-700 font-medium">Verified Active</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.verified.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-luxury-border">
            <p className="text-xs text-amber-700 font-medium">Re-verification Required</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{stats.verificationRequired.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-luxury-border">
            <p className="text-xs text-blue-700 font-medium">Open Proposals</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{stats.changesProposed.toLocaleString()}</p>
          </div>
        </div>

        {/* FILTER & CONTROLS TOOLBAR */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-xl border border-luxury-border">
            <div className="relative flex-1">
              <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-text-secondary text-xs" />
              <input
                type="text"
                placeholder="Search products by title, SKU, metal or material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-luxury-border rounded-lg focus:outline-none focus:ring-1 focus:ring-luxury-gold bg-luxury-bg/30"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category filter */}
              <div className="flex items-center gap-1.5">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-luxury-gold max-w-44 truncate ${
                    categoryFilter
                      ? "border-luxury-gold font-bold text-vamika-charcoal bg-luxury-gold/10"
                      : "border-luxury-border bg-white"
                  }`}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {categoryFilter && (
                  <button
                    onClick={() => {
                      setCategoryFilter("");
                      setCurrentPage(1);
                    }}
                    className="p-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-luxury-border rounded-lg transition cursor-pointer"
                    title="Clear category filter"
                  >
                    <FaXmark size={12} />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs border border-luxury-border rounded-lg focus:outline-none focus:ring-1 focus:ring-luxury-gold bg-white"
              >
                <option value="">All Verification Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Inspection</option>
                <option value="VERIFIED">Verified</option>
                <option value="VERIFICATION_REQUIRED">Verification Required</option>
                <option value="CHANGES_PROPOSED">Changes Proposed</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Page Size Selector: 20, 50, 100 */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-luxury-border px-2.5 py-1.5 rounded-lg text-xs">
                <span className="text-luxury-text-secondary font-medium">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-semibold text-vamika-charcoal focus:outline-none cursor-pointer"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <button
                onClick={fetchProducts}
                className="p-2 border border-luxury-border rounded-lg hover:bg-slate-50 text-luxury-text-secondary cursor-pointer"
                title="Refresh"
              >
                <FaRotate />
              </button>
            </div>
          </div>

          {/* Active Category Filter Indicator Banner */}
          {categoryFilter && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-luxury-gold/10 border border-luxury-gold/30 rounded-xl text-xs text-vamika-charcoal animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse" />
                <span>
                  Viewing Category: <strong className="font-bold">{categories.find((c) => c.id === categoryFilter)?.name || "Selected Category"}</strong>
                  {totalProductsCount > 0 && ` (${totalProductsCount} ${totalProductsCount === 1 ? "product" : "products"})`}
                </span>
              </div>
              <button
                onClick={() => {
                  setCategoryFilter("");
                  setCurrentPage(1);
                }}
                className="text-xs text-vamika-charcoal hover:text-black font-semibold underline cursor-pointer"
              >
                Show all products
              </button>
            </div>
          )}

          {/* Products Table with Expandable In-line Details */}
          <div className="bg-white rounded-xl border border-luxury-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-luxury-sand/20 border-b border-luxury-border text-luxury-text-secondary uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price / Original</th>
                    <th className="py-3 px-4">Purity & Metal</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/60">
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-luxury-text-secondary">
                        <div className="flex flex-col items-center gap-2">
                          <span className="w-6 h-6 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
                          <span>Loading catalog products...</span>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-luxury-text-secondary">
                        No products found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isExpanded = expandedProductId === p.id;
                      return (
                        <React.Fragment key={p.id}>
                          <tr
                            onClick={() => toggleExpandProduct(p)}
                            className={`transition cursor-pointer ${
                              isExpanded ? "bg-luxury-sand/15" : "hover:bg-slate-50/70"
                            }`}
                          >
                            <td className="py-3 px-4 text-center text-luxury-text-secondary">
                              {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {/* Thumbnail Preview */}
                                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-luxury-border shrink-0 overflow-hidden relative flex items-center justify-center">
                                  {p.mainImage ? (
                                    <img
                                      src={p.mainImage}
                                      alt={p.title}
                                      className="w-full h-full object-cover hover:scale-110 transition duration-300"
                                      loading="lazy"
                                      onError={(e) => {
                                        (e.target as any).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <FaImage className="text-slate-300 text-lg" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-vamika-charcoal line-clamp-1 hover:text-luxury-gold transition">
                                    {p.title}
                                  </p>
                                  <p className="text-[10px] text-luxury-text-secondary mt-0.5">
                                    ID: {p.id.slice(0, 8)}... · Ver: v{p.version} · Stock: {p.inStock}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-luxury-text-secondary truncate max-w-40">
                              {p.category?.name || "—"}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              <span className="font-semibold text-vamika-charcoal">₹{p.price.toLocaleString()}</span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-[10px] text-luxury-text-secondary line-through ml-1.5">
                                  ₹{p.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-luxury-text-secondary">
                              {p.purity || p.metalType ? `${p.purity || ""} ${p.metalType || ""}`.trim() : "—"}
                            </td>
                            <td className="py-3 px-4">{renderStatusBadge(p.verificationStatus)}</td>
                            <td
                              className="py-3 px-4 text-right space-x-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => toggleExpandProduct(p)}
                                className="px-2.5 py-1 text-[11px] font-semibold border border-luxury-gold/50 text-vamika-charcoal rounded hover:bg-luxury-gold/10 transition cursor-pointer"
                              >
                                {isExpanded ? "Close" : "Inspect & Edit"}
                              </button>

                              {isElevated && (
                                <>
                                  <button
                                    onClick={() => handleDirectVerification(p.id, "VERIFY")}
                                    className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition cursor-pointer"
                                    title="Approve & Verify"
                                  >
                                    <FaCheck />
                                  </button>
                                  <button
                                    onClick={() => handleDirectVerification(p.id, "REJECT")}
                                    className="px-2 py-1 text-[11px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 transition cursor-pointer"
                                    title="Reject"
                                  >
                                    <FaXmark />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>

                          {/* IN-LINE EXPANDED PRODUCT DETAILS & EDIT DRAWER */}
                          {isExpanded && (
                            <tr className="bg-luxury-sand/10 border-y border-luxury-gold/30">
                              <td colSpan={7} className="p-6">
                                <div className="bg-white rounded-xl p-5 border border-luxury-gold/30 shadow-xs space-y-6">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-luxury-border pb-3 gap-2">
                                    <div>
                                      <h3 className="font-serif font-bold text-sm text-vamika-charcoal flex items-center gap-2">
                                        <FaPenToSquare className="text-luxury-gold" />
                                        Product Details & Field-Level Editor: {p.title}
                                      </h3>
                                      <p className="text-[11px] text-luxury-text-secondary mt-0.5">
                                        {isElevated
                                          ? "DBA Mode active: changes save and verify directly in the database without secondary review."
                                          : "Proposer Mode: saving will bundle these field modifications as a structured Change Proposal for DBA approval."}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-luxury-text-secondary">
                                        Version: <strong>v{p.version}</strong>
                                      </span>
                                      {renderStatusBadge(p.verificationStatus)}
                                    </div>
                                  </div>

                                  {/* Visual Product Media & Images Gallery Showcase */}
                                  <div className="p-4 bg-slate-50/80 rounded-xl border border-luxury-border space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-xs text-vamika-charcoal flex items-center gap-1.5">
                                        <FaImage className="text-luxury-gold" />
                                        Product Visual Assets & Gallery
                                      </span>
                                      <span className="text-[11px] text-luxury-text-secondary">
                                        Click any image to open full resolution
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap gap-3 pt-2">
                                      {/* Main Featured Image */}
                                      {p.mainImage && (
                                        <a
                                          href={p.mainImage}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="group relative w-24 h-24 rounded-lg overflow-hidden border-2 border-luxury-gold/60 shadow-xs shrink-0 block bg-white"
                                        >
                                          <img
                                            src={p.mainImage}
                                            alt="Main View"
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                          />
                                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">
                                            Primary
                                          </span>
                                        </a>
                                      )}

                                      {/* Additional Gallery Images */}
                                      {(() => {
                                        let extraImgs: string[] = [];
                                        try {
                                          if (p.images) {
                                            const parsed = JSON.parse(p.images);
                                            extraImgs = Array.isArray(parsed) ? parsed : [];
                                          }
                                        } catch {}

                                        return extraImgs
                                          .filter((url) => url !== p.mainImage)
                                          .map((imgUrl, idx) => (
                                            <a
                                              key={idx}
                                              href={imgUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="group relative w-24 h-24 rounded-lg overflow-hidden border border-luxury-border shadow-xs shrink-0 block bg-white hover:border-luxury-gold transition"
                                            >
                                              <img
                                                src={imgUrl}
                                                alt={`Angle ${idx + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                loading="lazy"
                                              />
                                            </a>
                                          ));
                                      })()}
                                    </div>
                                  </div>

                                  {/* Edit form grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    <div className="md:col-span-2">
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Product Title
                                      </label>
                                      <input
                                        type="text"
                                        value={editFormData.title || ""}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, title: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg focus:ring-1 focus:ring-luxury-gold"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Category
                                      </label>
                                      <select
                                        value={editFormData.categoryId || ""}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, categoryId: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg focus:ring-1 focus:ring-luxury-gold bg-white"
                                      >
                                        {categories.map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Selling Price (₹)
                                      </label>
                                      <input
                                        type="number"
                                        value={editFormData.price ?? ""}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, price: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg font-mono focus:ring-1 focus:ring-luxury-gold"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Original List Price (₹)
                                      </label>
                                      <input
                                        type="number"
                                        value={editFormData.originalPrice ?? ""}
                                        onChange={(e) =>
                                          setEditFormData({
                                            ...editFormData,
                                            originalPrice: Number(e.target.value),
                                          })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg font-mono focus:ring-1 focus:ring-luxury-gold"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Stock Quantity
                                      </label>
                                      <input
                                        type="number"
                                        value={editFormData.inStock ?? ""}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, inStock: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg font-mono focus:ring-1 focus:ring-luxury-gold"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Metal Type
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Yellow Gold, Silver"
                                        value={editFormData.metalType || ""}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, metalType: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg focus:ring-1 focus:ring-luxury-gold"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Purity
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 22K, 18K, 925"
                                        value={editFormData.purity || ""}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, purity: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg focus:ring-1 focus:ring-luxury-gold"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Weight (grams)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editFormData.weight ?? ""}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, weight: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg font-mono focus:ring-1 focus:ring-luxury-gold"
                                      />
                                    </div>

                                    <div className="md:col-span-3">
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Description
                                      </label>
                                      <textarea
                                        rows={3}
                                        value={editFormData.description || ""}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, description: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg focus:ring-1 focus:ring-luxury-gold"
                                      />
                                    </div>

                                    <div className="md:col-span-3">
                                      <label className="block font-semibold text-vamika-charcoal mb-1">
                                        Change Justification / Reason (Required for Audit Trail)
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. Price revised per bullion rate, purity verified against hallmark certificate"
                                        value={editReason}
                                        onChange={(e) => setEditReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-luxury-border rounded-lg focus:ring-1 focus:ring-luxury-gold bg-amber-50/40"
                                      />
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex justify-end gap-3 pt-3 border-t border-luxury-border">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandProduct(p)}
                                      className="px-4 py-2 border border-luxury-border rounded-lg hover:bg-slate-50 transition cursor-pointer text-xs"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSavingProduct}
                                      onClick={() => handleSaveProductDetails(p.id)}
                                      className="px-5 py-2 bg-vamika-charcoal text-luxury-gold hover:bg-black rounded-lg font-semibold transition cursor-pointer flex items-center gap-2 text-xs"
                                    >
                                      <FaFloppyDisk />
                                      {isSavingProduct
                                        ? "Processing..."
                                        : isElevated
                                        ? "Save Direct to Database"
                                        : "Submit as Change Proposal"}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-luxury-border bg-slate-50/50 text-xs text-luxury-text-secondary gap-3">
              <div>
                Showing{" "}
                <strong>
                  {totalProductsCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(currentPage * pageSize, totalProductsCount)}
                </strong>{" "}
                of <strong>{totalProductsCount.toLocaleString()}</strong> products
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1 || loadingProducts}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 border border-luxury-border rounded-md hover:bg-white disabled:opacity-40 cursor-pointer"
                  title="Previous page"
                >
                  <FaChevronLeft size={11} />
                </button>

                <span className="px-2">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>

                <button
                  disabled={currentPage >= totalPages || loadingProducts}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="p-1.5 border border-luxury-border rounded-md hover:bg-white disabled:opacity-40 cursor-pointer"
                  title="Next page"
                >
                  <FaChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: ELEVATE DBA ACCESS */}
        {authModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-luxury-gold/30">
              <div className="flex items-center gap-2 text-vamika-charcoal mb-4">
                <FaShieldHalved className="text-luxury-gold text-xl" />
                <h3 className="font-serif font-bold text-lg">Elevated DBA Authentication</h3>
              </div>
              <p className="text-xs text-luxury-text-secondary mb-4">
                Enter your administrative password or master DBA passkey to unlock direct database mutations and approvals.
              </p>

              <form onSubmit={handleElevateSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-vamika-charcoal mb-1">
                    Administrator / DBA Password
                  </label>
                  <input
                    type="password"
                    required
                    value={dbaPassword}
                    onChange={(e) => setDbaPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-3 py-2 text-xs border border-luxury-border rounded-lg focus:outline-none focus:ring-1 focus:ring-luxury-gold"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-luxury-text-secondary hover:text-vamika-charcoal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={elevatedLoading}
                    className="px-4 py-2 text-xs font-bold bg-vamika-charcoal text-luxury-gold hover:bg-black rounded-lg transition"
                  >
                    {elevatedLoading ? "Verifying..." : "Unlock Elevated Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminAppShell>
  );
}

export default function AdminProductsVerificationPage() {
  return (
    <Suspense
      fallback={
        <AdminAppShell>
          <div className="p-12 text-center text-xs text-luxury-text-secondary">
            <span className="w-6 h-6 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p>Loading products verification queue...</p>
          </div>
        </AdminAppShell>
      }
    >
      <AdminProductsVerificationContent />
    </Suspense>
  );
}
