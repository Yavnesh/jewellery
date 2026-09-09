"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaChartPie,
  FaChartLine,
  FaUsers,
  FaArrowUp,
  FaIndianRupeeSign,
  FaBagShopping,
  FaGem,
} from "react-icons/fa6";
import toast from "react-hot-toast";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard/stats?range=30d")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Business Intelligence <span className="text-luxury-gold">& Performance Reports</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Deep dive into customer acquisition channels, product margins and order velocity.
          </p>
        </div>
      </div>

      {/* Grid of Analytical Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
        {/* Sales by Category breakdown */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Revenue by Category
            </h2>
            <FaChartPie className="text-luxury-gold" />
          </div>

          <div className="space-y-3">
            {[
              { name: "Diamond Rings & Solitaires", share: 48, amount: "₹88,80,000" },
              { name: "Gold Necklaces & Sets", share: 32, amount: "₹59,20,000" },
              { name: "Earrings & Studs", share: 14, amount: "₹25,90,000" },
              { name: "Bracelets & Bangles", share: 6, amount: "₹11,10,000" },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-vamika-charcoal">{cat.name}</span>
                  <span className="text-luxury-gold font-bold">{cat.share}% ({cat.amount})</span>
                </div>
                <div className="w-full h-2 bg-luxury-bg rounded-full overflow-hidden border border-luxury-border">
                  <div
                    style={{ width: `${cat.share}%` }}
                    className="h-full bg-gradient-to-r from-luxury-gold to-vamika-charcoal"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Pieces */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Top Velocity Products
            </h2>
            <FaGem className="text-luxury-gold" />
          </div>

          <div className="space-y-3">
            {data?.topProducts && data.topProducts.length > 0 ? (
              data.topProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-luxury-bg border border-luxury-border/60">
                  <div className="flex items-center gap-2">
                    <img
                      src={p.mainImage || "/placeholder.jpg"}
                      alt={p.title}
                      className="w-8 h-8 rounded object-cover border border-luxury-border"
                    />
                    <div className="font-semibold text-vamika-charcoal line-clamp-1">{p.title}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-luxury-gold">₹{p.revenue.toLocaleString()}</div>
                    <div className="text-[10px] text-luxury-text-secondary">{p.unitsSold} units</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-luxury-text-secondary">
                Analyzing historical sales volume...
              </div>
            )}
          </div>
        </div>

        {/* Cohort & Customer Health */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Client Retention & LTV
            </h2>
            <FaUsers className="text-luxury-gold" />
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-luxury-bg border border-luxury-border flex justify-between items-center">
              <div>
                <div className="text-[11px] text-luxury-text-secondary uppercase">Repeat Buyer Rate</div>
                <div className="text-xl font-serif font-bold text-vamika-charcoal">38.4%</div>
              </div>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <FaArrowUp size={11} /> +4.2%
              </span>
            </div>

            <div className="p-3 rounded-lg bg-luxury-bg border border-luxury-border flex justify-between items-center">
              <div>
                <div className="text-[11px] text-luxury-text-secondary uppercase">Gross Profit Margin</div>
                <div className="text-xl font-serif font-bold text-luxury-gold">42.8%</div>
              </div>
              <span className="text-emerald-600 font-semibold">Healthy</span>
            </div>

            <div className="p-3 rounded-lg bg-luxury-bg border border-luxury-border flex justify-between items-center">
              <div>
                <div className="text-[11px] text-luxury-text-secondary uppercase">Return / Refund Ratio</div>
                <div className="text-xl font-serif font-bold text-vamika-charcoal">1.4%</div>
              </div>
              <span className="text-emerald-600 font-semibold">Low RMA Risk</span>
            </div>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
