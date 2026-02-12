"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Merge, X, User, Mail, Phone, Building2, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { contactsApi, MergeStrategy } from "@/lib/api/contacts";

export interface MergeContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: (mergedContactId: string) => void;
  primaryContactId: string;
  secondaryContactId: string;
  isLoading?: boolean;
  onMerge: (primaryId: string, secondaryId: string, strategy: MergeStrategy) => void;
}

interface ContactSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  isLoading: boolean;
}

export default function MergeContactModal({
  isOpen,
  onClose,
  primaryContactId,
  secondaryContactId,
  isLoading,
  onMerge,
}: MergeContactModalProps) {
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('fill_empty');
  const [primaryContact, setPrimaryContact] = useState<ContactSummary | null>(null);
  const [secondaryContact, setSecondaryContact] = useState<ContactSummary | null>(null);

  // Load contact details
  useEffect(() => {
    if (isOpen && primaryContactId) {
      setPrimaryContact({ id: primaryContactId, name: 'Loading...', isLoading: true });
      contactsApi.getById(primaryContactId).then((contact) => {
        setPrimaryContact({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          title: contact.jobTitle,
          isLoading: false,
        });
      }).catch(() => {
        setPrimaryContact({ id: primaryContactId, name: 'Error loading', isLoading: false });
      });
    }
  }, [isOpen, primaryContactId]);

  useEffect(() => {
    if (isOpen && secondaryContactId) {
      setSecondaryContact({ id: secondaryContactId, name: 'Loading...', isLoading: true });
      contactsApi.getById(secondaryContactId).then((contact) => {
        setSecondaryContact({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          title: contact.jobTitle,
          isLoading: false,
        });
      }).catch(() => {
        setSecondaryContact({ id: secondaryContactId, name: 'Error loading', isLoading: false });
      });
    }
  }, [isOpen, secondaryContactId]);

  if (!isOpen) return null;

  const handleMerge = () => {
    onMerge(primaryContactId, secondaryContactId, mergeStrategy);
  };

  const ContactCard = ({ contact, label, isPrimary }: { contact: ContactSummary | null; label: string; isPrimary: boolean }) => (
    <div className={`border rounded-lg p-4 ${isPrimary ? 'border-primary bg-primary/5' : 'border-muted'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isPrimary ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {label}
        </span>
        {isPrimary && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" /> Will be kept
          </span>
        )}
      </div>

      {contact?.isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ) : contact ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{contact.name}</span>
          </div>
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{contact.company}</span>
            </div>
          )}
          {contact.title && (
            <div className="text-sm text-muted-foreground pl-6">
              {contact.title}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Contact not found</div>
      )}
    </div>
  );

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
        className="relative z-[101] w-full max-w-2xl"
      >
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Merge className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                Merge Contacts
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Combine two contact records into one. The secondary contact will be deleted after merging.
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Contact Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <ContactCard contact={primaryContact} label="Primary (Keep)" isPrimary={true} />
            <ContactCard contact={secondaryContact} label="Secondary (Delete)" isPrimary={false} />
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Secondary contact data</span>
              <ArrowRight className="h-4 w-4" />
              <span>Primary contact</span>
            </div>
          </div>

          {/* Merge Strategy Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Merge Strategy</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMergeStrategy('keep_primary')}
                className={`p-3 border rounded-lg text-left transition-all ${
                  mergeStrategy === 'keep_primary'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-sm mb-1">Keep Primary Only</div>
                <p className="text-xs text-muted-foreground">
                  Keep all primary contact values. Only move activities, deals, and tags from secondary.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMergeStrategy('fill_empty')}
                className={`p-3 border rounded-lg text-left transition-all ${
                  mergeStrategy === 'fill_empty'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-sm mb-1">Fill Empty Fields</div>
                <p className="text-xs text-muted-foreground">
                  Fill empty primary fields with secondary values, plus move activities, deals, and tags.
                </p>
              </button>
            </div>
          </div>

          {/* What will happen */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium mb-2">What will happen:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                All activities from secondary contact will be moved to primary
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                All deals associated with secondary will be linked to primary
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                Tags from secondary will be added to primary
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                Company associations will be merged
              </li>
              {mergeStrategy === 'fill_empty' && (
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  Empty fields in primary will be filled from secondary
                </li>
              )}
              <li className="flex items-center gap-2 text-red-600">
                <X className="h-3 w-3" />
                Secondary contact will be permanently deleted
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleMerge} 
              disabled={isLoading || !primaryContact || !secondaryContact}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="h-4 w-4 mr-2" />
                  Merge Contacts
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
