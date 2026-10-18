"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaBagShopping,
  FaFileInvoiceDollar,
  FaRotateLeft,
  FaTruckFast,
  FaCircleCheck,
  FaClock,
  FaXmark,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  dateTime: string;
  city: string;
  country: string;
  products: Array<{
    id: string;
    quantity: number;
    priceAtPurchase: number;
    product?: {
      title: string;
      mainImage: string;
      slug: string;
    };
  }>;
  shipments: Array<{
    trackingNumber?: string;
    courier?: string;
    status: string;
  }>;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Return Request Modal State
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<OrderItem | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [exchangeRequested, setExchangeRequested] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Invoice Modal State
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        toast.error("Failed to load your orders");
      }
    } catch (err) {
      toast.error("Error fetching order history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReturn || !returnReason.trim()) {
      toast.error("Please enter a return reason");
      return;
    }

    try {
      setSubmittingReturn(true);
      const res = await fetch("/api/customer/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderForReturn.id,
          reason: returnReason,
          exchangeCta: exchangeRequested,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Return requested successfully");
        setSelectedOrderForReturn(null);
        setReturnReason("");
        setExchangeRequested(false);
      } else {
        toast.error(data.error || "Failed to submit return request");
      }
    } catch (err) {
      toast.error("Network error while submitting return");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleViewInvoice = async (orderId: string) => {
    try {
      setLoadingInvoice(true);
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      if (res.ok) {
        const json = await res.json();
        setInvoiceData(json.invoice);
      } else {
        toast.error("Unable to generate GST Tax invoice");
      }
    } catch (err) {
      toast.error("Error loading tax invoice");
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-luxury-border/60 pb-4">
        <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
          Your Order <span className="text-luxury-gold">History</span>
        </h1>
        <p className="text-xs text-luxury-text-secondary mt-1">
          Review past luxury purchases, track armored logistics, request insured returns, and download GST tax invoices.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-luxury-text-secondary">
          <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading your order history...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4 hover:border-luxury-gold/50 transition-colors"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-luxury-border/40 pb-3 text-xs">
                <div>
                  <span className="text-luxury-text-secondary">Order </span>
                  <span className="font-mono font-bold text-vamika-charcoal">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-luxury-text-secondary ml-3">
                    Placed on {order.dateTime ? new Date(order.dateTime).toLocaleDateString("en-IN") : "Recent"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      order.paymentStatus === "SUCCEEDED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-luxury-bg text-vamika-charcoal border border-luxury-border">
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items in Order */}
              <div className="divide-y divide-luxury-border/30">
                {order.products?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.product?.mainImage && (
                        <img
                          src={item.product.mainImage}
                          alt={item.product.title}
                          className="w-12 h-12 object-cover rounded border border-luxury-border"
                        />
                      )}
                      <div>
                        <div className="font-serif font-semibold text-vamika-charcoal">
                          {item.product?.title || "Haute Joaillerie Piece"}
                        </div>
                        <div className="text-[11px] text-luxury-text-secondary">
                          Quantity: {item.quantity} • ₹{item.priceAtPurchase.toLocaleString("en-IN")} each
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-luxury-gold">
                      ₹{(item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Actions & Summary Footer */}
              <div className="pt-3 border-t border-luxury-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-luxury-text-secondary">Total: </span>
                  <span className="font-mono font-bold text-base text-vamika-charcoal">
                    ₹{order.total.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Download Invoice Button */}
                  <button
                    onClick={() => handleViewInvoice(order.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-luxury-border text-vamika-charcoal hover:border-luxury-gold text-xs font-semibold bg-white transition-colors cursor-pointer"
                  >
                    <FaFileInvoiceDollar className="text-luxury-gold" />
                    <span>GST Invoice</span>
                  </button>

                  {/* Return / RMA Initiation Button */}
                  <button
                    onClick={() => setSelectedOrderForReturn(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-luxury-border text-vamika-charcoal hover:border-rose-400 hover:text-rose-700 text-xs font-semibold bg-white transition-colors cursor-pointer"
                  >
                    <FaRotateLeft className="text-rose-500" />
                    <span>Request Return / RMA</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center space-y-3">
          <FaBagShopping className="mx-auto text-3xl text-luxury-gold/50" />
          <h2 className="font-serif text-base text-vamika-charcoal">No past purchases found</h2>
          <p className="text-xs text-luxury-text-secondary max-w-sm mx-auto">
            Your vault is currently empty. Explore our bespoke fine jewellery collections and make your first acquisition.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-block px-5 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold font-semibold text-xs tracking-wider uppercase hover:bg-black transition-colors"
            >
              Browse Collections
            </Link>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {selectedOrderForReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-luxury-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-luxury-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FaRotateLeft className="text-rose-600" />
                <h3 className="font-serif font-semibold text-base text-vamika-charcoal">
                  Request Insured Return / Exchange
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForReturn(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaXmark />
              </button>
            </div>

            <p className="text-xs text-luxury-text-secondary leading-relaxed">
              Order <strong>#{selectedOrderForReturn.id.slice(0, 8).toUpperCase()}</strong>. Returns are eligible within 15 days of delivery for pieces with intact tamper-proof seal and original certificate.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-vamika-charcoal mb-1">
                  Reason for Return / Exchange:
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border text-vamika-charcoal bg-white focus:outline-none focus:border-luxury-gold"
                >
                  <option value="">Select reason...</option>
                  <option value="Size mismatch - Ring / Bangle adjustment">Size mismatch - Ring / Bangle adjustment</option>
                  <option value="Changed mind / Exchange for different design">Changed mind / Exchange for different design</option>
                  <option value="Item condition inspection guarantee">Item condition inspection guarantee</option>
                  <option value="Other / Concierge consultation">Other / Concierge consultation</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="exchangeRequested"
                  checked={exchangeRequested}
                  onChange={(e) => setExchangeRequested(e.target.checked)}
                  className="rounded border-luxury-border text-luxury-gold focus:ring-luxury-gold"
                />
                <label htmlFor="exchangeRequested" className="text-vamika-charcoal font-medium">
                  I would like to exchange this for store credit / replacement design
                </label>
              </div>

              <div className="pt-3 border-t border-luxury-border/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForReturn(null)}
                  className="px-3.5 py-2 rounded-lg border border-luxury-border font-semibold text-xs text-luxury-text-secondary hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn || !returnReason}
                  className="px-4 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold font-semibold text-xs tracking-wider uppercase hover:bg-black transition-colors disabled:opacity-50"
                >
                  {submittingReturn ? "Submitting..." : "Submit Return Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GST Tax Invoice Viewer Modal */}
      {invoiceData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-luxury-border shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-luxury-border/60 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-luxury-gold">Official GST Tax Invoice</span>
                <h3 className="font-serif font-bold text-lg text-vamika-charcoal">{invoiceData.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setInvoiceData(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaXmark size={18} />
              </button>
            </div>

            {/* Seller & Buyer Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-luxury-border/40">
              <div>
                <div className="font-bold text-vamika-charcoal uppercase text-[10px]">Seller Details:</div>
                <div className="font-semibold text-vamika-charcoal">{invoiceData.seller.legalName}</div>
                <div className="text-luxury-text-secondary">GSTIN: {invoiceData.seller.gstin}</div>
                <div className="text-luxury-text-secondary">State: {invoiceData.seller.stateCode}</div>
                <div className="text-[10px] text-luxury-text-secondary mt-1">{invoiceData.seller.address}</div>
              </div>
              <div>
                <div className="font-bold text-vamika-charcoal uppercase text-[10px]">Buyer / Bill To:</div>
                <div className="font-semibold text-vamika-charcoal">{invoiceData.buyer.name}</div>
                <div className="text-luxury-text-secondary">{invoiceData.buyer.email}</div>
                <div className="text-luxury-text-secondary">{invoiceData.buyer.phone}</div>
                <div className="text-[10px] text-luxury-text-secondary mt-1">{invoiceData.buyer.billingAddress}</div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-luxury-border text-luxury-text-secondary uppercase text-[10px]">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">HSN</th>
                    <th className="py-2 text-center">Purity / Metal</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/30">
                  {invoiceData.items.map((i: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-vamika-charcoal">{i.description}</td>
                      <td className="py-2.5 text-center font-mono">{i.hsnCode}</td>
                      <td className="py-2.5 text-center text-luxury-text-secondary">{i.metalType} • {i.purity}</td>
                      <td className="py-2.5 text-center">{i.quantity}</td>
                      <td className="py-2.5 text-right font-mono font-bold">₹{i.amount.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax Computation Summary */}
            <div className="bg-luxury-bg/50 p-4 rounded-xl border border-luxury-border/40 text-xs space-y-1.5">
              <div className="flex justify-between text-luxury-text-secondary">
                <span>Taxable Amount (Pre-GST):</span>
                <span className="font-mono">₹{invoiceData.taxSummary.taxableAmount.toLocaleString("en-IN")}</span>
              </div>
              {invoiceData.taxSummary.cgst && (
                <div className="flex justify-between text-luxury-text-secondary">
                  <span>CGST (1.5%):</span>
                  <span className="font-mono">₹{invoiceData.taxSummary.cgst.amount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {invoiceData.taxSummary.sgst && (
                <div className="flex justify-between text-luxury-text-secondary">
                  <span>SGST (1.5%):</span>
                  <span className="font-mono">₹{invoiceData.taxSummary.sgst.amount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {invoiceData.taxSummary.igst && (
                <div className="flex justify-between text-luxury-text-secondary">
                  <span>IGST (3.0%):</span>
                  <span className="font-mono">₹{invoiceData.taxSummary.igst.amount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-vamika-charcoal pt-2 border-t border-luxury-border">
                <span>Net Total Payable:</span>
                <span className="font-mono text-luxury-gold">₹{invoiceData.taxSummary.netPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Compliance Note */}
            <div className="text-[10px] text-luxury-text-secondary italic space-y-1 border-t border-luxury-border/40 pt-3">
              {invoiceData.complianceDeclarations.map((dec: string, idx: number) => (
                <p key={idx}>• {dec}</p>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold font-semibold text-xs tracking-wider uppercase hover:bg-black transition-colors cursor-pointer"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
