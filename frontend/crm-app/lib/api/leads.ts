import { apiClient, PaginatedResponse } from './client';
import type { Lead } from '@/lib/types';

/**
 * Full lead response from API (snake_case)
 * Used for: GET /leads/{id}
 */
export interface LeadApiResponse {
  id: string;
  org_id: string;
  owner_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  company_name?: string;
  title?: string;
  website?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  status: string;
  source: string;
  source_detail?: string;
  score?: number;
  description?: string;
  custom_fields?: Record<string, unknown>;
  tags?: Array<{ id: string; name: string; color?: string }>;
  tag_ids?: string[];
  // Conversion tracking
  converted_at?: string;
  converted_contact_id?: string;
  converted_company_id?: string;
  converted_deal_id?: string;
  converted_by?: string;
  // Disqualification
  disqualified_reason?: string;
  disqualified_at?: string;
  // Activity tracking
  last_activity_at?: string;
  last_contacted_at?: string;
  activity_count?: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Lead list item response from API (snake_case)
 * Used for: GET /leads (list endpoint)
 * Matches LeadListSerializer: id, first_name, last_name, full_name,
 * email, company_name, status, source, score, tags, owner_id, last_activity_at, created_at
 */
export interface LeadListApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  company_name?: string | null;
  status: string;
  source: string;
  score?: number | null;
  owner_id?: string | null;
  tags?: Array<{ id: string; name: string; color?: string }>;
  last_activity_at?: string | null;
  created_at: string;
}

/**
 * Frontend lead view model (camelCase)
 * Used for: UI display, React components
 */
export interface LeadViewModel {
  id: string; // UUID from backend
  orgId?: string;
  ownerId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  mobile?: string;
  companyName?: string;
  title?: string;
  website?: string;
  // Address
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // Status & Source
  status: string;
  source: string;
  sourceDetail?: string;
  score?: number;
  description?: string;
  customFields?: Record<string, unknown>;
  // Tags
  tagIds?: string[];
  tags?: Array<{ id: string; name: string; color?: string }>;
  // Conversion tracking
  convertedAt?: string;
  convertedContactId?: string;
  convertedCompanyId?: string;
  convertedDealId?: string;
  convertedBy?: string;
  // Disqualification
  disqualifiedReason?: string;
  disqualifiedAt?: string;
  // Activity
  lastActivityAt?: string;
  lastContactedAt?: string;
  activityCount?: number;
  // Timestamps
  created: string;
  createdAt?: string;
  updatedAt?: string;
  // Computed
  initials: string;
}

/**
 * Lead request payload to API (snake_case)
 * Used for: POST /leads, PATCH /leads/{id}
 */
export interface LeadApiRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  company_name?: string;
  title?: string;
  website?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  source: string;
  source_detail?: string;
  status?: string;
  score?: number;
  description?: string;
  custom_fields?: Record<string, unknown>;
  tag_ids?: string[];
  owner_id?: string;
}

/**
 * Advanced filter condition
 */
export interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

/**
 * Advanced filter group
 */
export interface FilterGroup {
  logic: 'and' | 'or';
  conditions: FilterCondition[];
}

/**
 * Query params for listing leads
 */
export interface LeadQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  source?: string;
  owner_id?: string;
  order_by?: string;
  filters?: FilterGroup;
}

/**
 * Lead statistics
 */
export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  bySource?: Record<string, number>;
}

/**
 * Paginated response for leads
 */
export interface PaginatedLeadsResponse {
  data: LeadViewModel[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    stats?: LeadStats;
  };
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  total: number;
  success: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

/**
 * Convert lead request params
 */
export interface ConvertLeadParams {
  create_contact?: boolean;
  create_company?: boolean;
  create_deal?: boolean;
  contact_owner_id?: string;
  company_name?: string;
  company_owner_id?: string;
  deal_name?: string;
  deal_value?: string;
  deal_pipeline_id?: string;
  deal_stage_id?: string;
  deal_owner_id?: string;
}

/**
 * Convert lead result
 */
export interface ConvertLeadResult {
  lead_id: string;
  contact?: {
    id: string;
    name: string;
    created: boolean;
  };
  company?: {
    id: string;
    name: string;
    created: boolean;
  };
  deal?: {
    id: string;
    name: string;
    value: string;
  };
}

/**
 * Form data type - uses Lead from types.ts
 * Partial allows for create/update with optional fields
 */
export type LeadFormData = Partial<Lead>;

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
 * Transform API list response to frontend view model
 */
function toLeadViewModel(response: LeadListApiResponse): LeadViewModel {
  // Extract tag IDs from tags array for form compatibility
  const tagIds = response.tags?.map(tag => tag.id);

  return {
    id: response.id,
    firstName: response.first_name,
    lastName: response.last_name,
    fullName: response.full_name || `${response.first_name} ${response.last_name}`.trim(),
    email: response.email,
    companyName: nullToUndefined(response.company_name),
    status: response.status,
    source: response.source,
    score: nullToUndefined(response.score),
    ownerId: nullToUndefined(response.owner_id),
    tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
    tags: response.tags,
    lastActivityAt: nullToUndefined(response.last_activity_at),
    created: formatDate(response.created_at),
    createdAt: response.created_at,
    initials: getInitials(response.first_name, response.last_name),
  };
}

/**
 * Transform full API response to frontend view model
 */
function toFullLeadViewModel(response: LeadApiResponse): LeadViewModel {
  // Extract tag IDs from tags array
  const tagIds = response.tags?.map(tag => tag.id) || response.tag_ids;

  return {
    id: response.id,
    orgId: nullToUndefined(response.org_id),
    ownerId: nullToUndefined(response.owner_id),
    firstName: response.first_name,
    lastName: response.last_name,
    fullName: response.full_name || `${response.first_name} ${response.last_name}`.trim(),
    email: response.email,
    phone: nullToUndefined(response.phone),
    mobile: nullToUndefined(response.mobile),
    companyName: nullToUndefined(response.company_name),
    title: nullToUndefined(response.title),
    website: nullToUndefined(response.website),
    // Address
    addressLine1: nullToUndefined(response.address_line1),
    city: nullToUndefined(response.city),
    state: nullToUndefined(response.state),
    postalCode: nullToUndefined(response.postal_code),
    country: nullToUndefined(response.country),
    // Status & Source
    status: response.status,
    source: response.source,
    sourceDetail: nullToUndefined(response.source_detail),
    score: nullToUndefined(response.score),
    description: nullToUndefined(response.description),
    customFields: nullToUndefined(response.custom_fields),
    // Tags
    tagIds: nullToUndefined(tagIds),
    tags: response.tags,
    // Conversion tracking
    convertedAt: nullToUndefined(response.converted_at),
    convertedContactId: nullToUndefined(response.converted_contact_id),
    convertedCompanyId: nullToUndefined(response.converted_company_id),
    convertedDealId: nullToUndefined(response.converted_deal_id),
    convertedBy: nullToUndefined(response.converted_by),
    // Disqualification
    disqualifiedReason: nullToUndefined(response.disqualified_reason),
    disqualifiedAt: nullToUndefined(response.disqualified_at),
    // Activity
    lastActivityAt: nullToUndefined(response.last_activity_at),
    lastContactedAt: nullToUndefined(response.last_contacted_at),
    activityCount: response.activity_count,
    // Timestamps
    created: formatDate(response.created_at),
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    // Computed
    initials: getInitials(response.first_name, response.last_name),
  };
}

/**
 * Transform frontend form data to backend payload
 */
function toApiRequest(data: LeadFormData): LeadApiRequest {
  const payload: LeadApiRequest = {
    first_name: data.firstName || '',
    last_name: data.lastName || '',
    email: data.email || '',
    source: data.source || '',
  };

  // Contact info
  if (data.phone) payload.phone = data.phone;
  if (data.mobile) payload.mobile = data.mobile;

  // Company info
  if (data.companyName) payload.company_name = data.companyName;
  if (data.title) payload.title = data.title;
  if (data.website) payload.website = data.website;

  // Address
  if (data.addressLine1) payload.address_line1 = data.addressLine1;
  if (data.city) payload.city = data.city;
  if (data.state) payload.state = data.state;
  if (data.postalCode) payload.postal_code = data.postalCode;
  if (data.country) payload.country = data.country;

  // Status & Source
  if (data.status) payload.status = data.status;
  if (data.sourceDetail) payload.source_detail = data.sourceDetail;
  if (data.score !== undefined) payload.score = data.score;
  if (data.description) payload.description = data.description;
  if (data.customFields) payload.custom_fields = data.customFields;

  // Tags & Owner
  // Ensure tagIds are always strings (handle case where tag objects might be passed)
  if (data.tagIds && data.tagIds.length > 0) {
    payload.tag_ids = data.tagIds.map((tag: string | { id: string }) => 
      typeof tag === 'string' ? tag : tag.id
    );
  }
  if (data.ownerId) payload.owner_id = data.ownerId;

  return payload;
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
 * Get initials from name
 */
function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

// ============================================================================
// LEADS API
// ============================================================================

export const leadsApi = {
  /**
   * Get all leads with pagination and filtering
   */
  getAll: async (params: LeadQueryParams = {}): Promise<PaginatedLeadsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.source) queryParams.set('source', params.source);
    if (params.owner_id) queryParams.set('owner_id', params.owner_id);
    if (params.order_by) queryParams.set('order_by', params.order_by);
    
    // Add advanced filters if present
    if (params.filters && params.filters.conditions.length > 0) {
      queryParams.set('filters', JSON.stringify(params.filters));
    }

    const url = `/crm/api/v1/leads${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get<PaginatedResponse<LeadListApiResponse>>(url);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const backendMeta = response.data!.meta as any;
    
    return {
      data: response.data!.data.map(toLeadViewModel),
      meta: {
        page: backendMeta.page,
        page_size: backendMeta.page_size,
        total: backendMeta.total,
        stats: backendMeta.stats ? {
          total: backendMeta.stats.total,
          byStatus: backendMeta.stats.by_status || {},
          bySource: backendMeta.stats.by_source,
        } : undefined,
      },
    };
  },

  /**
   * Get lead by ID (UUID)
   */
  getById: async (id: string): Promise<LeadViewModel> => {
    const response = await apiClient.get<LeadApiResponse>(`/crm/api/v1/leads/${id}`);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullLeadViewModel(response.data!);
  },

  /**
   * Create a new lead
   */
  create: async (data: LeadFormData): Promise<LeadViewModel> => {
    const payload = toApiRequest(data);
    const response = await apiClient.post<LeadApiResponse>('/crm/api/v1/leads', payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullLeadViewModel(response.data!);
  },

  /**
   * Update a lead
   */
  update: async (id: string, data: LeadFormData): Promise<LeadViewModel> => {
    const payload = toApiRequest(data);
    const response = await apiClient.patch<LeadApiResponse>(`/crm/api/v1/leads/${id}`, payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullLeadViewModel(response.data!);
  },

  /**
   * Delete a lead
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/crm/api/v1/leads/${id}`);
    
    if (response.status !== 204 && response.status !== 200 && response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Bulk delete leads
   */
  bulkDelete: async (ids: string[]): Promise<BulkOperationResult> => {
    const response = await apiClient.post<BulkOperationResult>(
      '/crm/api/v1/leads/bulk-delete',
      { ids }
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data!;
  },

  /**
   * Bulk update leads
   */
  bulkUpdate: async (ids: string[], data: Partial<LeadFormData>): Promise<BulkOperationResult> => {
    // Convert camelCase to snake_case for API request
    const requestData: Record<string, unknown> = {};
    if (data.status) requestData.status = data.status;
    if (data.ownerId) requestData.owner_id = data.ownerId;
    if (data.source) requestData.source = data.source;
    if (data.score !== undefined) requestData.score = data.score;
    
    const response = await apiClient.post<BulkOperationResult>(
      '/crm/api/v1/leads/bulk-update',
      { ids, data: requestData }
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data!;
  },

  /**
   * Convert a lead to contact/company/deal
   */
  convert: async (id: string, params: ConvertLeadParams = {}): Promise<ConvertLeadResult> => {
    const payload = {
      create_contact: params.create_contact ?? true,
      create_company: params.create_company ?? true,
      create_deal: params.create_deal ?? false,
      contact_owner_id: params.contact_owner_id,
      company_name: params.company_name,
      company_owner_id: params.company_owner_id,
      deal_name: params.deal_name,
      deal_value: params.deal_value,
      deal_pipeline_id: params.deal_pipeline_id,
      deal_stage_id: params.deal_stage_id,
      deal_owner_id: params.deal_owner_id,
    };

    const response = await apiClient.post<ConvertLeadResult>(
      `/crm/api/v1/leads/${id}/convert`,
      payload
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!;
  },

  /**
   * Disqualify a lead
   */
  disqualify: async (id: string, reason: string = 'Not qualified'): Promise<LeadViewModel> => {
    const response = await apiClient.post<LeadApiResponse>(
      `/crm/api/v1/leads/${id}/disqualify`,
      { reason }
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return toFullLeadViewModel(response.data!);
  },

  /**
   * Update lead status only
   */
  updateStatus: async (id: string, status: string): Promise<LeadViewModel> => {
    const response = await apiClient.post<LeadApiResponse>(
      `/crm/api/v1/leads/${id}/status`,
      { status }
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return toFullLeadViewModel(response.data!);
  },

  /**
   * Get unique lead sources for the organization
   */
  getSources: async (): Promise<string[]> => {
    const response = await apiClient.get<{ data: string[] }>('/crm/api/v1/leads/sources');

    if (response.error) {
      console.error('Failed to fetch lead sources:', response.error);
      return [];
    }

    return response.data?.data || [];
  },
};
