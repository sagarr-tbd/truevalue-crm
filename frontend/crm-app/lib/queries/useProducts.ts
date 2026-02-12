import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import type { ProductDisplay } from "../api/mock/products";
import { toast } from "sonner";

// Query keys
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

// Get all products
export function useProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: () => productsApi.getAll(),
  });
}

// Get single product
export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.create,
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });
      const previous = queryClient.getQueryData(productKeys.lists());
      
      queryClient.setQueryData(productKeys.lists(), (old: ProductDisplay[] = []) => [
        { ...newProduct, id: Date.now() } as ProductDisplay,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newProduct, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productKeys.lists(), context.previous);
      }
      toast.error("Failed to create product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product created successfully!");
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductDisplay> }) =>
      productsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update product");
    },
  });
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete product");
    },
  });
}

// Bulk delete products
export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success(`${ids.length} products deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete products");
    },
  });
}

// Bulk update products
export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<ProductDisplay> }) =>
      productsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success(`${ids.length} products updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update products");
    },
  });
}
