/**
 * Shared Action Menu Item Helpers
 * 
 * These functions generate action menu items for different entity types.
 * They eliminate duplication between table view and grid view.
 */

import { FileText, Edit, Mail, Phone, Trash2, UserPlus, type LucideIcon } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'danger' | 'default';
  disabled?: boolean;
  divider?: boolean;
}

// Minimal entity types for action menu
interface ContactForMenu {
  id: string;
  email?: string;
}

interface LeadForMenu {
  id: string;
  email?: string;
  phone?: string;
  status?: string;
}

interface DealForMenu {
  id: string;
  contactEmail?: string;
  contactName?: string;
}

// Handler interfaces with generic types for flexibility
export interface ContactActionHandlers<T extends ContactForMenu = ContactForMenu> {
  onView: (id: string) => void;
  onEdit: (contact: T) => void;
  onSendEmail: (email: string) => void;
  onDelete: (contact: T) => void;
}

export interface LeadActionHandlers<T extends LeadForMenu = LeadForMenu> {
  onView: (id: string) => void;
  onEdit: (lead: T) => void;
  onSendEmail: (email: string) => void;
  onCall: (phone: string) => void;
  onConvert: (lead: T) => void;
  onDelete: (lead: T) => void;
}

export interface DealActionHandlers<T extends DealForMenu = DealForMenu> {
  onView: (id: string) => void;
  onEdit: (deal: T) => void;
  onSendEmail: (email: string) => void;
  onDelete: (deal: T) => void;
}

// =============================================================================
// CONTACT ACTION MENU
// =============================================================================

export function getContactActionMenuItems<T extends ContactForMenu>(
  contact: T,
  handlers: ContactActionHandlers<T>
): ActionMenuItem[] {
  return [
    {
      label: 'View Details',
      icon: FileText,
      onClick: () => handlers.onView(contact.id),
    },
    {
      label: 'Edit Contact',
      icon: Edit,
      onClick: () => handlers.onEdit(contact),
    },
    {
      label: 'Send Email',
      icon: Mail,
      onClick: () => handlers.onSendEmail(contact.email || ''),
      disabled: !contact.email,
    },
    { divider: true, label: '', onClick: () => {} },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'danger',
      onClick: () => handlers.onDelete(contact),
    },
  ];
}

// =============================================================================
// LEAD ACTION MENU
// =============================================================================

export interface LeadActionOptions {
  isConverting?: boolean;
}

export function getLeadActionMenuItems<T extends LeadForMenu>(
  lead: T,
  handlers: LeadActionHandlers<T>,
  options?: LeadActionOptions
): ActionMenuItem[] {
  const isLockedStatus = lead.status?.toLowerCase() === 'converted' || lead.status?.toLowerCase() === 'unqualified';
  const isConverting = options?.isConverting ?? false;

  return [
    {
      label: 'View Details',
      icon: FileText,
      onClick: () => handlers.onView(lead.id),
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: () => handlers.onEdit(lead),
      disabled: isLockedStatus,
    },
    {
      label: 'Send Email',
      icon: Mail,
      onClick: () => handlers.onSendEmail(lead.email || ''),
      disabled: !lead.email,
    },
    {
      label: 'Call Lead',
      icon: Phone,
      onClick: () => handlers.onCall(lead.phone || ''),
      disabled: !lead.phone,
    },
    {
      label: 'Convert to Contact',
      icon: UserPlus,
      onClick: () => handlers.onConvert(lead),
      disabled: isLockedStatus || isConverting,
    },
    { divider: true, label: '', onClick: () => {} },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'danger',
      onClick: () => handlers.onDelete(lead),
    },
  ];
}

// =============================================================================
// DEAL ACTION MENU
// =============================================================================

export function getDealActionMenuItems<T extends DealForMenu>(
  deal: T,
  handlers: DealActionHandlers<T>
): ActionMenuItem[] {
  return [
    {
      label: 'View Details',
      icon: FileText,
      onClick: () => handlers.onView(deal.id),
    },
    {
      label: 'Edit Deal',
      icon: Edit,
      onClick: () => handlers.onEdit(deal),
    },
    {
      label: 'Send Email',
      icon: Mail,
      onClick: () => handlers.onSendEmail(deal.contactEmail || ''),
      disabled: !deal.contactEmail,
    },
    { divider: true, label: '', onClick: () => {} },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'danger',
      onClick: () => handlers.onDelete(deal),
    },
  ];
}
