import { apiClient } from './client';

export interface SearchV2Contact {
  id: string;
  type: 'contact';
  name: string;
  email?: string;
  status?: string;
}

export interface SearchV2Company {
  id: string;
  type: 'company';
  name: string;
  email?: string;
  status?: string;
  industry?: string;
}

export interface SearchV2Deal {
  id: string;
  type: 'deal';
  name: string;
  value?: string;
  status?: string;
  stage?: string;
}

export interface SearchV2Lead {
  id: string;
  type: 'lead';
  name: string;
  email?: string;
  status?: string;
  source?: string;
}

export type SearchV2Item = SearchV2Contact | SearchV2Company | SearchV2Deal | SearchV2Lead;

export interface SearchV2Response {
  contacts: SearchV2Contact[];
  companies: SearchV2Company[];
  deals: SearchV2Deal[];
  leads: SearchV2Lead[];
}

export const searchV2Api = {
  search: async (query: string, limit = 5): Promise<SearchV2Response> => {
    if (!query || query.trim().length < 2) {
      return { contacts: [], companies: [], deals: [], leads: [] };
    }
    const qp = new URLSearchParams({ q: query.trim(), limit: String(limit) });
    const response = await apiClient.get<SearchV2Response>(
      `/crm/api/v2/search/?${qp}`
    );
    return response.data || { contacts: [], companies: [], deals: [], leads: [] };
  },
};
