"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import { FaArrowLeft, FaCheck, FaGem } from "react-icons/fa6";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [inStock, setInStock] = useState("5");
  const [categoryId, setCategoryId] = useState("");
  const [mainImage, setMainImage] = useState("/images/ring1.jpg");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("Vamika Luxe");
  const [metalType, setMetalType] = useState("18K Yellow Gold");
  const [purity, setPurity] = useState("VVS1 Clarity");
  const [weight, setWeight] = useState("5.2");
  const [occasion, setOccasion] = useState("Bridal & Engagement");
  const [collection, setCollection] = useState("Heritage 2026");
  const [featured, setFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  // Variant helper
  const [sku, setSku] = useState("");

  useEffect(() => {
    fetch("/api/admin/products?limit=1")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setSlug(generatedSlug);
    setSku(`VMK-${generatedSlug.slice(0, 8).toUpperCase()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !price || !categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          price,
          originalPrice,
          inStock,
          categoryId,
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
          variants: [
            {
              sku: sku || `SKU-${Date.now()}`,
              price,
              stockQuantity: inStock,
              weight,
            },
          ],
        }),
      });

      if (res.ok) {
        toast.success("Product created successfully");
        router.push("/admin/products");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create product");
      }
    } catch (err) {
      toast.error("Error creating product");
    } finally {
      setSaving(false);
    }
  };

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
                Create New <span className="text-luxury-gold">Luxury Masterpiece</span>
              </h1>
              <p className="text-xs text-luxury-text-secondary mt-0.5">
                Add an exquisite jewellery item to the global store catalog.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black shadow-xs transition-colors disabled:opacity-50"
          >
            <FaCheck size={12} />
            <span>{saving ? "Publishing Piece..." : "Publish Product"}</span>
          </button>
        </div>

        {/* 2-Column Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
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
                  placeholder="e.g. The Imperial Emerald Solitaire Ring"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
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
                    Initial SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-mono focus:border-luxury-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Story & Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the craftsmanship, cut, provenance and story behind this piece..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal focus:border-luxury-gold"
                />
              </div>
            </div>

            {/* Haute Joaillerie Specifications */}
            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <FaGem className="text-luxury-gold" />
                <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                  Specifications & Hallmarking
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Metal Type</label>
                  <input
                    type="text"
                    value={metalType}
                    onChange={(e) => setMetalType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Purity / Clarity</label>
                  <input
                    type="text"
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Weight (g)</label>
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
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Collection</label>
                  <input
                    type="text"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Col */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Pricing & Vault Stock
              </h2>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Price (INR ₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="185000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-bold text-sm text-luxury-gold focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Compare-at Price (INR ₹)
                </label>
                <input
                  type="number"
                  placeholder="210000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                />
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Initial Stock Count *
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

            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Taxonomy & Media
              </h2>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">Category *</label>
                <select
                  required
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
              </div>
            </div>

            <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-3">
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Storefront Merchandising
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
