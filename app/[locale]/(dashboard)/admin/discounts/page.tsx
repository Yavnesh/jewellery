"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaTicket,
  FaPlus,
  FaCheck,
  FaXmark,
  FaCalendarDays,
  FaChartLine,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface CouponItem {
  id: string;
  code: string;
  discountType: string;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isExpired: boolean;
  status: string;
  totalRevenueGenerated: number;
  totalDiscountGiven: number;
}

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Coupon Modal
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [value, setValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("50000");
  const [maxDiscount, setMaxDiscount] = useState("25000");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0]
  );
  const [usageLimit, setUsageLimit] = useState("100");
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/discounts");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      toast.error("Failed to load discount campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          value,
          minOrderValue,
          maxDiscount: discountType === "PERCENTAGE" ? maxDiscount : null,
          startDate,
          endDate,
          usageLimit,
        }),
      });

      if (res.ok) {
        toast.success(`Coupon ${code} created`);
        setShowModal(false);
        setCode("");
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create discount code");
      }
    } catch (err) {
      toast.error("Error creating coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Promotions & <span className="text-luxury-gold">Discount Campaigns</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Reward VIP clients, curate seasonal festival campaigns, and monitor redemption ROI.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black shadow-xs transition-colors"
        >
          <FaPlus size={12} />
          <span>New Discount Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Offer Value</th>
                <th className="py-3.5 px-4">Min. Spend</th>
                <th className="py-3.5 px-4">Usage / Limit</th>
                <th className="py-3.5 px-4">Active Window</th>
                <th className="py-3.5 px-4">Sales Driven</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-luxury-text-secondary">
                    Loading discount engine data...
                  </td>
                </tr>
              ) : coupons.length > 0 ? (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-sm text-vamika-charcoal">
                      {c.code}
                    </td>
                    <td className="py-4 px-4 font-semibold text-luxury-gold">
                      {c.discountType === "PERCENTAGE" ? `${c.value}% OFF` : `₹${c.value.toLocaleString()} OFF`}
                    </td>
                    <td className="py-4 px-4 text-luxury-text-secondary">
                      ₹{c.minOrderValue.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-vamika-charcoal">{c.usedCount}</span> / {c.usageLimit}
                        <div className="w-16 h-1.5 bg-luxury-bg rounded-full overflow-hidden border border-luxury-border">
                          <div
                            style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }}
                            className="h-full bg-luxury-gold"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-luxury-text-secondary">
                      {new Date(c.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} —{" "}
                      {new Date(c.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-4 px-4 font-bold text-vamika-charcoal">
                      ₹{c.totalRevenueGenerated.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-luxury-text-secondary">
                    No active discount codes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-luxury-border w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-serif font-bold text-vamika-charcoal">
              Create New Discount Campaign
            </h2>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIWALI2026"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-bold"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Min. Order (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-luxury-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-luxury-border text-luxury-text-secondary hover:bg-luxury-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold font-semibold hover:bg-black disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
