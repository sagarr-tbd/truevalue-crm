import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { forecastsApi } from "@/lib/api/forecasts";
import type { ForecastDisplay } from "@/lib/api/mock/forecasts";
import { toast } from "sonner";

// Query keys
export const forecastKeys = {
  all: ["forecasts"] as const,
  lists: () => [...forecastKeys.all, "list"] as const,
  list: (filters: string) => [...forecastKeys.lists(), { filters }] as const,
  details: () => [...forecastKeys.all, "detail"] as const,
  detail: (id: number) => [...forecastKeys.details(), id] as const,
};

// Queries
export function useForecasts() {
  return useQuery({
    queryKey: forecastKeys.lists(),
    queryFn: () => forecastsApi.getAll(),
  });
}

export function useForecast(id: number) {
  return useQuery({
    queryKey: forecastKeys.detail(id),
    queryFn: () => forecastsApi.getById(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ForecastDisplay>) => forecastsApi.create(data),
    onMutate: async (newForecast) => {
      await queryClient.cancelQueries({ queryKey: forecastKeys.lists() });
      const previousForecasts = queryClient.getQueryData(forecastKeys.lists());

      queryClient.setQueryData(forecastKeys.lists(), (old: ForecastDisplay[] = []) => [
        ...old,
        { ...newForecast, id: Date.now(), initials: "??" } as ForecastDisplay,
      ]);

      return { previousForecasts };
    },
    onError: (_err, _newForecast, context) => {
      if (context?.previousForecasts) {
        queryClient.setQueryData(forecastKeys.lists(), context.previousForecasts);
      }
      toast.error("Failed to create forecast");
    },
    onSuccess: () => {
      toast.success("Forecast created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: forecastKeys.lists() });
    },
  });
}

export function useUpdateForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ForecastDisplay> }) =>
      forecastsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastKeys.lists() });
      toast.success("Forecast updated successfully");
    },
    onError: () => {
      toast.error("Failed to update forecast");
    },
  });
}

export function useDeleteForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => forecastsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastKeys.lists() });
      toast.success("Forecast deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete forecast");
    },
  });
}

export function useBulkDeleteForecasts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => forecastsApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastKeys.lists() });
      toast.success("Forecasts deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete forecasts");
    },
  });
}

export function useBulkUpdateForecasts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<ForecastDisplay> }) =>
      forecastsApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastKeys.lists() });
      toast.success("Forecasts updated successfully");
    },
    onError: () => {
      toast.error("Failed to update forecasts");
    },
  });
}
