"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: LucideIcon;
  /** Tailwind classes for the icon container background */
  iconBg?: string;
  /** Tailwind classes for the icon colour */
  iconColor?: string;
  /** Tailwind classes for the confirm button */
  confirmClassName?: string;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  confirmClassName = "bg-primary hover:bg-primary/90 text-white",
  isLoading = false,
}: ConfirmationModalProps) {
  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (!isLoading) onClose();
  }, [isLoading, onClose]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) handleClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isLoading, handleClose]);

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

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ margin: 0 }}>
            <div className="min-h-screen px-4 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full my-8"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start gap-4">
                    {Icon && (
                      <div
                        className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                      </h2>
                      {description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                          {description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleClose}
                      disabled={isLoading}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end rounded-b-2xl">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="sm:w-auto w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {cancelLabel}
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`sm:w-auto w-full border-0 shadow-sm ${confirmClassName}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Please wait…
                      </>
                    ) : (
                      confirmLabel
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
