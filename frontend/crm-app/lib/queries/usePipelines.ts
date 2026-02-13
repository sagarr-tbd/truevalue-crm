import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  pipelinesApi, 
  PipelineFormData, 
  StageFormData,
  PipelineViewModel,
  PipelineListViewModel,
  PipelineStageViewModel,
  KanbanResponse,
  PipelineStatsResponse,
} from "../api/pipelines";
import { toast } from "sonner";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const pipelineKeys = {
  all: ["pipelines"] as const,
  lists: () => [...pipelineKeys.all, "list"] as const,
  details: () => [...pipelineKeys.all, "detail"] as const,
  detail: (id: string) => [...pipelineKeys.details(), id] as const,
  stages: (pipelineId: string) => [...pipelineKeys.all, "stages", pipelineId] as const,
  kanban: (pipelineId: string) => [...pipelineKeys.all, "kanban", pipelineId] as const,
  stats: (pipelineId: string) => [...pipelineKeys.all, "stats", pipelineId] as const,
  default: () => [...pipelineKeys.all, "default"] as const,
};

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Get all pipelines (minimal list)
 */
export function usePipelines() {
  return useQuery({
    queryKey: pipelineKeys.lists(),
    queryFn: () => pipelinesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - pipelines change infrequently
  });
}

/**
 * Get single pipeline by ID (with stages)
 */
export function usePipeline(id: string) {
  return useQuery({
    queryKey: pipelineKeys.detail(id),
    queryFn: () => pipelinesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get default pipeline
 */
export function useDefaultPipeline() {
  return useQuery({
    queryKey: pipelineKeys.default(),
    queryFn: () => pipelinesApi.getDefault(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get stages for a pipeline
 */
export function usePipelineStages(pipelineId: string) {
  return useQuery({
    queryKey: pipelineKeys.stages(pipelineId),
    queryFn: () => pipelinesApi.getStages(pipelineId),
    enabled: !!pipelineId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get Kanban view for a pipeline
 */
export function usePipelineKanban(pipelineId: string) {
  return useQuery({
    queryKey: pipelineKeys.kanban(pipelineId),
    queryFn: () => pipelinesApi.getKanban(pipelineId),
    enabled: !!pipelineId,
    staleTime: 30 * 1000, // 30 seconds - kanban needs fresher data
  });
}

/**
 * Get pipeline statistics
 */
export function usePipelineStats(pipelineId: string) {
  return useQuery({
    queryKey: pipelineKeys.stats(pipelineId),
    queryFn: () => pipelinesApi.getStats(pipelineId),
    enabled: !!pipelineId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Create a new pipeline
 */
export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PipelineFormData) => pipelinesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success("Pipeline created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create pipeline");
    },
  });
}

/**
 * Update a pipeline
 */
export function useUpdatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PipelineFormData> }) =>
      pipelinesApi.update(id, data),
    onSuccess: (updatedPipeline) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(updatedPipeline.id) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success("Pipeline updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update pipeline");
    },
  });
}

/**
 * Delete a pipeline
 */
export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pipelinesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success("Pipeline deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete pipeline");
    },
  });
}

/**
 * Create a new stage
 */
export function useCreateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pipelineId, data }: { pipelineId: string; data: StageFormData }) =>
      pipelinesApi.createStage(pipelineId, data),
    onSuccess: (_, { pipelineId }) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(pipelineId) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.stages(pipelineId) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.kanban(pipelineId) });
      toast.success("Stage created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create stage");
    },
  });
}

/**
 * Update a stage
 */
export function useUpdateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      pipelineId, 
      stageId, 
      data 
    }: { 
      pipelineId: string; 
      stageId: string; 
      data: Partial<StageFormData> 
    }) => pipelinesApi.updateStage(pipelineId, stageId, data),
    onSuccess: (_, { pipelineId }) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(pipelineId) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.stages(pipelineId) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.kanban(pipelineId) });
      toast.success("Stage updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update stage");
    },
  });
}

/**
 * Delete a stage
 */
export function useDeleteStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pipelineId, stageId }: { pipelineId: string; stageId: string }) =>
      pipelinesApi.deleteStage(pipelineId, stageId),
    onSuccess: (_, { pipelineId }) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(pipelineId) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.stages(pipelineId) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.kanban(pipelineId) });
      toast.success("Stage deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete stage");
    },
  });
}

/**
 * Reorder stages
 */
export function useReorderStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pipelineId, stageIds }: { pipelineId: string; stageIds: string[] }) =>
      pipelinesApi.reorderStages(pipelineId, stageIds),
    onSuccess: (_, { pipelineId }) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(pipelineId) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.stages(pipelineId) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.kanban(pipelineId) });
      toast.success("Stages reordered successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder stages");
    },
  });
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { 
  PipelineViewModel, 
  PipelineListViewModel, 
  PipelineStageViewModel,
  KanbanResponse,
  PipelineStatsResponse,
  PipelineFormData,
  StageFormData,
};
