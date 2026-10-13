"use client";

import React, { useState, useEffect } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import { Link } from "@/i18n/routing";
import {
  FaDatabase,
  FaShieldHalved,
  FaLock,
  FaLockOpen,
  FaCheck,
  FaXmark,
  FaCodeCompare,
  FaLayerGroup,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaRotate,
  FaCircleCheck,
  FaCircleExclamation,
} from "react-icons/fa6";
import toast from "react-hot-toast";

// Helper: check if a proposed field value is actually different from live value
const isFieldModified = (val: any) => {
  if (!val || typeof val !== "object") return false;
  if (val.changed !== undefined) return Boolean(val.changed);
  const o = val.old;
  const n = val.new;
  if (o === n) return false;
  const isOEmpty = o === null || o === undefined || o === "";
  const isNEmpty = n === null || n === undefined || n === "";
  if (isOEmpty && isNEmpty) return false;

  if (typeof o === "number" || typeof n === "number") {
    const numO = o !== null && o !== undefined && o !== "" ? Number(o) : null;
    const numN = n !== null && n !== undefined && n !== "" ? Number(n) : null;
    if (numO === numN) return false;
    if (isNaN(numO as any) && isNaN(numN as any)) return false;
    return numO !== numN;
  }

  return String(o ?? "").trim() !== String(n ?? "").trim();
};

// Helper: format field value nicely without hardcoding ₹ on strings or stock numbers
const formatFieldValue = (fieldName: string, value: any, categoryList: { id: string; name: string }[] = []) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numVal = Number(value);
  if (fieldName === "price" || fieldName === "originalPrice") {
    if (!isNaN(numVal)) {
      return `₹${numVal.toLocaleString("en-IN")}`;
    }
  }

  if (fieldName === "discountPercentage" || fieldName === "discount") {
    if (!isNaN(numVal)) {
      return `${numVal}%`;
    }
  }

  if (fieldName === "inStock") {
    if (!isNaN(numVal)) {
      return `${numVal} unit${numVal !== 1 ? "s" : ""}`;
    }
  }

  if (fieldName === "weight") {
    if (!isNaN(numVal)) {
      return `${numVal} g`;
    }
  }

  if (fieldName === "categoryId") {
    const matched = categoryList.find((c) => c.id === String(value));
    if (matched) return `${matched.name} (${String(value).slice(0, 8)}...)`;
  }

  return String(value);
};

// Helper: user-friendly label for product fields
const getFieldLabel = (fieldName: string) => {
  const map: Record<string, string> = {
    title: "Product Title",
    price: "Selling Price",
    originalPrice: "Original List Price",
    inStock: "Stock Quantity",
    purity: "Purity / Karat",
    metalType: "Metal Type",
    weight: "Gross Weight",
    categoryId: "Category",
    description: "Description",
    occasion: "Occasion",
    collection: "Collection",
    discountPercentage: "Discount %",
    verificationStatus: "Verification Status",
  };
  return map[fieldName] || fieldName;
};

// Helper: compute delta difference for numeric fields
const getDelta = (fieldName: string, oldVal: any, newVal: any) => {
  if (fieldName === "price" || fieldName === "originalPrice") {
    const diff = Number(newVal) - Number(oldVal);
    if (!isNaN(diff) && diff !== 0) {
      return diff > 0 ? `+₹${diff.toLocaleString("en-IN")}` : `-₹${Math.abs(diff).toLocaleString("en-IN")}`;
    }
  }
  if (fieldName === "inStock") {
    const diff = Number(newVal) - Number(oldVal);
    if (!isNaN(diff) && diff !== 0) {
      return diff > 0 ? `+${diff} units` : `${diff} units`;
    }
  }
  if (fieldName === "weight") {
    const diff = Number(newVal) - Number(oldVal);
    if (!isNaN(diff) && diff !== 0) {
      return diff > 0 ? `+${diff} g` : `${diff} g`;
    }
  }
  return null;
};

interface ChangeRequestItem {
  id: string;
  requestType: string;
  scope: string;
  status: string;
  reason: string;
  submittedAt: string;
  requestedBy: { email: string };
  reviewedBy?: { email: string };
  reviewNotes?: string;
  items: {
    id: string;
    productId: string;
    fieldChanges: string;
    product: {
      id: string;
      title: string;
      price: number;
      originalPrice?: number;
    };
  }[];
}

export default function DatabaseGovernancePage() {
  const [activeTab, setActiveTab] = useState<"requests" | "bulk">("requests");

  // Elevated DBA Session State
  const [isElevated, setIsElevated] = useState(false);
  const [elevatedLoading, setElevatedLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dbaPassword, setDbaPassword] = useState("");

  // Change Proposals State & Pagination
  const [proposals, setProposals] = useState<ChangeRequestItem[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ChangeRequestItem | null>(null);
  const [diffViewMode, setDiffViewMode] = useState<"changed" | "all">("changed");
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(null);
  const [pendingBatchAction, setPendingBatchAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [proposalPage, setProposalPage] = useState(1);
  const [proposalPageSize, setProposalPageSize] = useState<number>(20);

  // Bulk Operations State
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkDiscountPct, setBulkDiscountPct] = useState("10");
  const [bulkPreview, setBulkPreview] = useState<any>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    checkElevatedStatus();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchProposals();
    }
  }, [activeTab]);

  const checkElevatedStatus = async () => {
    try {
      const res = await fetch("/api/admin/database/auth");
      const data = await res.json();
      setIsElevated(!!data.isElevated);
    } catch {
      setIsElevated(false);
    }
  };

  const handleElevateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setElevatedLoading(true);
    try {
      const res = await fetch("/api/admin/database/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: dbaPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Elevation failed");
      } else {
        toast.success("Database Administrator access unlocked");
        setIsElevated(true);
        setAuthModalOpen(false);
        setDbaPassword("");

        // If batch or single approval was waiting on elevation, execute automatically
        if (pendingBatchAction && selectedProposalIds.length > 0) {
          const act = pendingBatchAction;
          setPendingBatchAction(null);
          await handleBatchEvaluateWithIds(selectedProposalIds, act);
        } else if (pendingProposalId) {
          const propIdToApprove = pendingProposalId;
          setPendingProposalId(null);
          await handleBatchEvaluateWithIds([propIdToApprove], "APPROVE");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setElevatedLoading(false);
    }
  };

  const handleRevokeElevation = async () => {
    try {
      await fetch("/api/admin/database/auth", { method: "DELETE" });
      setIsElevated(false);
      toast.success("Returned to Read-Only / Proposer mode");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch {}
  };

  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      const res = await fetch("/api/admin/database/proposals");
      const data = await res.json();
      if (data.requests) setProposals(data.requests);
    } catch {
      toast.error("Failed to load change proposals");
    } finally {
      setLoadingProposals(false);
    }
  };

  // Evaluate One or Multiple Proposals (DBA only)
  const handleBatchEvaluateWithIds = async (ids: string[], action: "APPROVE" | "REJECT") => {
    if (ids.length === 0) return;
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/admin/database/proposals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestIds: ids, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to process proposals");
      } else {
        toast.success(
          data.message ||
            `Successfully ${action === "APPROVE" ? "approved & verified" : "rejected"} ${ids.length} proposal(s).`
        );
        setSelectedProposalIds((prev) => prev.filter((id) => !ids.includes(id)));
        setSelectedProposal(null);
        setPendingProposalId(null);
        setPendingBatchAction(null);
        fetchProposals();
      }
    } catch {
      toast.error("Error processing proposals");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEvaluateProposal = async (requestId: string, action: "APPROVE" | "REJECT") => {
    if (action === "APPROVE" && !isElevated) {
      setPendingProposalId(requestId);
      setAuthModalOpen(true);
      return;
    }
    await handleBatchEvaluateWithIds([requestId], action);
  };

  const handleBatchEvaluate = async (action: "APPROVE" | "REJECT") => {
    if (selectedProposalIds.length === 0) {
      toast.error("Please select at least one proposal");
      return;
    }
    if (action === "APPROVE" && !isElevated) {
      setPendingBatchAction("APPROVE");
      setAuthModalOpen(true);
      return;
    }
    await handleBatchEvaluateWithIds(selectedProposalIds, action);
  };

  // Bulk Discount Preview
  const handlePreviewBulk = async () => {
    if (!bulkCategory) {
      toast.error("Please select a category");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/database/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewOnly: true,
          scope: "CATEGORY",
          categoryId: bulkCategory,
          discountPercentage: bulkDiscountPct,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Preview failed");
      } else {
        setBulkPreview(data);
      }
    } catch {
      toast.error("Failed to generate preview");
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk Discount Execute (DBA only)
  const handleExecuteBulk = async () => {
    if (!isElevated) {
      setAuthModalOpen(true);
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/database/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewOnly: false,
          scope: "CATEGORY",
          categoryId: bulkCategory,
          discountPercentage: bulkDiscountPct,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Bulk execution failed");
      } else {
        toast.success(data.message || "Bulk operation completed!");
        setBulkPreview(null);
      }
    } catch {
      toast.error("Failed to execute bulk operation");
    } finally {
      setBulkLoading(false);
    }
  };

  // Paginated proposals
  const paginatedProposals = proposals.slice(
    (proposalPage - 1) * proposalPageSize,
    proposalPage * proposalPageSize
  );
  const totalProposalPages = Math.max(1, Math.ceil(proposals.length / proposalPageSize));

  const currentPendingProposals = paginatedProposals.filter((p) => p.status === "PENDING");
  const isAllCurrentPendingSelected =
    currentPendingProposals.length > 0 &&
    currentPendingProposals.every((p) => selectedProposalIds.includes(p.id));

  const handleToggleSelectAll = () => {
    const pendingIds = currentPendingProposals.map((p) => p.id);
    if (isAllCurrentPendingSelected) {
      setSelectedProposalIds((prev) => prev.filter((id) => !pendingIds.includes(id)));
    } else {
      setSelectedProposalIds((prev) => Array.from(new Set([...prev, ...pendingIds])));
    }
  };

  const handleToggleProposal = (id: string) => {
    setSelectedProposalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <AdminAppShell>
      <div className="space-y-6">
        {/* Module Header & Access Control Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-luxury-gold/20 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-luxury-gold/10 text-luxury-gold">
                <FaDatabase className="text-xl" />
              </span>
              <h1 className="text-2xl font-serif font-bold text-vamika-charcoal">
                Database Governance & Approvals
              </h1>
            </div>
            <p className="text-xs text-luxury-text-secondary mt-1">
              Dual-tier proposal evaluation, atomic schema adjustments, and transactional category pricing operations.
            </p>
          </div>

          {/* Access Mode Pill */}
          <div className="flex items-center gap-3">
            {isElevated ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <FaLockOpen className="text-emerald-600" />
                  <span>DBA Mode (Elevated Write Access)</span>
                </div>
                <button
                  onClick={handleRevokeElevation}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer"
                >
                  Exit Mode
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
                  <FaLock className="text-slate-400" />
                  <span>Proposer Mode (Read-Only)</span>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-vamika-charcoal text-luxury-gold hover:bg-black px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Elevate Privileges
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Link Notice to Products Verification */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-luxury-gold/5 border border-luxury-gold/20 rounded-xl gap-3">
          <div className="text-xs text-vamika-charcoal">
            <span className="font-bold">Catalog Verification Queue moved:</span> Product inspection, image thumbnails, and field edits now live on the dedicated <strong>Products Verification page</strong>.
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vamika-charcoal text-luxury-gold hover:bg-black rounded-lg text-xs font-semibold transition shrink-0"
          >
            Go to Products Queue
            <FaArrowRight size={10} />
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-luxury-border gap-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "requests"
                ? "border-b-2 border-luxury-gold text-vamika-charcoal"
                : "text-luxury-text-secondary hover:text-vamika-charcoal"
            }`}
          >
            <FaCodeCompare />
            Change Proposals & Approval Queue ({proposals.length})
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`pb-3 text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "bulk"
                ? "border-b-2 border-luxury-gold text-vamika-charcoal"
                : "text-luxury-text-secondary hover:text-vamika-charcoal"
            }`}
          >
            <FaLayerGroup />
            Category Bulk Discount Studio
          </button>
        </div>

        {/* TAB 1: CHANGE PROPOSALS & APPROVAL QUEUE */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {/* Multi-Select Floating / Sticky Bulk Action Toolbar */}
            {selectedProposalIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-vamika-charcoal text-white rounded-xl shadow-lg border border-luxury-gold/30 animate-fade-in gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-luxury-gold animate-ping" />
                  <span className="text-xs font-semibold">
                    <strong className="text-luxury-gold font-bold">{selectedProposalIds.length}</strong> proposal{selectedProposalIds.length > 1 ? "s" : ""} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedProposalIds([])}
                    className="text-xs text-slate-300 hover:text-white underline cursor-pointer ml-1"
                  >
                    Clear selection
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => handleBatchEvaluate("REJECT")}
                    className="px-3.5 py-1.5 bg-rose-700/90 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <FaXmark size={12} />
                    Reject Selected ({selectedProposalIds.length})
                  </button>

                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => handleBatchEvaluate("APPROVE")}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <FaCheck size={12} />
                    {isElevated
                      ? `Approve Selected (${selectedProposalIds.length})`
                      : `Elevate & Approve (${selectedProposalIds.length})`}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-luxury-border">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-luxury-text-secondary">
                  Total Proposals: <strong>{proposals.length}</strong>
                </span>
                {selectedProposalIds.length > 0 && (
                  <span className="text-xs bg-luxury-gold/15 text-vamika-charcoal px-2.5 py-0.5 rounded-full font-bold">
                    {selectedProposalIds.length} selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* 20, 50, 100 Pagination limit dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-luxury-border px-2.5 py-1.5 rounded-lg text-xs">
                  <span className="text-luxury-text-secondary font-medium">Show:</span>
                  <select
                    value={proposalPageSize}
                    onChange={(e) => {
                      setProposalPageSize(Number(e.target.value));
                      setProposalPage(1);
                    }}
                    className="bg-transparent font-semibold text-vamika-charcoal focus:outline-none cursor-pointer"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <button
                  onClick={fetchProposals}
                  className="p-2 border border-luxury-border rounded-lg hover:bg-slate-50 text-luxury-text-secondary cursor-pointer"
                  title="Refresh proposals"
                >
                  <FaRotate />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-luxury-border overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-luxury-sand/20 border-b border-luxury-border text-luxury-text-secondary uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPendingSelected}
                        onChange={handleToggleSelectAll}
                        disabled={currentPendingProposals.length === 0}
                        className="rounded border-slate-300 text-luxury-gold focus:ring-luxury-gold cursor-pointer"
                        title={
                          currentPendingProposals.length > 0
                            ? "Select / deselect all pending proposals on this page"
                            : "No pending proposals on this page"
                        }
                      />
                    </th>
                    <th className="py-3 px-4">Proposal Info</th>
                    <th className="py-3 px-4">Scope & Action</th>
                    <th className="py-3 px-4">Submitter & Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/60">
                  {loadingProposals ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-luxury-text-secondary">
                        Loading change proposals...
                      </td>
                    </tr>
                  ) : paginatedProposals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-luxury-text-secondary">
                        No proposals found in queue.
                      </td>
                    </tr>
                  ) : (
                    paginatedProposals.map((req) => (
                      <tr
                        key={req.id}
                        className={`hover:bg-slate-50/70 transition ${
                          selectedProposalIds.includes(req.id) ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          {req.status === "PENDING" ? (
                            <input
                              type="checkbox"
                              checked={selectedProposalIds.includes(req.id)}
                              onChange={() => handleToggleProposal(req.id)}
                              className="rounded border-slate-300 text-luxury-gold focus:ring-luxury-gold cursor-pointer"
                              aria-label={`Select proposal ${req.id}`}
                            />
                          ) : (
                            <span className="text-slate-300 select-none text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {req.id.slice(0, 8)}
                          <p className="text-[10px] text-luxury-text-secondary font-sans mt-0.5">
                            {new Date(req.submittedAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-vamika-charcoal">{req.requestType}</span>
                          <p className="text-[10px] text-luxury-text-secondary">{req.scope}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-vamika-charcoal">{req.requestedBy?.email}</p>
                          <p className="text-xs text-luxury-text-secondary italic line-clamp-1 mt-0.5">
                            &ldquo;{req.reason}&rdquo;
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : req.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedProposal(req)}
                              className="px-2.5 py-1 bg-vamika-charcoal text-luxury-gold hover:bg-black rounded text-[11px] font-semibold transition cursor-pointer"
                              title="Inspect proposal diff details"
                            >
                              Inspect Diff
                            </button>
                            {req.status === "PENDING" && (
                              <>
                                <button
                                  disabled={isEvaluating}
                                  onClick={() => handleEvaluateProposal(req.id, "APPROVE")}
                                  className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded text-xs transition cursor-pointer disabled:opacity-50 border border-emerald-200"
                                  title={isElevated ? "Quick Approve & Apply to DB" : "Elevate & Quick Approve"}
                                >
                                  <FaCheck size={11} />
                                </button>
                                <button
                                  disabled={isEvaluating}
                                  onClick={() => handleEvaluateProposal(req.id, "REJECT")}
                                  className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded text-xs transition cursor-pointer disabled:opacity-50 border border-rose-200"
                                  title="Quick Reject"
                                >
                                  <FaXmark size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Proposals Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-luxury-border bg-slate-50/50 text-xs text-luxury-text-secondary gap-3">
                <div>
                  Showing{" "}
                  <strong>
                    {proposals.length === 0 ? 0 : (proposalPage - 1) * proposalPageSize + 1}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {Math.min(proposalPage * proposalPageSize, proposals.length)}
                  </strong>{" "}
                  of <strong>{proposals.length}</strong> proposals
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={proposalPage <= 1 || loadingProposals}
                    onClick={() => setProposalPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 border border-luxury-border rounded-md hover:bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <FaChevronLeft size={11} />
                  </button>

                  <span className="px-2">
                    Page <strong>{proposalPage}</strong> of <strong>{totalProposalPages}</strong>
                  </span>

                  <button
                    disabled={proposalPage >= totalProposalPages || loadingProposals}
                    onClick={() => setProposalPage((p) => Math.min(totalProposalPages, p + 1))}
                    className="p-1.5 border border-luxury-border rounded-md hover:bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <FaChevronRight size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY BULK DISCOUNT STUDIO */}
        {activeTab === "bulk" && (
          <div className="bg-white p-6 rounded-2xl border border-luxury-border space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-vamika-charcoal">
                Bulk Category Pricing & Verification Engine
              </h2>
              <p className="text-xs text-luxury-text-secondary mt-1">
                Calculate percentage discounts accurately (Selling Price = Original Price × (1 - Discount / 100)) and apply updates inside transactional batches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-vamika-charcoal mb-1">
                  1. Target Category
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-luxury-border rounded-lg focus:ring-1 focus:ring-luxury-gold bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vamika-charcoal mb-1">
                  2. Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bulkDiscountPct}
                  onChange={(e) => setBulkDiscountPct(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-luxury-border rounded-lg focus:ring-1 focus:ring-luxury-gold"
                  placeholder="e.g. 10"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handlePreviewBulk}
                  disabled={bulkLoading}
                  className="w-full py-2 bg-luxury-sand/30 hover:bg-luxury-sand/60 text-vamika-charcoal font-semibold text-xs rounded-lg transition cursor-pointer border border-luxury-border"
                >
                  {bulkLoading ? "Calculating Preview..." : "Simulate & Preview Impact"}
                </button>
              </div>
            </div>

            {/* Preview Simulation Table */}
            {bulkPreview && (
              <div className="mt-6 space-y-4 border-t border-luxury-border pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-vamika-charcoal">
                      Simulation Summary:
                    </span>
                    <span className="text-xs bg-luxury-gold/10 text-luxury-gold px-2.5 py-0.5 rounded-full font-bold">
                      {bulkPreview.summary.totalMatched} products affected
                    </span>
                  </div>

                  <button
                    onClick={handleExecuteBulk}
                    disabled={bulkLoading}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <FaCheck />
                    {isElevated ? "Execute Atomic Bulk Update" : "Elevate & Execute"}
                  </button>
                </div>

                <div className="border border-luxury-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-luxury-sand/20 border-b border-luxury-border text-luxury-text-secondary uppercase">
                        <th className="py-2.5 px-4">Sample Product</th>
                        <th className="py-2.5 px-4 font-mono">Original Price</th>
                        <th className="py-2.5 px-4 font-mono">Current Price</th>
                        <th className="py-2.5 px-4 font-mono text-emerald-700">Proposed New Price</th>
                        <th className="py-2.5 px-4">Verification Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-luxury-border/60">
                      {bulkPreview.previewSample.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-semibold text-vamika-charcoal">{item.title}</td>
                          <td className="py-2.5 px-4 font-mono">₹{item.currentOriginalPrice}</td>
                          <td className="py-2.5 px-4 font-mono">₹{item.currentPrice}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">₹{item.newPrice}</td>
                          <td className="py-2.5 px-4">
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                              Verified by DBA
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: ELEVATE DBA ACCESS */}
        {authModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-luxury-gold/30">
              <div className="flex items-center gap-2 text-vamika-charcoal mb-4">
                <FaShieldHalved className="text-luxury-gold text-xl" />
                <h3 className="font-serif font-bold text-lg">
                  {pendingBatchAction
                    ? `Authorize Batch Approval (${selectedProposalIds.length} proposals)`
                    : pendingProposalId
                    ? "Authorize Proposal Approval"
                    : "Elevated DBA Authentication"}
                </h3>
              </div>
              <p className="text-xs text-luxury-text-secondary mb-4">
                {pendingBatchAction
                  ? `Enter your administrator password or DBA passkey to unlock elevated mode and verify all ${selectedProposalIds.length} selected proposals directly into the database.`
                  : pendingProposalId
                  ? "Enter your administrator password or DBA passkey to unlock elevated mode and apply this proposal directly to the catalog."
                  : "Enter your administrative password or master DBA passkey to unlock direct database mutations and approvals."}
              </p>

              <form onSubmit={handleElevateSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-vamika-charcoal mb-1">
                    Administrator / DBA Password
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={dbaPassword}
                    onChange={(e) => setDbaPassword(e.target.value)}
                    placeholder="Enter admin password..."
                    className="w-full px-3 py-2 text-xs border border-luxury-border rounded-lg focus:outline-none focus:ring-1 focus:ring-luxury-gold"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      setPendingProposalId(null);
                      setPendingBatchAction(null);
                    }}
                    className="px-3 py-1.5 text-xs text-luxury-text-secondary hover:text-vamika-charcoal cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={elevatedLoading}
                    className="px-4 py-2 text-xs font-bold bg-vamika-charcoal text-luxury-gold hover:bg-black rounded-lg transition cursor-pointer"
                  >
                    {elevatedLoading
                      ? "Authorizing..."
                      : pendingBatchAction
                      ? `Unlock & Approve ${selectedProposalIds.length} Proposals`
                      : pendingProposalId
                      ? "Unlock & Approve Proposal"
                      : "Unlock Elevated Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: INSPECT PROPOSAL DIFF */}
        {selectedProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-2xl border border-luxury-border flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex justify-between items-start pb-4 border-b border-luxury-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-luxury-gold/10 text-luxury-gold">
                      <FaCodeCompare className="text-base" />
                    </span>
                    <h3 className="font-serif font-bold text-lg text-vamika-charcoal">
                      Proposal Inspection #{selectedProposal.id.slice(0, 8)}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedProposal.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedProposal.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedProposal.status}
                    </span>
                  </div>
                  <p className="text-xs text-luxury-text-secondary mt-1">
                    Submitted by <strong className="text-vamika-charcoal">{selectedProposal.requestedBy?.email}</strong> on{" "}
                    {new Date(selectedProposal.submittedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-luxury-text-secondary mt-0.5">
                    Reason: <span className="italic font-medium text-vamika-charcoal">&ldquo;{selectedProposal.reason}&rdquo;</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="text-luxury-text-secondary hover:text-vamika-charcoal p-1 cursor-pointer"
                >
                  <FaXmark size={16} />
                </button>
              </div>

              {/* Items Diff Container */}
              <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
                {selectedProposal.items.map((it) => {
                  let parsed: Record<string, { old: any; new: any; changed?: boolean }> = {};
                  try {
                    parsed = JSON.parse(it.fieldChanges);
                  } catch {}

                  const allKeys = Object.keys(parsed);
                  const changedKeys = allKeys.filter((k) => isFieldModified(parsed[k]));
                  const unchangedKeys = allKeys.filter((k) => !isFieldModified(parsed[k]));
                  const hasChanges = changedKeys.length > 0;

                  return (
                    <div key={it.id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                      {/* Product Header & Diff Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div>
                          <p className="font-semibold text-sm text-vamika-charcoal">{it.product?.title}</p>
                          <p className="text-[10px] text-luxury-text-secondary font-mono mt-0.5">
                            Product ID: {it.productId} · Scope: {selectedProposal.scope}
                          </p>
                        </div>

                        {/* View Mode Switcher */}
                        <div className="flex items-center gap-1.5 bg-white border border-luxury-border p-1 rounded-lg text-xs self-start sm:self-auto shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setDiffViewMode("changed")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                              diffViewMode === "changed"
                                ? "bg-vamika-charcoal text-luxury-gold shadow-xs"
                                : "text-luxury-text-secondary hover:text-vamika-charcoal"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${hasChanges ? "bg-amber-400 animate-pulse" : "bg-slate-400"}`} />
                            Modified Only ({changedKeys.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiffViewMode("all")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              diffViewMode === "all"
                                ? "bg-vamika-charcoal text-luxury-gold shadow-xs"
                                : "text-luxury-text-secondary hover:text-vamika-charcoal"
                            }`}
                          >
                            All Fields ({allKeys.length})
                          </button>
                        </div>
                      </div>

                      {/* Summary Banner of what changed */}
                      {hasChanges ? (
                        <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-2">
                          <FaCircleExclamation className="text-amber-600 mt-0.5 shrink-0 text-sm" />
                          <div className="flex-1">
                            <span className="font-bold">
                              {changedKeys.length} {changedKeys.length === 1 ? "field" : "fields"} modified in this proposal:
                            </span>{" "}
                            <span className="font-medium text-amber-800">
                              {changedKeys.map((k) => getFieldLabel(k)).join(", ")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                          <FaCircleCheck className="text-emerald-600 shrink-0" />
                          <span>No values differ between the current record and the proposed update.</span>
                        </div>
                      )}

                      {/* MODIFIED ONLY VIEW */}
                      {diffViewMode === "changed" && (
                        <div className="space-y-2.5">
                          {hasChanges ? (
                            changedKeys.map((field) => {
                              const change = parsed[field];
                              const oldFormatted = formatFieldValue(field, change.old, categories);
                              const newFormatted = formatFieldValue(field, change.new, categories);
                              const delta = getDelta(field, change.old, change.new);

                              return (
                                <div
                                  key={field}
                                  className="p-3.5 bg-white border border-luxury-gold/40 rounded-xl shadow-2xs space-y-2 hover:border-luxury-gold transition"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs text-vamika-charcoal">
                                        {getFieldLabel(field)}
                                      </span>
                                      <span className="font-mono text-[10px] text-luxury-text-secondary bg-slate-100 px-1.5 py-0.5 rounded">
                                        {field}
                                      </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide border border-amber-200">
                                      Modified
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-center bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
                                    {/* Before */}
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                                        Current Database Value:
                                      </span>
                                      <div className="font-mono text-rose-900 bg-rose-50 border border-rose-200/80 px-3 py-2 rounded-md line-through text-xs break-all">
                                        {oldFormatted}
                                      </div>
                                    </div>

                                    {/* After */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                          Proposed Value:
                                        </span>
                                        {delta && (
                                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                                            {delta}
                                          </span>
                                        )}
                                      </div>
                                      <div className="font-mono font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-md text-xs break-all shadow-2xs flex items-center justify-between">
                                        <span>{newFormatted}</span>
                                        <FaCheck size={11} className="text-emerald-600 shrink-0 ml-1.5" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-luxury-text-secondary text-center py-4 italic">
                              No fields were modified. Switch to &quot;All Fields&quot; to review the complete submitted payload.
                            </p>
                          )}
                        </div>
                      )}

                      {/* ALL FIELDS VIEW */}
                      {diffViewMode === "all" && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Current Column */}
                            <div className="p-3 bg-white border border-rose-200 rounded-xl space-y-2">
                              <p className="font-bold text-[11px] uppercase tracking-wider text-rose-800 border-b border-rose-100 pb-1.5 flex items-center justify-between">
                                <span>Current Values</span>
                                <span className="text-[10px] font-normal text-rose-600">Database Live</span>
                              </p>
                              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                {allKeys.map((f) => {
                                  const change = parsed[f];
                                  const isChanged = isFieldModified(change);
                                  return (
                                    <div
                                      key={f}
                                      className={`p-1.5 rounded text-xs font-mono break-all ${
                                        isChanged
                                          ? "bg-rose-50 border border-rose-200 text-rose-900 font-semibold"
                                          : "text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      <span className="text-[10px] text-slate-500 block font-sans font-medium">
                                        {getFieldLabel(f)}:
                                      </span>
                                      <span className={isChanged ? "line-through text-rose-800" : ""}>
                                        {formatFieldValue(f, change.old, categories)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Proposed Column */}
                            <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2">
                              <p className="font-bold text-[11px] uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-1.5 flex items-center justify-between">
                                <span>Proposed Values</span>
                                <span className="text-[10px] font-normal text-emerald-600">Pending Review</span>
                              </p>
                              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                {allKeys.map((f) => {
                                  const change = parsed[f];
                                  const isChanged = isFieldModified(change);
                                  return (
                                    <div
                                      key={f}
                                      className={`p-1.5 rounded text-xs font-mono break-all ${
                                        isChanged
                                          ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold"
                                          : "text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500 font-sans font-medium">
                                          {getFieldLabel(f)}:
                                        </span>
                                        {isChanged && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold uppercase font-sans border border-amber-200">
                                            Changed
                                          </span>
                                        )}
                                      </div>
                                      <span>{formatFieldValue(f, change.new, categories)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Review Actions Footer */}
              <div className="flex items-center justify-between border-t border-luxury-border pt-4 mt-auto">
                <span className="text-xs text-luxury-text-secondary">
                  Current Status: <strong className="text-vamika-charcoal">{selectedProposal.status}</strong>
                </span>

                {selectedProposal.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      disabled={isEvaluating}
                      onClick={() => handleEvaluateProposal(selectedProposal.id, "REJECT")}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg cursor-pointer transition disabled:opacity-50"
                    >
                      {isEvaluating ? "Processing..." : "Reject Proposal"}
                    </button>
                    <button
                      disabled={isEvaluating}
                      onClick={() => {
                        if (!isElevated) {
                          setPendingProposalId(selectedProposal.id);
                          setAuthModalOpen(true);
                        } else {
                          handleEvaluateProposal(selectedProposal.id, "APPROVE");
                        }
                      }}
                      className="px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                    >
                      <FaCheck />
                      {isEvaluating
                        ? "Processing..."
                        : isElevated
                        ? "Approve & Apply Changes"
                        : "Elevate & Approve"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAppShell>
  );
}
