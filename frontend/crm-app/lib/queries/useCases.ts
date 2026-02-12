import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CaseDisplay } from "@/lib/api/mock/cases";
import { casesApi } from "@/lib/api/cases";
import { toast } from "sonner";

// Query keys
export const caseKeys = {
  all: ["cases"] as const,
  lists: () => [...caseKeys.all, "list"] as const,
  detail: (id: number) => [...caseKeys.all, "detail", id] as const,
};

// GET all cases
export function useCases() {
  return useQuery({
    queryKey: caseKeys.lists(),
    queryFn: casesApi.getAll,
  });
}

// GET single case
export function useCase(id: number) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => casesApi.getAll().then((cases) => cases.find((c) => c.id === id)),
    enabled: !!id,
  });
}

// CREATE case
export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: casesApi.create,
    onMutate: async (newCase) => {
      await queryClient.cancelQueries({ queryKey: caseKeys.lists() });
      const previous = queryClient.getQueryData(caseKeys.lists());

      queryClient.setQueryData(caseKeys.lists(), (old: CaseDisplay[] = []) => [
        { ...newCase, id: Date.now(), created: new Date().toISOString().split("T")[0] } as CaseDisplay,
        ...old,
      ]);

      return { previous };
    },
    onError: (err, newCase, context) => {
      if (context?.previous) {
        queryClient.setQueryData(caseKeys.lists(), context.previous);
      }
      toast.error("Failed to create case");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast.success("Case created successfully!");
    },
  });
}

// UPDATE case
export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CaseDisplay> }) =>
      casesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast.success("Case updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update case");
    },
  });
}

// DELETE case
export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: casesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast.success("Case deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete case");
    },
  });
}

// BULK DELETE
export function useBulkDeleteCases() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: casesApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast.success(`${ids.length} cases deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete cases");
    },
  });
}

// BULK UPDATE
export function useBulkUpdateCases() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<CaseDisplay> }) =>
      casesApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast.success(`${ids.length} cases updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update cases");
    },
  });
}
