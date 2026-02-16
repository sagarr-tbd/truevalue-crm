import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  notesApi,
  NoteQueryParams,
  NoteFormData,
  NoteViewModel,
} from '@/lib/api/notes';
import type { ActivityStats } from '@/lib/api/activities';
import { toast } from 'sonner';

// Re-export types for convenience
export type { NoteQueryParams, NoteFormData, NoteViewModel, ActivityStats };

// ============================================================================
// QUERY KEYS
// ============================================================================

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (params?: NoteQueryParams) => [...noteKeys.lists(), params] as const,
  detail: (id: string) => [...noteKeys.all, 'detail', id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useNotes(params: NoteQueryParams = {}) {
  return useQuery({
    queryKey: noteKeys.list(params),
    queryFn: () => notesApi.getAll(params),
    staleTime: 60 * 1000,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NoteFormData) => notesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Note created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create note');
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NoteFormData> }) =>
      notesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Note updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update note');
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Note deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete note');
    },
  });
}

export function useBulkDeleteNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => notesApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${result.success} notes deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete notes');
    },
  });
}

export function useBulkUpdateNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<NoteFormData> }) =>
      notesApi.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${result.success} notes updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notes');
    },
  });
}
