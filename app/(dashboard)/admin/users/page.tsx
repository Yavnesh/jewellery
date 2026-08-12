"use client";
import { CustomButton, DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { nanoid } from "nanoid";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";

const DashboardUsers = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    apiClient.get("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
      });
  }, []);

  return (
    <div className="bg-luxury-bg min-h-screen flex max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex-1 p-8 max-xl:p-4">
        
        <div className="bg-white rounded-lg shadow-sm border border-luxury-border p-6">
          <div className="flex justify-between items-center mb-6 border-b border-luxury-border/50 pb-4">
            <h1 className="text-2xl font-serif text-vamika-charcoal">All Users</h1>
            <Link href="/admin/users/new">
              <CustomButton
                buttonType="button"
                customWidth="160px"
                paddingX={20}
                paddingY={10}
                textSize="sm"
                text="Add New User"
              />
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-luxury-border">
                  <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">User</th>
                  <th className="py-4 px-4 font-serif text-sm text-luxury-text-secondary uppercase tracking-wider font-medium">Role</th>
                  <th className="py-4 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={nanoid()} className="border-b border-luxury-border/30 hover:bg-vamika-ivory/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <FaUserCircle className="text-luxury-gold/50 text-3xl" />
                          <p className="font-medium text-vamika-charcoal tracking-wide">{user?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase ${
                          user?.role === "admin" 
                            ? "bg-purple-50 text-purple-600 border border-purple-200" 
                            : "bg-blue-50 text-blue-600 border border-blue-200"
                        }`}>
                          {user?.role || "user"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/users/${user?.id}`}
                          className="text-xs font-medium tracking-widest uppercase text-luxury-gold hover:text-luxury-gold-dark transition-colors border border-luxury-gold hover:bg-luxury-gold/5 px-4 py-2 rounded"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-luxury-text-secondary">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardUsers;
