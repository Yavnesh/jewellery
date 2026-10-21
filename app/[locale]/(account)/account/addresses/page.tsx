"use client";

import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaMapPin,
  FaPhone,
  FaPencil,
  FaTrashCan,
  FaStar,
  FaXmark,
  FaCheck,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface Address {
  id: string;
  label?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    label: "Home",
    firstName: "",
    lastName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: "IN",
    isDefault: false,
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customer/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      } else {
        toast.error("Failed to load saved addresses");
      }
    } catch (err) {
      toast.error("Network error while loading addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      label: "Home",
      firstName: "",
      lastName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      countryCode: "IN",
      isDefault: addresses.length === 0,
    });
    setModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({
      label: addr.label || "Home",
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      countryCode: addr.countryCode || "IN",
      isDefault: addr.isDefault,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingAddress
        ? `/api/customer/addresses/${editingAddress.id}`
        : "/api/customer/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          editingAddress ? "Address updated successfully" : "New address saved"
        );
        setModalOpen(false);
        fetchAddresses();
      } else {
        toast.error(data.error || "Failed to save address");
      }
    } catch (err) {
      toast.error("Error saving address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Address deleted");
        fetchAddresses();
      } else {
        toast.error("Failed to delete address");
      }
    } catch (err) {
      toast.error("Error deleting address");
    }
  };

  const handleSetDefault = async (addr: Address) => {
    if (addr.isDefault) return;
    try {
      const res = await fetch(`/api/customer/addresses/${addr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        toast.success("Default shipping address updated");
        fetchAddresses();
      }
    } catch (err) {
      toast.error("Failed to set default address");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-serif font-medium text-gray-900">Saved Addresses</h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage your delivery and billing addresses for seamless checkout.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-vamika-charcoal text-luxury-ivory hover:bg-black transition-colors text-xs font-semibold shadow-xs"
        >
          <FaPlus size={11} />
          <span>Add New Address</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-pulse h-44 bg-gray-100 rounded-lg" />
          <div className="animate-pulse h-44 bg-gray-100 rounded-lg" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <FaMapPin className="mx-auto text-gray-400 mb-3" size={28} />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No Saved Addresses</h3>
          <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
            Add your primary residence or work address so your jewellery orders can be dispatched directly.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-luxury-gold text-vamika-charcoal hover:bg-amber-600 hover:text-white transition-colors text-xs font-semibold shadow-xs"
          >
            <FaPlus size={11} />
            <span>Add Your First Address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-lg border transition-all relative flex flex-col justify-between ${
                addr.isDefault
                  ? "border-luxury-gold/50 bg-luxury-gold/5 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">
                      {addr.firstName} {addr.lastName}
                    </span>
                    {addr.label && (
                      <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-gray-100 text-gray-600">
                        {addr.label}
                      </span>
                    )}
                  </div>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-luxury-gold text-vamika-charcoal">
                      <FaStar size={9} /> Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {addr.line1}
                  {addr.line2 && <>, {addr.line2}</>}
                  <br />
                  {addr.city}, {addr.state} - {addr.postalCode}
                  <br />
                  {addr.countryCode}
                </p>

                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                  <FaPhone size={10} className="text-gray-400" />
                  <span>{addr.phone}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr)}
                    className="text-luxury-gold hover:underline font-medium text-[11px]"
                  >
                    Set as default
                  </button>
                ) : (
                  <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                    <FaCheck size={10} /> Primary Address
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="text-gray-600 hover:text-gray-900 transition-colors p-1"
                    title="Edit address"
                  >
                    <FaPencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Delete address"
                  >
                    <FaTrashCan size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                {editingAddress ? "Edit Shipping Address" : "Add New Address"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaXmark size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Address Label (e.g., Home, Office, Studio)
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  placeholder="Home"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Address Line 1 (House/Flat No, Building, Street) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.line1}
                  onChange={(e) =>
                    setFormData({ ...formData, line1: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  placeholder="12/A, Emerald Enclave"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Address Line 2 (Area, Landmark, Sector)
                </label>
                <input
                  type="text"
                  value={formData.line2}
                  onChange={(e) =>
                    setFormData({ ...formData, line2: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  placeholder="Near Diamond Market"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-luxury-gold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="rounded border-gray-300 text-luxury-gold focus:ring-luxury-gold"
                />
                <label htmlFor="isDefault" className="text-gray-700 select-none">
                  Make this my default shipping address
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-luxury-gold text-vamika-charcoal hover:bg-amber-600 hover:text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
