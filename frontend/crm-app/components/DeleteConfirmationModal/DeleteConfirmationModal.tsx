"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationModalProps } from "./DeleteConfirmationModal.types";

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  itemType = "item",
  icon: Icon,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = useCallback(() => {
    if (!isDeleting) {
      onClose();
    }
  }, [isDeleting, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isDeleting, handleClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={handleClose}
            style={{ margin: 0 }}
          />

          {/* Modal Container - Fixed positioning with proper centering */}
          <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ margin: 0 }}>
            <div className="min-h-screen px-4 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ 
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full my-8"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                      </h2>
                      {itemName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {itemType}: <span className="font-medium text-gray-900 dark:text-gray-100">{itemName}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleClose}
                      disabled={isDeleting}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-4">
                  <div className="flex gap-3">
                    {Icon && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Warning Box */}
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                        This action is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end rounded-b-2xl">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="sm:w-auto w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    className="sm:w-auto w-full bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white border-0 shadow-sm"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete {itemType}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
