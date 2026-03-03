import { apiClient } from './client';

export interface TagV2 {
  id: string;
  name: string;
  color: string;
  entity_type: string;
  description?: string;
  usage_count?: number;
  created_at?: string;
}

export interface TagV2FormData {
  name: string;
  color?: string;
  entity_type?: string;
  description?: string;
}

export interface EntityTagV2 {
  id: string;
  tag: TagV2;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export interface TagV2Option {
  value: string;
  label: string;
  color?: string;
}

interface PaginatedTagsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TagV2[];
}

export const tagsV2Api = {
  getAll: async (params?: { entity_type?: string; search?: string }): Promise<TagV2[]> => {
    const response = await apiClient.get<PaginatedTagsResponse>(
      '/crm/api/v2/tags/', { params }
    );
    if (!response.data) return [];
    return response.data.results || [];
  },

  getById: async (id: string): Promise<TagV2> => {
    const response = await apiClient.get<TagV2>(`/crm/api/v2/tags/${id}/`);
    if (!response.data) throw new Error('Tag not found');
    return response.data;
  },

  create: async (data: TagV2FormData): Promise<TagV2> => {
    const response = await apiClient.post<TagV2>('/crm/api/v2/tags/', data);
    if (!response.data) throw new Error('Failed to create tag');
    return response.data;
  },

  update: async (id: string, data: Partial<TagV2FormData>): Promise<TagV2> => {
    const response = await apiClient.patch<TagV2>(`/crm/api/v2/tags/${id}/`, data);
    if (!response.data) throw new Error('Failed to update tag');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/crm/api/v2/tags/${id}/`);
  },

  assign: async (tagId: string, entityType: string, entityId: string): Promise<EntityTagV2> => {
    const response = await apiClient.post<EntityTagV2>('/crm/api/v2/tags/assign/', {
      tag_id: tagId,
      entity_type: entityType,
      entity_id: entityId,
    });
    if (!response.data) throw new Error('Failed to assign tag');
    return response.data;
  },

  unassign: async (tagId: string, entityType: string, entityId: string): Promise<void> => {
    await apiClient.post('/crm/api/v2/tags/unassign/', {
      tag_id: tagId,
      entity_type: entityType,
      entity_id: entityId,
    });
  },

  bulkAssign: async (tagIds: string[], entityType: string, entityIds: string[]) => {
    const response = await apiClient.post<{ assigned: number }>('/crm/api/v2/tags/bulk_assign/', {
      tag_ids: tagIds,
      entity_type: entityType,
      entity_ids: entityIds,
    });
    if (!response.data) throw new Error('Failed to bulk assign tags');
    return response.data;
  },

  bulkUnassign: async (tagIds: string[], entityType: string, entityIds: string[]) => {
    const response = await apiClient.post<{ removed: number }>('/crm/api/v2/tags/bulk_unassign/', {
      tag_ids: tagIds,
      entity_type: entityType,
      entity_ids: entityIds,
    });
    if (!response.data) throw new Error('Failed to bulk unassign tags');
    return response.data;
  },

  forEntity: async (entityType: string, entityId: string): Promise<EntityTagV2[]> => {
    const response = await apiClient.get<EntityTagV2[]>('/crm/api/v2/tags/for_entity/', {
      params: { entity_type: entityType, entity_id: entityId },
    });
    return response.data || [];
  },

  forEntities: async (entityType: string, entityIds: string[]): Promise<Record<string, TagV2[]>> => {
    const response = await apiClient.post<Record<string, TagV2[]>>('/crm/api/v2/tags/for_entities/', {
      entity_type: entityType,
      entity_ids: entityIds,
    });
    return response.data || {};
  },

  getAsOptions: async (entityType?: string): Promise<TagV2Option[]> => {
    const tags = await tagsV2Api.getAll({ entity_type: entityType });
    return tags.map(tag => ({
      value: tag.id,
      label: tag.name,
      color: tag.color,
    }));
  },
};
