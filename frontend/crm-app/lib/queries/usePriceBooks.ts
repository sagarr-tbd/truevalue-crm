import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { priceBooksApi } from "@/lib/api/priceBooks";
import type { PriceBookDisplay } from "@/lib/api/mock/priceBooks";
import { toast } from "sonner";

// Query keys
export const priceBookKeys = {
  all: ["priceBooks"] as const,
  lists: () => [...priceBookKeys.all, "list"] as const,
  list: (filters: string) => [...priceBookKeys.lists(), { filters }] as const,
  details: () => [...priceBookKeys.all, "detail"] as const,
  detail: (id: number) => [...priceBookKeys.details(), id] as const,
};

// Queries
export function usePriceBooks() {
  return useQuery({
    queryKey: priceBookKeys.lists(),
    queryFn: () => priceBooksApi.getAll(),
  });
}

export function usePriceBook(id: number) {
  return useQuery({
    queryKey: priceBookKeys.detail(id),
    queryFn: () => priceBooksApi.getById(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreatePriceBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<PriceBookDisplay>) => priceBooksApi.create(data),
    onMutate: async (newPriceBook) => {
      await queryClient.cancelQueries({ queryKey: priceBookKeys.lists() });
      const previousPriceBooks = queryClient.getQueryData(priceBookKeys.lists());

      queryClient.setQueryData(priceBookKeys.lists(), (old: PriceBookDisplay[] = []) => [
        ...old,
        { ...newPriceBook, id: Date.now(), initials: "??" } as PriceBookDisplay,
      ]);

      return { previousPriceBooks };
    },
    onError: (_err, _newPriceBook, context) => {
      if (context?.previousPriceBooks) {
        queryClient.setQueryData(priceBookKeys.lists(), context.previousPriceBooks);
      }
      toast.error("Failed to create price book");
    },
    onSuccess: () => {
      toast.success("Price book created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: priceBookKeys.lists() });
    },
  });
}

export function useUpdatePriceBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PriceBookDisplay> }) =>
      priceBooksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceBookKeys.lists() });
      toast.success("Price book updated successfully");
    },
    onError: () => {
      toast.error("Failed to update price book");
    },
  });
}

export function useDeletePriceBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => priceBooksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceBookKeys.lists() });
      toast.success("Price book deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete price book");
    },
  });
}

export function useBulkDeletePriceBooks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => priceBooksApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceBookKeys.lists() });
      toast.success("Price books deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete price books");
    },
  });
}

export function useBulkUpdatePriceBooks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<PriceBookDisplay> }) =>
      priceBooksApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceBookKeys.lists() });
      toast.success("Price books updated successfully");
    },
    onError: () => {
      toast.error("Failed to update price books");
    },
  });
}
