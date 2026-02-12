"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Users, X, ChevronRight, Merge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface DuplicateContact {
  id: string;
  name: string;
}

export interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onViewDuplicate: (id: string) => void;
  onMerge?: (duplicateId: string) => void;
  duplicates: DuplicateContact[];
  matchField: 'email' | 'phone' | 'name';
  matchValue: string;
  isLoading?: boolean;
  showMergeOption?: boolean;
}

export default function DuplicateWarningModal({
  isOpen,
  onClose,
  onProceed,
  onViewDuplicate,
  onMerge,
  duplicates,
  matchField,
  matchValue,
  isLoading,
  showMergeOption = true,
}: DuplicateWarningModalProps) {
  if (!isOpen) return null;

  const fieldLabels: Record<string, string> = {
    email: 'Email',
    phone: 'Phone',
    name: 'Name',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-[101] w-full max-w-md"
      >
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                Potential Duplicate Found
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                We found {duplicates.length} existing contact{duplicates.length > 1 ? 's' : ''} with 
                matching {fieldLabels[matchField]}: <span className="font-medium">{matchValue}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Duplicate List */}
          <div className="border rounded-lg divide-y mb-4 max-h-[200px] overflow-auto">
            {duplicates.map((duplicate) => (
              <div
                key={duplicate.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => onViewDuplicate(duplicate.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{duplicate.name}</span>
                </button>
                <div className="flex items-center gap-2">
                  {showMergeOption && onMerge && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMerge(duplicate.id)}
                      className="text-xs h-7 px-2"
                      title="Merge with this contact"
                    >
                      <Merge className="h-3 w-3 mr-1" />
                      Merge
                    </Button>
                  )}
                  <ChevronRight 
                    className="h-4 w-4 text-muted-foreground cursor-pointer"
                    onClick={() => onViewDuplicate(duplicate.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={onProceed}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : null}
              Create Anyway
            </Button>
            <Button onClick={onClose} className="w-full">
              Go Back
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            {showMergeOption 
              ? "Click 'Merge' to combine records, or 'Create Anyway' to add a new contact"
              : "Creating a new contact will not merge with existing records"
            }
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
