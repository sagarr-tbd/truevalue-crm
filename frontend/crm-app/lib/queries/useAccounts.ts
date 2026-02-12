import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "../api/accounts";
import type { AccountDisplay } from "../api/mock/accounts";
import { toast } from "sonner";

// Query keys
export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  details: () => [...accountKeys.all, "detail"] as const,
  detail: (id: number) => [...accountKeys.details(), id] as const,
};

// Get all accounts
export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.lists(),
    queryFn: () => accountsApi.getAll(),
  });
}

// Get single account
export function useAccount(id: number) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountsApi.getById(id),
    enabled: !!id,
  });
}

// Create account
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.create,
    onMutate: async (newAccount) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.lists() });
      const previous = queryClient.getQueryData(accountKeys.lists());
      
      queryClient.setQueryData(accountKeys.lists(), (old: AccountDisplay[] = []) => [
        { ...newAccount, id: Date.now() } as AccountDisplay,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newAccount, context) => {
      if (context?.previous) {
        queryClient.setQueryData(accountKeys.lists(), context.previous);
      }
      toast.error("Failed to create account");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Account created successfully!");
    },
  });
}

// Update account
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AccountDisplay> }) =>
      accountsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Account updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update account");
    },
  });
}

// Delete account
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Account deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete account");
    },
  });
}

// Bulk delete accounts
export function useBulkDeleteAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success(`${ids.length} accounts deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete accounts");
    },
  });
}

// Bulk update accounts
export function useBulkUpdateAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<AccountDisplay> }) =>
      accountsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success(`${ids.length} accounts updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update accounts");
    },
  });
}
