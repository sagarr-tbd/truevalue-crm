import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callsApi } from "@/lib/api/calls";
import type { CallDisplay } from "@/lib/api/mock/calls";
import { toast } from "sonner";

// Query Keys
export const callKeys = {
  all: ["calls"] as const,
  lists: () => [...callKeys.all, "list"] as const,
  detail: (id: number) => [...callKeys.all, "detail", id] as const,
};

// GET all calls
export function useCalls() {
  return useQuery({
    queryKey: callKeys.lists(),
    queryFn: callsApi.getAll,
  });
}

// GET single call
export function useCall(id: number) {
  return useQuery({
    queryKey: callKeys.detail(id),
    queryFn: () => callsApi.getById(id),
    enabled: !!id,
  });
}

// CREATE call
export function useCreateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: callsApi.create,
    onMutate: async (newCall) => {
      await queryClient.cancelQueries({ queryKey: callKeys.lists() });
      const previous = queryClient.getQueryData(callKeys.lists());
      
      queryClient.setQueryData(callKeys.lists(), (old: CallDisplay[] = []) => [
        { ...newCall, id: Date.now() } as CallDisplay,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newCall, context) => {
      if (context?.previous) {
        queryClient.setQueryData(callKeys.lists(), context.previous);
      }
      toast.error("Failed to create call");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      toast.success("Call created successfully!");
    },
  });
}

// UPDATE call
export function useUpdateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CallDisplay> }) =>
      callsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: callKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      toast.success("Call updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update call");
    },
  });
}

// DELETE call
export function useDeleteCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: callsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      toast.success("Call deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete call");
    },
  });
}

// BULK DELETE
export function useBulkDeleteCalls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: callsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      toast.success(`${ids.length} calls deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete calls");
    },
  });
}

// BULK UPDATE
export function useBulkUpdateCalls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<CallDisplay> }) =>
      callsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      toast.success(`${ids.length} calls updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update calls");
    },
  });
}
