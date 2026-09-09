"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaArrowUp,
  FaArrowDown,
  FaBagShopping,
  FaBoxOpen,
  FaUsers,
  FaIndianRupeeSign,
  FaRotateLeft,
  FaTriangleExclamation,
  FaArrowRight,
  FaShieldHalved,
  FaTruckFast,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface DashboardStats {
  kpis: {
    revenue: number;
    orders: number;
    aov: number;
    totalCustomers: number;
    newCustomers: number;
    totalProducts: number;
    refundAmount: number;
    refundsCount: number;
  };
  chartData: Array<{ date: string; revenue: number; orders: number }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    email: string;
    total: number;
    status: string;
    paymentStatus: string;
    dateTime: string;
    country: string;
    city: string;
  }>;
  topProducts: Array<{
    id: string;
    title: string;
    price: number;
    mainImage: string;
    inStock: number;
    unitsSold: number;
    revenue: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    title: string;
    inStock: number;
    price: number;
    mainImage: string;
  }>;
  alerts: {
    pendingReviews: number;
    pendingReturns: number;
    lowStockCount: number;
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    actorId: string;
    entityType: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/dashboard/stats?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Failed to load dashboard metrics");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error fetching statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  if (loading && !data) {
    return (
      <AdminAppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-luxury-border/60 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-luxury-border" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 bg-white rounded-xl border border-luxury-border" />
            <div className="h-80 bg-white rounded-xl border border-luxury-border" />
          </div>
        </div>
      </AdminAppShell>
    );
  }

  const kpis = data?.kpis || {
    revenue: 0,
    orders: 0,
    aov: 0,
    totalCustomers: 0,
    newCustomers: 0,
    totalProducts: 0,
    refundAmount: 0,
    refundsCount: 0,
  };

  return (
    <AdminAppShell>
      {/* Top Banner & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Executive Operations <span className="text-luxury-gold">Overview</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Real-time telemetry, revenue performance, and inventory health.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="inline-flex rounded-lg bg-white border border-luxury-border p-1 shadow-2xs">
          {[
            { label: "Today", value: "today" },
            { label: "7 Days", value: "7d" },
            { label: "30 Days", value: "30d" },
            { label: "90 Days", value: "90d" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRange(item.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                range === item.value
                  ? "bg-vamika-charcoal text-luxury-gold shadow-2xs"
                  : "text-luxury-text-secondary hover:text-vamika-charcoal"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operational Alerts Bar */}
      {(data?.alerts?.pendingReviews || 0) > 0 || (data?.alerts?.lowStockCount || 0) > 0 ? (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <FaTriangleExclamation className="text-amber-600 text-sm" />
            <span>
              Action Required: {data?.alerts.lowStockCount || 0} items low in stock, {data?.alerts.pendingReviews || 0} reviews pending moderation.
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/inventory?filter=low"
              className="px-2.5 py-1 bg-amber-600 text-white rounded font-medium text-[11px] hover:bg-amber-700 transition-colors"
            >
              Inspect Stock
            </Link>
            <Link
              href="/admin/reviews?status=PENDING"
              className="px-2.5 py-1 bg-white border border-amber-300 rounded font-medium text-[11px] hover:bg-amber-50 transition-colors"
            >
              Moderate Reviews
            </Link>
          </div>
        </div>
      ) : null}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-5 bg-white rounded-xl border border-luxury-border shadow-xs hover:border-luxury-gold/50 transition-all">
          <div className="flex items-center justify-between text-luxury-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Gross Revenue</span>
            <div className="p-2 rounded-lg bg-luxury-gold/10 text-luxury-gold">
              <FaIndianRupeeSign />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-vamika-charcoal">
            ₹{kpis.revenue.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-2">
            <FaArrowUp size={11} />
            <span>+14.2%</span>
            <span className="text-luxury-text-secondary font-normal">vs previous period</span>
          </div>
        </div>

        {/* Orders Placed */}
        <div className="p-5 bg-white rounded-xl border border-luxury-border shadow-xs hover:border-luxury-gold/50 transition-all">
          <div className="flex items-center justify-between text-luxury-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Orders Placed</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FaBagShopping />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-vamika-charcoal">
            {kpis.orders.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-2">
            <FaArrowUp size={11} />
            <span>+8.4%</span>
            <span className="text-luxury-text-secondary font-normal">order velocity</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-5 bg-white rounded-xl border border-luxury-border shadow-xs hover:border-luxury-gold/50 transition-all">
          <div className="flex items-center justify-between text-luxury-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Avg Order Value (AOV)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <FaBoxOpen />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-vamika-charcoal">
            ₹{kpis.aov.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-luxury-gold font-medium mt-2">
            <span>High-Ticket Fine Jewellery</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-5 bg-white rounded-xl border border-luxury-border shadow-xs hover:border-luxury-gold/50 transition-all">
          <div className="flex items-center justify-between text-luxury-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Clients</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <FaUsers />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-vamika-charcoal">
            {kpis.totalCustomers.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-purple-700 font-medium mt-2">
            <span>+{kpis.newCustomers} new acquisitions</span>
          </div>
        </div>
      </div>

      {/* Real-time Order Delivery & Shipping Telemetry Bar */}
      <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaTruckFast className="text-luxury-gold text-base" />
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Shipping & Armored Logistics Operations
            </h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-luxury-gold hover:underline flex items-center gap-1"
          >
            Manage All Shipments <FaArrowRight size={10} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Awaiting Shipment */}
          <Link
            href="/admin/orders?shippingStatus=NOT_SHIPPED"
            className="p-3.5 rounded-lg border border-luxury-border bg-luxury-bg/60 hover:border-luxury-gold transition-all block group"
          >
            <div className="text-[11px] font-semibold text-luxury-text-secondary uppercase tracking-wider">
              Awaiting Shipment
            </div>
            <div className="text-xl font-serif font-bold text-amber-600 mt-1">
              {(data as any)?.shippingMetrics?.awaitingShipment || 0}
            </div>
            <div className="text-[10px] text-luxury-text-secondary mt-0.5 group-hover:text-luxury-gold transition-colors">
              In Vault Packaging →
            </div>
          </Link>

          {/* In Transit */}
          <Link
            href="/admin/orders?shippingStatus=IN_TRANSIT"
            className="p-3.5 rounded-lg border border-luxury-border bg-luxury-bg/60 hover:border-luxury-gold transition-all block group"
          >
            <div className="text-[11px] font-semibold text-luxury-text-secondary uppercase tracking-wider">
              In Transit
            </div>
            <div className="text-xl font-serif font-bold text-blue-600 mt-1">
              {(data as any)?.shippingMetrics?.inTransit || 0}
            </div>
            <div className="text-[10px] text-luxury-text-secondary mt-0.5 group-hover:text-luxury-gold transition-colors">
              Active Carrier Freight →
            </div>
          </Link>

          {/* Delivered Today */}
          <Link
            href="/admin/orders?shippingStatus=DELIVERED"
            className="p-3.5 rounded-lg border border-luxury-border bg-luxury-bg/60 hover:border-luxury-gold transition-all block group"
          >
            <div className="text-[11px] font-semibold text-luxury-text-secondary uppercase tracking-wider">
              Delivered Today
            </div>
            <div className="text-xl font-serif font-bold text-emerald-600 mt-1">
              {(data as any)?.shippingMetrics?.deliveredToday || 0}
            </div>
            <div className="text-[10px] text-luxury-text-secondary mt-0.5 group-hover:text-luxury-gold transition-colors">
              Client OTP Verified →
            </div>
          </Link>

          {/* Delivery Exceptions / Customs Holds */}
          <Link
            href="/admin/orders?shippingStatus=EXCEPTION"
            className="p-3.5 rounded-lg border border-luxury-border bg-luxury-bg/60 hover:border-luxury-gold transition-all block group"
          >
            <div className="text-[11px] font-semibold text-luxury-text-secondary uppercase tracking-wider">
              Exceptions & Holds
            </div>
            <div className="text-xl font-serif font-bold text-rose-600 mt-1">
              {(data as any)?.shippingMetrics?.exceptions || 0}
            </div>
            <div className="text-[10px] text-luxury-text-secondary mt-0.5 group-hover:text-luxury-gold transition-colors">
              Requires Intervention →
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Revenue Velocity & Low Stock Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Chart / Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-luxury-border p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Revenue & Velocity Timeline
              </h2>
              <p className="text-xs text-luxury-text-secondary">Sales trends across selected window</p>
            </div>
            <span className="text-xs font-bold text-luxury-gold uppercase tracking-wider px-2 py-1 bg-luxury-gold/10 rounded">
              Live DB Telemetry
            </span>
          </div>

          {/* Render Visual Bar Chart */}
          <div className="h-56 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-luxury-border/60">
            {data?.chartData && data.chartData.length > 0 ? (
              data.chartData.map((item, idx) => {
                const maxRev = Math.max(...data.chartData.map((d) => d.revenue), 100000);
                const heightPct = Math.max(8, Math.round((item.revenue / maxRev) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-vamika-charcoal text-luxury-ivory text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                      <div>{item.date}</div>
                      <div className="text-luxury-gold font-bold">₹{item.revenue.toLocaleString()}</div>
                      <div>{item.orders} orders</div>
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-vamika-charcoal to-luxury-gold rounded-t-sm group-hover:brightness-125 transition-all"
                    />
                    <span className="text-[10px] text-luxury-text-secondary truncate w-full text-center">
                      {item.date}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-luxury-text-secondary">
                No orders in this timeframe yet
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-luxury-text-secondary pt-3">
            <span>Aggregated from live customer orders</span>
            <Link href="/admin/analytics" className="text-luxury-gold font-medium hover:underline flex items-center gap-1">
              Deep Analytics <FaArrowRight size={10} />
            </Link>
          </div>
        </div>

        {/* Low Stock & Inventory Watch */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Low Stock Watchlist
            </h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-medium text-luxury-gold hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
              data.lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-luxury-border/60 hover:bg-vamika-ivory/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.mainImage || "/placeholder.jpg"}
                      alt={p.title}
                      className="w-10 h-10 rounded object-cover border border-luxury-border"
                    />
                    <div>
                      <div className="text-xs font-medium text-vamika-charcoal line-clamp-1">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-luxury-text-secondary">₹{p.price.toLocaleString()}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      p.inStock <= 0
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    {p.inStock <= 0 ? "Out of Stock" : `${p.inStock} left`}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-luxury-text-secondary">
                All inventory levels optimal
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Security Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-luxury-border p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Recent Customer Orders
            </h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-luxury-gold hover:underline">
              View All Orders
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-luxury-border text-luxury-text-secondary uppercase font-semibold">
                  <th className="pb-3 px-2">Order ID</th>
                  <th className="pb-3 px-2">Customer</th>
                  <th className="pb-3 px-2">Total</th>
                  <th className="pb-3 px-2">Payment</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/40">
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-vamika-ivory/40 transition-colors">
                      <td className="py-3 px-2 font-mono font-medium text-vamika-charcoal">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-2 font-medium text-vamika-charcoal">
                        <div>{order.customer}</div>
                        <div className="text-[10px] text-luxury-text-secondary">{order.city}</div>
                      </td>
                      <td className="py-3 px-2 font-semibold text-luxury-gold">
                        ₹{order.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            order.paymentStatus === "SUCCEEDED"
                              ? "bg-emerald-50 text-emerald-600"
                              : order.paymentStatus === "REFUNDED"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {order.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                            order.status === "delivered" || order.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-100 text-zinc-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="px-2.5 py-1 rounded bg-luxury-bg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold text-[11px] font-semibold transition-colors"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-luxury-text-secondary">
                      No orders found. Click "Seed Demo DB" above to populate sample orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaShieldHalved className="text-luxury-gold" />
                <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                  Immutable Audit Log
                </h2>
              </div>
              <Link href="/admin/audit-logs" className="text-xs text-luxury-gold hover:underline">
                Full Trail
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
                data.recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-luxury-bg border border-luxury-border/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-vamika-charcoal text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-luxury-text-secondary">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-luxury-text-secondary truncate">
                      By {log.actorId} on {log.entityType}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-luxury-text-secondary">
                  No audit log entries recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-luxury-border text-[11px] text-luxury-text-secondary flex items-center justify-between">
            <span>PCI-DSS & Audit Ready</span>
            <span className="text-emerald-600 font-semibold">Protected</span>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}

