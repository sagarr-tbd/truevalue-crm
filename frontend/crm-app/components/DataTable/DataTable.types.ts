import { LucideIcon } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
  visible?: boolean;
}

export interface ColumnState {
  key: string;
  visible: boolean;
  order: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  selectedIds?: (string | number)[];
  onSelectAll?: () => void;
  onSelectRow?: (id: string | number) => void;
  onSort?: (column: keyof T | string) => void;
  sortColumn?: keyof T | string | null;
  sortDirection?: "asc" | "desc";
  renderActions?: (row: T, index: number) => React.ReactNode;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  emptyDescription?: string;
  showSelection?: boolean;
  getRowId?: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  loading?: boolean;
  tableId?: string;
  externalColumnState?: ColumnState[];
}
