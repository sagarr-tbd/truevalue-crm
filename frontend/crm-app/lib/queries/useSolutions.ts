import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SolutionDisplay } from "@/lib/api/mock/solutions";
import { solutionsApi } from "@/lib/api/solutions";
import { toast } from "sonner";

// Query keys
export const solutionKeys = {
  all: ["solutions"] as const,
  lists: () => [...solutionKeys.all, "list"] as const,
  detail: (id: number) => [...solutionKeys.all, "detail", id] as const,
};

// GET all solutions
export function useSolutions() {
  return useQuery({
    queryKey: solutionKeys.lists(),
    queryFn: solutionsApi.getAll,
  });
}

// GET single solution
export function useSolution(id: number) {
  return useQuery({
    queryKey: solutionKeys.detail(id),
    queryFn: () => solutionsApi.getAll().then((solutions) => solutions.find((s) => s.id === id)),
    enabled: !!id,
  });
}

// CREATE solution
export function useCreateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: solutionsApi.create,
    onMutate: async (newSolution) => {
      await queryClient.cancelQueries({ queryKey: solutionKeys.lists() });
      const previous = queryClient.getQueryData(solutionKeys.lists());

      queryClient.setQueryData(solutionKeys.lists(), (old: SolutionDisplay[] = []) => [
        { ...newSolution, id: Date.now(), created: new Date().toISOString().split("T")[0] } as SolutionDisplay,
        ...old,
      ]);

      return { previous };
    },
    onError: (err, newSolution, context) => {
      if (context?.previous) {
        queryClient.setQueryData(solutionKeys.lists(), context.previous);
      }
      toast.error("Failed to create solution");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.lists() });
      toast.success("Solution created successfully!");
    },
  });
}

// UPDATE solution
export function useUpdateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SolutionDisplay> }) =>
      solutionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: solutionKeys.lists() });
      toast.success("Solution updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update solution");
    },
  });
}

// DELETE solution
export function useDeleteSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: solutionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.lists() });
      toast.success("Solution deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete solution");
    },
  });
}

// BULK DELETE
export function useBulkDeleteSolutions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: solutionsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.lists() });
      toast.success(`${ids.length} solutions deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete solutions");
    },
  });
}

// BULK UPDATE
export function useBulkUpdateSolutions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<SolutionDisplay> }) =>
      solutionsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.lists() });
      toast.success(`${ids.length} solutions updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update solutions");
    },
  });
}
