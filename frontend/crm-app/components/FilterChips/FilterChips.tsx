"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterChip {
  id: string;
  label: string;
  value: string;
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
}

export interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (chipId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

const colorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  danger: "bg-red-50 text-red-700 border-red-200",
};

export default function FilterChips({
  chips,
  onRemove,
  onClearAll,
  className = "",
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-600">Filters:</span>
      
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.div
            key={chip.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm border rounded-full transition-all ${
              colorClasses[chip.color || "primary"]
            }`}
          >
            <span className="font-medium">{chip.label}:</span>
            <span>{chip.value}</span>
            <button
              onClick={() => onRemove(chip.id)}
              className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
              title="Remove filter"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {onClearAll && chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
