/**
 * Advanced Filter Types
 * Defines filter configurations for complex filtering
 */

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "between"
  | "in"
  | "notIn"
  | "isEmpty"
  | "isNotEmpty";

export type FilterFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "boolean"
  | "dateRange";

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  operators?: FilterOperator[];
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For 'between' operator
}

export interface FilterGroup {
  id: string;
  logic: "AND" | "OR";
  conditions: FilterCondition[];
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  group: FilterGroup;
  createdAt: string;
  isDefault?: boolean;
}

export interface AdvancedFilterProps {
  fields: FilterField[];
  onApply: (group: FilterGroup) => void;
  onClear: () => void;
  initialGroup?: FilterGroup;
  presets?: FilterPreset[];
  onSavePreset?: (preset: Omit<FilterPreset, "id" | "createdAt">) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
  onDeletePreset?: (presetId: string) => void;
  className?: string;
  isDrawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  drawerPosition?: "left" | "right";
}
