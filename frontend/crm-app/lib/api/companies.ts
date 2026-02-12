import { apiClient } from './client';

/**
 * Company interface from backend
 */
export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  owner_id?: string;
  created_at: string;
}

/**
 * Company option for select fields
 */
export interface CompanyOption {
  value: string;
  label: string;
}

/**
 * Paginated response
 */
interface PaginatedResponse {
  data: Company[];
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
}

/**
 * Companies API
 */
export const companiesApi = {
  /**
   * Get all companies for select dropdown
   */
  getAll: async (params?: { page_size?: number }): Promise<Company[]> => {
    const pageSize = params?.page_size || 100; // Get more for dropdown
    const response = await apiClient.get<PaginatedResponse>(
      `/crm/api/v1/companies?page_size=${pageSize}`
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data?.data || [];
  },

  /**
   * Get companies as select options
   */
  getAsOptions: async (): Promise<CompanyOption[]> => {
    const companies = await companiesApi.getAll({ page_size: 100 });
    return companies.map(company => ({
      value: company.id,
      label: company.name,
    }));
  },
};
