/**
 * PDF Export Utility
 * Exports data to PDF format using jsPDF and jspdf-autotable
 */

import { ExportColumn } from './csvExport';

export interface PDFExportOptions<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  includeHeaders?: boolean;
}

/**
 * Export table data to PDF
 */
export async function exportToPDF<T = any>(options: PDFExportOptions<T>): Promise<void> {
  const {
    data,
    columns,
    filename = 'export.pdf',
    title,
    orientation = 'landscape',
    includeHeaders = true,
  } = options;
  
  // Dynamic import to avoid build issues
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });
  
  // Add title if provided
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 15);
  }
  
  // Prepare table data
  const headers = includeHeaders
    ? [columns.map(col => col.label)]
    : [];
  
  const body = data.map(row =>
    columns.map(col => {
      const value = row[col.key as keyof T];
      
      // Use custom formatter if provided
      if (col.format) {
        return col.format(value, row);
      }
      
      return value?.toString() || '';
    })
  );
  
  // Generate table
  autoTable(doc, {
    head: headers,
    body: body,
    startY: title ? 25 : 15,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 15, right: 14, bottom: 15, left: 14 },
  });
  
  // Save PDF
  doc.save(filename);
}

/**
 * Export table data to PDF with custom styling
 */
export async function exportToPDFCustom<T = any>(
  data: T[],
  columns: ExportColumn<T>[],
  filename?: string,
  title?: string,
  orientation?: 'portrait' | 'landscape'
): Promise<void> {
  return exportToPDF({
    data,
    columns,
    filename: filename || `export-${new Date().toISOString().split('T')[0]}.pdf`,
    title,
    orientation,
  });
}
