"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface BulkUpdateModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: T) => Promise<void>;
  itemCount: number;
  title: string;
  field: string;
  options: Array<{ label: string; value: T }>;
  currentValue?: T;
}

export default function BulkUpdateModal<T = any>({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  title,
  field,
  options,
  currentValue,
}: BulkUpdateModalProps<T>) {
  const [selectedValue, setSelectedValue] = useState<T | undefined>(currentValue);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (selectedValue === undefined) return;

    setIsUpdating(true);
    try {
      await onConfirm(selectedValue);
      onClose();
    } catch (error) {
      console.error("Bulk update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={isUpdating ? undefined : onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-[101]"
      >
        <Card className="w-full max-w-md p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {!isUpdating && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Update {field} for {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>

          {/* Select Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select {field}
            </label>
            <select
              value={selectedValue !== undefined ? String(selectedValue) : ""}
              onChange={(e) => {
                const option = options.find((opt) => String(opt.value) === e.target.value);
                if (option) {
                  setSelectedValue(option.value);
                }
              }}
              disabled={isUpdating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select {field}...</option>
              {options.map((option, index) => (
                <option key={index} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isUpdating || selectedValue === undefined}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Update ${itemCount} ${itemCount === 1 ? "item" : "items"}`
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
