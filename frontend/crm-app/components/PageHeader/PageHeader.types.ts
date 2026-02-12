import { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  actions?: React.ReactNode;
  subtitle?: string;
}
