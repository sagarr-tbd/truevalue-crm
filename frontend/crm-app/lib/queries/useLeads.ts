import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  leadsApi,
  LeadQueryParams,
  LeadFormData,
  ConvertLeadParams,
} from '@/lib/api/leads';
import { toast } from 'sonner';

// Re-export types for convenience
export type {
  LeadQueryParams,
  LeadFormData,
  LeadViewModel,
  ConvertLeadParams,
  ConvertLeadResult,
  BulkOperationResult,
  FilterCondition,
  FilterGroup as LeadFilterGroup,
  LeadStats,
  PaginatedLeadsResponse,
} from '@/lib/api/leads';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (params?: LeadQueryParams) => [...leadKeys.lists(), params] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const,
  options: () => [...leadKeys.all, 'options'] as const,
  sources: () => [...leadKeys.all, 'sources'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch leads with pagination and filtering
 */
export function useLeads(params: LeadQueryParams = {}) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => leadsApi.getAll(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch single lead by ID (UUID)
 */
export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch unique lead sources
 */
export function useLeadSources() {
  return useQuery({
    queryKey: leadKeys.sources(),
    queryFn: () => leadsApi.getSources(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Get leads as select options (for dropdowns)
 */
export function useLeadOptions() {
  return useQuery({
    queryKey: leadKeys.options(),
    queryFn: () => leadsApi.getAsOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new lead
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LeadFormData) => leadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success('Lead created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create lead');
    },
  });
}

/**
 * Update a lead
 */
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeadFormData }) =>
      leadsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success('Lead updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update lead');
    },
  });
}

/**
 * Delete a lead
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: leadKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success('Lead deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete lead');
    },
  });
}

/**
 * Bulk delete leads
 */
export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => leadsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success(`${result.success} leads deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete leads');
    },
  });
}

/**
 * Bulk update leads
 */
export function useBulkUpdateLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<LeadFormData> }) =>
      leadsApi.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success(`${result.success} leads updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update leads');
    },
  });
}

/**
 * Convert a lead to contact/company/deal
 */
export function useConvertLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: ConvertLeadParams }) =>
      leadsApi.convert(id, params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      
      // Also invalidate contacts/companies/deals if they were created
      if (result.contact?.created) {
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      }
      if (result.company?.created) {
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      }
      if (result.deal) {
        queryClient.invalidateQueries({ queryKey: ['deals'] });
      }
      
      toast.success('Lead converted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to convert lead');
    },
  });
}

/**
 * Disqualify a lead
 */
export function useDisqualifyLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      leadsApi.disqualify(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success('Lead disqualified');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disqualify lead');
    },
  });
}

/**
 * Update lead status only
 */
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leadsApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      toast.success('Lead status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}
