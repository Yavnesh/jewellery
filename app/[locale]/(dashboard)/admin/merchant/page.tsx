"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import Link from "next/link";
import apiClient from "@/lib/api";
import { toast } from "react-hot-toast";
import { FaStore, FaPlus, FaEnvelope, FaPhone, FaLocationDot } from "react-icons/fa6";

interface Merchant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  status: string;
  products: any[];
}

export default function MerchantPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/merchants");
      if (!response.ok) {
        throw new Error("Failed to fetch merchants");
      }
      const data = await response.json();
      setMerchants(data);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      toast.error("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Merchant Partners <span className="text-luxury-gold">& Suppliers</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Manage jewellery brand suppliers, boutique concessions, and vendor inventories.
          </p>
        </div>

        <Link
          href="/admin/merchant/new"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black shadow-xs transition-colors"
        >
          <FaPlus size={12} />
          <span>Add Merchant</span>
        </Link>
      </div>

      {/* Merchants Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4">Merchant Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Associated Products</th>
                <th className="py-3.5 px-4">Operating Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-luxury-text-secondary">
                    Loading merchants...
                  </td>
                </tr>
              ) : merchants.length > 0 ? (
                merchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-vamika-charcoal flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-luxury-gold/15 text-luxury-gold">
                        <FaStore size={14} />
                      </div>
                      <div>
                        <div>{merchant.name}</div>
                        <div className="text-[10px] text-luxury-text-secondary font-normal">
                          ID: {merchant.id.slice(0, 8)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-vamika-charcoal font-medium">{merchant.email || "—"}</div>
                      <div className="text-[11px] text-luxury-text-secondary">{merchant.phone || "—"}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-vamika-charcoal">
                      {merchant.products?.length || 0} items in catalog
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          merchant.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {merchant.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/merchant/${merchant.id}`}
                        className="px-3 py-1 bg-luxury-bg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold hover:text-luxury-gold rounded font-semibold text-xs transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-luxury-text-secondary">
                    No merchant suppliers registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminAppShell>
  );
}