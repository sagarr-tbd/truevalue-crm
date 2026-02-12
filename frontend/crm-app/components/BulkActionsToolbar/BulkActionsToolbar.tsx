"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Trash2,
  Download,
  Edit,
  Tag,
  UserPlus,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BulkActionsToolbarProps } from "./BulkActionsToolbar.types";

export default function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExport,
  onUpdateStatus,
  statusLabel = "Status",
  onUpdateOwner,
  onUpdateTags,
  customActions = [],
  className = "",
  isProcessing = false,
}: BulkActionsToolbarProps) {
  const [showMoreActions, setShowMoreActions] = useState(false);

  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
                </p>
                <p className="text-xs text-gray-600">
                  {isAllSelected ? (
                    <button
                      onClick={onDeselectAll}
                      className="text-primary hover:underline"
                    >
                      Deselect all
                    </button>
                  ) : (
                    <button
                      onClick={onSelectAll}
                      className="text-primary hover:underline"
                    >
                      Select all {totalCount} items
                    </button>
                  )}
                </p>
              </div>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Actions */}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={isProcessing}
                title="Export selected items"
                className="text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}

            {onUpdateStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUpdateStatus}
                disabled={isProcessing}
                title={`Update ${statusLabel.toLowerCase()}`}
                className="text-xs sm:text-sm"
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{statusLabel}</span>
              </Button>
            )}

            {onUpdateOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUpdateOwner}
                disabled={isProcessing}
                title="Update owner"
                className="text-xs sm:text-sm"
              >
                <UserPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Owner</span>
              </Button>
            )}

            {onUpdateTags && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUpdateTags}
                disabled={isProcessing}
                title="Update tags"
                className="text-xs sm:text-sm"
              >
                <Tag className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tags</span>
              </Button>
            )}

            {/* Custom Actions Dropdown */}
            {customActions.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  disabled={isProcessing}
                >
                  More
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>

                {showMoreActions && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMoreActions(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                    >
                      {customActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              action.onClick();
                              setShowMoreActions(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                              action.variant === "danger"
                                ? "text-red-600 hover:bg-red-50"
                                : action.variant === "success"
                                ? "text-green-600 hover:bg-green-50"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {Icon && <Icon className="h-4 w-4" />}
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </div>
            )}

            {/* Delete Action */}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={isProcessing}
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
                title="Delete selected items"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}

            {/* Close Button */}
            <button
              onClick={onDeselectAll}
              disabled={isProcessing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
