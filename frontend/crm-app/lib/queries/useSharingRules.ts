import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sharingRulesApi,
  type SharingRuleItem,
  type SharingRuleDetail,
  type CreateSharingRuleData,
  type UpdateSharingRuleData,
  type SharingType,
} from '@/lib/api/sharing-rules-api';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const sharingKeys = {
  all: ['sharing-rules'] as const,
  lists: () => [...sharingKeys.all, 'list'] as const,
  list: (activeOnly?: boolean) => [...sharingKeys.lists(), activeOnly] as const,
  details: () => [...sharingKeys.all, 'detail'] as const,
  detail: (id: string) => [...sharingKeys.details(), id] as const,
  byModule: (module: string) => [...sharingKeys.all, 'module', module] as const,
  effective: (module: string) => [...sharingKeys.all, 'effective', module] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all sharing rules for the organization.
 */
export function useSharingRules(activeOnly = true) {
  return useQuery<SharingRuleItem[]>({
    queryKey: sharingKeys.list(activeOnly),
    queryFn: () => sharingRulesApi.listRules(activeOnly),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single sharing rule by ID.
 */
export function useSharingRuleDetail(ruleId: string | null) {
  return useQuery<SharingRuleDetail | null>({
    queryKey: sharingKeys.detail(ruleId!),
    queryFn: () => sharingRulesApi.getRule(ruleId!),
    enabled: !!ruleId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch sharing rule for a specific module.
 */
export function useSharingRuleByModule(module: string | null) {
  return useQuery<SharingRuleDetail | null>({
    queryKey: sharingKeys.byModule(module!),
    queryFn: () => sharingRulesApi.getRuleByModule(module!),
    enabled: !!module,
    staleTime: 60 * 1000,
  });
}

/**
 * Get effective sharing type for a module.
 */
export function useEffectiveSharing(module: string | null) {
  return useQuery<SharingType>({
    queryKey: sharingKeys.effective(module!),
    queryFn: () => sharingRulesApi.getEffectiveSharing(module!),
    enabled: !!module,
    staleTime: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new sharing rule.
 */
export function useCreateSharingRule() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSharingRuleData) => sharingRulesApi.createRule(data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: sharingKeys.lists() });
      qc.invalidateQueries({ queryKey: sharingKeys.byModule(vars.module) });
    },
  });
}

/**
 * Update an existing sharing rule.
 */
export function useUpdateSharingRule() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: UpdateSharingRuleData }) =>
      sharingRulesApi.updateRule(ruleId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: sharingKeys.detail(vars.ruleId) });
      qc.invalidateQueries({ queryKey: sharingKeys.lists() });
    },
  });
}

/**
 * Delete a sharing rule.
 */
export function useDeleteSharingRule() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (ruleId: string) => sharingRulesApi.deleteRule(ruleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sharingKeys.lists() });
    },
  });
}

/**
 * Ensure default sharing rules exist for all modules.
 */
export function useEnsureDefaultRules() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: () => sharingRulesApi.ensureDefaultRules(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sharingKeys.lists() });
    },
  });
}
