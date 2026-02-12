/**
 * CSV Export Utility
 * Exports data to CSV format with proper escaping and formatting
 */

export interface ExportColumn<T = any> {
  key: keyof T | string;
  label: string;
  format?: (value: any, row: T) => string;
}

export interface CSVExportOptions<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  includeHeaders?: boolean;
}

/**
 * Escape CSV cell value
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // Force text format for values that start with +, -, or = to prevent formula interpretation
  // Also force text format for phone numbers
  if (stringValue.startsWith('+') || stringValue.startsWith('-') || stringValue.startsWith('=') || /^[\d\s\-\+\(\)]+$/.test(stringValue)) {
    // Prefix with = and wrap in quotes to force text format in Excel
    return `"=""${stringValue.replace(/"/g, '""')}"""`; 
  }
  
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert data to CSV string
 */
export function convertToCSV<T = any>(options: CSVExportOptions<T>): string {
  const { data, columns, includeHeaders = true } = options;
  
  const rows: string[] = [];
  
  // Add header row
  if (includeHeaders) {
    const headers = columns.map(col => escapeCSVValue(col.label));
    rows.push(headers.join(','));
  }
  
  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key as keyof T];
      
      // Use custom formatter if provided
      if (col.format) {
        return escapeCSVValue(col.format(value, row));
      }
      
      return escapeCSVValue(value);
    });
    
    rows.push(values.join(','));
  });
  
  return rows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV<T = any>(options: CSVExportOptions<T>): void {
  const { filename = 'export.csv' } = options;
  
  const csvContent = convertToCSV(options);
  
  // Create blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export table data to CSV
 */
export function exportToCSV<T = any>(
  data: T[],
  columns: ExportColumn<T>[],
  filename?: string
): void {
  downloadCSV({
    data,
    columns,
    filename: filename || `export-${new Date().toISOString().split('T')[0]}.csv`,
  });
}
