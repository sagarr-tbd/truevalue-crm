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
} from '@/lib/api/contacts';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params?: ContactQueryParams) => [...contactKeys.lists(), params] as const,
  detail: (id: string) => [...contactKeys.all, 'detail', id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch contacts with pagination and filtering
 */
export function useContacts(params: ContactQueryParams = {}) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => contactsApi.getAll(params),
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

// Re-export types
export type { DuplicateCheckResult, MergeContactResult, MergeStrategy } from '@/lib/api/contacts';
