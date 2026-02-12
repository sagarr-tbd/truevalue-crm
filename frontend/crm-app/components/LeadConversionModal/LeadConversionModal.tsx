"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  X,
  Loader2,
  User,
  Building2,
  Briefcase,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemberOptions } from "@/lib/queries/useMembers";

export interface LeadConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (params: ConversionParams) => Promise<void>;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyName?: string;
    title?: string;
    website?: string;
  };
  isConverting?: boolean;
}

export interface ConversionParams {
  create_contact: boolean;
  create_company: boolean;
  create_deal: boolean;
  contact_owner_id?: string;
  company_name?: string;
  company_owner_id?: string;
  deal_name?: string;
  deal_value?: string;
}

export default function LeadConversionModal({
  isOpen,
  onClose,
  onConvert,
  lead,
  isConverting = false,
}: LeadConversionModalProps) {
  // Form state
  const [createContact, setCreateContact] = useState(true);
  const [createCompany, setCreateCompany] = useState(true);
  const [createDeal, setCreateDeal] = useState(false);
  const [contactOwnerId, setContactOwnerId] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [dealName, setDealName] = useState("");
  const [dealValue, setDealValue] = useState("");

  // Fetch member options for owner selection
  const { data: memberOptions = [] } = useMemberOptions();

  // Initialize form with lead data
  useEffect(() => {
    if (isOpen && lead) {
      setCompanyName(lead.companyName || "");
      setDealName(`${lead.companyName || lead.firstName} - New Business`);
      setCreateCompany(!!lead.companyName);
    }
  }, [isOpen, lead]);

  // Prevent body scroll when modal is open
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
    if (!isConverting) {
      onClose();
    }
  }, [isConverting, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConverting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isConverting, handleClose]);

  const handleConvert = async () => {
    const params: ConversionParams = {
      create_contact: createContact,
      create_company: createCompany,
      create_deal: createDeal,
    };

    if (contactOwnerId) {
      params.contact_owner_id = contactOwnerId;
    }

    if (createCompany && companyName) {
      params.company_name = companyName;
    }

    if (createDeal) {
      params.deal_name = dealName;
      params.deal_value = dealValue;
    }

    await onConvert(params);
  };

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

          {/* Modal Container */}
          <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ margin: 0 }}>
            <div className="min-h-screen px-4 flex items-center justify-center py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Convert Lead
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Converting: <span className="font-medium text-gray-900 dark:text-gray-100">
                          {lead.firstName} {lead.lastName}
                        </span>
                        {lead.companyName && (
                          <span className="text-gray-500"> ({lead.companyName})</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      disabled={isConverting}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Contact Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Contact</h3>
                    </div>
                    
                    <div className="pl-10 space-y-3">
                      <label className="flex items-center gap-2 cursor-not-allowed">
                        <input
                          type="checkbox"
                          id="createContact"
                          checked={createContact}
                          onChange={(e) => setCreateContact(e.target.checked)}
                          disabled
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Create new contact
                        </span>
                      </label>
                      
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Name:</span>
                          <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Email:</span>
                          <span className="font-medium">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Phone:</span>
                            <span className="font-medium">{lead.phone}</span>
                          </div>
                        )}
                      </div>

                      {memberOptions.length > 0 && (
                        <div className="space-y-1.5">
                          <label htmlFor="contactOwner" className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign to</label>
                          <select
                            id="contactOwner"
                            value={contactOwnerId}
                            onChange={(e) => setContactOwnerId(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="">Current user (me)</option>
                            {memberOptions.map((member) => (
                              <option key={member.value} value={member.value}>
                                {member.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Company</h3>
                    </div>
                    
                    <div className="pl-10 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          id="createCompany"
                          checked={createCompany}
                          onChange={(e) => setCreateCompany(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Create new company
                        </span>
                      </label>
                      
                      {createCompany && (
                        <div className="space-y-1.5">
                          <label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                          <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter company name"
                            className="text-sm"
                          />
                          {lead.website && (
                            <p className="text-xs text-gray-500">
                              Website: {lead.website}
                            </p>
                          )}
                        </div>
                      )}

                      {!createCompany && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            If a company with similar name exists, the contact will be linked to it.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deal Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Deal (Optional)</h3>
                    </div>
                    
                    <div className="pl-10 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          id="createDeal"
                          checked={createDeal}
                          onChange={(e) => setCreateDeal(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Create a deal for this conversion
                        </span>
                      </label>
                      
                      {createDeal && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label htmlFor="dealName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Deal Name</label>
                            <Input
                              id="dealName"
                              value={dealName}
                              onChange={(e) => setDealName(e.target.value)}
                              placeholder="Enter deal name"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="dealValue" className="text-sm font-medium text-gray-700 dark:text-gray-300">Deal Value ($)</label>
                            <Input
                              id="dealValue"
                              type="number"
                              value={dealValue}
                              onChange={(e) => setDealValue(e.target.value)}
                              placeholder="0.00"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end rounded-b-2xl">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isConverting}
                    className="sm:w-auto w-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConvert}
                    disabled={isConverting || !createContact}
                    className="sm:w-auto w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Convert Lead
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
