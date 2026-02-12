export interface ExportButtonProps<T = any> {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    label: string;
    format?: (value: any, row: T) => string;
  }>;
  filename?: string;
  title?: string;
  className?: string;
  disabled?: boolean;
}
