import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { EntityV2Stats, EntityV2QueryParams, PaginatedResponse } from '@/lib/api/entityV2Api';

interface EntityApi<TEntity, TListItem, TQueryParams extends EntityV2QueryParams> {
  list: (params?: TQueryParams) => Promise<PaginatedResponse<TListItem>>;
  getById: (id: string) => Promise<TEntity>;
  create: (data: Partial<TEntity>) => Promise<TEntity>;
  update: (id: string, data: Partial<TEntity>) => Promise<TEntity>;
  delete: (id: string) => Promise<void>;
  stats: () => Promise<EntityV2Stats>;
  updateStatus: (id: string, status: string) => Promise<unknown>;
  bulkDelete: (ids: string[]) => Promise<unknown>;
  bulkUpdate: (ids: string[], data: Partial<TEntity> & { entity_data?: Record<string, unknown> }) => Promise<unknown>;
  export: (params?: TQueryParams & { ids?: string[] }) => Promise<void>;
  checkDuplicate: (email: string) => Promise<unknown>;
  sources: () => Promise<string[]>;
  mine: (params?: TQueryParams) => Promise<PaginatedResponse<TListItem>>;
}

export function createEntityV2QueryKeys(prefix: string) {
  const keys = {
    all: [prefix] as const,
    lists: () => [...keys.all, 'list'] as const,
    list: (params: EntityV2QueryParams) => [...keys.lists(), params] as const,
    details: () => [...keys.all, 'detail'] as const,
    detail: (id: string) => [...keys.details(), id] as const,
    stats: () => [...keys.all, 'stats'] as const,
  };
  return keys;
}

export function createEntityV2Hooks<
  TEntity,
  TListItem,
  TQueryParams extends EntityV2QueryParams,
>(
  api: EntityApi<TEntity, TListItem, TQueryParams>,
  queryKeys: ReturnType<typeof createEntityV2QueryKeys>,
  entityLabel: string,
  entityLabelPlural: string,
) {
  function useList(
    params?: TQueryParams,
    options?: Omit<UseQueryOptions<PaginatedResponse<TListItem>>, 'queryKey' | 'queryFn'>
  ) {
    return useQuery({
      queryKey: queryKeys.list(params || {}),
      queryFn: () => api.list(params),
      staleTime: 30000,
      ...options,
    });
  }

  function useDetail(
    id: string,
    options?: Omit<UseQueryOptions<TEntity>, 'queryKey' | 'queryFn'>
  ) {
    return useQuery<TEntity, Error>({
      queryKey: queryKeys.detail(id),
      queryFn: () => api.getById(id),
      enabled: !!id,
      staleTime: 60000,
      ...options,
    });
  }

  function useStats(
    options?: Omit<UseQueryOptions<EntityV2Stats>, 'queryKey' | 'queryFn'>
  ) {
    return useQuery<EntityV2Stats, Error>({
      queryKey: queryKeys.stats(),
      queryFn: () => api.stats(),
      staleTime: 60000,
      ...options,
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: Partial<TEntity>) => api.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
        toast.success(`${entityLabel} created successfully`);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || `Failed to create ${entityLabel.toLowerCase()}`);
      },
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TEntity> }) =>
        api.update(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
        toast.success(`${entityLabel} updated successfully`);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || `Failed to update ${entityLabel.toLowerCase()}`);
      },
    });
  }

  function useDelete() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
        toast.success(`${entityLabel} deleted successfully`);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || `Failed to delete ${entityLabel.toLowerCase()}`);
      },
    });
  }

  function useBulkDelete() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (ids: string[]) => api.bulkDelete(ids) as Promise<{ message?: string }>,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
        toast.success(data.message || `${entityLabelPlural} deleted successfully`);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || `Failed to delete ${entityLabelPlural.toLowerCase()}`);
      },
    });
  }

  function useBulkUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ ids, data }: { ids: string[]; data: Partial<TEntity> }) =>
        api.bulkUpdate(ids, data as Partial<TEntity> & { entity_data?: Record<string, unknown> }) as Promise<{ message?: string }>,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
        toast.success(data.message || `${entityLabelPlural} updated successfully`);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || `Failed to update ${entityLabelPlural.toLowerCase()}`);
      },
    });
  }

  return {
    useList,
    useDetail,
    useStats,
    useCreate,
    useUpdate,
    useDelete,
    useBulkDelete,
    useBulkUpdate,
  };
}
