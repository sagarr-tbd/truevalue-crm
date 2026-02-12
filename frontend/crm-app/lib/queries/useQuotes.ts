import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi } from "@/lib/api/quotes";
import type { QuoteDisplay } from "@/lib/api/mock/quotes";
import { toast } from "sonner";

// Query keys
export const quoteKeys = {
  all: ["quotes"] as const,
  lists: () => [...quoteKeys.all, "list"] as const,
  list: (filters: string) => [...quoteKeys.lists(), { filters }] as const,
  details: () => [...quoteKeys.all, "detail"] as const,
  detail: (id: number) => [...quoteKeys.details(), id] as const,
};

// Queries
export function useQuotes() {
  return useQuery({
    queryKey: quoteKeys.lists(),
    queryFn: () => quotesApi.getAll(),
  });
}

export function useQuote(id: number) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: () => quotesApi.getById(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<QuoteDisplay>) => quotesApi.create(data),
    onMutate: async (newQuote) => {
      await queryClient.cancelQueries({ queryKey: quoteKeys.lists() });
      const previousQuotes = queryClient.getQueryData(quoteKeys.lists());

      queryClient.setQueryData(quoteKeys.lists(), (old: QuoteDisplay[] = []) => [
        ...old,
        { ...newQuote, id: Date.now(), initials: "??" } as QuoteDisplay,
      ]);

      return { previousQuotes };
    },
    onError: (_err, _newQuote, context) => {
      if (context?.previousQuotes) {
        queryClient.setQueryData(quoteKeys.lists(), context.previousQuotes);
      }
      toast.error("Failed to create quote");
    },
    onSuccess: () => {
      toast.success("Quote created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<QuoteDisplay> }) =>
      quotesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      toast.success("Quote updated successfully");
    },
    onError: () => {
      toast.error("Failed to update quote");
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => quotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      toast.success("Quote deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete quote");
    },
  });
}

export function useBulkDeleteQuotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => quotesApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      toast.success("Quotes deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete quotes");
    },
  });
}

export function useBulkUpdateQuotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<QuoteDisplay> }) =>
      quotesApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      toast.success("Quotes updated successfully");
    },
    onError: () => {
      toast.error("Failed to update quotes");
    },
  });
}
