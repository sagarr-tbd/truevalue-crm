import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelinesV2Api, PipelineV2, CreatePipelineV2Input, PipelineStageV2 } from '@/lib/api/pipelinesV2';

const PIPELINES_KEY = ['pipelines-v2'];

export function useDefaultPipelineV2() {
  return useQuery({
    queryKey: [...PIPELINES_KEY, 'default'],
    queryFn: async () => {
      const result = await pipelinesV2Api.list({ is_active: true });
      const pipelines = result?.results || [];
      return pipelines.find((p) => p.is_default) || pipelines[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePipelinesV2(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: [...PIPELINES_KEY, params],
    queryFn: () => pipelinesV2Api.list(params),
  });
}

export function usePipelineV2(id: string | undefined) {
  return useQuery({
    queryKey: [...PIPELINES_KEY, id],
    queryFn: () => pipelinesV2Api.get(id!),
    enabled: !!id,
  });
}

export function usePipelineV2Stats(id: string | undefined) {
  return useQuery({
    queryKey: [...PIPELINES_KEY, id, 'stats'],
    queryFn: () => pipelinesV2Api.stats(id!),
    enabled: !!id,
  });
}

export function useCreatePipelineV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePipelineV2Input) => pipelinesV2Api.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

export function useUpdatePipelineV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PipelineV2> }) =>
      pipelinesV2Api.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

export function useDeletePipelineV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipelinesV2Api.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

export function useSetDefaultPipelineV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipelinesV2Api.setDefault(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

export function useAddStageV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, data }: { pipelineId: string; data: Partial<PipelineStageV2> }) =>
      pipelinesV2Api.addStage(pipelineId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

export function useUpdateStageV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, stageId, data }: { pipelineId: string; stageId: string; data: Partial<PipelineStageV2> }) =>
      pipelinesV2Api.updateStage(pipelineId, stageId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

export function useDeleteStageV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, stageId }: { pipelineId: string; stageId: string }) =>
      pipelinesV2Api.deleteStage(pipelineId, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

export function useReorderStagesV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, stageIds }: { pipelineId: string; stageIds: string[] }) =>
      pipelinesV2Api.reorderStages(pipelineId, stageIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}
