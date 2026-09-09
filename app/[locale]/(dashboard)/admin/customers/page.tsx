"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaUsers,
  FaMagnifyingGlass,
  FaEnvelope,
  FaPhone,
  FaAward,
  FaCrown,
  FaRotateLeft,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface CustomerItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  reviewCount: number;
  addressCount: number;
  status: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
      });

      const res = await fetch(`/api/admin/customers?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error("Failed to load customers");
      }
    } catch (err) {
      toast.error("Error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Customer Directory <span className="text-luxury-gold">& VIP Clients</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Lifetime spend analytics, repeat purchase behavior and client profiles.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-luxury-border p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full sm:w-80 flex items-center relative">
          <input
            type="text"
            placeholder="Search by client name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal placeholder:text-luxury-text-secondary focus:outline-none focus:border-luxury-gold"
          />
          <FaMagnifyingGlass className="absolute left-3 text-luxury-gold text-xs pointer-events-none" />
        </form>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Orders Placed</th>
                <th className="py-3.5 px-4">Lifetime Spend</th>
                <th className="py-3.5 px-4">Last Purchase</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-luxury-text-secondary">
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-luxury-gold/15 text-luxury-gold font-bold flex items-center justify-center text-xs">
                          {c.firstName?.[0] || c.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-vamika-charcoal">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-[10px] text-luxury-text-secondary">
                            Client ID: {c.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-vamika-charcoal font-medium">{c.email}</div>
                      <div className="text-[11px] text-luxury-text-secondary">{c.phone}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-vamika-charcoal">{c.orderCount} orders</td>
                    <td className="py-4 px-4 font-serif font-bold text-sm text-luxury-gold">
                      ₹{c.totalSpent.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 text-luxury-text-secondary">
                      {c.lastOrderDate
                        ? new Date(c.lastOrderDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No orders yet"}
                    </td>
                    <td className="py-4 px-4">
                      {c.totalSpent >= 200000 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          <FaCrown size={10} /> Haute VIP
                        </span>
                      ) : c.totalSpent > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <FaAward size={10} /> Patron
                        </span>
                      ) : (
                        <span className="text-[11px] text-luxury-text-secondary">Prospective</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-luxury-text-secondary">
                    No customers found matching search.
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
