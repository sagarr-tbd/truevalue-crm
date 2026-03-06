import { apiClient } from './client';

export interface EntityV2QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  source?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  assigned_to?: string;
  owner_id?: string;
  filters?: string;
}

export interface EntityV2Stats {
  total: number;
  by_status: Record<string, number>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DuplicateCheckResponse<TListItem> {
  has_duplicates: boolean;
  count: number;
  duplicates: TListItem[];
}

export function createEntityV2Api<
  TEntity,
  TListItem,
  TQueryParams extends EntityV2QueryParams = EntityV2QueryParams,
>(basePath: string, entityName: string) {
  return {
    list: async (params?: TQueryParams) => {
      const response = await apiClient.get<PaginatedResponse<TListItem>>(
        `${basePath}/`, { params }
      );
      if (!response.data) throw new Error(`Failed to fetch ${entityName}s`);
      return response.data;
    },

    getById: async (id: string) => {
      const response = await apiClient.get<TEntity>(`${basePath}/${id}/`);
      if (!response.data) throw new Error(`${entityName} not found`);
      return response.data;
    },

    create: async (data: Partial<TEntity>) => {
      const response = await apiClient.post<TEntity>(`${basePath}/`, data);
      if (!response.data) throw new Error(`Failed to create ${entityName}`);
      return response.data;
    },

    update: async (id: string, data: Partial<TEntity>) => {
      const response = await apiClient.patch<TEntity>(`${basePath}/${id}/`, data);
      if (!response.data) throw new Error(`Failed to update ${entityName}`);
      return response.data;
    },

    delete: async (id: string) => {
      await apiClient.delete(`${basePath}/${id}/`);
    },

    stats: async () => {
      const response = await apiClient.get<EntityV2Stats>(`${basePath}/stats/`);
      if (!response.data) throw new Error('Failed to fetch stats');
      return response.data;
    },

    updateStatus: async (id: string, status: string, extra?: { loss_reason?: string }) => {
      const response = await apiClient.post(`${basePath}/${id}/update_status/`, { status, ...extra });
      if (!response.data) throw new Error('Failed to update status');
      return response.data;
    },

    bulkDelete: async (ids: string[]) => {
      const response = await apiClient.post(`${basePath}/bulk_delete/`, { ids });
      if (!response.data) throw new Error(`Failed to bulk delete ${entityName}s`);
      return response.data;
    },

    bulkUpdate: async (ids: string[], data: Partial<TEntity> & { entity_data?: Record<string, unknown> }) => {
      const response = await apiClient.post(`${basePath}/bulk_update/`, { ids, data });
      if (!response.data) throw new Error(`Failed to bulk update ${entityName}s`);
      return response.data;
    },

    export: async (params?: TQueryParams & { ids?: string[] }) => {
      const queryParams = new URLSearchParams();
      if (params?.ids) queryParams.append('ids', params.ids.join(','));
      if (params?.status) queryParams.append('status', params.status);
      if (params?.source) queryParams.append('source', params.source);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.owner_id) queryParams.append('owner_id', params.owner_id);
      if (params?.filters) queryParams.append('filters', params.filters);

      const response = await apiClient.get(
        `${basePath}/export/?${queryParams.toString()}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entityName}s-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },

    checkDuplicate: async (params: { email?: string; phone?: string; name?: string }) => {
      const response = await apiClient.post<DuplicateCheckResponse<TListItem>>(
        `${basePath}/check_duplicate/`,
        params
      );
      if (!response.data) throw new Error('Failed to check duplicates');
      return response.data;
    },

    sources: async () => {
      const response = await apiClient.get<{ sources: string[] }>(`${basePath}/sources/`);
      if (!response.data) throw new Error('Failed to fetch sources');
      return response.data.sources;
    },

    mine: async (params?: TQueryParams) => {
      const response = await apiClient.get<PaginatedResponse<TListItem>>(
        `${basePath}/mine/`, { params }
      );
      if (!response.data) throw new Error(`Failed to fetch my ${entityName}s`);
      return response.data;
    },
  };
}
