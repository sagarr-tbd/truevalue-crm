import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dealsApi } from "../api/deals";
import type { DealDisplay } from "../api/mock/deals";
import { toast } from "sonner";

// Query keys
export const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: number) => [...dealKeys.details(), id] as const,
};

// Get all deals
export function useDeals() {
  return useQuery({
    queryKey: dealKeys.lists(),
    queryFn: () => dealsApi.getAll(),
  });
}

// Get single deal
export function useDeal(id: number) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => dealsApi.getById(id),
    enabled: !!id,
  });
}

// Create deal
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dealsApi.create,
    onMutate: async (newDeal) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.lists() });
      const previous = queryClient.getQueryData(dealKeys.lists());
      
      queryClient.setQueryData(dealKeys.lists(), (old: DealDisplay[] = []) => [
        { ...newDeal, id: Date.now() } as DealDisplay,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newDeal, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dealKeys.lists(), context.previous);
      }
      toast.error("Failed to create deal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success("Deal created successfully!");
    },
  });
}

// Update deal
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DealDisplay> }) =>
      dealsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success("Deal updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update deal");
    },
  });
}

// Delete deal
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dealsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success("Deal deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete deal");
    },
  });
}

// Bulk delete deals
export function useBulkDeleteDeals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dealsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success(`${ids.length} deals deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete deals");
    },
  });
}

// Bulk update deals
export function useBulkUpdateDeals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<DealDisplay> }) =>
      dealsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success(`${ids.length} deals updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update deals");
    },
  });
}
