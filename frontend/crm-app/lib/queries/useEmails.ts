import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  emailsApi,
  EmailQueryParams,
  EmailFormData,
  EmailViewModel,
} from '@/lib/api/emails';
import type { ActivityStats } from '@/lib/api/activities';
import { toast } from 'sonner';

// Re-export types for convenience
export type { EmailQueryParams, EmailFormData, EmailViewModel, ActivityStats };

// ============================================================================
// QUERY KEYS
// ============================================================================

export const emailKeys = {
  all: ['emails'] as const,
  lists: () => [...emailKeys.all, 'list'] as const,
  list: (params?: EmailQueryParams) => [...emailKeys.lists(), params] as const,
  detail: (id: string) => [...emailKeys.all, 'detail', id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch emails with server-side pagination and filtering
 */
export function useEmails(params: EmailQueryParams = {}) {
  return useQuery({
    queryKey: emailKeys.list(params),
    queryFn: () => emailsApi.getAll(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch single email by ID (UUID)
 */
export function useEmail(id: string) {
  return useQuery({
    queryKey: emailKeys.detail(id),
    queryFn: () => emailsApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new email log
 */
export function useCreateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmailFormData) => emailsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Email logged successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to log email');
    },
  });
}

/**
 * Update an email log
 */
export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailFormData> }) =>
      emailsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emailKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: emailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Email updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update email');
    },
  });
}

/**
 * Delete an email log
 */
export function useDeleteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => emailsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: emailKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: emailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Email deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete email');
    },
  });
}

/**
 * Complete an email log
 */
export function useCompleteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => emailsApi.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: emailKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: emailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Email completed!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete email');
    },
  });
}

/**
 * Bulk delete emails
 */
export function useBulkDeleteEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => emailsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: emailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${result.success} emails deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete emails');
    },
  });
}

/**
 * Bulk update emails
 */
export function useBulkUpdateEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<EmailFormData> }) =>
      emailsApi.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: emailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${result.success} emails updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update emails');
    },
  });
}
