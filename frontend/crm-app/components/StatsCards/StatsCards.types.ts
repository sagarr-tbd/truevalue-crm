import { LucideIcon } from "lucide-react";

export interface StatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export interface StatsCardsProps {
  stats: StatCard[];
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}
