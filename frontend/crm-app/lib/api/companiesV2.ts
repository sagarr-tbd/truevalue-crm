import { createEntityV2Api } from './entityV2Api';

export interface CompanyV2 {
  id: string;
  org_id?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  status: 'active' | 'inactive' | 'prospect' | 'customer' | 'partner' | 'archived';
  industry?: string | null;
  size?: string | null;
  assigned_to_id?: string | null;
  parent_company_id?: string | null;
  entity_data: Record<string, any>;
  display_name?: string;
  display_website?: string;
  display_email?: string;
  display_phone?: string;
  last_activity_at?: string | null;
}

export interface CompanyV2ListItem {
  id: string;
  status: string;
  industry?: string | null;
  size?: string | null;
  entity_data: Record<string, any>;
  created_at: string;
  last_activity_at?: string | null;
  display_name?: string;
  display_website?: string;
  display_email?: string;
  display_phone?: string;
  display_industry?: string;
}

export interface CompanyV2QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  industry?: string;
  size?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  assigned_to?: string;
  parent_company_id?: string;
  owner_id?: string;
  filters?: string;
}

export interface CompanyV2Stats {
  total: number;
  by_status: Record<string, number>;
}

export interface CreateCompanyV2Input {
  status?: 'active' | 'inactive' | 'prospect' | 'customer' | 'partner' | 'archived';
  entity_data: Record<string, any>;
}

export interface DuplicateCheckResponse {
  has_duplicates: boolean;
  count: number;
  duplicates: CompanyV2ListItem[];
}

export const companiesV2Api = createEntityV2Api<CompanyV2, CompanyV2ListItem, CompanyV2QueryParams>(
  '/crm/api/v2/companies',
  'company'
);
