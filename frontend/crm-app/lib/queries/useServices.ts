import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceDisplay } from "@/lib/api/mock/services";
import { servicesApi } from "@/lib/api/services";
import { toast } from "sonner";

// Query keys
export const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  detail: (id: number) => [...serviceKeys.all, "detail", id] as const,
};

// GET all services
export function useServices() {
  return useQuery({
    queryKey: serviceKeys.lists(),
    queryFn: servicesApi.getAll,
  });
}

// GET single service
export function useService(id: number) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => servicesApi.getAll().then((services) => services.find((s) => s.id === id)),
    enabled: !!id,
  });
}

// CREATE service
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servicesApi.create,
    onMutate: async (newService) => {
      await queryClient.cancelQueries({ queryKey: serviceKeys.lists() });
      const previous = queryClient.getQueryData(serviceKeys.lists());

      queryClient.setQueryData(serviceKeys.lists(), (old: ServiceDisplay[] = []) => [
        { ...newService, id: Date.now(), created: new Date().toISOString().split("T")[0] } as ServiceDisplay,
        ...old,
      ]);

      return { previous };
    },
    onError: (err, newService, context) => {
      if (context?.previous) {
        queryClient.setQueryData(serviceKeys.lists(), context.previous);
      }
      toast.error("Failed to create service");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success("Service created successfully!");
    },
  });
}

// UPDATE service
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServiceDisplay> }) =>
      servicesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success("Service updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update service");
    },
  });
}

// DELETE service
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success("Service deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete service");
    },
  });
}

// BULK DELETE
export function useBulkDeleteServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servicesApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success(`${ids.length} services deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete services");
    },
  });
}

// BULK UPDATE
export function useBulkUpdateServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<ServiceDisplay> }) =>
      servicesApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success(`${ids.length} services updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update services");
    },
  });
}
