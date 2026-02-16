import { apiClient, PaginatedResponse } from './client';
import type { Contact } from '@/lib/types';

/**
 * Full contact response from API (snake_case)
 * Used for: GET /contacts/{id}
 */
/**
 * Company association from API (snake_case)
 */
export interface ContactCompanyAssociation {
  id: string;
  company: {
    id: string;
    name: string;
    industry?: string;
    website?: string;
  };
  title?: string;
  department?: string;
  is_primary: boolean;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactApiResponse {
  id: string;
  org_id: string;
  owner_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  secondary_email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  primary_company_id?: string;
  primary_company?: {
    id: string;
    name: string;
    industry?: string;
    website?: string;
  };
  companies?: ContactCompanyAssociation[];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  description?: string;
  avatar_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  status?: string;
  source?: string;
  source_detail?: string;
  do_not_call?: boolean;
  do_not_email?: boolean;
  tags?: Array<{ id: string; name: string; color?: string }>;
  tag_ids?: string[];
  deal_count?: number;
  activity_count?: number;
  last_activity_at?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Contact list item response from API (snake_case)
 * Used for: GET /contacts (list endpoint)
 */
export interface ContactListApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  primary_company?: {
    id: string;
    name: string;
  };
  status?: string;
  source?: string;
  owner_id?: string;
  tags?: Array<{ id: string; name: string; color?: string }>;
  deal_count?: number;
  activity_count?: number;
  last_activity_at?: string;
  created_at: string;
}

/**
 * Frontend contact view model (camelCase)
 * Used for: UI display, React components
 */
/**
 * Company association view model (camelCase)
 */
export interface CompanyAssociation {
  id: string;
  companyId: string;
  companyName: string;
  companyIndustry?: string;
  companyWebsite?: string;
  title?: string;
  department?: string;
  isPrimary: boolean;
  isCurrent: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ContactViewModel {
  id: string; // UUID from backend
  name: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  company?: string;
  primaryCompanyId?: string;
  ownerId?: string;
  status: string;
  source?: string;
  sourceDetail?: string;
  created: string;
  initials: string;
  // Company associations (many-to-many)
  companies?: CompanyAssociation[];
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // Profile
  description?: string;
  avatarUrl?: string;
  // Social
  linkedinUrl?: string;
  twitterUrl?: string;
  // Preferences
  doNotCall?: boolean;
  doNotEmail?: boolean;
  // Tags
  tagIds?: string[];
  tags?: Array<{ id: string; name: string; color?: string }>;
  // Activity
  lastActivityAt?: string;
  lastContactedAt?: string;
  dealCount?: number;
  activityCount?: number;
}

/**
 * Contact request payload to API (snake_case)
 * Used for: POST /contacts, PATCH /contacts/{id}
 */
export interface ContactApiRequest {
  first_name: string;
  last_name: string;
  email: string;
  secondary_email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  primary_company_id?: string;
  owner_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  description?: string;
  avatar_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  status?: string;
  source?: string;
  source_detail?: string;
  do_not_call?: boolean;
  do_not_email?: boolean;
  tag_ids?: string[];
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
 * Query params for listing contacts
 */
export interface ContactQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  owner_id?: string;
  company_id?: string;
  order_by?: string;
  filters?: FilterGroup;
}

/**
 * Paginated response for contacts
 */
export interface PaginatedContactsResponse {
  data: ContactViewModel[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    stats?: ContactStats;
  };
}

/**
 * Contact statistics (frontend format)
 */
export interface ContactStats {
  total: number;
  byStatus: Record<string, number>;
}

/**
 * Backend contact statistics (snake_case)
 */
interface BackendContactStats {
  total: number;
  by_status?: Record<string, number>;
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
 * Form data type - uses Contact from types.ts
 * Partial allows for create/update with optional fields
 */
export type ContactFormData = Partial<Contact>;

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
function toContactViewModel(response: ContactListApiResponse): ContactViewModel {
  return {
    id: response.id,
    name: response.full_name || `${response.first_name} ${response.last_name}`.trim(),
    email: response.email,
    phone: response.phone || '-',
    mobile: nullToUndefined(response.mobile),
    jobTitle: nullToUndefined(response.title),
    department: nullToUndefined(response.department),
    company: response.primary_company?.name,
    primaryCompanyId: response.primary_company?.id,
    ownerId: nullToUndefined(response.owner_id),
    status: response.status || 'active',
    source: nullToUndefined(response.source),
    created: formatDate(response.created_at),
    initials: getInitials(response.first_name, response.last_name),
    tags: response.tags,
    dealCount: response.deal_count,
    activityCount: response.activity_count,
    lastActivityAt: nullToUndefined(response.last_activity_at),
  };
}

/**
 * Transform full API response to frontend view model
 */
function toCompanyAssociation(assoc: ContactCompanyAssociation): CompanyAssociation {
  return {
    id: assoc.id,
    companyId: assoc.company.id,
    companyName: assoc.company.name,
    companyIndustry: assoc.company.industry,
    companyWebsite: assoc.company.website,
    title: nullToUndefined(assoc.title),
    department: nullToUndefined(assoc.department),
    isPrimary: assoc.is_primary,
    isCurrent: assoc.is_current,
    startDate: nullToUndefined(assoc.start_date),
    endDate: nullToUndefined(assoc.end_date),
  };
}

function toFullContactViewModel(response: ContactApiResponse): ContactViewModel {
  // Extract tag IDs from tags array (tag_ids is write-only in backend)
  const tagIds = response.tags?.map(tag => tag.id) || response.tag_ids;
  
  // Extract primary company ID from primary_company object (primary_company_id is write-only in backend)
  const primaryCompanyId = response.primary_company?.id || response.primary_company_id;

  return {
    id: response.id,
    name: response.full_name || `${response.first_name} ${response.last_name}`.trim(),
    email: response.email,
    secondaryEmail: nullToUndefined(response.secondary_email),
    phone: response.phone || '-',
    mobile: nullToUndefined(response.mobile),
    jobTitle: nullToUndefined(response.title),
    department: nullToUndefined(response.department),
    company: response.primary_company?.name,
    primaryCompanyId: nullToUndefined(primaryCompanyId),
    ownerId: nullToUndefined(response.owner_id),
    status: response.status || 'active',
    source: nullToUndefined(response.source),
    sourceDetail: nullToUndefined(response.source_detail),
    created: formatDate(response.created_at),
    initials: getInitials(response.first_name, response.last_name),
    // Company associations
    companies: response.companies?.map(toCompanyAssociation),
    // Address
    addressLine1: nullToUndefined(response.address_line1),
    addressLine2: nullToUndefined(response.address_line2),
    city: nullToUndefined(response.city),
    state: nullToUndefined(response.state),
    postalCode: nullToUndefined(response.postal_code),
    country: nullToUndefined(response.country),
    // Profile
    description: nullToUndefined(response.description),
    avatarUrl: nullToUndefined(response.avatar_url),
    // Social
    linkedinUrl: nullToUndefined(response.linkedin_url),
    twitterUrl: nullToUndefined(response.twitter_url),
    // Preferences
    doNotCall: nullToUndefined(response.do_not_call),
    doNotEmail: nullToUndefined(response.do_not_email),
    // Tags - include both IDs (for forms) and full objects (for display)
    tagIds: nullToUndefined(tagIds),
    tags: response.tags,
    // Activity
    lastActivityAt: nullToUndefined(response.last_activity_at),
    lastContactedAt: nullToUndefined(response.last_contacted_at),
    dealCount: response.deal_count,
    activityCount: response.activity_count,
  };
}

/**
 * Transform frontend form data to backend payload
 */
function toApiRequest(data: ContactFormData): ContactApiRequest {
  const payload: ContactApiRequest = {
    first_name: data.firstName || '',
    last_name: data.lastName || '',
    email: data.email || '',
  };

  // Contact info
  if (data.phone) payload.phone = data.phone;
  if (data.mobile) payload.mobile = data.mobile;
  if (data.secondaryEmail) payload.secondary_email = data.secondaryEmail;

  // Job info
  if (data.title) payload.title = data.title;
  if (data.department) payload.department = data.department;

  // Company & Owner
  if (data.primaryCompanyId) payload.primary_company_id = data.primaryCompanyId;
  if (data.ownerId) payload.owner_id = data.ownerId;

  // Address
  if (data.addressLine1) payload.address_line1 = data.addressLine1;
  if (data.addressLine2) payload.address_line2 = data.addressLine2;
  if (data.city) payload.city = data.city;
  if (data.state) payload.state = data.state;
  if (data.postalCode) payload.postal_code = data.postalCode;
  if (data.country) payload.country = data.country;

  // Profile
  if (data.description) payload.description = data.description;
  if (data.avatarUrl) payload.avatar_url = data.avatarUrl;

  // Social
  if (data.linkedinUrl) payload.linkedin_url = data.linkedinUrl;
  if (data.twitterUrl) payload.twitter_url = data.twitterUrl;

  // Status & Source
  if (data.status) payload.status = data.status.toLowerCase();
  if (data.source) payload.source = data.source;
  if (data.sourceDetail) payload.source_detail = data.sourceDetail;

  // Preferences
  if (data.doNotCall !== undefined) payload.do_not_call = data.doNotCall;
  if (data.doNotEmail !== undefined) payload.do_not_email = data.doNotEmail;

  // Tags
  if (data.tagIds && data.tagIds.length > 0) payload.tag_ids = data.tagIds;

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
// CONTACT OPTIONS TYPE
// ============================================================================

/**
 * Contact option for dropdown select fields
 */
export interface ContactOption {
  value: string;
  label: string;
}

// ============================================================================
// CONTACTS API
// ============================================================================

export const contactsApi = {
  /**
   * Get all contacts with pagination and filtering
   */
  getAll: async (params: ContactQueryParams = {}): Promise<PaginatedContactsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.owner_id) queryParams.set('owner_id', params.owner_id);
    if (params.company_id) queryParams.set('company_id', params.company_id);
    if (params.order_by) queryParams.set('order_by', params.order_by);
    
    // Serialize advanced filters as JSON
    if (params.filters && params.filters.conditions.length > 0) {
      queryParams.set('filters', JSON.stringify(params.filters));
    }

    const url = `/crm/api/v1/contacts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get<PaginatedResponse<ContactListApiResponse, BackendContactStats>>(url);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    const backendMeta = response.data!.meta;
    
    // Transform snake_case stats to camelCase
    const stats: ContactStats | undefined = backendMeta.stats ? {
      total: backendMeta.stats.total,
      byStatus: backendMeta.stats.by_status || {},
    } : undefined;
    
    return {
      data: response.data!.data.map(toContactViewModel),
      meta: {
        page: backendMeta.page,
        page_size: backendMeta.page_size,
        total: backendMeta.total,
        stats,
      },
    };
  },

  /**
   * Get contact by ID (UUID)
   */
  getById: async (id: string): Promise<ContactViewModel> => {
    const response = await apiClient.get<ContactApiResponse>(`/crm/api/v1/contacts/${id}`);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullContactViewModel(response.data!);
  },

  /**
   * Create a new contact
   * @param data - Contact form data
   * @param options - Optional settings
   * @param options.skipDuplicateCheck - If true, skip duplicate email check (user confirmed)
   */
  create: async (
    data: ContactFormData, 
    options?: { skipDuplicateCheck?: boolean }
  ): Promise<ContactViewModel> => {
    const payload = {
      ...toApiRequest(data),
      skip_duplicate_check: options?.skipDuplicateCheck ?? false,
    };
    const response = await apiClient.post<ContactApiResponse>('/crm/api/v1/contacts', payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullContactViewModel(response.data!);
  },

  /**
   * Update a contact
   */
  update: async (id: string, data: ContactFormData): Promise<ContactViewModel> => {
    const payload = toApiRequest(data);
    const response = await apiClient.patch<ContactApiResponse>(`/crm/api/v1/contacts/${id}`, payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullContactViewModel(response.data!);
  },

  /**
   * Delete a contact
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/crm/api/v1/contacts/${id}`);
    
    if (response.status !== 204 && response.status !== 200 && response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Bulk delete contacts
   */
  bulkDelete: async (ids: string[]): Promise<BulkOperationResult> => {
    const response = await apiClient.post<BulkOperationResult>(
      '/crm/api/v1/contacts/bulk-delete',
      { ids }
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data!;
  },

  /**
   * Bulk update contacts
   */
  bulkUpdate: async (ids: string[], data: Partial<ContactFormData>): Promise<BulkOperationResult> => {
    // Convert camelCase to snake_case for API request
    const requestData: Record<string, unknown> = {};
    if (data.status) requestData.status = data.status;
    if (data.ownerId) requestData.owner_id = data.ownerId;
    if (data.firstName) requestData.first_name = data.firstName;
    if (data.lastName) requestData.last_name = data.lastName;
    if (data.email) requestData.email = data.email;
    if (data.phone) requestData.phone = data.phone;
    if (data.mobile) requestData.mobile = data.mobile;
    if (data.title) requestData.title = data.title;
    if (data.department) requestData.department = data.department;
    
    const response = await apiClient.post<BulkOperationResult>(
      '/crm/api/v1/contacts/bulk-update',
      { ids, data: requestData }
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data!;
  },

  /**
   * Import contacts from CSV data
   */
  import: async (
    contacts: Record<string, unknown>[],
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
      duplicateCheckField: 'email' | 'phone';
    }
  ): Promise<ImportResult> => {
    // Transform camelCase field names to snake_case for each contact
    const transformedContacts = contacts.map(contact => {
      const transformed: Record<string, unknown> = {};
      
      // Map common field names from camelCase to snake_case
      const fieldMap: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email',
        secondaryEmail: 'secondary_email',
        phone: 'phone',
        mobile: 'mobile',
        title: 'title',
        department: 'department',
        status: 'status',
        source: 'source',
        sourceDetail: 'source_detail',
        addressLine1: 'address_line1',
        addressLine2: 'address_line2',
        city: 'city',
        state: 'state',
        postalCode: 'postal_code',
        country: 'country',
        description: 'description',
        linkedinUrl: 'linkedin_url',
        twitterUrl: 'twitter_url',
        doNotCall: 'do_not_call',
        doNotEmail: 'do_not_email',
      };

      // Fields that should be boolean
      const booleanFields = ['doNotCall', 'doNotEmail', 'do_not_call', 'do_not_email'];

      Object.entries(contact).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          const snakeKey = fieldMap[key] || key;
          
          // Convert string booleans to actual booleans
          if (booleanFields.includes(key) || booleanFields.includes(snakeKey)) {
            if (typeof value === 'string') {
              transformed[snakeKey] = value.toLowerCase() === 'true';
            } else {
              transformed[snakeKey] = Boolean(value);
            }
          } else {
            transformed[snakeKey] = value;
          }
        }
      });

      return transformed;
    });

    const response = await apiClient.post<ImportResult>(
      '/crm/api/v1/contacts/import',
      {
        contacts: transformedContacts,
        skip_duplicates: options.skipDuplicates,
        update_existing: options.updateExisting,
        duplicate_check_field: options.duplicateCheckField,
      }
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!;
  },

  /**
   * Check for duplicate contacts before creation
   */
  checkDuplicates: async (params: {
    email?: string;
    phone?: string;
    name?: string;
  }): Promise<DuplicateCheckResult> => {
    const response = await apiClient.post<DuplicateCheckResult>(
      '/crm/api/v1/duplicates/check',
      {
        entity_type: 'contact',
        email: params.email,
        phone: params.phone,
        name: params.name,
      }
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!;
  },

  /**
   * Merge two contacts
   * The secondary contact will be deleted after merging into the primary
   */
  merge: async (params: MergeContactParams): Promise<MergeContactResult> => {
    const response = await apiClient.post<MergeContactResult>(
      '/crm/api/v1/contacts/merge',
      {
        primary_id: params.primaryId,
        secondary_id: params.secondaryId,
        merge_strategy: params.mergeStrategy || 'keep_primary',
      }
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!;
  },

  /**
   * Get contacts as dropdown options
   * Used for select fields in forms
   */
  getAsOptions: async (): Promise<ContactOption[]> => {
    const response = await contactsApi.getAll({ page_size: 100 });
    return response.data.map(contact => ({
      value: contact.id,
      label: contact.name || contact.email,
    }));
  },

  // ==========================================================================
  // CONTACT-COMPANY ASSOCIATIONS
  // ==========================================================================

  /**
   * Add a company association to a contact
   */
  addCompany: async (contactId: string, data: {
    companyId: string;
    title?: string;
    department?: string;
    isPrimary?: boolean;
  }): Promise<CompanyAssociation> => {
    const response = await apiClient.post<ContactCompanyAssociation>(
      `/crm/api/v1/contacts/${contactId}/companies`,
      {
        company_id: data.companyId,
        title: data.title,
        department: data.department,
        is_primary: data.isPrimary ?? false,
      }
    );
    if (response.error) {
      throw new Error(response.error.message);
    }
    return toCompanyAssociation(response.data!);
  },

  /**
   * Remove a company association from a contact
   */
  removeCompany: async (contactId: string, companyId: string): Promise<void> => {
    const response = await apiClient.delete(
      `/crm/api/v1/contacts/${contactId}/companies/${companyId}`
    );
    if (response.status !== 204 && response.status !== 200 && response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Update a company association (title, department, is_primary)
   */
  updateCompanyAssociation: async (contactId: string, companyId: string, data: {
    title?: string;
    department?: string;
    isPrimary?: boolean;
  }): Promise<CompanyAssociation> => {
    const response = await apiClient.patch<ContactCompanyAssociation>(
      `/crm/api/v1/contacts/${contactId}/companies/${companyId}`,
      {
        title: data.title,
        department: data.department,
        is_primary: data.isPrimary ?? false,
      }
    );
    if (response.error) {
      throw new Error(response.error.message);
    }
    return toCompanyAssociation(response.data!);
  },
};

/**
 * Duplicate check result type
 */
export interface DuplicateCheckResult {
  has_duplicates: boolean;
  duplicates: Array<{ id: string; name: string }>;
  match_field: 'email' | 'phone' | 'name';
}

/**
 * Import result type
 */
export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; error: string; data?: Record<string, unknown> }>;
}

/**
 * Merge strategy type
 */
export type MergeStrategy = 'keep_primary' | 'fill_empty';

/**
 * Merge request parameters
 */
export interface MergeContactParams {
  primaryId: string;
  secondaryId: string;
  mergeStrategy?: MergeStrategy;
}

/**
 * Merge result type
 */
export interface MergeContactResult {
  success: boolean;
  merged_contact?: ContactApiResponse;
  message: string;
}
