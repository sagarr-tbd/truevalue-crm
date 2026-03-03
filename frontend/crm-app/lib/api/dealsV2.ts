import { createEntityV2Api } from './entityV2Api';

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
