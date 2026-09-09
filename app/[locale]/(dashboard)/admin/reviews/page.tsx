"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaStar,
  FaCheck,
  FaXmark,
  FaFlag,
  FaMagnifyingGlass,
  FaCommentDots,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface ReviewItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  createdAt: string;
  product: { id: string; title: string; mainImage?: string };
  user: { id: string; email: string; name: string };
  orderId?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      if (search) queryParams.set("search", search);

      const res = await fetch(`/api/admin/reviews?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setCounts(data.statusCounts);
      }
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (reviewId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status }),
      });

      if (res.ok) {
        toast.success(`Review marked as ${status}`);
        fetchReviews();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("Error updating review");
    }
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Review Moderation <span className="text-luxury-gold">& Client Feedback</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Moderate verified buyer ratings, approve high-jewelry testimonials, and flag disputes.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-luxury-border pb-3 text-xs font-semibold">
        {[
          { label: `All Reviews (${counts.all})`, value: "ALL" },
          { label: `Pending (${counts.pending})`, value: "PENDING" },
          { label: `Approved (${counts.approved})`, value: "APPROVED" },
          { label: `Rejected (${counts.rejected})`, value: "REJECTED" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === tab.value
                ? "bg-vamika-charcoal text-luxury-gold"
                : "text-luxury-text-secondary hover:text-vamika-charcoal bg-white border border-luxury-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4">Product Piece</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Review Content</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-luxury-text-secondary">
                    Loading review queue...
                  </td>
                </tr>
              ) : reviews.length > 0 ? (
                reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {r.product?.mainImage && (
                          <img
                            src={r.product.mainImage}
                            alt={r.product.title}
                            className="w-10 h-10 rounded object-cover border border-luxury-border"
                          />
                        )}
                        <span className="font-semibold text-vamika-charcoal line-clamp-1">
                          {r.product?.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex text-luxury-gold text-xs">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={i < r.rating ? "text-luxury-gold" : "text-luxury-border"}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-sm">
                      {r.title && <div className="font-bold text-vamika-charcoal mb-0.5">{r.title}</div>}
                      <div className="text-luxury-text-secondary line-clamp-2">{r.comment}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-vamika-charcoal">{r.user.name}</div>
                      <div className="text-[10px] text-luxury-text-secondary">{r.user.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === "REJECTED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                          title="Approve for Storefront Display"
                          className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          <FaCheck size={12} />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r.id, "REJECTED")}
                          title="Reject / Hide from Storefront"
                          className="p-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                          <FaXmark size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-luxury-text-secondary">
                    No reviews in this status queue.
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
