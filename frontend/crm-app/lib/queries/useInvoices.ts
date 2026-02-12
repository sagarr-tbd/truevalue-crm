import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api/invoices";
import type { InvoiceDisplay } from "@/lib/api/mock/invoices";
import { toast } from "sonner";

// Query keys
export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters: string) => [...invoiceKeys.lists(), { filters }] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
};

// Queries
export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: () => invoicesApi.getAll(),
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<InvoiceDisplay>) => invoicesApi.create(data),
    onMutate: async (newInvoice) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.lists() });
      const previousInvoices = queryClient.getQueryData(invoiceKeys.lists());

      queryClient.setQueryData(invoiceKeys.lists(), (old: InvoiceDisplay[] = []) => [
        ...old,
        { ...newInvoice, id: Date.now(), initials: "??" } as InvoiceDisplay,
      ]);

      return { previousInvoices };
    },
    onError: (_err, _newInvoice, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(invoiceKeys.lists(), context.previousInvoices);
      }
      toast.error("Failed to create invoice");
    },
    onSuccess: () => {
      toast.success("Invoice created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InvoiceDisplay> }) =>
      invoicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Invoice updated successfully");
    },
    onError: () => {
      toast.error("Failed to update invoice");
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Invoice deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete invoice");
    },
  });
}

export function useBulkDeleteInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => invoicesApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Invoices deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete invoices");
    },
  });
}

export function useBulkUpdateInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<InvoiceDisplay> }) =>
      invoicesApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Invoices updated successfully");
    },
    onError: () => {
      toast.error("Failed to update invoices");
    },
  });
}
