import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import type { TaskDisplay } from "@/lib/api/mock/tasks";
import { toast } from "sonner";

// Query Keys
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  detail: (id: number) => [...taskKeys.all, "detail", id] as const,
};

// GET all tasks
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: tasksApi.getAll,
  });
}

// GET single task
export function useTask(id: number) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
}

// CREATE task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.create,
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      const previous = queryClient.getQueryData(taskKeys.lists());
      
      queryClient.setQueryData(taskKeys.lists(), (old: TaskDisplay[] = []) => [
        { ...newTask, id: Date.now() } as TaskDisplay,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newTask, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.lists(), context.previous);
      }
      toast.error("Failed to create task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success("Task created successfully!");
    },
  });
}

// UPDATE task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TaskDisplay> }) =>
      tasksApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success("Task updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });
}

// DELETE task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success("Task deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}

// BULK DELETE
export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success(`${ids.length} tasks deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete tasks");
    },
  });
}

// BULK UPDATE
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<TaskDisplay> }) =>
      tasksApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success(`${ids.length} tasks updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update tasks");
    },
  });
}
