import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api/leads';
import type { Lead } from '@/lib/types';
import { toast } from 'sonner';

// Query Keys (for cache management)
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  detail: (id: number) => [...leadKeys.all, 'detail', id] as const,
};

// GET all leads
export function useLeads() {
  return useQuery({
    queryKey: leadKeys.lists(),
    queryFn: leadsApi.getAll,
  });
}

// GET single lead by ID
export function useLead(id: number) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => leadsApi.getById(id),
    enabled: !!id, // Only run if id exists
  });
}

// CREATE lead
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadsApi.create,
    onMutate: async (newLead) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() });
      const previous = queryClient.getQueryData(leadKeys.lists());
      
      // Optimistically add new lead to cache
      queryClient.setQueryData(leadKeys.lists(), (old: Lead[] = []) => [
        { ...newLead, id: Date.now() } as Lead,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newLead, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(leadKeys.lists(), context.previous);
      }
      toast.error('Failed to create lead');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success('Lead created successfully!');
    },
  });
}

// UPDATE lead
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lead> }) =>
      leadsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success('Lead updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update lead');
    },
  });
}

// DELETE lead
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success('Lead deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete lead');
    },
  });
}

// BULK DELETE leads
export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success(`${ids.length} leads deleted successfully!`);
    },
    onError: () => {
      toast.error('Failed to delete leads');
    },
  });
}

// BULK UPDATE leads
export function useBulkUpdateLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<Lead> }) =>
      leadsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success(`${ids.length} leads updated successfully!`);
    },
    onError: () => {
      toast.error('Failed to update leads');
    },
  });
}
