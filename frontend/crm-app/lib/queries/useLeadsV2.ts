import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { leadsV2Api, LeadV2, LeadV2QueryParams, LeadV2Stats } from '@/lib/api/leadsV2';
import { toast } from 'sonner';

export const leadsV2QueryKeys = {
  all: ['leadsV2'] as const,
  lists: () => [...leadsV2QueryKeys.all, 'list'] as const,
  list: (params: LeadV2QueryParams) => [...leadsV2QueryKeys.lists(), params] as const,
  details: () => [...leadsV2QueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadsV2QueryKeys.details(), id] as const,
  stats: () => [...leadsV2QueryKeys.all, 'stats'] as const,
};

export function useLeadsV2(
  params?: LeadV2QueryParams,
  options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof leadsV2Api.list>>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: leadsV2QueryKeys.list(params || {}),
    queryFn: () => leadsV2Api.list(params),
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

export function useLeadV2(
  id: string,
  options?: Omit<UseQueryOptions<LeadV2>, 'queryKey' | 'queryFn'>
) {
  return useQuery<LeadV2, Error>({
    queryKey: leadsV2QueryKeys.detail(id),
    queryFn: () => leadsV2Api.getById(id),
    enabled: !!id,
    staleTime: 60000,
    ...options,
  });
}

export function useLeadsV2Stats(
  options?: Omit<UseQueryOptions<LeadV2Stats>, 'queryKey' | 'queryFn'>
) {
  return useQuery<LeadV2Stats, Error>({
    queryKey: leadsV2QueryKeys.stats(),
    queryFn: () => leadsV2Api.stats(),
    staleTime: 60000,
    ...options,
  });
}

export function useCreateLeadV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<LeadV2>) => leadsV2Api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.stats() });
      toast.success('Lead created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create lead';
      toast.error(message);
    },
  });
}

export function useUpdateLeadV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeadV2> }) => 
      leadsV2Api.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.stats() });
      toast.success('Lead updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update lead';
      toast.error(message);
    },
  });
}

export function useDeleteLeadV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadsV2Api.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.stats() });
      toast.success('Lead deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete lead';
      toast.error(message);
    },
  });
}

export function useConvertLeadV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: any }) => 
      leadsV2Api.convert(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.stats() });
      toast.success('Lead converted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to convert lead';
      toast.error(message);
    },
  });
}

export function useDisqualifyLeadV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      leadsV2Api.disqualify(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.stats() });
      toast.success('Lead disqualified');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to disqualify lead';
      toast.error(message);
    },
  });
}

export function useBulkDeleteLeadsV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => leadsV2Api.bulkDelete(ids),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.stats() });
      toast.success(data.message || 'Leads deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete leads';
      toast.error(message);
    },
  });
}

export function useBulkUpdateLeadsV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<LeadV2> }) => 
      leadsV2Api.bulkUpdate(ids, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.stats() });
      toast.success(data.message || 'Leads updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update leads';
      toast.error(message);
    },
  });
}
