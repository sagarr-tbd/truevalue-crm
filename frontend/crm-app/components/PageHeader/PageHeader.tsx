"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeaderProps } from "./PageHeader.types";

export default function PageHeader({
  title,
  icon: Icon,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  showSearch = true,
  actions,
  subtitle,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Title and Icon */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions on mobile - show only on larger screens or move to bottom */}
        {actions && (
          <div className="hidden lg:flex items-center gap-2 flex-wrap flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Second Row: Search Bar (full width on mobile) */}
      {showSearch && onSearchChange && (
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 bg-muted/50 border-border w-full"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Mobile Actions Row */}
      {actions && (
        <div className="flex lg:hidden items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
