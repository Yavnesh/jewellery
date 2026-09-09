"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaWarehouse,
  FaMagnifyingGlass,
  FaPlus,
  FaMinus,
  FaClockRotateLeft,
  FaShieldHalved,
  FaBoxOpen,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface InventoryItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  category: string;
  sku: string;
  barcode?: string;
  price: number;
  stockQuantity: number;
  reservedQuantity: number;
  available: number;
  status: string;
  updatedAt: string;
}

interface InventorySummary {
  totalStockUnits: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalTrackedSkus: number;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    totalStockUnits: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalTrackedSkus: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  // Stock Adjustment Modal
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("Restock Received");
  const [adjusting, setAdjusting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (filter) queryParams.set("filter", filter);

      const res = await fetch(`/api/admin/inventory?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSummary(data.summary);
      } else {
        toast.error("Failed to load inventory data");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || !adjustmentQty) return;

    try {
      setAdjusting(true);
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantityChange: parseInt(adjustmentQty),
          reason: adjustmentReason,
        }),
      });

      if (res.ok) {
        toast.success(`Inventory updated for SKU: ${selectedVariant.sku}`);
        setSelectedVariant(null);
        setAdjustmentQty("");
        fetchInventory();
      } else {
        toast.error("Adjustment failed");
      }
    } catch (err) {
      toast.error("Stock adjustment error");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Vault Stock & <span className="text-luxury-gold">Inventory Control</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Real-time variant tracking, stock reservations, safe reorder thresholds & audit logs.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-luxury-border shadow-xs">
          <div className="text-luxury-text-secondary text-[11px] font-semibold uppercase tracking-wider mb-1">
            Total Vault Units
          </div>
          <div className="text-2xl font-serif font-bold text-vamika-charcoal">
            {summary.totalStockUnits.toLocaleString()} pcs
          </div>
          <div className="text-[11px] text-luxury-gold font-medium mt-1">
            Across {summary.totalTrackedSkus} active SKUs
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-luxury-border shadow-xs">
          <div className="text-luxury-text-secondary text-[11px] font-semibold uppercase tracking-wider mb-1">
            Total Stock Asset Value
          </div>
          <div className="text-2xl font-serif font-bold text-luxury-gold">
            ₹{summary.totalStockValue.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-luxury-text-secondary mt-1">Fine Jewellery Valuation</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-luxury-border shadow-xs">
          <div className="text-luxury-text-secondary text-[11px] font-semibold uppercase tracking-wider mb-1">
            Low Stock Thresholds
          </div>
          <div className="text-2xl font-serif font-bold text-amber-600">
            {summary.lowStockCount} items
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Need replenishment (&lt;= 5 units)</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-luxury-border shadow-xs">
          <div className="text-luxury-text-secondary text-[11px] font-semibold uppercase tracking-wider mb-1">
            Out of Stock (Zero)
          </div>
          <div className="text-2xl font-serif font-bold text-red-600">
            {summary.outOfStockCount} items
          </div>
          <div className="text-[11px] text-red-700 mt-1">Customer backorders paused</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-luxury-border p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchInventory();
          }}
          className="w-full sm:w-80 flex items-center relative"
        >
          <input
            type="text"
            placeholder="Filter by SKU or Product Title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal placeholder:text-luxury-text-secondary focus:outline-none focus:border-luxury-gold"
          />
          <FaMagnifyingGlass className="absolute left-3 text-luxury-gold text-xs pointer-events-none" />
        </form>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === ""
                ? "bg-vamika-charcoal text-luxury-gold"
                : "bg-white border border-luxury-border text-luxury-text-secondary"
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => setFilter("low")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "low"
                ? "bg-amber-600 text-white"
                : "bg-white border border-luxury-border text-amber-700"
            }`}
          >
            Low Stock Only
          </button>
          <button
            onClick={() => setFilter("out")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "out"
                ? "bg-red-600 text-white"
                : "bg-white border border-luxury-border text-red-700"
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4">Item & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4">On Hand</th>
                <th className="py-3.5 px-4">Reserved</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4">Stock Health</th>
                <th className="py-3.5 px-4 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-luxury-text-secondary">
                    Loading inventory telemetry...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productTitle}
                            className="w-10 h-10 rounded object-cover border border-luxury-border"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-vamika-charcoal line-clamp-1">
                            {item.productTitle}
                          </div>
                          <div className="font-mono text-[11px] text-luxury-gold font-bold">
                            {item.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-vamika-charcoal">{item.category}</td>
                    <td className="py-4 px-4 font-serif font-bold text-luxury-gold">
                      ₹{item.price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 font-bold text-vamika-charcoal">{item.stockQuantity}</td>
                    <td className="py-4 px-4 text-luxury-text-secondary">{item.reservedQuantity}</td>
                    <td className="py-4 px-4 font-bold text-vamika-charcoal">{item.available}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.stockQuantity <= 0
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : item.stockQuantity <= 5
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                      >
                        {item.stockQuantity <= 0
                          ? "Out of Stock"
                          : item.stockQuantity <= 5
                          ? "Low Threshold"
                          : "Healthy Level"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedVariant(item)}
                        className="px-3 py-1 bg-luxury-bg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold hover:text-luxury-gold rounded font-semibold text-xs transition-colors"
                      >
                        Adjust Qty
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-luxury-text-secondary">
                    No inventory records match filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-luxury-border w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-serif font-bold text-vamika-charcoal">
              Adjust Stock for <span className="text-luxury-gold">{selectedVariant.sku}</span>
            </h2>
            <p className="text-xs text-luxury-text-secondary">
              Current stock: <b>{selectedVariant.stockQuantity} units</b>. This change will be permanently logged in the audit trail.
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Quantity Adjustment (e.g. +5 or -2)
                </label>
                <input
                  type="number"
                  required
                  placeholder="+5 or -2"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-bold text-sm focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal"
                >
                  <option value="Restock Received">Restock Received from Atelier</option>
                  <option value="Damaged / Inspection Loss">Damaged / Inspection Loss</option>
                  <option value="Inventory Audit Correction">Inventory Audit Correction</option>
                  <option value="Customer Return Restocked">Customer Return Restocked</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-luxury-border">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 rounded-lg border border-luxury-border text-luxury-text-secondary hover:bg-luxury-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-4 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold font-semibold hover:bg-black disabled:opacity-50"
                >
                  {adjusting ? "Updating..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
