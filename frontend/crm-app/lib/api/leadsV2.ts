import { apiClient } from './client';
import { createEntityV2Api } from './entityV2Api';

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
  full_name?: string;
  email?: string;
  phone?: string;
  is_converted?: boolean;
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
  rating?: string;
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
  filters?: string;
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

const baseApi = createEntityV2Api<LeadV2, LeadV2ListItem, LeadV2QueryParams>(
  '/crm/api/v2/leads',
  'lead'
);

export const leadsV2Api = {
  ...baseApi,

  convert: async (id: string, params?: ConvertLeadV2Params) => {
    const response = await apiClient.post<ConvertLeadV2Response>(
      `/crm/api/v2/leads/${id}/convert/`,
      params
    );
    if (!response.data) throw new Error('Failed to convert lead');
    return response.data;
  },

  disqualify: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/crm/api/v2/leads/${id}/disqualify/`, { reason });
    if (!response.data) throw new Error('Failed to disqualify lead');
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
    if (!response.data) throw new Error('Failed to submit web form');
    return response.data;
  },
};
