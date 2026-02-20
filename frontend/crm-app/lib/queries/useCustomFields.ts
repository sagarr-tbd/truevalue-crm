import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  customFieldsApi,
  CustomFieldDefinitionFormData,
} from '@/lib/api/customFields';
import { toast } from 'sonner';

// Re-export types for convenience
export type {
  CustomFieldDefinition,
  CustomFieldDefinitionFormData,
} from '@/lib/api/customFields';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const customFieldKeys = {
  all: ['customFields'] as const,
  lists: () => [...customFieldKeys.all, 'list'] as const,
  list: (entityType?: string) => [...customFieldKeys.lists(), { entityType }] as const,
  detail: (id: string) => [...customFieldKeys.all, 'detail', id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all custom field definitions (optionally filtered by entity type)
 */
export function useCustomFields(
  entityType?: 'contact' | 'company' | 'deal' | 'lead',
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: customFieldKeys.list(entityType),
    queryFn: () => customFieldsApi.getAll(entityType),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes - custom fields change infrequently
  });
}

/**
 * Fetch single custom field definition by ID
 */
export function useCustomField(id: string) {
  return useQuery({
    queryKey: customFieldKeys.detail(id),
    queryFn: () => customFieldsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new custom field definition
 */
export function useCreateCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomFieldDefinitionFormData) => customFieldsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.lists() });
      toast.success('Custom field created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create custom field');
    },
  });
}

/**
 * Update a custom field definition
 */
export function useUpdateCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomFieldDefinitionFormData> }) =>
      customFieldsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customFieldKeys.detail(id) });
      toast.success('Custom field updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update custom field');
    },
  });
}

/**
 * Delete a custom field definition
 */
export function useDeleteCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customFieldsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.lists() });
      toast.success('Custom field deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete custom field');
    },
  });
}
