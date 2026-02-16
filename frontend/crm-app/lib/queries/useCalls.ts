import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  callsApi,
  CallQueryParams,
  CallFormData,
  CallViewModel,
} from '@/lib/api/calls';
import type { ActivityStats } from '@/lib/api/activities';
import { toast } from 'sonner';

// Re-export types for convenience
export type { CallQueryParams, CallFormData, CallViewModel, ActivityStats };

// ============================================================================
// QUERY KEYS
// ============================================================================

export const callKeys = {
  all: ['calls'] as const,
  lists: () => [...callKeys.all, 'list'] as const,
  list: (params?: CallQueryParams) => [...callKeys.lists(), params] as const,
  detail: (id: string) => [...callKeys.all, 'detail', id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch calls with server-side pagination and filtering
 */
export function useCalls(params: CallQueryParams = {}) {
  return useQuery({
    queryKey: callKeys.list(params),
    queryFn: () => callsApi.getAll(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch single call by ID (UUID)
 */
export function useCall(id: string) {
  return useQuery({
    queryKey: callKeys.detail(id),
    queryFn: () => callsApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new call
 */
export function useCreateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CallFormData) => callsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Call logged successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to log call');
    },
  });
}

/**
 * Update a call
 */
export function useUpdateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CallFormData> }) =>
      callsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: callKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Call updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update call');
    },
  });
}

/**
 * Delete a call
 */
export function useDeleteCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => callsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: callKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Call deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete call');
    },
  });
}

/**
 * Complete a call
 */
export function useCompleteCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => callsApi.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: callKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Call completed!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete call');
    },
  });
}

/**
 * Bulk delete calls
 */
export function useBulkDeleteCalls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => callsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${result.success} calls deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete calls');
    },
  });
}

/**
 * Bulk update calls
 */
export function useBulkUpdateCalls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<CallFormData> }) =>
      callsApi.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${result.success} calls updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update calls');
    },
  });
}
