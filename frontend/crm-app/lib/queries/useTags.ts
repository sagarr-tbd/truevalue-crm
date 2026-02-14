import { useQuery } from '@tanstack/react-query';
import { tagsApi, Tag, TagOption } from '@/lib/api/tags';

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

// Re-export types
export type { Tag, TagOption };
