"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Copy, Loader2 } from "lucide-react";
import { ExportButtonProps } from "./ExportButton.types";
import { exportToCSV, exportToExcel, exportToPDFCustom, exportToClipboard } from "@/lib/export";
import { toast } from "sonner";

export default function ExportButton<T = any>({
  data,
  columns,
  filename,
  title,
  className = "",
  disabled = false,
}: ExportButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf' | 'clipboard') => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    setIsExporting(true);
    setIsOpen(false);

    try {
      const baseFilename = filename || `export-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'csv':
          exportToCSV(data, columns, `${baseFilename}.csv`);
          toast.success('Exported to CSV successfully!');
          break;

        case 'excel':
          exportToExcel(data, columns, `${baseFilename}.xlsx`);
          toast.success('Exported to Excel successfully!');
          break;

        case 'pdf':
          await exportToPDFCustom(data, columns, `${baseFilename}.pdf`, title, 'landscape');
          toast.success('Exported to PDF successfully!');
          break;

        case 'clipboard':
          await exportToClipboard(data, columns);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting || data.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={data.length === 0 ? "No data to export" : "Export data"}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-gray-400" />
              <span>Export as CSV</span>
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span>Export as Excel</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span>Export as PDF</span>
            </button>

            <div className="border-t border-gray-200 my-1" />

            <button
              onClick={() => handleExport('clipboard')}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy className="h-4 w-4 text-gray-400" />
              <span>Copy to Clipboard</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
