"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { ExportButtonProps } from "./ExportButton.types";
import { toast } from "sonner";
import { TokenManager } from "@/lib/api/client";

export default function ExportButton({
  exportUrl,
  exportParams,
  filename,
  totalRecords,
  className = "",
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const searchParams = new URLSearchParams({
        ...exportParams,
      });
      const token = TokenManager.getAccessToken();
      const resp = await fetch(`${baseUrl}${exportUrl}?${searchParams.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename || "export"}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Exported to CSV successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const label = totalRecords != null ? `Export (${totalRecords.toLocaleString()})` : "Export";

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      title={totalRecords != null ? `Export ${totalRecords.toLocaleString()} records as CSV` : "Export as CSV"}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
