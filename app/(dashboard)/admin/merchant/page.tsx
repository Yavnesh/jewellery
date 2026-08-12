"use client";
import React, { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import Link from "next/link";
import apiClient from "@/lib/api";
import { toast } from "react-hot-toast";

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
    <div className="bg-luxury-bg min-h-screen flex max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex-1 p-8 max-xl:p-4">
        
        <div className="bg-white rounded-lg shadow-sm border border-luxury-border p-6">
          <div className="flex justify-between items-center mb-6 border-b border-luxury-border/50 pb-4">
            <h1 className="text-2xl font-serif text-vamika-charcoal">All Merchants</h1>
            <Link
              href="/admin/merchant/new"
              className="bg-luxury-gold text-white font-medium tracking-widest uppercase text-xs px-6 py-3 rounded hover:bg-luxury-gold-dark transition-colors"
            >
              Add Merchant
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            {loading ? (
              <div className="text-center py-10 font-serif text-luxury-text-secondary">Loading merchants...</div>
            ) : merchants.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-luxury-border">
                    <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Name</th>
                    <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Email</th>
                    <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Status</th>
                    <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Products</th>
                    <th className="py-4 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant.id} className="border-b border-luxury-border/30 hover:bg-vamika-ivory/30 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-medium text-vamika-charcoal tracking-wide">{merchant.name}</span>
                      </td>
                      <td className="py-4 px-4 text-luxury-text-secondary">
                        {merchant.email || "N/A"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase ${
                          merchant.status === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}>
                          {merchant.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-vamika-charcoal font-medium">
                        {merchant.products.length}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/merchant/${merchant.id}`}
                          className="text-xs font-medium tracking-widest uppercase text-luxury-gold hover:text-luxury-gold-dark transition-colors border border-luxury-gold hover:bg-luxury-gold/5 px-4 py-2 rounded"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 font-serif text-luxury-text-secondary">No merchants found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}