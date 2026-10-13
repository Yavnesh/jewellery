"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaShieldHalved,
  FaRotate,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`);
      const data = await res.json();
      setLogs(data.auditLogs || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalLogs(data.pagination.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

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

        <div className="flex items-center gap-3">
          {/* Page Size Selector: 20, 50, 100 */}
          <div className="flex items-center gap-1.5 bg-white border border-luxury-border px-2.5 py-1.5 rounded-lg text-xs">
            <span className="text-luxury-text-secondary font-medium">Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-transparent font-semibold text-vamika-charcoal focus:outline-none cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <FaShieldHalved />
            <span>Tamper-Resistant Ledger</span>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 border border-luxury-border rounded-lg bg-white hover:bg-slate-50 text-luxury-text-secondary cursor-pointer"
            title="Refresh logs"
          >
            <FaRotate size={12} />
          </button>
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-luxury-border bg-luxury-bg/30 flex flex-col sm:flex-row items-center justify-between text-xs text-luxury-text-secondary gap-3">
          <div>
            Showing{" "}
            <strong>
              {totalLogs === 0 ? 0 : (page - 1) * limit + 1}
            </strong>{" "}
            to{" "}
            <strong>
              {Math.min(page * limit, totalLogs)}
            </strong>{" "}
            of <strong>{totalLogs.toLocaleString()}</strong> audit entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded bg-white border border-luxury-border disabled:opacity-40 hover:bg-luxury-bg transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded bg-white border border-luxury-border disabled:opacity-40 hover:bg-luxury-bg transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
