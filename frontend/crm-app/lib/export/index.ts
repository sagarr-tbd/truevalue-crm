/**
 * Export utilities index
 * Centralized exports for all export functionality
 */

// CSV Export
export {
  convertToCSV,
  downloadCSV,
  exportToCSV,
  type ExportColumn,
  type CSVExportOptions,
} from './csvExport';

// Excel Export
export {
  downloadExcel,
  exportToExcel,
  exportMultiSheetExcel,
  type ExcelExportOptions,
} from './excelExport';

// PDF Export
export {
  exportToPDF,
  exportToPDFCustom,
  type PDFExportOptions,
} from './pdfExport';

// Clipboard Export
export {
  copyToClipboard,
  exportToClipboard,
  copySelectedRows,
  type ClipboardExportOptions,
} from './clipboardExport';

// Re-export ExportColumn for convenience
import type { ExportColumn } from './csvExport';

// Unified export function
export interface ExportOptions<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  format: 'csv' | 'excel' | 'pdf' | 'clipboard';
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Unified export function that handles all formats
 */
export async function exportData<T = any>(
  options: ExportOptions<T>
): Promise<boolean> {
  const { format, data, columns, filename, title, orientation } = options;
  
  try {
    switch (format) {
      case 'csv':
        await import('./csvExport').then(({ exportToCSV }) => {
          exportToCSV(data, columns, filename);
        });
        return true;
        
      case 'excel':
        await import('./excelExport').then(({ exportToExcel }) => {
          exportToExcel(data, columns, filename);
        });
        return true;
        
      case 'pdf':
        return await import('./pdfExport').then(async ({ exportToPDFCustom }) => {
          await exportToPDFCustom(data, columns, filename, title, orientation);
          return true;
        });
        
      case 'clipboard':
        return await import('./clipboardExport').then(({ exportToClipboard }) => {
          return exportToClipboard(data, columns);
        });
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Export error:', error);
    return false;
  }
}
