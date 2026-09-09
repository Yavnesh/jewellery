"use client";

import React, { useState, useRef } from "react";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import BulkUploadHistory from "@/components/BulkUploadHistory";
import toast from "react-hot-toast";
import {
  FaUpload,
  FaDownload,
  FaCircleCheck,
  FaCircleXmark,
  FaFileCsv,
  FaCircleInfo,
} from "react-icons/fa6";



interface UploadResult {
  success: boolean;
  message: string;
  details?: {
    processed: number;
    successful: number;
    failed: number;
    errors?: string[];
  };
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setUploadResult(null);
      } else {
        toast.error("Please upload a CSV file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        toast.error("Please upload a CSV file");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: data.message || "Products uploaded successfully!",
          details: data.details,
        });
        toast.success("Bulk catalog upload completed!");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setUploadResult({
          success: false,
          message: data.error || "Upload failed",
          details: data.details,
        });
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: "Network error occurred during upload",
      });
      toast.error("Network error occurred");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,price,manufacturer,inStock,mainImage,description,slug,categoryId
The Solitaire Diamond Ring,185000,Vamika Signature,10,https://example.com/ring.jpg,Brilliant cut 1.5ct solitaire ring in 18K gold.,the-solitaire-diamond-ring,category-uuid
The Emerald Cascade Necklace,420000,Vamika Signature,5,https://example.com/necklace.jpg,Cascade of Colombian emeralds in 18K white gold.,the-emerald-cascade-necklace,category-uuid`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vamika_product_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("CSV template downloaded!");
  };

  return (
    <AdminAppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-vamika-charcoal">
            Bulk Product <span className="text-luxury-gold">Import & Batch Processor</span>
          </h1>
          <p className="text-xs text-luxury-text-secondary mt-1">
            Import hundreds of jewellery items simultaneously with automated SKU and variant synchronization.
          </p>
        </div>

        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-luxury-border text-vamika-charcoal hover:border-luxury-gold shadow-2xs transition-colors"
        >
          <FaDownload className="text-luxury-gold" size={12} />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Upload & Guidance Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Drag and Drop Zone (Left 2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-luxury-border p-6 shadow-xs space-y-4">
            <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
              Upload Catalog CSV File
            </h2>

            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-luxury-gold bg-luxury-gold/5"
                  : "border-luxury-border bg-luxury-bg hover:border-luxury-gold/60"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FaFileCsv className="text-5xl text-luxury-gold mx-auto mb-3" />
              <p className="text-sm font-semibold text-vamika-charcoal mb-1">
                {file ? (
                  <span className="text-luxury-gold font-bold">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                ) : (
                  "Drag & drop your formatted product CSV here, or click to browse"
                )}
              </p>
              <p className="text-[11px] text-luxury-text-secondary">
                Supports .csv files up to 50MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
            </div>

            {file && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-lg bg-vamika-charcoal text-luxury-gold font-semibold text-xs hover:bg-black shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <FaUpload />
                  <span>{uploading ? "Processing Batch..." : "Execute Bulk Upload"}</span>
                </button>

              </div>
            )}
          </div>

          {/* Upload Status Card */}
          {uploadResult && (
            <div
              className={`p-5 rounded-xl border shadow-xs ${
                uploadResult.success
                  ? "bg-emerald-50/70 border-emerald-200"
                  : "bg-red-50/70 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {uploadResult.success ? (
                  <FaCircleCheck className="text-emerald-600 text-xl shrink-0 mt-0.5" />
                ) : (
                  <FaCircleXmark className="text-red-600 text-xl shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">

                  <h3
                    className={`font-serif font-bold text-sm ${
                      uploadResult.success ? "text-emerald-900" : "text-red-900"
                    }`}
                  >
                    {uploadResult.success ? "Batch Processing Successful" : "Upload Failed"}
                  </h3>
                  <p className="text-luxury-text-secondary">{uploadResult.message}</p>

                  {uploadResult.details && (
                    <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                      <div className="p-2 bg-white rounded-lg border border-luxury-border">
                        <div className="text-base font-bold text-vamika-charcoal">
                          {uploadResult.details.processed}
                        </div>
                        <div className="text-[10px] uppercase text-luxury-text-secondary">Processed</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-luxury-border">
                        <div className="text-base font-bold text-emerald-600">
                          {uploadResult.details.successful}
                        </div>
                        <div className="text-[10px] uppercase text-emerald-600">Created</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-luxury-border">
                        <div className="text-base font-bold text-red-600">
                          {uploadResult.details.failed}
                        </div>
                        <div className="text-[10px] uppercase text-red-600">Failed</div>
                      </div>
                    </div>
                  )}

                  {uploadResult.details?.errors && uploadResult.details.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-red-200 text-[11px] text-red-700 max-h-36 overflow-y-auto space-y-1">
                      <div className="font-bold">Error Breakdown:</div>
                      {uploadResult.details.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CSV Format Guide (Right Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-luxury-border p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <FaCircleInfo className="text-luxury-gold" />
              <h2 className="font-serif font-semibold text-base text-vamika-charcoal">
                Required CSV Schema
              </h2>
            </div>
            <p className="text-luxury-text-secondary text-[11px]">
              Ensure your columns match the expected headers before submitting:
            </p>

            <div className="space-y-2 divide-y divide-luxury-border/60">
              {[
                { col: "title", req: "Yes", desc: "Product headline / name" },
                { col: "price", req: "Yes", desc: "Selling price in INR (e.g. 185000)" },
                { col: "manufacturer", req: "Yes", desc: "Brand / Atelier name" },
                { col: "inStock", req: "Optional", desc: "Stock quantity (default 0)" },
                { col: "mainImage", req: "Optional", desc: "Direct image URL" },
                { col: "description", req: "Yes", desc: "Item story & specification" },
                { col: "slug", req: "Yes", desc: "Unique URL slug" },
                { col: "categoryId", req: "Yes", desc: "Valid Category ID" },
              ].map((item, idx) => (
                <div key={idx} className="pt-2 flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-vamika-charcoal">{item.col}</span>
                    <div className="text-[10px] text-luxury-text-secondary">{item.desc}</div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      item.req === "Yes"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {item.req}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Batch History */}
      <div className="mt-8">
        <BulkUploadHistory />
      </div>
    </AdminAppShell>
  );
}
