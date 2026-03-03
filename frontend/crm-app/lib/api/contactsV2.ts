import { createEntityV2Api } from './entityV2Api';
import { apiClient } from './client';

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

export type MergeStrategy = 'keep_primary' | 'keep_secondary' | 'merge';

export interface MergeContactV2Params {
  primaryId: string;
  secondaryId: string;
  mergeStrategy?: MergeStrategy;
}

export interface MergeContactV2Result {
  id: string;
  status: string;
  reassigned: Record<string, number>;
}

export interface ContactCompanyAssociation {
  id: string;
  contact_id: string;
  company_id: string;
  company_name?: string | null;
  title?: string | null;
  department?: string | null;
  is_primary: boolean;
  is_current: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddContactCompanyInput {
  company_id: string;
  title?: string;
  department?: string;
  is_primary?: boolean;
}

export const contactCompaniesV2Api = {
  list: async (contactId: string): Promise<ContactCompanyAssociation[]> => {
    const response = await apiClient.get<ContactCompanyAssociation[]>(
      `/crm/api/v2/contacts/${contactId}/companies/`
    );
    return response.data || [];
  },

  add: async (contactId: string, data: AddContactCompanyInput): Promise<ContactCompanyAssociation> => {
    const response = await apiClient.post<ContactCompanyAssociation>(
      `/crm/api/v2/contacts/${contactId}/companies/`,
      data
    );
    if (!response.data) throw new Error('Failed to link company');
    return response.data;
  },

  remove: async (contactId: string, associationId: string): Promise<void> => {
    await apiClient.delete(`/crm/api/v2/contacts/${contactId}/companies/${associationId}/`);
  },

  update: async (contactId: string, associationId: string, data: Partial<AddContactCompanyInput>): Promise<ContactCompanyAssociation> => {
    const response = await apiClient.patch<ContactCompanyAssociation>(
      `/crm/api/v2/contacts/${contactId}/companies/${associationId}/`,
      data
    );
    if (!response.data) throw new Error('Failed to update association');
    return response.data;
  },
};

export const contactsV2ExtApi = {
  merge: async (params: MergeContactV2Params): Promise<MergeContactV2Result> => {
    const response = await apiClient.post<MergeContactV2Result>(
      '/crm/api/v2/contacts/merge/',
      {
        primary_id: params.primaryId,
        secondary_id: params.secondaryId,
        strategy: params.mergeStrategy || 'keep_primary',
      }
    );
    if (!response.data) throw new Error('Failed to merge contacts');
    return response.data;
  },

  importContacts: async (contacts: Record<string, unknown>[], duplicateHandling = 'skip') => {
    const response = await apiClient.post<{ created: number; skipped: number; errors: number }>(
      '/crm/api/v2/contacts/import_contacts/',
      { contacts, duplicate_handling: duplicateHandling }
    );
    if (!response.data) throw new Error('Failed to import contacts');
    return response.data;
  },

  timeline: async (contactId: string) => {
    const response = await apiClient.get<{ results: unknown[] }>(
      `/crm/api/v2/contacts/${contactId}/timeline/`
    );
    return response.data;
  },
};
