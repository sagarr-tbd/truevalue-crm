import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesOrdersApi } from "@/lib/api/salesOrders";
import type { SalesOrderDisplay } from "@/lib/api/mock/salesOrders";
import { toast } from "sonner";

// Query keys
export const salesOrderKeys = {
  all: ["salesOrders"] as const,
  lists: () => [...salesOrderKeys.all, "list"] as const,
  list: (filters: string) => [...salesOrderKeys.lists(), { filters }] as const,
  details: () => [...salesOrderKeys.all, "detail"] as const,
  detail: (id: number) => [...salesOrderKeys.details(), id] as const,
};

// Queries
export function useSalesOrders() {
  return useQuery({
    queryKey: salesOrderKeys.lists(),
    queryFn: () => salesOrdersApi.getAll(),
  });
}

export function useSalesOrder(id: number) {
  return useQuery({
    queryKey: salesOrderKeys.detail(id),
    queryFn: () => salesOrdersApi.getById(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SalesOrderDisplay>) => salesOrdersApi.create(data),
    onMutate: async (newSalesOrder) => {
      await queryClient.cancelQueries({ queryKey: salesOrderKeys.lists() });
      const previousSalesOrders = queryClient.getQueryData(salesOrderKeys.lists());

      queryClient.setQueryData(salesOrderKeys.lists(), (old: SalesOrderDisplay[] = []) => [
        ...old,
        { ...newSalesOrder, id: Date.now(), initials: "??" } as SalesOrderDisplay,
      ]);

      return { previousSalesOrders };
    },
    onError: (_err, _newSalesOrder, context) => {
      if (context?.previousSalesOrders) {
        queryClient.setQueryData(salesOrderKeys.lists(), context.previousSalesOrders);
      }
      toast.error("Failed to create sales order");
    },
    onSuccess: () => {
      toast.success("Sales order created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SalesOrderDisplay> }) =>
      salesOrdersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      toast.success("Sales order updated successfully");
    },
    onError: () => {
      toast.error("Failed to update sales order");
    },
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => salesOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      toast.success("Sales order deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete sales order");
    },
  });
}

export function useBulkDeleteSalesOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => salesOrdersApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      toast.success("Sales orders deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete sales orders");
    },
  });
}

export function useBulkUpdateSalesOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<SalesOrderDisplay> }) =>
      salesOrdersApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      toast.success("Sales orders updated successfully");
    },
    onError: () => {
      toast.error("Failed to update sales orders");
    },
  });
}
