import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsV2Api, TagV2, TagV2FormData, TagV2Option, EntityTagV2 } from '@/lib/api/tagsV2';
import { toast } from 'sonner';

export const tagV2Keys = {
  all: ['tags-v2'] as const,
  list: (entityType?: string) => [...tagV2Keys.all, 'list', entityType] as const,
  options: (entityType?: string) => [...tagV2Keys.all, 'options', entityType] as const,
  forEntity: (entityType: string, entityId: string) =>
    [...tagV2Keys.all, 'entity', entityType, entityId] as const,
  forEntities: (entityType: string, entityIds: string[]) =>
    [...tagV2Keys.all, 'entities', entityType, ...entityIds] as const,
};

export function useTagsV2(entityType?: string) {
  return useQuery({
    queryKey: tagV2Keys.list(entityType),
    queryFn: () => tagsV2Api.getAll({ entity_type: entityType }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTagV2Options(entityType?: string) {
  return useQuery({
    queryKey: tagV2Keys.options(entityType),
    queryFn: () => tagsV2Api.getAsOptions(entityType),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEntityTagsV2(entityType: string, entityId: string) {
  return useQuery({
    queryKey: tagV2Keys.forEntity(entityType, entityId),
    queryFn: () => tagsV2Api.forEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useCreateTagV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TagV2FormData) => tagsV2Api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagV2Keys.all });
      toast.success('Tag created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tag');
    },
  });
}

export function useUpdateTagV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TagV2FormData> }) =>
      tagsV2Api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagV2Keys.all });
      toast.success('Tag updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tag');
    },
  });
}

export function useDeleteTagV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagsV2Api.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagV2Keys.all });
      toast.success('Tag deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tag');
    },
  });
}

export function useAssignTagV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, entityType, entityId }: {
      tagId: string; entityType: string; entityId: string;
    }) => tagsV2Api.assign(tagId, entityType, entityId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagV2Keys.forEntity(variables.entityType, variables.entityId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign tag');
    },
  });
}

export function useUnassignTagV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, entityType, entityId }: {
      tagId: string; entityType: string; entityId: string;
    }) => tagsV2Api.unassign(tagId, entityType, entityId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagV2Keys.forEntity(variables.entityType, variables.entityId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unassign tag');
    },
  });
}

export type { TagV2, TagV2FormData, TagV2Option, EntityTagV2 };
