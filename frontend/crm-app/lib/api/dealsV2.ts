import { createEntityV2Api } from './entityV2Api';
import { apiClient } from './client';

export interface DealV2 {
  id: string;
  org_id?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  stage: string;
  value: string;
  currency: string;
  probability?: number | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  loss_reason?: string | null;
  pipeline_id?: string | null;
  assigned_to_id?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  converted_from_lead_id?: string | null;
  entity_data: Record<string, any>;
  display_name?: string;
  display_value?: string;
  display_stage?: string;
  display_pipeline?: string;
  display_owner?: string;
  display_contact?: string;
  display_company?: string;
  last_activity_at?: string | null;
  stage_entered_at?: string | null;
}

export interface DealV2ListItem {
  id: string;
  status: string;
  stage: string;
  value: string;
  currency: string;
  probability?: number | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  loss_reason?: string | null;
  pipeline_id?: string | null;
  entity_data: Record<string, any>;
  created_at: string;
  last_activity_at?: string | null;
  display_name?: string;
  display_value?: string;
  display_stage?: string;
  display_contact?: string;
  display_company?: string;
  display_pipeline?: string;
}

export interface DealV2QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  stage?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  pipeline_id?: string;
  assigned_to?: string;
  contact_id?: string;
  company_id?: string;
  owner_id?: string;
  filters?: string;
}

export interface DealV2Stats {
  total: number;
  by_status: Record<string, number>;
  by_stage: Record<string, number>;
  pipeline_value: string;
  average_deal_value: string;
  won_value: string;
}

export interface CreateDealV2Input {
  status?: 'open' | 'won' | 'lost' | 'abandoned';
  stage?: string;
  value?: string | number;
  currency?: string;
  probability?: number | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  loss_reason?: string | null;
  entity_data: Record<string, any>;
}

export interface DuplicateCheckResponse {
  has_duplicates: boolean;
  count: number;
  duplicates: DealV2ListItem[];
}

export const dealsV2Api = createEntityV2Api<DealV2, DealV2ListItem, DealV2QueryParams>(
  '/crm/api/v2/deals',
  'deal'
);

export interface DealV2ForecastDeal {
  id: string;
  name: string;
  value: string;
  probability: number;
  weighted_value: string;
  expected_close_date: string;
  stage: string;
  pipeline_id: string | null;
}

export interface DealV2ForecastResponse {
  period_days: number;
  deal_count: number;
  total_value: string;
  weighted_value: string;
  deals: DealV2ForecastDeal[];
}

export interface DealV2AnalysisResponse {
  summary: {
    won: number;
    lost: number;
    win_rate: number;
    avg_won_value: string;
    avg_lost_value: string;
    avg_days_to_close: number | null;
  };
  trend: Array<{
    period: string;
    won: number;
    lost: number;
    won_value: number;
    lost_value: number;
  }>;
  loss_reasons: Array<{ reason: string; count: number }>;
}

export const dealsV2ExtApi = {
  forecast: async (params?: { days?: number; pipeline_id?: string }) => {
    const qp = new URLSearchParams();
    if (params?.days) qp.set('days', String(params.days));
    if (params?.pipeline_id) qp.set('pipeline_id', params.pipeline_id);
    const url = qp.toString()
      ? `/crm/api/v2/deals/forecast/?${qp}`
      : '/crm/api/v2/deals/forecast/';
    const response = await apiClient.get<DealV2ForecastResponse>(url);
    return response.data;
  },

  analysis: async (params?: { days?: number; pipeline_id?: string }) => {
    const qp = new URLSearchParams();
    if (params?.days) qp.set('days', String(params.days));
    if (params?.pipeline_id) qp.set('pipeline_id', params.pipeline_id);
    const url = qp.toString()
      ? `/crm/api/v2/deals/analysis/?${qp}`
      : '/crm/api/v2/deals/analysis/';
    const response = await apiClient.get<DealV2AnalysisResponse>(url);
    return response.data;
  },
};
