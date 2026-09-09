"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaArrowLeft,
  FaTrashCan,
  FaCheck,
  FaImage,
  FaLayerGroup,
  FaGem,
  FaWarehouse,
} from "react-icons/fa6";
import toast from "react-hot-toast";

export default function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [inStock, setInStock] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("Vamika Luxe");
  const [metalType, setMetalType] = useState("18K Gold");
  const [purity, setPurity] = useState("VVS1");
  const [weight, setWeight] = useState("");
  const [occasion, setOccasion] = useState("");
  const [collection, setCollection] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        const p = data.product;
        setCategories(data.categories || []);
        setMerchants(data.merchants || []);

        setTitle(p.title || "");
        setSlug(p.slug || "");
        setPrice(p.price?.toString() || "");
        setOriginalPrice(p.originalPrice?.toString() || "");
        setInStock(p.inStock?.toString() || "0");
        setCategoryId(p.categoryId || "");
        setMerchantId(p.merchantId || "");
        setMainImage(p.mainImage || "");
        setDescription(p.description || "");
        setManufacturer(p.manufacturer || "Vamika Luxe");
        setMetalType(p.metalType || "18K Gold");
        setPurity(p.purity || "VVS1");
        setWeight(p.weight?.toString() || "");
        setOccasion(p.occasion || "");
        setCollection(p.collection || "");
        setFeatured(Boolean(p.featured));
        setIsBestseller(Boolean(p.isBestseller));
        setIsNewArrival(Boolean(p.isNewArrival));
      } else {
        toast.error("Failed to load product");
      }
    } catch (err) {
      toast.error("Error loading product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          price,
          originalPrice,
          inStock,
          categoryId,
          merchantId,
          mainImage,
          description,
          manufacturer,
          metalType,
          purity,
          weight,
          occasion,
          collection,
          featured,
          isBestseller,
          isNewArrival,
        }),
      });

      if (res.ok) {
        toast.success("Product updated successfully");
      } else {
        toast.error("Failed to update product");
      }
    } catch (err) {
      toast.error("Save error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action is recorded in the audit log.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted");
        router.push("/admin/products");
      } else {
        toast.error("Failed to delete product");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (loading) {
    return (
      <AdminAppShell>
        <div className="py-20 text-center text-luxury-text-secondary animate-pulse">
          Loading product specifications...
        </div>
      </AdminAppShell>
    );
  }

  return (
    <AdminAppShell>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="p-2 rounded-lg bg-white border border-luxury-border text-luxury-text-secondary hover:text-vamika-charcoal hover:border-luxury-gold transition-colors"
            >
              <FaArrowLeft size={13} />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-vamika-charcoal">
                Edit Product: <span className="text-luxury-gold">{title}</span>
              </h1>
              <p className="text-xs text-luxury-text-secondary mt-0.5">
                Slug: /{slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <FaTrashCan size={12} />
              <span>Delete</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black shadow-xs transition-colors disabled:opacity-50"
            >
              <FaCheck size={12} />
              <span>{saving ? "Saving Changes..." : "Save Product"}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Main Info (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                General Product Information
              </h2>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-medium focus:border-luxury-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-mono focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">
                    Atelier / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal focus:border-luxury-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Description & Story
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal focus:border-luxury-gold"
                />
              </div>
            </div>

            {/* Specifications & Haute Joaillerie Meta */}
            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <FaGem className="text-luxury-gold" />
                <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                  Precious Metals & Gemstone Specifications
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Metal Type</label>
                  <input
                    type="text"
                    placeholder="e.g. 18K Yellow Gold / Platinum"
                    value={metalType}
                    onChange={(e) => setMetalType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Clarity / Purity</label>
                  <input
                    type="text"
                    placeholder="e.g. VVS1 / IF"
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Weight (Grams)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Occasion</label>
                  <input
                    type="text"
                    placeholder="e.g. Bridal, Gala, Everyday Luxe"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Collection</label>
                  <input
                    type="text"
                    placeholder="e.g. Heritage 2026"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Pricing, Inventory, Category & Flags */}
          <div className="space-y-6">
            {/* Pricing & Stock */}
            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Pricing & Inventory
              </h2>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Price (INR ₹) *
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-bold text-sm text-luxury-gold focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Compare-at Original Price (INR ₹)
                </label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                />
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Stock Units in Vault *
                </label>
                <input
                  type="number"
                  required
                  value={inStock}
                  onChange={(e) => setInStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-semibold"
                />
              </div>
            </div>

            {/* Category & Organization */}
            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Category & Merchant
              </h2>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">Main Image URL</label>
                <input
                  type="text"
                  value={mainImage}
                  onChange={(e) => setMainImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-mono text-[11px]"
                />
                {mainImage && (
                  <img
                    src={mainImage}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded-lg border border-luxury-border"
                  />
                )}
              </div>
            </div>

            {/* Merchandising Badges */}
            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-3">
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Merchandising Badges
              </h2>

              <label className="flex items-center gap-2 text-luxury-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-luxury-border text-luxury-gold focus:ring-luxury-gold"
                />
                <span className="text-vamika-charcoal font-medium">Showcase as Featured Piece</span>
              </label>

              <label className="flex items-center gap-2 text-luxury-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="rounded border-luxury-border text-luxury-gold focus:ring-luxury-gold"
                />
                <span className="text-vamika-charcoal font-medium">Highlight as Bestseller</span>
              </label>

              <label className="flex items-center gap-2 text-luxury-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="rounded border-luxury-border text-luxury-gold focus:ring-luxury-gold"
                />
                <span className="text-vamika-charcoal font-medium">Flag as New Arrival</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </AdminAppShell>
  );
}
