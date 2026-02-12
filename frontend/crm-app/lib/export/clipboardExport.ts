/**
 * Clipboard Export Utility
 * Copy data to clipboard in various formats
 */

import { ExportColumn } from './csvExport';
import { toast } from 'sonner';

export interface ClipboardExportOptions<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  format?: 'csv' | 'tsv' | 'plain';
  includeHeaders?: boolean;
}

/**
 * Convert data to clipboard-friendly string
 */
function convertToClipboardString<T = any>(
  options: ClipboardExportOptions<T>
): string {
  const { data, columns, format = 'tsv', includeHeaders = true } = options;
  
  const separator = format === 'csv' ? ',' : '\t';
  const rows: string[] = [];
  
  // Add header row
  if (includeHeaders) {
    rows.push(columns.map(col => col.label).join(separator));
  }
  
  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key as keyof T];
      
      // Use custom formatter if provided
      if (col.format) {
        return col.format(value, row);
      }
      
      return value?.toString() || '';
    });
    
    rows.push(values.join(separator));
  });
  
  return rows.join('\n');
}

/**
 * Copy data to clipboard
 */
export async function copyToClipboard<T = any>(
  options: ClipboardExportOptions<T>
): Promise<boolean> {
  try {
    const text = convertToClipboardString(options);
    
    // Use modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      toast.success('Copied to clipboard!');
      return true;
    }
    
    toast.error('Failed to copy to clipboard');
    return false;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    toast.error('Failed to copy to clipboard');
    return false;
  }
}

/**
 * Copy table data to clipboard
 */
export async function exportToClipboard<T = any>(
  data: T[],
  columns: ExportColumn<T>[],
  format: 'csv' | 'tsv' | 'plain' = 'tsv'
): Promise<boolean> {
  return copyToClipboard({
    data,
    columns,
    format,
  });
}

/**
 * Copy selected rows to clipboard
 */
export async function copySelectedRows<T = any>(
  data: T[],
  selectedIds: (string | number)[],
  columns: ExportColumn<T>[],
  getRowId: (row: T) => string | number = (row: any) => row.id
): Promise<boolean> {
  const selectedData = data.filter(row => selectedIds.includes(getRowId(row)));
  
  if (selectedData.length === 0) {
    toast.error('No rows selected');
    return false;
  }
  
  return exportToClipboard(selectedData, columns);
}
