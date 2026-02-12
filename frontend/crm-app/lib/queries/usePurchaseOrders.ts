import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrdersApi } from "@/lib/api/purchaseOrders";
import type { PurchaseOrderDisplay } from "@/lib/api/mock/purchaseOrders";
import { toast } from "sonner";

// Query keys
export const purchaseOrderKeys = {
  all: ["purchaseOrders"] as const,
  lists: () => [...purchaseOrderKeys.all, "list"] as const,
  list: (filters: string) => [...purchaseOrderKeys.lists(), { filters }] as const,
  details: () => [...purchaseOrderKeys.all, "detail"] as const,
  detail: (id: number) => [...purchaseOrderKeys.details(), id] as const,
};

// Queries
export function usePurchaseOrders() {
  return useQuery({
    queryKey: purchaseOrderKeys.lists(),
    queryFn: () => purchaseOrdersApi.getAll(),
  });
}

export function usePurchaseOrder(id: number) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => purchaseOrdersApi.getById(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<PurchaseOrderDisplay>) => purchaseOrdersApi.create(data),
    onMutate: async (newPurchaseOrder) => {
      await queryClient.cancelQueries({ queryKey: purchaseOrderKeys.lists() });
      const previousPurchaseOrders = queryClient.getQueryData(purchaseOrderKeys.lists());

      queryClient.setQueryData(purchaseOrderKeys.lists(), (old: PurchaseOrderDisplay[] = []) => [
        ...old,
        { ...newPurchaseOrder, id: Date.now(), initials: "??" } as PurchaseOrderDisplay,
      ]);

      return { previousPurchaseOrders };
    },
    onError: (_err, _newPurchaseOrder, context) => {
      if (context?.previousPurchaseOrders) {
        queryClient.setQueryData(purchaseOrderKeys.lists(), context.previousPurchaseOrders);
      }
      toast.error("Failed to create purchase order");
    },
    onSuccess: () => {
      toast.success("Purchase order created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PurchaseOrderDisplay> }) =>
      purchaseOrdersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      toast.success("Purchase order updated successfully");
    },
    onError: () => {
      toast.error("Failed to update purchase order");
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => purchaseOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      toast.success("Purchase order deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete purchase order");
    },
  });
}

export function useBulkDeletePurchaseOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => purchaseOrdersApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      toast.success("Purchase orders deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete purchase orders");
    },
  });
}

export function useBulkUpdatePurchaseOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<PurchaseOrderDisplay> }) =>
      purchaseOrdersApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      toast.success("Purchase orders updated successfully");
    },
    onError: () => {
      toast.error("Failed to update purchase orders");
    },
  });
}
