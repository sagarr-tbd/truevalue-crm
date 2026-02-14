import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  companiesApi, 
  accountsApi,
  AccountDisplay, 
  AccountFormData,
  CompanyQueryParams,
  PaginatedAccountsResponse,
  AccountStats,
  FilterGroup,
} from "../api/companies";
import { toast } from "sonner";

// Re-export types for convenience
export type {
  CompanyQueryParams as AccountQueryParams,
  AccountFormData,
  AccountStats,
  PaginatedAccountsResponse,
  FilterGroup as AccountFilterGroup,
} from "../api/companies";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: (params?: CompanyQueryParams) => [...accountKeys.lists(), params] as const,
  details: () => [...accountKeys.all, "detail"] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  options: () => [...accountKeys.all, "options"] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch accounts with pagination and filtering (server-side)
 */
export function useAccounts(
  params: CompanyQueryParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: accountKeys.list(params),
    queryFn: () => companiesApi.getAll(params),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000, // 1 minute - list data can be slightly stale
  });
}

/**
 * Fetch single account by ID (UUID)
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => companiesApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - detail data can be cached longer
  });
}

/**
 * Fetch accounts as dropdown options
 * Used for select fields in forms
 */
export function useAccountOptions() {
  return useQuery({
    queryKey: accountKeys.options(),
    queryFn: () => companiesApi.getAsOptions(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Re-export AccountDisplay type for consumers
export type { AccountDisplay };

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new account
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountFormData) => companiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Account created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create account");
    },
  });
}

/**
 * Update an account
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountFormData }) =>
      companiesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Account updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update account");
    },
  });
}

/**
 * Delete an account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companiesApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: accountKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Account deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });
}

/**
 * Bulk delete accounts
 */
export function useBulkDeleteAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => companiesApi.bulkDelete(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success(`${ids.length} accounts deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete accounts");
    },
  });
}

/**
 * Bulk update accounts
 */
export function useBulkUpdateAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<AccountFormData> }) =>
      companiesApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success(`${ids.length} accounts updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update accounts");
    },
  });
}

// ============================================================================
// COMPANY-CONTACT ASSOCIATION HOOKS
// ============================================================================

/**
 * Link a contact to a company/account
 */
export function useLinkContactToAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: {
      companyId: string;
      data: { contactId: string; title?: string; department?: string; isPrimary?: boolean };
    }) => companiesApi.linkContact(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(companyId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      // Also invalidate contacts list since the contact's company changed
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact linked to account!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link contact');
    },
  });
}

/**
 * Unlink a contact from a company/account
 */
export function useUnlinkContactFromAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, contactId }: { companyId: string; contactId: string }) =>
      companiesApi.unlinkContact(companyId, contactId),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(companyId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact unlinked from account!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlink contact');
    },
  });
}

// Legacy wrapper for backward compatibility
export { accountsApi };
