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
  owner_id?: string;
  filters?: string; // JSON string for advanced filters
}

export interface LeadV2Stats {
  total: number;
  by_status: Record<string, number>;
}

export interface CreateLeadV2Input {
  status?: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  entity_data: Record<string, any>;
}

export interface ConvertLeadV2Params {
  create_contact?: boolean;
  create_company?: boolean;
  create_deal?: boolean;
  deal_name?: string;
  deal_value?: number;
  deal_pipeline_id?: string;
  deal_stage_id?: string;
}

export interface ConvertLeadV2Response {
  success: boolean;
  lead_id: string;
  contact_id?: string | null;
  company_id?: string | null;
  deal_id?: string | null;
}

export interface DuplicateCheckResponse {
  has_duplicates: boolean;
  count: number;
  duplicates: LeadV2ListItem[];
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

  convert: async (id: string, params?: ConvertLeadV2Params) => {
    const response = await apiClient.post<ConvertLeadV2Response>(
      `/crm/api/v2/leads/${id}/convert/`,
      params
    );
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

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.post(`/crm/api/v2/leads/${id}/update_status/`, { status });
    if (!response.data) {
      throw new Error('Failed to update status');
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

  bulkUpdate: async (ids: string[], data: Partial<LeadV2> & { entity_data?: Record<string, any> }) => {
    const response = await apiClient.post('/crm/api/v2/leads/bulk_update/', { ids, data });
    if (!response.data) {
      throw new Error('Failed to bulk update leads');
    }
    return response.data;
  },

  export: async (params?: LeadV2QueryParams & { ids?: string[] }) => {
    const queryParams = new URLSearchParams();
    
    if (params?.ids) {
      queryParams.append('ids', params.ids.join(','));
    }
    if (params?.status) queryParams.append('status', params.status);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.owner_id) queryParams.append('owner_id', params.owner_id);
    if (params?.filters) queryParams.append('filters', params.filters);
    
    const response = await apiClient.get(
      `/crm/api/v2/leads/export/?${queryParams.toString()}`,
      { responseType: 'blob' }
    );
    
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  checkDuplicate: async (email: string) => {
    const response = await apiClient.post<DuplicateCheckResponse>(
      '/crm/api/v2/leads/check_duplicate/',
      { email }
    );
    if (!response.data) {
      throw new Error('Failed to check duplicates');
    }
    return response.data;
  },

  sources: async () => {
    const response = await apiClient.get<{ sources: string[] }>('/crm/api/v2/leads/sources/');
    if (!response.data) {
      throw new Error('Failed to fetch sources');
    }
    return response.data.sources;
  },

  mine: async (params?: LeadV2QueryParams) => {
    const response = await apiClient.get<{
      count: number;
      next: string | null;
      previous: string | null;
      results: LeadV2ListItem[];
    }>('/crm/api/v2/leads/mine/', { params });
    if (!response.data) {
      throw new Error('Failed to fetch my leads');
    }
    return response.data;
  },

  webForm: async (data: {
    org_id: string;
    form_token?: string;
    [key: string]: any;
  }) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      lead_id?: string;
      is_new?: boolean;
    }>('/crm/api/v2/leads/web_form/', data);
    if (!response.data) {
      throw new Error('Failed to submit web form');
    }
    return response.data;
  },
};
