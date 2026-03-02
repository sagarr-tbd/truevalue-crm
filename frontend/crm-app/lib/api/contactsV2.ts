import { createEntityV2Api } from './entityV2Api';

export interface ContactV2 {
  id: string;
  org_id?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  status: 'active' | 'inactive' | 'bounced' | 'unsubscribed' | 'archived';
  source?: string;
  assigned_to_id?: string;
  company_id?: string;
  entity_data: Record<string, any>;
  full_name?: string;
  display_name?: string;
  display_company?: string | null;
  do_not_call?: boolean;
  do_not_email?: boolean;
  converted_from_lead_id?: string | null;
  converted_at?: string | null;
  last_activity_at?: string | null;
  last_contacted_at?: string | null;
}

export interface ContactV2ListItem {
  id: string;
  status: string;
  source?: string;
  entity_data: Record<string, any>;
  created_at: string;
  last_activity_at?: string | null;
  last_contacted_at?: string | null;
  display_name?: string;
  display_email?: string;
  display_company?: string;
  display_phone?: string;
  do_not_call?: boolean;
  do_not_email?: boolean;
}

export interface ContactV2QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  source?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  assigned_to?: string;
  company_id?: string;
  owner_id?: string;
  filters?: string;
}

export interface ContactV2Stats {
  total: number;
  by_status: Record<string, number>;
}

export interface CreateContactV2Input {
  status?: 'active' | 'inactive' | 'bounced' | 'unsubscribed' | 'archived';
  entity_data: Record<string, any>;
}

export interface DuplicateCheckResponse {
  has_duplicates: boolean;
  count: number;
  duplicates: ContactV2ListItem[];
}

export const contactsV2Api = createEntityV2Api<ContactV2, ContactV2ListItem, ContactV2QueryParams>(
  '/crm/api/v2/contacts',
  'contact'
);
