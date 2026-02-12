import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectDisplay } from "@/lib/api/mock/projects";
import { projectsApi } from "@/lib/api/projects";
import { toast } from "sonner";

// Query keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  detail: (id: number) => [...projectKeys.all, "detail", id] as const,
};

// GET all projects
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: projectsApi.getAll,
  });
}

// GET single project
export function useProject(id: number) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.getAll().then((projects) => projects.find((p) => p.id === id)),
    enabled: !!id,
  });
}

// CREATE project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectsApi.create,
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });
      const previous = queryClient.getQueryData(projectKeys.lists());

      queryClient.setQueryData(projectKeys.lists(), (old: ProjectDisplay[] = []) => [
        { ...newProject, id: Date.now(), created: new Date().toISOString().split("T")[0] } as ProjectDisplay,
        ...old,
      ]);

      return { previous };
    },
    onError: (err, newProject, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.lists(), context.previous);
      }
      toast.error("Failed to create project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project created successfully!");
    },
  });
}

// UPDATE project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProjectDisplay> }) =>
      projectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update project");
    },
  });
}

// DELETE project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });
}

// BULK DELETE
export function useBulkDeleteProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success(`${ids.length} projects deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete projects");
    },
  });
}

// BULK UPDATE
export function useBulkUpdateProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<ProjectDisplay> }) =>
      projectsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success(`${ids.length} projects updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update projects");
    },
  });
}
