"use client";

import React, { useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaGear,
  FaCreditCard,
  FaTruckFast,
  FaShieldHalved,
  FaBell,
  FaCheck,
  FaGlobe,
} from "react-icons/fa6";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("Vamika Luxe Haute Joaillerie");
  const [supportEmail, setSupportEmail] = useState("concierge@vamika.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [currency, setCurrency] = useState("INR");
  const [taxRate, setTaxRate] = useState("3.0"); // 3% Gold GST
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [skydoEnabled, setSkydoEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Store configuration saved successfully");
    }, 400);
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Store Governance & <span className="text-luxury-gold">Settings</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Configure payment gateways, tax calculation, shipping logistics, and security policies.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-vamika-charcoal text-luxury-gold hover:bg-black shadow-xs transition-colors disabled:opacity-50"
        >
          <FaCheck size={12} />
          <span>{saving ? "Updating Store..." : "Save Settings"}</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Left 2 Cols: General & Financial */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Store Identity */}
          <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Store Profile & Concierge Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-medium"
                />
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-white text-vamika-charcoal"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="AED">AED (د.إ - UAE Dirham)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">Concierge Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                />
              </div>

              <div>
                <label className="block text-luxury-text-secondary font-semibold mb-1">Concierge Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal"
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <FaCreditCard className="text-luxury-gold" />
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Integrated Payment Gateways
              </h2>
            </div>

            <div className="space-y-3">
              {/* Razorpay */}
              <div className="p-3.5 rounded-lg border border-luxury-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-vamika-charcoal">Razorpay Enterprise (Domestic Cards, UPI, Netbanking)</div>
                  <div className="text-[11px] text-luxury-text-secondary">Direct webhook verification & instant settlement</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={razorpayEnabled}
                    onChange={(e) => setRazorpayEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-luxury-gold"></div>
                </label>
              </div>

              {/* Skydo */}
              <div className="p-3.5 rounded-lg border border-luxury-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-vamika-charcoal">Skydo International Wire & FX</div>
                  <div className="text-[11px] text-luxury-text-secondary">Cross-border export payments & compliance invoices</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skydoEnabled}
                    onChange={(e) => setSkydoEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-luxury-gold"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Taxes & Armored Delivery */}
        <div className="space-y-6">
          {/* Taxes & Hallmarking */}
          <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Tax & GST Rules
            </h2>

            <div>
              <label className="block text-luxury-text-secondary font-semibold mb-1">
                Jewellery GST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-luxury-border bg-luxury-bg text-vamika-charcoal font-bold"
              />
              <p className="text-[10px] text-luxury-text-secondary mt-1">
                Standard Indian GST for Precious Metals & Articles is 3.0%
              </p>
            </div>
          </div>

          {/* Insured Shipping */}
          <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <FaTruckFast className="text-luxury-gold" />
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Integrated Carrier Logistics
              </h2>
            </div>

            <div className="space-y-3">
              {/* BlueDart */}
              <div className="p-3 rounded-lg border border-luxury-border bg-luxury-bg/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-vamika-charcoal">BlueDart Apex Secured</div>
                  <div className="text-[10px] text-emerald-600 font-bold">● Connected (Default)</div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-luxury-border text-vamika-charcoal">
                  Armored
                </span>
              </div>

              {/* DHL */}
              <div className="p-3 rounded-lg border border-luxury-border bg-luxury-bg/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-vamika-charcoal">DHL Express Worldwide</div>
                  <div className="text-[10px] text-emerald-600 font-bold">● Connected (Live API)</div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-luxury-border text-vamika-charcoal">
                  Cross-Border
                </span>
              </div>

              {/* FedEx */}
              <div className="p-3 rounded-lg border border-luxury-border bg-luxury-bg/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-vamika-charcoal">FedEx International</div>
                  <div className="text-[10px] text-emerald-600 font-bold">● Connected</div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-luxury-border text-vamika-charcoal">
                  Priority
                </span>
              </div>

              {/* Shiprocket */}
              <div className="p-3 rounded-lg border border-luxury-border bg-luxury-bg/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-vamika-charcoal">Shiprocket Multi-Carrier</div>
                  <div className="text-[10px] text-emerald-600 font-bold">● Connected (Hub Sync)</div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-luxury-border text-vamika-charcoal">
                  Aggregator
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
