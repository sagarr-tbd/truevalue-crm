import { LucideIcon } from "lucide-react";

export interface QuickFilter {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  value: string | null;
}

export interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
  className?: string;
  showCount?: boolean;
}
