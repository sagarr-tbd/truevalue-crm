/**
 * Excel Export Utility
 * Exports data to Excel format using xlsx library
 */

import * as XLSX from 'xlsx';
import { ExportColumn } from './csvExport';

export interface ExcelExportOptions<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
}

/**
 * Convert data to Excel worksheet
 */
function convertToWorksheet<T = any>(options: ExcelExportOptions<T>): XLSX.WorkSheet {
  const { data, columns, includeHeaders = true } = options;
  
  const rows: any[][] = [];
  
  // Add header row
  if (includeHeaders) {
    rows.push(columns.map(col => col.label));
  }
  
  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key as keyof T];
      
      // Use custom formatter if provided
      if (col.format) {
        return col.format(value, row);
      }
      
      return value ?? '';
    });
    
    rows.push(values);
  });
  
  // Create worksheet from array
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Format phone number cells as text to prevent Excel from converting them to numbers
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v) {
        const stringValue = String(cell.v);
        // Check if it looks like a phone number (contains +, -, numbers, spaces, or parentheses)
        if (/^[\+\-]?[\d\s\-\+\(\)]+$/.test(stringValue)) {
          cell.t = 's'; // Force string type
          cell.z = '@'; // Text format
        }
      }
    }
  }
  
  // Auto-size columns
  const colWidths = columns.map((col, idx) => {
    // Calculate max width for this column
    let maxWidth = col.label.length;
    rows.slice(1).forEach(row => {
      const cellValue = String(row[idx] || '');
      maxWidth = Math.max(maxWidth, cellValue.length);
    });
    return { wch: Math.min(maxWidth + 2, 50) }; // Cap at 50 characters
  });
  worksheet['!cols'] = colWidths;
  
  return worksheet;
}

/**
 * Download Excel file
 */
export function downloadExcel<T = any>(options: ExcelExportOptions<T>): void {
  const {
    filename = 'export.xlsx',
    sheetName = 'Sheet1',
  } = options;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Create worksheet
  const worksheet = convertToWorksheet(options);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Write file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export table data to Excel
 */
export function exportToExcel<T = any>(
  data: T[],
  columns: ExportColumn<T>[],
  filename?: string,
  sheetName?: string
): void {
  downloadExcel({
    data,
    columns,
    filename: filename || `export-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: sheetName || 'Data',
  });
}

/**
 * Export multiple sheets to Excel
 */
export function exportMultiSheetExcel<T = any>(
  sheets: Array<{
    name: string;
    data: T[];
    columns: ExportColumn<T>[];
  }>,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    const worksheet = convertToWorksheet({
      data: sheet.data,
      columns: sheet.columns,
    });
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  
  XLSX.writeFile(
    workbook,
    filename || `export-${new Date().toISOString().split('T')[0]}.xlsx`
  );
}
