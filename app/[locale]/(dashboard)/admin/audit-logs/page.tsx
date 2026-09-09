"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaScroll,
  FaShieldHalved,
  FaFilter,
  FaMagnifyingGlass,
  FaLock,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface AuditLogItem {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.auditLogs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Governance & <span className="text-luxury-gold">Immutable Audit Logs</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Complete compliance trail of price edits, order cancellations, refunds, and stock movements.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <FaShieldHalved />
          <span>Tamper-Resistant Ledger</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-luxury-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-bg/60 text-luxury-text-secondary uppercase font-semibold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Operator / Actor</th>
                <th className="py-3.5 px-4">Action Performed</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Entity ID</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-luxury-text-secondary">
                    Retrieving audit trail...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-vamika-ivory/50 transition-colors">
                    <td className="py-4 px-4 text-luxury-text-secondary font-mono">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 font-semibold text-vamika-charcoal">
                      {log.actorId}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-luxury-gold bg-luxury-gold/10 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-vamika-charcoal">
                      {log.entityType}
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-luxury-text-secondary">
                      {log.entityId.slice(0, 16)}...
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-luxury-text-secondary">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-luxury-text-secondary">
                    No audit records registered yet.
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
