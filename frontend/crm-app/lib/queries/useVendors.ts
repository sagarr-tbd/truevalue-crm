import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorsApi } from "../api/vendors";
import type { VendorDisplay } from "../api/mock/vendors";
import { toast } from "sonner";

// Query keys
export const vendorKeys = {
  all: ["vendors"] as const,
  lists: () => [...vendorKeys.all, "list"] as const,
  details: () => [...vendorKeys.all, "detail"] as const,
  detail: (id: number) => [...vendorKeys.details(), id] as const,
};

// Get all vendors
export function useVendors() {
  return useQuery({
    queryKey: vendorKeys.lists(),
    queryFn: () => vendorsApi.getAll(),
  });
}

// Get single vendor
export function useVendor(id: number) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => vendorsApi.getById(id),
    enabled: !!id,
  });
}

// Create vendor
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorsApi.create,
    onMutate: async (newVendor) => {
      await queryClient.cancelQueries({ queryKey: vendorKeys.lists() });
      const previous = queryClient.getQueryData(vendorKeys.lists());
      
      queryClient.setQueryData(vendorKeys.lists(), (old: VendorDisplay[] = []) => [
        { ...newVendor, id: Date.now() } as VendorDisplay,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newVendor, context) => {
      if (context?.previous) {
        queryClient.setQueryData(vendorKeys.lists(), context.previous);
      }
      toast.error("Failed to create vendor");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success("Vendor created successfully!");
    },
  });
}

// Update vendor
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<VendorDisplay> }) =>
      vendorsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success("Vendor updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update vendor");
    },
  });
}

// Delete vendor
export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success("Vendor deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete vendor");
    },
  });
}

// Bulk delete vendors
export function useBulkDeleteVendors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success(`${ids.length} vendors deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete vendors");
    },
  });
}

// Bulk update vendors
export function useBulkUpdateVendors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<VendorDisplay> }) =>
      vendorsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success(`${ids.length} vendors updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update vendors");
    },
  });
}
