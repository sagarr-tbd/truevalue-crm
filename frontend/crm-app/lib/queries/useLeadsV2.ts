import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsV2Api, type LeadV2, type LeadV2ListItem, type LeadV2QueryParams } from '@/lib/api/leadsV2';
import { toast } from 'sonner';
import { createEntityV2QueryKeys, createEntityV2Hooks } from './useEntityV2';

export type { LeadV2Stats } from '@/lib/api/leadsV2';

export const leadsV2QueryKeys = createEntityV2QueryKeys('leadsV2');

const hooks = createEntityV2Hooks<LeadV2, LeadV2ListItem, LeadV2QueryParams>(
  leadsV2Api,
  leadsV2QueryKeys,
  'Lead',
  'Leads',
);

export const useLeadsV2 = hooks.useList;
export const useLeadV2 = hooks.useDetail;
export const useLeadsV2Stats = hooks.useStats;
export const useCreateLeadV2 = hooks.useCreate;
export const useUpdateLeadV2 = hooks.useUpdate;
export const useDeleteLeadV2 = hooks.useDelete;
export const useBulkDeleteLeadsV2 = hooks.useBulkDelete;
export const useBulkUpdateLeadsV2 = hooks.useBulkUpdate;

export function useConvertLeadV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: Record<string, unknown> }) =>
      leadsV2Api.convert(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadsV2QueryKeys.stats() });
      toast.success('Lead converted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to convert lead');
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
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to disqualify lead');
    },
  });
}
