export interface ExportButtonProps {
  /** Backend export endpoint path, e.g. '/crm/api/v1/contacts/export'. */
  exportUrl: string;
  /** Query params forwarded to the backend export endpoint (current filters). */
  exportParams?: Record<string, string>;
  /** Base filename without extension. */
  filename?: string;
  /** Total records available (shown in tooltip). */
  totalRecords?: number;
  className?: string;
  disabled?: boolean;
}
