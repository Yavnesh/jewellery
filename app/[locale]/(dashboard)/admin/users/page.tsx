"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import { FaCircleUser, FaShieldHalved, FaPlus } from "react-icons/fa6";
import toast from "react-hot-toast";



export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers?limit=50");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.customers || []);
      }
    } catch (err) {
      toast.error("Failed to load staff & users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Staff, Users & <span className="text-luxury-gold">Role-Based Access</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Manage authenticated accounts, concierge operators, and operational staff permissions.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4">User Account</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Total Orders</th>
                <th className="py-3.5 px-4">Lifetime Spend</th>
                <th className="py-3.5 px-4 text-right">Access Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-luxury-text-secondary">
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-luxury-gold/15 text-luxury-gold font-bold flex items-center justify-center text-xs">
                          {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-vamika-charcoal">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-[11px] text-luxury-text-secondary">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-luxury-text-secondary">{user.phone}</td>
                    <td className="py-4 px-4 font-bold text-vamika-charcoal">{user.orderCount} orders</td>
                    <td className="py-4 px-4 font-serif font-bold text-luxury-gold">
                      ₹{user.totalSpent?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {user.role || "User"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-luxury-text-secondary">
                    No accounts found.
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
