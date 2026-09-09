"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaArrowLeft,
  FaPrint,
  FaTruckFast,
  FaShieldHalved,
  FaIndianRupeeSign,
  FaBoxOpen,
  FaRotateLeft,
  FaEnvelope,
  FaPhone,
  FaUser,
  FaLocationDot,
  FaClock,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaCircleCheck,
  FaTriangleExclamation,
  FaEarthAmericas,
  FaCode,
  FaFileLines,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface ShipmentItemData {
  id: string;
  orderProductId: string;
  quantity: number;
  orderProduct?: {
    quantity: number;
    priceAtPurchase: number;
    product?: {
      title: string;
      mainImage: string;
      price: number;
    };
    variant?: {
      sku: string;
      title: string;
    };
  };
}

interface TrackingEventData {
  id: string;
  status: string;
  carrierStatus?: string;
  description: string;
  location?: string;
  eventAt: string;
  source: string;
}

interface ShipmentData {
  id: string;
  orderId: string;
  provider: string;
  providerShipmentId?: string;
  courier: string;
  service?: string;
  trackingNumber: string;
  status: string;
  previousStatus?: string;
  estimatedDeliveryAt?: string;
  estimatedDeliveryFrom?: string;
  estimatedDeliveryTo?: string;
  shippedAt?: string;
  deliveredAt?: string;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  packageCount?: number;
  insuranceValue?: number;
  signatureReq?: boolean;
  labelUrl?: string;
  customsInfo?: any;
  internalNotes?: string;
  humanStatus?: string;
  createdAt: string;
  events: TrackingEventData[];
  items: ShipmentItemData[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [customerStats, setCustomerStats] = useState<any>(null);
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderNotice, setOrderNotice] = useState("");
  const [saving, setSaving] = useState(false);

  // Create Shipment Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("BLUEDART");
  const [selectedService, setSelectedService] = useState("Apex Armored High-Value Transit");
  const [packageWeight, setPackageWeight] = useState("0.5");
  const [packageLength, setPackageLength] = useState("15");
  const [packageWidth, setPackageWidth] = useState("12");
  const [packageHeight, setPackageHeight] = useState("8");
  const [packageCount, setPackageCount] = useState("1");
  const [customTrackingNo, setCustomTrackingNo] = useState("");
  const [insuranceCover, setInsuranceCover] = useState("");
  const [selectedItemQuantities, setSelectedItemQuantities] = useState<Record<string, number>>({});
  const [creatingShipment, setCreatingShipment] = useState(false);

  // International Customs State
  const [hsCode, setHsCode] = useState("7113.19.00");
  const [declaredVal, setDeclaredVal] = useState("");
  const [exportReason, setExportReason] = useState("Commercial Sale");
  const [incoterm, setIncoterm] = useState("DDP");
  const [dutiesPayer, setDutiesPayer] = useState("SENDER");

  // Manual Event Modal State
  const [activeShipmentForEvent, setActiveShipmentForEvent] = useState<ShipmentData | null>(null);
  const [manualEventStatus, setManualEventStatus] = useState("IN_TRANSIT");
  const [manualEventDesc, setManualEventDesc] = useState("");
  const [manualEventLoc, setManualEventLoc] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  // Expanded technical info toggles per shipment
  const [expandedTech, setExpandedTech] = useState<Record<string, boolean>>({});

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const [orderRes, shipmentsRes] = await Promise.all([
        fetch(`/api/admin/orders/${orderId}`),
        fetch(`/api/admin/orders/${orderId}/shipments`),
      ]);

      if (orderRes.ok) {
        const data = await orderRes.json();
        setOrder(data.order);
        setCustomerStats(data.customerStats);
        setStatus(data.order?.status || "processing");
        setPaymentStatus(data.order?.paymentStatus || "PENDING");
        setOrderNotice(data.order?.orderNotice || "");
        setInsuranceCover(String(data.order?.total || ""));
        setDeclaredVal(String(data.order?.total || ""));

        // Initialize item quantities for shipment modal default
        const initialQty: Record<string, number> = {};
        data.order?.products?.forEach((p: any) => {
          initialQty[p.id] = p.quantity;
        });
        setSelectedItemQuantities(initialQty);
      }

      if (shipmentsRes.ok) {
        const shipData = await shipmentsRes.json();
        setShipments(shipData.shipments || []);
      }
    } catch (err) {
      toast.error("Network error fetching order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          orderNotice,
        }),
      });

      if (res.ok) {
        toast.success("Order status and notes updated");
        fetchOrderDetail();
      } else {
        toast.error("Failed to update order");
      }
    } catch (err) {
      toast.error("Update error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingShipment(true);
      const itemsPayload = Object.entries(selectedItemQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([orderProductId, quantity]) => ({ orderProductId, quantity }));

      if (itemsPayload.length === 0) {
        toast.error("Please select at least one item quantity to ship");
        setCreatingShipment(false);
        return;
      }

      const isInternational =
        order.country?.toUpperCase() !== "IN" &&
        order.country?.toUpperCase() !== "INDIA";

      const customsPayload = isInternational
        ? {
            originCountry: "India",
            hsCode,
            declaredValue: Number(declaredVal) || order.total,
            currency: "INR",
            exportReason,
            incoterm,
            dutiesPayer,
          }
        : undefined;

      let carrierLabel = "BlueDart Apex";
      if (selectedCarrier === "DHL") carrierLabel = "DHL Express";
      if (selectedCarrier === "FEDEX") carrierLabel = "FedEx";
      if (selectedCarrier === "SHIPROCKET") carrierLabel = "Shiprocket Logistics";

      const res = await fetch(`/api/admin/orders/${orderId}/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedCarrier,
          carrier: carrierLabel,
          service: selectedService,
          trackingNumber: customTrackingNo || undefined,
          weight: Number(packageWeight),
          length: Number(packageLength),
          width: Number(packageWidth),
          height: Number(packageHeight),
          packageCount: Number(packageCount),
          insuranceValue: Number(insuranceCover) || order.total,
          signatureReq: true,
          items: itemsPayload,
          customsInfo: customsPayload,
        }),
      });

      if (res.ok) {
        toast.success("Shipment created & AWB barcode assigned");
        setShowCreateModal(false);
        fetchOrderDetail();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to create shipment");
      }
    } catch (err) {
      toast.error("Shipment creation error");
    } finally {
      setCreatingShipment(false);
    }
  };

  const handleAddManualEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipmentForEvent) return;

    try {
      setSavingEvent(true);
      const res = await fetch(`/api/admin/shipments/${activeShipmentForEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: manualEventStatus,
          newEvent: {
            status: manualEventStatus,
            description: manualEventDesc,
            location: manualEventLoc,
            carrierStatus: "MANUAL_ADMIN_LOG",
          },
        }),
      });

      if (res.ok) {
        toast.success("Tracking timeline updated");
        setActiveShipmentForEvent(null);
        setManualEventDesc("");
        setManualEventLoc("");
        fetchOrderDetail();
      } else {
        toast.error("Failed to add tracking event");
      }
    } catch (err) {
      toast.error("Event update error");
    } finally {
      setSavingEvent(false);
    }
  };

  const toggleTechDetails = (shipmentId: string) => {
    setExpandedTech((prev) => ({ ...prev, [shipmentId]: !prev[shipmentId] }));
  };

  if (loading && !order) {
    return (
      <AdminAppShell>
        <div className="py-20 text-center text-luxury-text-secondary animate-pulse">
          Loading order lifecycle record...
        </div>
      </AdminAppShell>
    );
  }

  if (!order) {
    return (
      <AdminAppShell>
        <div className="py-20 text-center">
          <h2 className="text-xl font-serif text-vamika-charcoal mb-2">Order Not Found</h2>
          <Link href="/admin/orders" className="text-luxury-gold underline text-xs">
            Back to Orders List
          </Link>
        </div>
      </AdminAppShell>
    );
  }

  const isInternational =
    order.country?.toUpperCase() !== "IN" &&
    order.country?.toUpperCase() !== "INDIA";

  return (
    <AdminAppShell>
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-lg bg-white border border-luxury-border text-luxury-text-secondary hover:text-vamika-charcoal hover:border-luxury-gold transition-colors"
          >
            <FaArrowLeft size={13} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-vamika-charcoal">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.paymentStatus === "SUCCEEDED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {order.paymentStatus}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.status === "delivered" || order.status === "SHIPPED"
                    ? "bg-emerald-100 text-emerald-800"
                    : order.status === "PARTIALLY_SHIPPED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-luxury-text-secondary mt-0.5">
              Placed on {new Date(order.dateTime).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-luxury-border text-vamika-charcoal hover:border-luxury-gold shadow-2xs transition-colors"
          >
            <FaPrint size={12} className="text-luxury-gold" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-luxury-gold text-vamika-charcoal hover:bg-amber-400 shadow-xs transition-colors font-bold"
          >
            <FaPlus size={11} />
            <span>Create Shipment</span>
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black shadow-xs transition-colors disabled:opacity-50"
          >
            <span>{saving ? "Saving Changes..." : "Save Order"}</span>
          </button>
        </div>
      </div>

      {/* Main Order Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Delivery Shipments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Items */}
          <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal mb-4">
              Purchased Jewellery Items ({order.products?.length || 0})
            </h2>

            <div className="divide-y divide-luxury-border/50">
              {order.products?.map((item: any) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product?.mainImage || "/placeholder.jpg"}
                      alt={item.product?.title || "Item"}
                      className="w-14 h-14 rounded-lg object-cover border border-luxury-border"
                    />
                    <div>
                      <div className="text-xs font-semibold text-vamika-charcoal">
                        {item.product?.title || "Product"}
                      </div>
                      <div className="text-[11px] text-luxury-text-secondary mt-0.5">
                        SKU: <span className="font-mono text-luxury-gold font-semibold">{item.variant?.sku || "STD-SKU"}</span>
                      </div>
                      <div className="text-[10px] text-luxury-text-secondary">
                        Qty: {item.quantity} × ₹{(item.priceAtPurchase || item.product?.price || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-serif font-bold text-sm text-vamika-charcoal">
                    ₹{((item.priceAtPurchase || item.product?.price || 0) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="mt-4 pt-4 border-t border-luxury-border space-y-2 text-xs">
              <div className="flex justify-between text-luxury-text-secondary">
                <span>Subtotal</span>
                <span>₹{order.total?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-luxury-text-secondary">
                <span>Insured Armored Logistics Cover</span>
                <span className="text-emerald-600 font-semibold">Included (100% Transit Cover)</span>
              </div>
              <div className="flex justify-between text-luxury-text-secondary">
                <span>GST (3% Fine Jewellery Tax Included)</span>
                <span>₹{Math.round(order.total * 0.03).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-serif font-bold text-vamika-charcoal pt-2 border-t border-luxury-border/60">
                <span>Total Amount Settled</span>
                <span className="text-luxury-gold">₹{order.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* DEDICATED DELIVERY & SHIPMENT SECTION */}
          <div id="shipments" className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-luxury-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-luxury-gold/15 text-luxury-gold">
                  <FaTruckFast className="text-base" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                    Delivery & Shipment Tracking ({shipments.length})
                  </h2>
                  <p className="text-[11px] text-luxury-text-secondary">
                    Individual consignments, carrier milestones, and dispatch manifests.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vamika-charcoal text-luxury-gold text-xs font-semibold hover:bg-black transition-colors self-start sm:self-auto"
              >
                <FaPlus size={10} />
                <span>Add Shipment</span>
              </button>
            </div>

            {/* List of Shipments */}
            {shipments.length > 0 ? (
              <div className="space-y-6">
                {shipments.map((shipment, idx) => (
                  <div
                    key={shipment.id}
                    className="p-4 rounded-xl border border-luxury-border/80 bg-luxury-bg/30 space-y-4"
                  >
                    {/* Shipment Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-luxury-border/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-vamika-charcoal">
                            Shipment #{idx + 1}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-white border border-luxury-border text-luxury-gold">
                            {shipment.courier}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              shipment.status === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : shipment.status === "EXCEPTION" || shipment.status === "CUSTOMS_HOLD"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {shipment.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-luxury-text-secondary mt-1 flex items-center gap-3">
                          <span>
                            Tracking AWB: <strong className="font-mono text-vamika-charcoal">{shipment.trackingNumber}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            ETA: {shipment.estimatedDeliveryAt ? new Date(shipment.estimatedDeliveryAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Delivery estimate unavailable"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveShipmentForEvent(shipment);
                            setManualEventStatus(shipment.status);
                          }}
                          className="px-2.5 py-1 rounded bg-white border border-luxury-border text-vamika-charcoal hover:border-luxury-gold text-xs font-semibold transition-colors"
                        >
                          Add Tracking Event
                        </button>
                        {shipment.labelUrl && (
                          <a
                            href={shipment.labelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gold hover:text-vamika-charcoal text-xs font-semibold transition-colors"
                          >
                            Label
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Shipment Assigned Items */}
                    {shipment.items && shipment.items.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-luxury-border text-xs space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-luxury-text-secondary mb-1">
                          Consignment Package Items ({shipment.items.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {shipment.items.map((itm) => (
                            <span
                              key={itm.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-luxury-bg border border-luxury-border text-vamika-charcoal text-xs"
                            >
                              <span>{itm.orderProduct?.product?.title || "Item"}</span>
                              <strong className="text-luxury-gold">×{itm.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Visual Chronological Timeline */}
                    <div className="bg-white p-4 rounded-lg border border-luxury-border space-y-3">
                      <div className="text-xs font-semibold text-vamika-charcoal flex items-center justify-between">
                        <span>Carrier Milestone Timeline</span>
                        <span className="text-[11px] text-luxury-text-secondary font-normal">
                          {shipment.events?.length || 0} event(s) recorded
                        </span>
                      </div>

                      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-luxury-gold/30">
                        {shipment.events?.map((ev, eIdx) => (
                          <div key={ev.id || eIdx} className="relative group text-xs">
                            <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-luxury-gold ring-4 ring-white" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="font-semibold text-vamika-charcoal">
                                {ev.description}
                              </span>
                              <span className="text-[10px] text-luxury-text-secondary">
                                {new Date(ev.eventAt).toLocaleString("en-IN")}
                              </span>
                            </div>
                            {ev.location && (
                              <div className="text-[11px] text-luxury-text-secondary flex items-center gap-1 mt-0.5">
                                <FaLocationDot className="text-luxury-gold text-[10px]" />
                                <span>{ev.location}</span>
                                {ev.carrierStatus && (
                                  <span className="ml-2 font-mono text-[9px] px-1 bg-gray-100 rounded text-gray-600">
                                    {ev.carrierStatus}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expandable Technical Details */}
                    <div className="border-t border-luxury-border/60 pt-2">
                      <button
                        onClick={() => toggleTechDetails(shipment.id)}
                        className="flex items-center justify-between w-full text-[11px] text-luxury-text-secondary hover:text-vamika-charcoal py-1 font-semibold"
                      >
                        <span className="flex items-center gap-1.5">
                          <FaCode className="text-luxury-gold text-xs" />
                          Technical & Webhook Diagnostics
                        </span>
                        {expandedTech[shipment.id] ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                      </button>

                      {expandedTech[shipment.id] && (
                        <div className="mt-2 p-3 rounded bg-luxury-bg text-[11px] font-mono space-y-1.5 text-vamika-charcoal border border-luxury-border">
                          <div>Provider: <strong>{shipment.provider}</strong></div>
                          <div>Provider Shipment ID: <strong>{shipment.providerShipmentId || "N/A"}</strong></div>
                          <div>Tracking Number: <strong>{shipment.trackingNumber}</strong></div>
                          <div>Package Specs: {shipment.weight}kg ({shipment.length}×{shipment.width}×{shipment.height} cm)</div>
                          <div>Webhook Sync Status: <span className="text-emerald-600 font-bold">Healthy (Idempotency Active)</span></div>
                          {shipment.customsInfo && (
                            <div className="pt-1.5 border-t border-luxury-border text-[10px]">
                              <div>HS Code: {shipment.customsInfo.hsCode || "N/A"}</div>
                              <div>Declared Export Value: ₹{shipment.customsInfo.declaredValue?.toLocaleString()} ({shipment.customsInfo.currency || "INR"})</div>
                              <div>Incoterm: {shipment.customsInfo.incoterm} • Duties: {shipment.customsInfo.dutiesPayer}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-luxury-bg/40 rounded-xl border border-dashed border-luxury-border p-6 space-y-3">
                <FaBoxOpen className="text-3xl text-luxury-gold/50 mx-auto" />
                <h3 className="font-serif font-semibold text-vamika-charcoal text-sm">
                  No Shipment Created Yet
                </h3>
                <p className="text-xs text-luxury-text-secondary max-w-sm mx-auto">
                  Assign a shipping carrier (BlueDart, DHL, FedEx) and generate tracking AWB for this order.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold text-xs font-semibold hover:bg-black transition-colors"
                >
                  Create First Shipment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Client Dossier & Order Controls */}
        <div className="space-y-6">
          {/* Order Lifecycle Controls */}
          <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4 text-xs">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Order Lifecycle State
            </h2>

            <div>
              <label className="block text-luxury-text-secondary mb-1 font-semibold">Fulfillment State</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal font-medium focus:border-luxury-gold"
              >
                <option value="processing">Processing / In Vault</option>
                <option value="PARTIALLY_SHIPPED">Partially Shipped</option>
                <option value="SHIPPED">Fully Shipped</option>
                <option value="delivered">Delivered to Client</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-luxury-text-secondary mb-1 font-semibold">Payment Settlement</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal font-medium focus:border-luxury-gold"
              >
                <option value="PENDING">Pending Verification</option>
                <option value="SUCCEEDED">Succeeded / Captured</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Payment Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-luxury-text-secondary mb-1 font-semibold">Internal Concierge Notes</label>
              <textarea
                rows={3}
                value={orderNotice}
                onChange={(e) => setOrderNotice(e.target.value)}
                placeholder="Add special packaging notes, armored security codes, or client delivery remarks..."
                className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal focus:border-luxury-gold"
              />
            </div>
          </div>

          {/* Client Dossier */}
          <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4 text-xs">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Client Dossier
            </h2>

            <div className="flex items-center gap-3 pb-3 border-b border-luxury-border">
              <div className="w-10 h-10 rounded-full bg-luxury-gold/15 text-luxury-gold flex items-center justify-center font-bold text-sm">
                {order.name?.[0]}
                {order.lastname?.[0]}
              </div>
              <div>
                <div className="font-semibold text-sm text-vamika-charcoal">
                  {order.name} {order.lastname}
                </div>
                <div className="text-[11px] text-luxury-gold font-medium">VIP Tier Client</div>
              </div>
            </div>

            <div className="space-y-2.5 text-luxury-text-secondary">
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-luxury-gold" />
                <span className="text-vamika-charcoal">{order.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaPhone className="text-luxury-gold" />
                <span className="text-vamika-charcoal">{order.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <FaLocationDot className="text-luxury-gold mt-0.5 shrink-0" />
                <span className="text-vamika-charcoal">
                  {order.adress}, {order.apartment ? `${order.apartment}, ` : ""}
                  {order.city}, {order.postalCode}, {order.country}
                </span>
              </div>
            </div>

            {/* Lifetime Client Stats */}
            {customerStats && (
              <div className="pt-3 border-t border-luxury-border grid grid-cols-2 gap-2 text-center bg-luxury-bg p-2 rounded-lg">
                <div>
                  <div className="text-[10px] uppercase text-luxury-text-secondary">Total Orders</div>
                  <div className="font-bold text-vamika-charcoal text-sm">{customerStats.orderCount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-luxury-text-secondary">Lifetime Value</div>
                  <div className="font-bold text-luxury-gold text-sm">₹{customerStats.totalSpent?.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE SHIPMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-luxury-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-luxury-border">
              <div>
                <h3 className="text-lg font-serif font-bold text-vamika-charcoal">
                  Create Consignment Shipment
                </h3>
                <p className="text-luxury-text-secondary text-xs">
                  Generate courier tracking, package dimensions, and partial shipment allocations.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-luxury-text-secondary hover:text-vamika-charcoal font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4">
              {/* Carrier Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">
                    Shipping Provider / Carrier
                  </label>
                  <select
                    value={selectedCarrier}
                    onChange={(e) => {
                      setSelectedCarrier(e.target.value);
                      if (e.target.value === "DHL") setSelectedService("Express Worldwide");
                      else if (e.target.value === "FEDEX") setSelectedService("International Priority");
                      else if (e.target.value === "BLUEDART") setSelectedService("Apex Armored High-Value Transit");
                      else setSelectedService("Standard Express");
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal font-medium focus:border-luxury-gold"
                  >
                    <option value="BLUEDART">BlueDart Apex (Armored High-Value Transit)</option>
                    <option value="DHL">DHL Express (Global Priority)</option>
                    <option value="FEDEX">FedEx International Priority</option>
                    <option value="SHIPROCKET">Shiprocket Multi-Carrier Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">
                    Service Level
                  </label>
                  <input
                    type="text"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-medium focus:border-luxury-gold"
                  />
                </div>
              </div>

              {/* Partial Items Allocation */}
              <div className="bg-luxury-bg p-3.5 rounded-xl border border-luxury-border space-y-2">
                <label className="block text-vamika-charcoal font-bold">
                  Select Items for This Consignment (Supports Partial Shipment)
                </label>
                <div className="space-y-2">
                  {order.products?.map((prod: any) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-2 rounded bg-white border border-luxury-border/80"
                    >
                      <div className="truncate max-w-[280px]">
                        <div className="font-semibold text-vamika-charcoal truncate">{prod.product?.title || "Item"}</div>
                        <div className="text-[10px] text-luxury-text-secondary">Ordered Qty: {prod.quantity}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-luxury-text-secondary font-medium">Ship:</span>
                        <input
                          type="number"
                          min="0"
                          max={prod.quantity}
                          value={selectedItemQuantities[prod.id] || 0}
                          onChange={(e) =>
                            setSelectedItemQuantities({
                              ...selectedItemQuantities,
                              [prod.id]: Math.min(prod.quantity, Math.max(0, parseInt(e.target.value) || 0)),
                            })
                          }
                          className="w-16 px-2 py-1 rounded border border-luxury-border text-center font-bold text-vamika-charcoal"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Length (cm)</label>
                  <input
                    type="number"
                    value={packageLength}
                    onChange={(e) => setPackageLength(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={packageWidth}
                    onChange={(e) => setPackageWidth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-luxury-text-secondary font-semibold mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={packageHeight}
                    onChange={(e) => setPackageHeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                  />
                </div>
              </div>

              {/* Optional Custom Tracking Number Override */}
              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Custom AWB / Barcode (Leave blank for automatic carrier generation)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BD-SEC-981249"
                  value={customTrackingNo}
                  onChange={(e) => setCustomTrackingNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-mono"
                />
              </div>

              {/* International Customs Declaration (if international order) */}
              {isInternational && (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <FaEarthAmericas className="text-indigo-600" />
                    <span>International Customs Declaration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-indigo-900 font-semibold mb-1">HS Code</label>
                      <input
                        type="text"
                        value={hsCode}
                        onChange={(e) => setHsCode(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-indigo-200 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-indigo-900 font-semibold mb-1">Declared Value (INR)</label>
                      <input
                        type="number"
                        value={declaredVal}
                        onChange={(e) => setDeclaredVal(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-indigo-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-indigo-900 font-semibold mb-1">Incoterm</label>
                      <select
                        value={incoterm}
                        onChange={(e) => setIncoterm(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-indigo-200 bg-white text-xs"
                      >
                        <option value="DDP">DDP (Delivered Duty Paid)</option>
                        <option value="DAP">DAP (Delivered At Place)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-luxury-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal hover:bg-luxury-bg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingShipment}
                  className="px-5 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black font-semibold disabled:opacity-50"
                >
                  {creatingShipment ? "Generating Dispatch..." : "Generate Shipment & Label"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MANUAL TRACKING EVENT MODAL */}
      {activeShipmentForEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-luxury-border w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-luxury-border">
              <h3 className="text-base font-serif font-bold text-vamika-charcoal">
                Add Tracking Milestone Event
              </h3>
              <button
                onClick={() => setActiveShipmentForEvent(null)}
                className="text-luxury-text-secondary hover:text-vamika-charcoal font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualEvent} className="space-y-3">
              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  New Status
                </label>
                <select
                  value={manualEventStatus}
                  onChange={(e) => setManualEventStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal font-medium"
                >
                  <option value="LABEL_CREATED">Label Created</option>
                  <option value="PICKED_UP">Picked Up by Carrier</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="CUSTOMS_CLEARANCE">Customs Clearance Processing</option>
                  <option value="CUSTOMS_HOLD">Customs Hold / Duties Required</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered to Recipient</option>
                  <option value="EXCEPTION">Delivery Exception</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Milestone Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Package arrived at Frankfurt Gateway"
                  value={manualEventDesc}
                  onChange={(e) => setManualEventDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                />
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">
                  Location (City, Facility, Country)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frankfurt Hub, Germany"
                  value={manualEventLoc}
                  onChange={(e) => setManualEventLoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                />
              </div>

              <div className="pt-3 border-t border-luxury-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveShipmentForEvent(null)}
                  className="px-4 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal hover:bg-luxury-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="px-4 py-2 rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black font-semibold disabled:opacity-50"
                >
                  {savingEvent ? "Recording..." : "Record Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
