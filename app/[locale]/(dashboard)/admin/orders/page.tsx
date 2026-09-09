"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaMagnifyingGlass,
  FaFilter,
  FaFileExport,
  FaArrowDown,
  FaArrowUp,
  FaRotateLeft,
  FaTruckFast,
  FaCheck,
  FaXmark,
  FaBagShopping,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  status: string;
  paymentStatus: string;
  dateTime: string;
  city: string;
  country: string;
  itemCount: number;
  shipmentCount?: number;
  carrier?: string;
  trackingNumber?: string;
  shippingStatus?: string;
  estimatedDeliveryAt?: string;
  lastTrackingUpdate?: string;
  hasRefund: boolean;
  hasReturn: boolean;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [shippingFilter, setShippingFilter] = useState("ALL");
  const [carrierFilter, setCarrierFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        paymentStatus: paymentFilter,
        shippingStatus: shippingFilter,
        carrier: carrierFilter,
        search,
      });

      const res = await fetch(`/api/admin/orders?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter, shippingFilter, carrierFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((item) => item !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkAction || selectedOrders.length === 0) return;

    try {
      let updatePayload: any = { orderIds: selectedOrders, action: bulkAction };
      if (bulkAction === "MARK_PROCESSING") updatePayload.status = "processing";
      if (bulkAction === "MARK_DELIVERED") updatePayload.status = "delivered";
      if (bulkAction === "MARK_PAID") updatePayload.paymentStatus = "SUCCEEDED";
      if (bulkAction === "CANCEL") updatePayload.status = "CANCELLED";

      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        toast.success(`Updated ${selectedOrders.length} orders`);
        setSelectedOrders([]);
        setBulkAction("");
        fetchOrders();
      } else {
        toast.error("Failed to apply bulk update");
      }
    } catch (err) {
      toast.error("Bulk update error");
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = ["Order ID", "Customer", "Email", "City", "Total", "Payment", "Fulfillment", "Shipping Status", "Carrier", "Tracking", "ETA", "Date"];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      o.email,
      `"${o.city}"`,
      o.total,
      o.paymentStatus,
      o.status,
      o.shippingStatus || "NOT_SHIPPED",
      o.carrier || "—",
      o.trackingNumber || "—",
      o.estimatedDeliveryAt ? new Date(o.estimatedDeliveryAt).toLocaleDateString() : "—",
      o.dateTime,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_delivery_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders CSV exported");
  };

  const renderShippingBadge = (status?: string) => {
    const s = status || "NOT_SHIPPED";
    switch (s) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            Delivered
          </span>
        );
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
            Out For Delivery
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            In Transit
          </span>
        );
      case "CUSTOMS_CLEARANCE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
            Customs Clear
          </span>
        );
      case "CUSTOMS_HOLD":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-300">
            Customs Hold
          </span>
        );
      case "PICKED_UP":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200">
            Picked Up
          </span>
        );
      case "LABEL_CREATED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-50 text-cyan-700 border border-cyan-200">
            Label Created
          </span>
        );
      case "EXCEPTION":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
            Exception
          </span>
        );
      case "RETURNED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
            Returned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
            Not Shipped
          </span>
        );
    }
  };

  return (
    <AdminAppShell>
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Sales & Delivery <span className="text-luxury-gold">Logistics</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Track real-time carrier delivery status, dispatch armored shipments, and manage fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-luxury-border text-vamika-charcoal hover:border-luxury-gold shadow-2xs transition-colors"
          >
            <FaFileExport size={13} className="text-luxury-gold" />
            <span>Export Logistics CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-xl border border-luxury-border p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="w-full lg:w-80 flex items-center relative">
            <input
              type="text"
              placeholder="Search by Order ID, tracking AWB, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal placeholder:text-luxury-text-secondary focus:outline-none focus:border-luxury-gold"
            />
            <FaMagnifyingGlass className="absolute left-3 text-luxury-gold text-xs pointer-events-none" />
          </form>

          {/* Multi-tier Filters */}
          <div className="w-full lg:w-auto flex flex-wrap gap-2.5 items-center">
            {/* Shipping Status Filter */}
            <select
              value={shippingFilter}
              onChange={(e) => {
                setShippingFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-luxury-border bg-white text-vamika-charcoal font-medium focus:outline-none focus:border-luxury-gold"
            >
              <option value="ALL">All Shipping Statuses</option>
              <option value="NOT_SHIPPED">Not Shipped</option>
              <option value="LABEL_CREATED">Label Created</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="CUSTOMS_CLEARANCE">Customs Clearance</option>
              <option value="CUSTOMS_HOLD">Customs Hold</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="EXCEPTION">Delivery Exception</option>
              <option value="RETURNED">Returned</option>
            </select>

            {/* Carrier Filter */}
            <select
              value={carrierFilter}
              onChange={(e) => {
                setCarrierFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-luxury-border bg-white text-vamika-charcoal focus:outline-none focus:border-luxury-gold"
            >
              <option value="ALL">All Carriers</option>
              <option value="DHL">DHL Express</option>
              <option value="FedEx">FedEx</option>
              <option value="BlueDart">BlueDart Apex</option>
              <option value="Shiprocket">Shiprocket</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-luxury-border bg-white text-vamika-charcoal focus:outline-none focus:border-luxury-gold"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="SUCCEEDED">Paid / Succeeded</option>
              <option value="PENDING">Pending</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar (when rows selected) */}
        {selectedOrders.length > 0 && (
          <div className="pt-3 border-t border-luxury-border flex items-center justify-between bg-luxury-bg/50 p-2 rounded-lg text-xs">
            <span className="font-semibold text-vamika-charcoal">
              {selectedOrders.length} {selectedOrders.length === 1 ? "order" : "orders"} selected
            </span>
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-luxury-border bg-white text-xs text-vamika-charcoal"
              >
                <option value="">Choose bulk action...</option>
                <option value="MARK_PROCESSING">Mark as Processing</option>
                <option value="MARK_DELIVERED">Mark as Delivered</option>
                <option value="MARK_PAID">Mark Payment Succeeded</option>
                <option value="CANCEL">Cancel Orders</option>
              </select>
              <button
                onClick={handleBulkSubmit}
                disabled={!bulkAction}
                className="px-3 py-1.5 rounded bg-vamika-charcoal text-luxury-gold font-semibold text-xs disabled:opacity-50 hover:bg-black transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table with Delivery Columns */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrders.length === orders.length}
                    onChange={handleSelectAll}
                    className="rounded border-luxury-border text-luxury-gold focus:ring-luxury-gold"
                  />
                </th>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Fulfillment</th>
                <th className="py-3.5 px-4">Shipping Status</th>
                <th className="py-3.5 px-4">Carrier</th>
                <th className="py-3.5 px-4">Tracking / AWB</th>
                <th className="py-3.5 px-4">Estimated ETA</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-luxury-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
                      <span>Loading delivery telemetry...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-vamika-ivory/50 transition-colors ${
                      selectedOrders.includes(order.id) ? "bg-luxury-gold/5" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOne(order.id)}
                        className="rounded border-luxury-border text-luxury-gold focus:ring-luxury-gold"
                      />
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-vamika-charcoal">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hover:text-luxury-gold transition-colors"
                      >
                        #{order.id.slice(0, 8)}...
                      </Link>
                      <div className="text-[10px] font-sans text-luxury-text-secondary font-normal">
                        ₹{order.total.toLocaleString("en-IN")} • {order.itemCount} item(s)
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-vamika-charcoal">{order.customerName}</div>
                      <div className="text-[11px] text-luxury-text-secondary">{order.email}</div>
                      <div className="text-[10px] text-luxury-text-secondary">{order.city}, {order.country}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === "SUCCEEDED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : order.paymentStatus === "REFUNDED"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {order.paymentStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          order.status === "delivered" || order.status === "SHIPPED"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "PARTIALLY_SHIPPED"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {renderShippingBadge(order.shippingStatus)}
                    </td>
                    <td className="py-4 px-4 font-medium text-vamika-charcoal">
                      <div className="flex items-center gap-1.5">
                        <FaTruckFast className="text-luxury-gold text-xs shrink-0" />
                        <span className="truncate max-w-[120px]">{order.carrier || "—"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold">
                      {order.trackingNumber && order.trackingNumber !== "—" ? (
                        <Link
                          href={`/admin/orders/${order.id}#shipments`}
                          className="text-luxury-gold hover:underline"
                        >
                          {order.trackingNumber}
                        </Link>
                      ) : (
                        <span className="text-luxury-text-secondary">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-luxury-text-secondary">
                      {order.estimatedDeliveryAt
                        ? new Date(order.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-luxury-bg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold hover:text-luxury-gold text-xs font-semibold transition-colors"
                      >
                        Delivery & Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-luxury-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <FaBagShopping className="text-3xl text-luxury-gold/40" />
                      <p className="font-serif text-base text-vamika-charcoal">No orders match filter criteria</p>
                      <p className="text-xs">Adjust your search query or shipping status filter</p>
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
