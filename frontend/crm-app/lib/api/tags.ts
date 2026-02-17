import { apiClient } from './client';

/**
 * Tag interface from backend (from get_with_counts)
 */
export interface Tag {
  id: string;
  name: string;
  color?: string;
  entity_type?: string;
  usage_count?: number;
}

/**
 * Payload for creating/updating a tag
 */
export interface TagFormData {
  name: string;
  color?: string;
  entity_type?: string;
}

/**
 * Tag option for select fields
 */
export interface TagOption {
  value: string;
  label: string;
  color?: string;
}

/**
 * Tags list response (not paginated)
 */
interface TagsResponse {
  data: Tag[];
}

/**
 * Tags API
 */
export const tagsApi = {
  /**
   * Get all tags
   */
  getAll: async (params?: { entity_type?: string }): Promise<Tag[]> => {
    let url = `/crm/api/v1/tags`;
    
    if (params?.entity_type) {
      url += `?entity_type=${params.entity_type}`;
    }
    
    const response = await apiClient.get<TagsResponse>(url);
    
    if (response.error) {
      console.error('Failed to fetch tags:', response.error);
      return [];
    }
    
    return response.data?.data || [];
  },

  /**
   * Create a tag
   */
  create: async (data: TagFormData): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/crm/api/v1/tags', data);
    if (response.error) throw new Error(response.error.message || 'Failed to create tag');
    return response.data!;
  },

  /**
   * Update a tag
   */
  update: async (id: string, data: Partial<TagFormData>): Promise<Tag> => {
    const response = await apiClient.patch<Tag>(`/crm/api/v1/tags/${id}`, data);
    if (response.error) throw new Error(response.error.message || 'Failed to update tag');
    return response.data!;
  },

  /**
   * Delete a tag
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/crm/api/v1/tags/${id}`);
    if (response.error) throw new Error(response.error.message || 'Failed to delete tag');
  },

  /**
   * Get tags as select options
   */
  getAsOptions: async (entityType?: string): Promise<TagOption[]> => {
    const tags = await tagsApi.getAll({ entity_type: entityType });
    return tags.map(tag => ({
      value: tag.id,
      label: tag.name,
      color: tag.color,
    }));
  },

  /**
   * Get tags for contacts
   */
  getContactTags: async (): Promise<TagOption[]> => {
    return tagsApi.getAsOptions('contact');
  },

  /**
   * Get tags for companies/accounts
   */
  getCompanyTags: async (): Promise<TagOption[]> => {
    return tagsApi.getAsOptions('company');
  },
};
