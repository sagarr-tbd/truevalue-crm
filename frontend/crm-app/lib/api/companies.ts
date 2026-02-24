import { apiClient } from './client';
import type { FilterGroup } from '@/components/AdvancedFilter';

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Advanced filter condition (API format - for serialization)
 */
export interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

// Re-export component FilterGroup type for consumers
export type { FilterGroup };

// ============================================================================
// BACKEND API TYPES (snake_case)
// ============================================================================

/**
 * Full company response from API (snake_case)
 * Used for: GET /companies/{id}
 */
export interface CompanyApiResponse {
  id: string;
  org_id: string;
  owner_id?: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  description?: string;
  annual_revenue?: number;
  employee_count?: number;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  custom_fields?: Record<string, unknown>;
  tags?: Array<{ id: string; name: string; color?: string }>;
  tag_ids?: string[];
  parent_company?: string;
  contact_count?: number;
  deal_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Company list item response from API (snake_case)
 * Used for: GET /companies (list endpoint)
 */
export interface CompanyListApiResponse {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  annual_revenue?: number;
  employee_count?: number;
  tags?: Array<{ id: string; name: string; color?: string }>;
  owner_id?: string;
  created_at: string;
}

/**
 * Company request payload to API (snake_case)
 * Used for: POST /companies, PATCH /companies/{id}
 */
export interface CompanyApiRequest {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  description?: string;
  annual_revenue?: number;
  employee_count?: number;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  tag_ids?: string[];
  owner_id?: string;
  custom_fields?: Record<string, unknown>;
}

// ============================================================================
// FRONTEND VIEW MODEL (camelCase) - matches AccountDisplay structure
// ============================================================================

/**
 * Account/Company display data (matches what the page expects)
 * Note: Using string ID (UUID) instead of number
 */
export interface AccountDisplay {
  id: string;
  accountName: string;
  industry: string;
  type: string;  // Maps from size (backend) with conversion
  website: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  country: string;
  employees: number;
  annualRevenue: number;
  status: string;  // Derived (not in backend)
  owner: string;   // Derived from owner_id
  ownerId?: string;
  created: string;
  lastActivity: string;  // Derived
  initials: string;
  // Additional fields for detail view
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  description?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  tags?: Array<{ id: string; name: string; color?: string }>;
  tagIds?: string[];
  contactCount?: number;
  dealCount?: number;
  customFields?: Record<string, unknown>;
}

/**
 * Form data for create/update
 */
export interface AccountFormData {
  accountName?: string;
  industry?: string;
  type?: string;
  website?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  employees?: number;
  annualRevenue?: number;
  description?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  ownerId?: string;
  owner?: string;
  status?: string;
  tagIds?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Query params for listing companies
 */
export interface CompanyQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  industry?: string;
  size?: string;
  owner_id?: string;
  order_by?: string;
  filters?: FilterGroup;
}

/**
 * Account/Company statistics (frontend format)
 */
export interface AccountStats {
  total: number;
  byIndustry: Record<string, number>;
  bySize: Record<string, number>;
  totalRevenue: number;
  totalEmployees: number;
}

/**
 * Backend account statistics (snake_case)
 */
interface BackendAccountStats {
  total: number;
  by_industry: Record<string, number>;
  by_size: Record<string, number>;
  total_revenue: number;
  total_employees: number;
}

/**
 * Paginated response for accounts
 */
export interface PaginatedAccountsResponse {
  data: AccountDisplay[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    stats?: AccountStats;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert null to undefined for consistent handling
 */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}


/**
 * Size from employee count (frontend → backend)
 * Convert number of employees to size category
 */
function employeeCountToSize(count?: number): string {
  if (!count || count <= 0) return '';
  if (count === 1) return '1';
  if (count <= 10) return '2-10';
  if (count <= 50) return '11-50';
  if (count <= 200) return '51-200';
  if (count <= 500) return '201-500';
  if (count <= 1000) return '501-1000';
  return '1000+';
}

/**
 * Format date from ISO string
 */
function formatDate(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get initials from company name
 */
function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Transform API list response to frontend view model
 */
function toAccountDisplay(response: CompanyListApiResponse): AccountDisplay {
  return {
    id: response.id,
    accountName: response.name,
    industry: response.industry || '',
    type: response.size || '', // Store raw size value for form compatibility
    website: '',
    phone: response.phone || '',
    email: response.email || '',
    city: response.city || '',
    state: response.state || '',
    country: response.country || '',
    employees: response.employee_count || 0,
    annualRevenue: response.annual_revenue || 0,
    status: 'Active',
    owner: 'Unassigned', // TODO: Resolve from owner_id
    ownerId: nullToUndefined(response.owner_id),
    created: formatDate(response.created_at),
    lastActivity: formatDate(response.created_at), // TODO: Get from activities
    initials: getInitials(response.name),
    tags: response.tags,
  };
}

/**
 * Get display label for company size
 * Exported for use in table columns
 */
export function getSizeDisplayLabel(size?: string): string {
  if (!size) return '';
  
  const sizeDisplayMap: Record<string, string> = {
    '1': 'Solo',
    '2-10': 'Micro',
    '11-50': 'Small',
    '51-200': 'Medium',
    '201-500': 'Large',
    '501-1000': 'Enterprise',
    '1000+': 'Corporate',
  };
  
  return sizeDisplayMap[size] || size;
}

/**
 * Transform full API response to frontend view model
 */
function toFullAccountDisplay(response: CompanyApiResponse): AccountDisplay {
  return {
    id: response.id,
    accountName: response.name,
    industry: response.industry || '',
    type: response.size || '', // Store raw size value from backend
    website: response.website || '',
    phone: response.phone || '',
    email: response.email || '',
    city: response.city || '',
    state: response.state || '',
    country: response.country || '',
    employees: response.employee_count || 0,
    annualRevenue: response.annual_revenue || 0,
    status: 'Active',
    owner: 'Unassigned', // TODO: Resolve from owner_id
    ownerId: nullToUndefined(response.owner_id),
    created: formatDate(response.created_at),
    lastActivity: formatDate(response.updated_at),
    initials: getInitials(response.name),
    // Additional fields
    addressLine1: nullToUndefined(response.address_line1),
    addressLine2: nullToUndefined(response.address_line2),
    postalCode: nullToUndefined(response.postal_code),
    description: nullToUndefined(response.description),
    linkedinUrl: nullToUndefined(response.linkedin_url),
    twitterUrl: nullToUndefined(response.twitter_url),
    facebookUrl: nullToUndefined(response.facebook_url),
    tags: response.tags,
    tagIds: response.tags?.map(t => t.id) || response.tag_ids,
    contactCount: response.contact_count,
    dealCount: response.deal_count,
    // Custom fields - IMPORTANT for edit!
    customFields: response.custom_fields || {},
  };
}

/**
 * Transform frontend form data to backend payload
 */
function toApiRequest(data: AccountFormData): CompanyApiRequest {
  const payload: CompanyApiRequest = {
    name: data.accountName || '',
  };

  if (data.website) payload.website = data.website;
  if (data.industry) payload.industry = data.industry;
  // type field stores size value directly (e.g., "51-200", "1000+")
  if (data.type) payload.size = data.type;
  if (data.phone) payload.phone = data.phone;
  if (data.email) payload.email = data.email;
  if (data.addressLine1) payload.address_line1 = data.addressLine1;
  if (data.addressLine2) payload.address_line2 = data.addressLine2;
  if (data.city) payload.city = data.city;
  if (data.state) payload.state = data.state;
  if (data.postalCode) payload.postal_code = data.postalCode;
  if (data.country) payload.country = data.country;
  if (data.description) payload.description = data.description;
  // employees field is number, map to employee_count
  if (data.employees !== undefined && data.employees > 0) {
    payload.employee_count = data.employees;
    // Also auto-calculate size if not provided
    if (!data.type) {
      payload.size = employeeCountToSize(data.employees);
    }
  }
  if (data.annualRevenue !== undefined) payload.annual_revenue = data.annualRevenue;
  if (data.linkedinUrl) payload.linkedin_url = data.linkedinUrl;
  if (data.twitterUrl) payload.twitter_url = data.twitterUrl;
  if (data.facebookUrl) payload.facebook_url = data.facebookUrl;
  if (data.ownerId) payload.owner_id = data.ownerId;
  if (data.tagIds && data.tagIds.length > 0) payload.tag_ids = data.tagIds;
  
  // Include custom_fields if present
  if (data.customFields) payload.custom_fields = data.customFields;

  return payload;
}

// ============================================================================
// COMPANIES API (Real Backend)
// ============================================================================

/**
 * Convert backend stats to frontend stats
 */
function toFrontendStats(backendStats?: BackendAccountStats): AccountStats | undefined {
  if (!backendStats) return undefined;
  
  return {
    total: backendStats.total,
    byIndustry: backendStats.by_industry || {},
    bySize: backendStats.by_size || {},
    totalRevenue: backendStats.total_revenue || 0,
    totalEmployees: backendStats.total_employees || 0,
  };
}

/**
 * Convert FilterGroup conditions to backend-compatible operators
 * Backend supports both camelCase and snake_case operators
 */
function toBackendOperator(operator: string): string {
  // Map frontend operators to backend-supported operators
  // Backend FILTER_OPERATOR_MAP supports: equals, notEquals, contains, notContains, 
  // startsWith, endsWith, isEmpty, isNotEmpty, greaterThan, lessThan, 
  // greaterThanOrEqual, lessThanOrEqual, in, notIn (and snake_case equivalents)
  const operatorMap: Record<string, string> = {
    'equals': 'equals',
    'notEquals': 'notEquals',
    'contains': 'contains',
    'notContains': 'notContains',
    'startsWith': 'startsWith',
    'endsWith': 'endsWith',
    'greaterThan': 'greaterThan',
    'lessThan': 'lessThan',
    'greaterThanOrEqual': 'greaterThanOrEqual',
    'lessThanOrEqual': 'lessThanOrEqual',
    'isEmpty': 'isEmpty',
    'isNotEmpty': 'isNotEmpty',
    'in': 'in',
    'notIn': 'notIn',
    // Legacy short forms - map to proper names
    'eq': 'equals',
    'neq': 'notEquals',
    'gt': 'greaterThan',
    'gte': 'greaterThanOrEqual',
    'lt': 'lessThan',
    'lte': 'lessThanOrEqual',
  };
  return operatorMap[operator] || operator;
}

/**
 * Serialize FilterGroup for API
 * Converts component's FilterGroup (uppercase logic) to API format (lowercase logic)
 */
function serializeFilters(filters: FilterGroup): string {
  const serialized = {
    // Convert uppercase 'AND'/'OR' to lowercase 'and'/'or'
    logic: filters.logic.toLowerCase() as 'and' | 'or',
    conditions: filters.conditions.map(condition => ({
      field: condition.field,
      operator: toBackendOperator(condition.operator),
      value: condition.value,
    })),
  };
  return JSON.stringify(serialized);
}

export const companiesApi = {
  /**
   * Get all companies with pagination, filtering, and stats
   */
  getAll: async (params: CompanyQueryParams = {}): Promise<PaginatedAccountsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.industry) queryParams.set('industry', params.industry);
    if (params.size) queryParams.set('size', params.size);
    if (params.owner_id) queryParams.set('owner_id', params.owner_id);
    if (params.order_by) queryParams.set('order_by', params.order_by);
    
    // Serialize advanced filters
    if (params.filters && params.filters.conditions.length > 0) {
      queryParams.set('filters', serializeFilters(params.filters));
    }

    const url = `/crm/api/v1/companies${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    interface BackendPaginatedResponse {
      data: CompanyListApiResponse[];
      meta: {
        page: number;
        page_size: number;
        total: number;
        stats?: BackendAccountStats;
      };
    }
    
    const response = await apiClient.get<BackendPaginatedResponse>(url);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return {
      data: response.data!.data.map(toAccountDisplay),
      meta: {
        page: response.data!.meta.page,
        page_size: response.data!.meta.page_size,
        total: response.data!.meta.total,
        stats: toFrontendStats(response.data!.meta.stats),
      },
    };
  },

  /**
   * Get company by ID (UUID)
   */
  getById: async (id: string): Promise<AccountDisplay> => {
    const response = await apiClient.get<CompanyApiResponse>(`/crm/api/v1/companies/${id}`);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullAccountDisplay(response.data!);
  },

  /**
   * Create a new company
   */
  create: async (data: AccountFormData): Promise<AccountDisplay> => {
    const payload = toApiRequest(data);
    const response = await apiClient.post<CompanyApiResponse>('/crm/api/v1/companies', payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullAccountDisplay(response.data!);
  },

  /**
   * Update a company
   */
  update: async (id: string, data: AccountFormData): Promise<AccountDisplay> => {
    const payload = toApiRequest(data);
    const response = await apiClient.patch<CompanyApiResponse>(`/crm/api/v1/companies/${id}`, payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullAccountDisplay(response.data!);
  },

  /**
   * Delete a company
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/crm/api/v1/companies/${id}`);
    
    if (response.status !== 204 && response.status !== 200 && response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Bulk delete companies (sequential, since backend doesn't have bulk endpoint)
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    const errors: string[] = [];
    
    for (const id of ids) {
      try {
        await companiesApi.delete(id);
      } catch (error) {
        errors.push(id);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Failed to delete ${errors.length} companies`);
    }
  },

  /**
   * Bulk update companies (sequential, since backend doesn't have bulk endpoint)
   */
  bulkUpdate: async (ids: string[], data: AccountFormData): Promise<AccountDisplay[]> => {
    const updated: AccountDisplay[] = [];
    
    for (const id of ids) {
      try {
        const result = await companiesApi.update(id, data);
        updated.push(result);
      } catch (error) {
        console.error(`Failed to update company ${id}:`, error);
      }
    }
    
    return updated;
  },

  /**
   * Get companies as dropdown options
   */
  getAsOptions: async (): Promise<Array<{ value: string; label: string }>> => {
    const response = await companiesApi.getAll({ page_size: 100 });
    return response.data.map(account => ({
      value: account.id,
      label: account.accountName,
    }));
  },

  // ==========================================================================
  // COMPANY-CONTACT ASSOCIATIONS
  // ==========================================================================

  /**
   * Link a contact to this company
   */
  linkContact: async (companyId: string, data: {
    contactId: string;
    title?: string;
    department?: string;
    isPrimary?: boolean;
  }): Promise<void> => {
    const response = await apiClient.post(
      `/crm/api/v1/companies/${companyId}/contacts`,
      {
        contact_id: data.contactId,
        title: data.title,
        department: data.department,
        is_primary: data.isPrimary ?? false,
      }
    );
    if (response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Unlink a contact from this company
   */
  unlinkContact: async (companyId: string, contactId: string): Promise<void> => {
    const response = await apiClient.delete(
      `/crm/api/v1/companies/${companyId}/contacts/${contactId}`
    );
    if (response.status !== 204 && response.status !== 200 && response.error) {
      throw new Error(response.error.message);
    }
  },
};

// ============================================================================
// ACCOUNTS API WRAPPER (for compatibility with existing code)
// ============================================================================

/**
 * Wrapper that provides backward-compatible API interface
 * Matches the mock API function signatures
 */
export const accountsApi = {
  getAll: async (): Promise<AccountDisplay[]> => {
    const response = await companiesApi.getAll({ page_size: 100 });
    return response.data;
  },

  getById: async (id: string): Promise<AccountDisplay | null> => {
    try {
      return await companiesApi.getById(id);
    } catch {
      return null;
    }
  },

  create: async (data: Partial<AccountDisplay>): Promise<AccountDisplay> => {
    return companiesApi.create({
      accountName: data.accountName,
      industry: data.industry,
      type: data.type,
      website: data.website,
      phone: data.phone,
      email: data.email,
      // Address fields
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      // Business fields
      employees: data.employees,
      annualRevenue: data.annualRevenue,
      description: data.description,
      // Social URLs
      linkedinUrl: data.linkedinUrl,
      twitterUrl: data.twitterUrl,
      facebookUrl: data.facebookUrl,
      // Relations
      ownerId: data.ownerId,
      tagIds: data.tagIds,
      // Custom fields
      customFields: data.customFields,
    });
  },

  update: async (id: string, data: Partial<AccountDisplay>): Promise<AccountDisplay> => {
    return companiesApi.update(id, {
      accountName: data.accountName,
      industry: data.industry,
      type: data.type,
      website: data.website,
      phone: data.phone,
      email: data.email,
      // Address fields
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      // Business fields
      employees: data.employees,
      annualRevenue: data.annualRevenue,
      description: data.description,
      // Social URLs
      linkedinUrl: data.linkedinUrl,
      twitterUrl: data.twitterUrl,
      facebookUrl: data.facebookUrl,
      // Relations
      ownerId: data.ownerId,
      tagIds: data.tagIds,
      // Custom fields
      customFields: data.customFields,
    });
  },

  delete: async (id: string): Promise<void> => {
    return companiesApi.delete(id);
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    return companiesApi.bulkDelete(ids);
  },

  bulkUpdate: async (ids: string[], data: Partial<AccountDisplay>): Promise<AccountDisplay[]> => {
    return companiesApi.bulkUpdate(ids, {
      accountName: data.accountName,
      industry: data.industry,
      type: data.type,
      website: data.website,
      phone: data.phone,
      email: data.email,
      // Address fields
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      // Business fields
      employees: data.employees,
      annualRevenue: data.annualRevenue,
      description: data.description,
      // Social URLs
      linkedinUrl: data.linkedinUrl,
      twitterUrl: data.twitterUrl,
      facebookUrl: data.facebookUrl,
      // Relations
      ownerId: data.ownerId,
      tagIds: data.tagIds,
      // Custom fields
      customFields: data.customFields,
    });
  },
};
