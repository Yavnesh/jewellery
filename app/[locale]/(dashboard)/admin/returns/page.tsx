"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaRotateLeft,
  FaArrowRight,
  FaCheck,
  FaXmark,
  FaMoneyBillWave,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface ReturnItem {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  status: string;
  orderTotal: number;
  createdAt: string;
  products: Array<{
    title: string;
    image?: string;
    quantity: number;
    price: number;
  }>;
  refunds: any[];
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Settlement Modal
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [returnStatus, setReturnStatus] = useState("APPROVED");
  const [processing, setProcessing] = useState(false);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/returns");
      if (res.ok) {
        const data = await res.json();
        setReturns(data.returns || []);
      }
    } catch (err) {
      toast.error("Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    try {
      setProcessing(true);
      const res = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnId: selectedReturn.id,
          status: returnStatus,
          refundAmount: refundAmount || selectedReturn.orderTotal,
        }),
      });

      if (res.ok) {
        toast.success("Return & RMA status updated");
        setSelectedReturn(null);
        fetchReturns();
      } else {
        toast.error("Failed to update return");
      }
    } catch (err) {
      toast.error("Processing error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Returns, Exchanges <span className="text-luxury-gold">& RMA Refunds</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Authorize return merchandise, gemstone inspection, and initiate financial settlements.
          </p>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4">Return ID</th>
                <th className="py-3.5 px-4">Order & Client</th>
                <th className="py-3.5 px-4">Returned Pieces</th>
                <th className="py-3.5 px-4">Return Reason</th>
                <th className="py-3.5 px-4">Order Value</th>
                <th className="py-3.5 px-4">RMA Status</th>
                <th className="py-3.5 px-4 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-luxury-text-secondary">
                    Loading return requests...
                  </td>
                </tr>
              ) : returns.length > 0 ? (
                returns.map((item) => (
                  <tr key={item.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-vamika-charcoal">
                      #{item.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-vamika-charcoal">{item.customerName}</div>
                      <div className="text-[11px] text-luxury-text-secondary">Order #{item.orderId.slice(0, 8)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {item.products?.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {p.image && (
                              <img
                                src={p.image}
                                alt={p.title}
                                className="w-6 h-6 rounded object-cover border border-luxury-border"
                              />
                            )}
                            <span className="text-[11px] text-vamika-charcoal">{p.title}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-luxury-text-secondary max-w-xs">{item.reason}</td>
                    <td className="py-4 px-4 font-serif font-bold text-luxury-gold">
                      ₹{item.orderTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === "REFUNDED"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReturn(item);
                          setRefundAmount(item.orderTotal.toString());
                        }}
                        className="px-3 py-1 bg-luxury-bg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold hover:text-luxury-gold rounded font-semibold text-xs transition-colors"
                      >
                        Process
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-luxury-text-secondary">
                    No return or refund requests currently active.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Action Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-luxury-border w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-serif font-bold text-vamika-charcoal">
              Process Return RMA #{selectedReturn.id.slice(0, 8)}
            </h2>
            <p className="text-xs text-luxury-text-secondary">
              Client: <b>{selectedReturn.customerName}</b> • Order Value: ₹{selectedReturn.orderTotal.toLocaleString()}
            </p>

            <form onSubmit={handleProcessReturn} className="space-y-4 text-xs">
              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  RMA Decision Status
                </label>
                <select
                  value={returnStatus}
                  onChange={(e) => setReturnStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal"
                >
                  <option value="APPROVED">Approve for Vault Return</option>
                  <option value="RECEIVED">Received in Vault / Inspected</option>
                  <option value="REFUNDED">Settle & Issue Full Refund</option>
                  <option value="REJECTED">Reject Return Request</option>
                </select>
              </div>

              {returnStatus === "REFUNDED" && (
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">
                    Refund Amount (INR ₹)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-bold text-sm text-luxury-gold"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-luxury-border">
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className="px-4 py-2 rounded-lg border border-luxury-border text-luxury-text-secondary hover:bg-luxury-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold font-semibold hover:bg-black disabled:opacity-50"
                >
                  {processing ? "Updating..." : "Execute Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
