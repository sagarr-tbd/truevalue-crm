import { apiClient } from './client';

export interface LeadV2 {
  id: string;
  org_id?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  source?: string;
  rating?: string;
  assigned_to_id?: string;
  company_id?: string;
  contact_id?: string;
  entity_data: Record<string, any>;
  
  converted_at?: string | null;
  converted_contact_id?: string | null;
  converted_company_id?: string | null;
  converted_deal_id?: string | null;
  last_activity_at?: string | null;
}

export interface LeadV2ListItem {
  id: string;
  status: string;
  source?: string;
  entity_data: Record<string, any>;
  created_at: string;
  last_activity_at?: string | null;
  display_name?: string;
  display_email?: string;
  display_company?: string;
}

export interface LeadV2QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  source?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  assigned_to?: string;
  is_converted?: boolean;
}

export interface LeadV2Stats {
  total: number;
  by_status: Record<string, number>;
}

export interface CreateLeadV2Input {
  status?: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  entity_data: Record<string, any>;
}

export const leadsV2Api = {
  list: async (params?: LeadV2QueryParams) => {
    const response = await apiClient.get<{
      count: number;
      next: string | null;
      previous: string | null;
      results: LeadV2ListItem[];
    }>('/crm/api/v2/leads/', { params });
    if (!response.data) {
      throw new Error('Failed to fetch leads');
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<LeadV2>(`/crm/api/v2/leads/${id}/`);
    if (!response.data) {
      throw new Error('Lead not found');
    }
    return response.data;
  },

  create: async (data: Partial<LeadV2>) => {
    const response = await apiClient.post<LeadV2>('/crm/api/v2/leads/', data);
    if (!response.data) {
      throw new Error('Failed to create lead');
    }
    return response.data;
  },

  update: async (id: string, data: Partial<LeadV2>) => {
    const response = await apiClient.patch<LeadV2>(`/crm/api/v2/leads/${id}/`, data);
    if (!response.data) {
      throw new Error('Failed to update lead');
    }
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/crm/api/v2/leads/${id}/`);
  },

  stats: async () => {
    const response = await apiClient.get<LeadV2Stats>('/crm/api/v2/leads/stats/');
    if (!response.data) {
      throw new Error('Failed to fetch stats');
    }
    return response.data;
  },

  convert: async (id: string, params?: {
    create_deal?: boolean;
    deal_name?: string;
    deal_value?: number;
  }) => {
    const response = await apiClient.post(`/crm/api/v2/leads/${id}/convert/`, params);
    if (!response.data) {
      throw new Error('Failed to convert lead');
    }
    return response.data;
  },

  disqualify: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/crm/api/v2/leads/${id}/disqualify/`, { reason });
    if (!response.data) {
      throw new Error('Failed to disqualify lead');
    }
    return response.data;
  },

  bulkDelete: async (ids: string[]) => {
    const response = await apiClient.post('/crm/api/v2/leads/bulk_delete/', { ids });
    if (!response.data) {
      throw new Error('Failed to bulk delete leads');
    }
    return response.data;
  },

  bulkUpdate: async (ids: string[], data: Partial<LeadV2>) => {
    const response = await apiClient.post('/crm/api/v2/leads/bulk_update/', { ids, data });
    if (!response.data) {
      throw new Error('Failed to bulk update leads');
    }
    return response.data;
  },
};
