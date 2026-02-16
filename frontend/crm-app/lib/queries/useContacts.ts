import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  contactsApi,
  ContactQueryParams,
  ContactFormData,
} from '@/lib/api/contacts';
import { toast } from 'sonner';

// Re-export types for convenience
export type {
  ContactQueryParams,
  ContactFormData,
  ContactOption,
} from '@/lib/api/contacts';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params?: ContactQueryParams) => [...contactKeys.lists(), params] as const,
  detail: (id: string) => [...contactKeys.all, 'detail', id] as const,
  options: () => [...contactKeys.all, 'options'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch contacts with pagination and filtering
 */
export function useContacts(
  params: ContactQueryParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => contactsApi.getAll(params),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000, // 1 minute - list data can be slightly stale
  });
}

/**
 * Fetch single contact by ID (UUID)
 */
export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => contactsApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - detail data can be cached longer
  });
}

/**
 * Fetch contacts as dropdown options
 * Used for select fields in forms
 */
export function useContactOptions() {
  return useQuery({
    queryKey: contactKeys.options(),
    queryFn: () => contactsApi.getAsOptions(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      data, 
      skipDuplicateCheck = false 
    }: { 
      data: ContactFormData; 
      skipDuplicateCheck?: boolean 
    }) => contactsApi.create(data, { skipDuplicateCheck }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contact created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create contact');
    },
  });
}

/**
 * Update a contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactFormData }) =>
      contactsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contact updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update contact');
    },
  });
}

/**
 * Delete a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: contactKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contact deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete contact');
    },
  });
}

/**
 * Bulk delete contacts
 */
export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => contactsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success(`${result.success} contacts deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete contacts');
    },
  });
}

/**
 * Bulk update contacts
 */
export function useBulkUpdateContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<ContactFormData> }) =>
      contactsApi.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success(`${result.success} contacts updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update contacts');
    },
  });
}

/**
 * Check for duplicate contacts
 */
export function useCheckDuplicates() {
  return useMutation({
    mutationFn: (params: { email?: string; phone?: string; name?: string }) =>
      contactsApi.checkDuplicates(params),
  });
}

/**
 * Merge two contacts into one
 */
export function useMergeContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      primaryId: string;
      secondaryId: string;
      mergeStrategy?: 'keep_primary' | 'fill_empty';
    }) => contactsApi.merge(params),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
        queryClient.invalidateQueries({ queryKey: contactKeys.all });
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to merge contacts');
    },
  });
}

// ============================================================================
// CONTACT-COMPANY ASSOCIATION HOOKS
// ============================================================================

/**
 * Add a company association to a contact
 */
export function useAddContactCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, data }: {
      contactId: string;
      data: { companyId: string; title?: string; department?: string; isPrimary?: boolean };
    }) => contactsApi.addCompany(contactId, data),
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Company linked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link company');
    },
  });
}

/**
 * Remove a company association from a contact
 */
export function useRemoveContactCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, companyId }: { contactId: string; companyId: string }) =>
      contactsApi.removeCompany(contactId, companyId),
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Company unlinked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlink company');
    },
  });
}

// Re-export types
export type { DuplicateCheckResult, MergeContactResult, MergeStrategy } from '@/lib/api/contacts';
export type { CompanyAssociation } from '@/lib/api/contacts';