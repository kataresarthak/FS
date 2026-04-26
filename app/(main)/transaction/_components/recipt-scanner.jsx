"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";
import { useState } from "react";

export function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("No file chosen");

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    // Create FormData to send the file
    const formData = new FormData();
    formData.append("file", file);
    setFileName(file.name || "No file chosen");

    await scanReceiptFn(formData);
  };

  useEffect(() => {
    if (scannedData?.success && !scanReceiptLoading) {
      toast.success(`Receipt scanned successfully!`);

      // Send data back to form
      onScanComplete(scannedData);
    }
  }, [scanReceiptLoading, scannedData, onScanComplete]);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" style={{ color: "#111827" }}>
        AI Scan Receipt
      </label>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
      />

      <div
        className="flex h-9 items-center gap-1.5 rounded-md border bg-white px-2"
        style={{ borderColor: "#D1D5DB" }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanReceiptLoading}
          className="inline-flex h-7 w-8 items-center justify-center rounded-md border border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280]"
          aria-label="Scan receipt"
        >
          {scanReceiptLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanReceiptLoading}
          className="inline-flex h-6.5 items-center rounded bg-[#233A41] px-2.5 text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-[#32484F] active:bg-[#32484F] focus:ring-2 focus:ring-[#CAA166]"
        >
          Choose File
        </button>

        <span className="truncate text-[11px]" style={{ color: "#374151" }}>
          {scanReceiptLoading ? "Scanning..." : fileName}
        </span>
      </div>
    </div>
  );
}
