"use client";

import React, { useEffect, useState } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import {
  FaHeartPulse,
  FaDatabase,
  FaServer,
  FaArrowsRotate,
  FaTriangleExclamation,
  FaCircleCheck,
  FaEnvelope,
  FaCreditCard,
  FaClockRotateLeft,
  FaShieldHalved,
  FaPlay,
} from "react-icons/fa6";
import toast from "react-hot-toast";

interface TelemetryData {
  systemStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  uptimeSeconds: number;
  timestamp: string;
  responseTimeMs: number;
  database: {
    status: string;
    latencyMs: number;
  };
  queues: {
    outbox: {
      pending: number;
      failed: number;
      processed: number;
      deadLetters: any[];
    };
    webhooks: {
      pending: number;
      failed: number;
      processed: number;
      recentFailures: any[];
    };
  };
  inventoryReservations: {
    totalReservedQuantity: number;
    stuckExpiredOrders: number;
  };
  environment: {
    nodeEnv: string;
    cronSecretConfigured: boolean;
    sentryConfigured: boolean;
  };
}

export default function AdminObservabilityPage() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/observability");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Failed to load system observability telemetry");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while pinging telemetry service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, id?: string) => {
    try {
      setRetrying(id || action);
      const res = await fetch("/api/admin/observability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Action executed successfully");
        fetchTelemetry();
      } else {
        toast.error(result.error || "Action failed");
      }
    } catch (err) {
      toast.error("Error sending action request");
    } finally {
      setRetrying(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal flex items-center gap-2.5">
            <FaHeartPulse className="text-luxury-gold" />
            System Health & <span className="text-luxury-gold">Observability</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Real-time background worker queues, transactional outbox status, payment webhooks, and database latency.
          </p>
        </div>

        <button
          onClick={fetchTelemetry}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-luxury-border text-vamika-charcoal hover:border-luxury-gold shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <FaArrowsRotate className={loading ? "animate-spin text-luxury-gold" : "text-luxury-gold"} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Top Level Status Banners */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Status */}
        <div className="bg-white rounded-xl border border-luxury-border p-4 shadow-xs">
          <div className="text-xs text-luxury-text-secondary font-medium uppercase tracking-wider mb-1">
            System Overall
          </div>
          <div className="flex items-center gap-2">
            {data?.systemStatus === "HEALTHY" ? (
              <FaCircleCheck className="text-emerald-500 text-lg" />
            ) : data?.systemStatus === "DEGRADED" ? (
              <FaTriangleExclamation className="text-amber-500 text-lg" />
            ) : (
              <FaTriangleExclamation className="text-rose-500 text-lg" />
            )}
            <span className="font-serif font-bold text-lg text-vamika-charcoal">
              {data?.systemStatus || "CHECKING..."}
            </span>
          </div>
          <div className="text-[11px] text-luxury-text-secondary mt-1">
            Response time: <span className="font-mono">{data?.responseTimeMs ?? "—"}ms</span>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white rounded-xl border border-luxury-border p-4 shadow-xs">
          <div className="text-xs text-luxury-text-secondary font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Database</span>
            <FaDatabase className="text-luxury-gold text-xs" />
          </div>
          <div className="font-serif font-bold text-lg text-vamika-charcoal">
            {data?.database.status || "—"}
          </div>
          <div className="text-[11px] text-luxury-text-secondary mt-1">
            Ping Latency: <span className="font-mono font-bold text-vamika-charcoal">{data?.database.latencyMs ?? "—"}ms</span>
          </div>
        </div>

        {/* Process Uptime */}
        <div className="bg-white rounded-xl border border-luxury-border p-4 shadow-xs">
          <div className="text-xs text-luxury-text-secondary font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Engine Uptime</span>
            <FaServer className="text-luxury-gold text-xs" />
          </div>
          <div className="font-serif font-bold text-lg text-vamika-charcoal">
            {data ? formatUptime(data.uptimeSeconds) : "—"}
          </div>
          <div className="text-[11px] text-luxury-text-secondary mt-1">
            Env: <span className="font-mono uppercase font-semibold">{data?.environment.nodeEnv}</span>
          </div>
        </div>

        {/* Security Gates */}
        <div className="bg-white rounded-xl border border-luxury-border p-4 shadow-xs">
          <div className="text-xs text-luxury-text-secondary font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Security Gates</span>
            <FaShieldHalved className="text-luxury-gold text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                data?.environment.cronSecretConfigured
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {data?.environment.cronSecretConfigured ? "CRON PROTECTED" : "CRON UNPROTECTED"}
            </span>
          </div>
          <div className="text-[11px] text-luxury-text-secondary mt-1">
            Sentry DSN: <span className="font-mono">{data?.environment.sentryConfigured ? "Configured" : "None"}</span>
          </div>
        </div>
      </div>

      {/* Queue Telemetry: Outbox & Payment Webhooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outbox Notifications Queue */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-luxury-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FaEnvelope className="text-luxury-gold" />
              <h2 className="font-serif font-semibold text-sm text-vamika-charcoal">
                Outbox Notification Queue (Emails & Dispatches)
              </h2>
            </div>
            {data && data.queues.outbox.failed > 0 && (
              <button
                onClick={() => handleAction("RETRY_ALL_FAILED_OUTBOX")}
                disabled={retrying === "RETRY_ALL_FAILED_OUTBOX"}
                className="text-[11px] font-bold text-luxury-gold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FaPlay size={9} /> Retry All Failed
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-luxury-border/40 rounded-lg p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-luxury-text-secondary">Pending</div>
              <div className="text-lg font-mono font-bold text-amber-600">
                {data?.queues.outbox.pending ?? 0}
              </div>
            </div>
            <div className="bg-slate-50 border border-luxury-border/40 rounded-lg p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-luxury-text-secondary">Processed</div>
              <div className="text-lg font-mono font-bold text-emerald-600">
                {data?.queues.outbox.processed ?? 0}
              </div>
            </div>
            <div className="bg-slate-50 border border-luxury-border/40 rounded-lg p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-luxury-text-secondary">Failed</div>
              <div className="text-lg font-mono font-bold text-rose-600">
                {data?.queues.outbox.failed ?? 0}
              </div>
            </div>
          </div>

          {/* Dead Letters List */}
          <div>
            <div className="text-xs font-semibold text-vamika-charcoal mb-2">
              Failed / Max Attempts Dead-Letter Records:
            </div>
            {data?.queues.outbox.deadLetters && data.queues.outbox.deadLetters.length > 0 ? (
              <div className="space-y-2">
                {data.queues.outbox.deadLetters.map((dl: any) => (
                  <div
                    key={dl.id}
                    className="p-2.5 rounded bg-rose-50/50 border border-rose-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-rose-900">{dl.eventType} #{dl.id.slice(0, 8)}</div>
                      <div className="text-[11px] text-rose-700 truncate max-w-xs">{dl.lastError || "Unknown error"}</div>
                      <div className="text-[10px] text-luxury-text-secondary">Attempts: {dl.attempts}</div>
                    </div>
                    <button
                      onClick={() => handleAction("RETRY_OUTBOX_EVENT", dl.id)}
                      disabled={retrying === dl.id}
                      className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 rounded font-semibold text-[10px] hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      {retrying === dl.id ? "Retrying..." : "Reset & Retry"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-luxury-text-secondary py-3 text-center italic">
                No failed dead-letter notifications.
              </p>
            )}
          </div>
        </div>

        {/* Incoming Payment Webhooks Queue */}
        <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-luxury-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FaCreditCard className="text-luxury-gold" />
              <h2 className="font-serif font-semibold text-sm text-vamika-charcoal">
                Incoming Payment Webhooks
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-luxury-border/40 rounded-lg p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-luxury-text-secondary">Pending In Queue</div>
              <div className="text-lg font-mono font-bold text-amber-600">
                {data?.queues.webhooks.pending ?? 0}
              </div>
            </div>
            <div className="bg-slate-50 border border-luxury-border/40 rounded-lg p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-luxury-text-secondary">Processed</div>
              <div className="text-lg font-mono font-bold text-emerald-600">
                {data?.queues.webhooks.processed ?? 0}
              </div>
            </div>
            <div className="bg-slate-50 border border-luxury-border/40 rounded-lg p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-luxury-text-secondary">Failed</div>
              <div className="text-lg font-mono font-bold text-rose-600">
                {data?.queues.webhooks.failed ?? 0}
              </div>
            </div>
          </div>

          {/* Webhook Failure Records */}
          <div>
            <div className="text-xs font-semibold text-vamika-charcoal mb-2">
              Recent Failed Webhook Payloads:
            </div>
            {data?.queues.webhooks.recentFailures && data.queues.webhooks.recentFailures.length > 0 ? (
              <div className="space-y-2">
                {data.queues.webhooks.recentFailures.map((wf: any) => (
                  <div
                    key={wf.id}
                    className="p-2.5 rounded bg-amber-50/60 border border-amber-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-vamika-charcoal">{wf.provider} #{wf.id.slice(0, 8)}</div>
                      <div className="text-[10px] text-luxury-text-secondary">
                        Logged: {new Date(wf.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction("RETRY_WEBHOOK_EVENT", wf.id)}
                      disabled={retrying === wf.id}
                      className="px-2.5 py-1 bg-white border border-amber-300 text-amber-800 rounded font-semibold text-[10px] hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      {retrying === wf.id ? "Requeuing..." : "Re-queue"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-luxury-text-secondary py-3 text-center italic">
                All incoming payment webhooks processed cleanly.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Reservation Health */}
      <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-luxury-border/60 pb-3 mb-4">
          <FaClockRotateLeft className="text-luxury-gold" />
          <h2 className="font-serif font-semibold text-sm text-vamika-charcoal">
            Cart Stock Reservations & Lock Telemetry
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-luxury-bg border border-luxury-border/50">
            <div className="text-xs text-luxury-text-secondary font-medium">
              Active Reserved Pieces in Live Customer Carts
            </div>
            <div className="text-xl font-mono font-bold text-luxury-gold mt-1">
              {data?.inventoryReservations.totalReservedQuantity ?? 0} units
            </div>
            <p className="text-[11px] text-luxury-text-secondary mt-1">
              Stock temporarily held during checkout to prevent duplicate purchases.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-luxury-bg border border-luxury-border/50">
            <div className="text-xs text-luxury-text-secondary font-medium">
              Stuck Unpaid Orders (&gt;15 mins) Awaiting Auto-Release Daemon
            </div>
            <div className="text-xl font-mono font-bold text-vamika-charcoal mt-1">
              {data?.inventoryReservations.stuckExpiredOrders ?? 0} orders
            </div>
            <p className="text-[11px] text-luxury-text-secondary mt-1">
              Scheduled release daemon restores stock to active inventory every 5 minutes.
            </p>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
