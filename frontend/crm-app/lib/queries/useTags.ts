import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi, Tag, TagOption, TagFormData } from '@/lib/api/tags';
import { toast } from 'sonner';

/**
 * Query keys for tags
 */
export const tagKeys = {
  all: ['tags'] as const,
  list: (entityType?: string) => [...tagKeys.all, 'list', entityType] as const,
  options: (entityType?: string) => [...tagKeys.all, 'options', entityType] as const,
};

/**
 * Hook to fetch all tags
 */
export function useTags(entityType?: string) {
  return useQuery({
    queryKey: tagKeys.list(entityType),
    queryFn: () => tagsApi.getAll({ entity_type: entityType }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch tags as select options
 */
export function useTagOptions(entityType?: string) {
  return useQuery({
    queryKey: tagKeys.options(entityType),
    queryFn: () => tagsApi.getAsOptions(entityType),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch contact-specific tags
 */
export function useContactTagOptions() {
  return useQuery({
    queryKey: tagKeys.options('contact'),
    queryFn: () => tagsApi.getContactTags(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch company/account-specific tags
 */
export function useCompanyTagOptions() {
  return useQuery({
    queryKey: tagKeys.options('company'),
    queryFn: () => tagsApi.getCompanyTags(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TagFormData) => tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      toast.success('Tag created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tag');
    },
  });
}

/**
 * Hook to update a tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TagFormData> }) =>
      tagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      toast.success('Tag updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tag');
    },
  });
}

/**
 * Hook to delete a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      toast.success('Tag deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tag');
    },
  });
}

// Re-export types
export type { Tag, TagOption, TagFormData };
