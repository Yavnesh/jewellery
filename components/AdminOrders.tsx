"use client";

// *********************
// Role of the component: Component that displays all orders on admin dashboard page
// Name of the component: AdminOrders.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <AdminOrders />
// Input parameters: No input parameters
// Output: Table with all orders
// *********************

import React, { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      console.log('Fetching from URL:', apiClient.baseUrl + "/api/orders", "apiClient:", apiClient);
      const response = await apiClient.get("/api/orders");
      const data = await response.json();
      
      setOrders(data?.orders);
    };
    fetchOrders();
  }, []);

  return (
    <div className="flex-1 w-full bg-white rounded-lg shadow-sm border border-luxury-border p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-luxury-border/50 pb-4">
        <h1 className="text-2xl font-serif text-vamika-charcoal">All Orders</h1>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-luxury-border">
              <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Order ID</th>
              <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Customer</th>
              <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Status</th>
              <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Subtotal</th>
              <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Date</th>
              <th className="py-4 px-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order?.id} className="border-b border-luxury-border/30 hover:bg-vamika-ivory/30 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-medium text-vamika-charcoal tracking-wider">#{order?.id.substring(0, 8)}...</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-vamika-charcoal">{order?.name}</div>
                      <div className="text-xs text-luxury-text-secondary mt-1">{order?.country}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase ${
                      order?.status === "PAID" || order?.status === "DELIVERED" 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}>
                      {order?.status || "PENDING"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-luxury-gold">₹{order?.total}</p>
                  </td>
                  <td className="py-4 px-4 text-sm text-luxury-text-secondary">
                    {new Date(Date.parse(order?.dateTime)).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/admin/orders/${order?.id}`}
                      className="text-xs font-medium tracking-widest uppercase text-luxury-gold hover:text-luxury-gold-dark transition-colors border border-luxury-gold hover:bg-luxury-gold/5 px-4 py-2 rounded"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-luxury-text-secondary">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
