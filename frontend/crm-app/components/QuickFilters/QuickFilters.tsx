"use client";

import { motion } from "framer-motion";
import { QuickFiltersProps } from "./QuickFilters.types";

export default function QuickFilters({
  filters,
  activeFilter,
  onFilterChange,
  className = "",
  showCount = true,
}: QuickFiltersProps) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;
        const Icon = filter.icon;

        return (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterChange(isActive ? null : filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isActive
                ? "bg-gradient-to-r from-brand-teal to-brand-purple text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{filter.label}</span>
            {showCount && filter.count !== undefined && (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filter.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
