"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, X, Loader2, Search, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccounts } from "@/lib/queries/useAccounts";
import { useAddContactCompany } from "@/lib/queries/useContacts";

interface LinkCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  /** Company IDs already linked to this contact (to exclude from search) */
  existingCompanyIds?: string[];
}

export default function LinkCompanyModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  existingCompanyIds = [],
}: LinkCompanyModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const addCompany = useAddContactCompany();

  // Fetch companies for selection
  const { data: companiesResponse, isLoading: isLoadingCompanies } = useAccounts(
    { search: search || undefined, page_size: 20 },
    { enabled: isOpen }
  );

  const availableCompanies = (companiesResponse?.data ?? []).filter(
    (c) => !existingCompanyIds.includes(c.id)
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedCompanyId(null);
      setTitle("");
      setDepartment("");
      setIsPrimary(false);
    }
  }, [isOpen]);

  // Prevent body scroll
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
    if (!addCompany.isPending) onClose();
  }, [addCompany.isPending, onClose]);

  // ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !addCompany.isPending) handleClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, addCompany.isPending, handleClose]);

  const handleSubmit = async () => {
    if (!selectedCompanyId) return;
    try {
      await addCompany.mutateAsync({
        contactId,
        data: {
          companyId: selectedCompanyId,
          title: title || undefined,
          department: department || undefined,
          isPrimary,
        },
      });
      onClose();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={handleClose}
            style={{ margin: 0 }}
          />
          <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ margin: 0 }}>
            <div className="min-h-screen px-4 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full my-8"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Link Company
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Add a company association to {contactName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      disabled={addCompany.isPending}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="px-6 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Company List */}
                <div className="px-6 pb-3 max-h-48 overflow-y-auto">
                  {isLoadingCompanies ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableCompanies.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      {search ? "No matching companies found" : "No companies available"}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableCompanies.map((company) => (
                        <button
                          key={company.id}
                          onClick={() => setSelectedCompanyId(company.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            selectedCompanyId === company.id
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                            {company.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{company.accountName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[company.industry, company.city].filter(Boolean).join(" · ") || "No details"}
                            </p>
                          </div>
                          {selectedCompanyId === company.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Association Details (shown when company selected) */}
                {selectedCompanyId && (
                  <div className="px-6 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role at this company (optional)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Job Title</label>
                        <Input
                          placeholder="e.g. CEO, CTO"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                        <Input
                          placeholder="e.g. Engineering"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Set as primary company</span>
                    </label>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end rounded-b-2xl">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={addCompany.isPending}
                    className="sm:w-auto w-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedCompanyId || addCompany.isPending}
                    className="sm:w-auto w-full"
                  >
                    {addCompany.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Link Company
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
