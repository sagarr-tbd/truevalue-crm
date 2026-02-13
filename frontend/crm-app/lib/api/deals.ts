import { apiClient, PaginatedResponse } from './client';

// =============================================================================
// API RESPONSE TYPES (snake_case from backend)
// =============================================================================

/**
 * Pipeline stage minimal response (embedded in deal)
 */
export interface PipelineStageMinimal {
  id: string;
  name: string;
  probability: number;
  order: number;
  is_won: boolean;
  is_lost: boolean;
  color?: string;
}

/**
 * Pipeline minimal response (embedded in deal)
 */
export interface PipelineMinimal {
  id: string;
  name: string;
  currency: string;
}

/**
 * Contact minimal response (embedded in deal)
 */
export interface ContactMinimal {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  email: string;
}

/**
 * Company minimal response (embedded in deal)
 */
export interface CompanyMinimal {
  id: string;
  name: string;
}

/**
 * Tag minimal response
 */
export interface TagMinimal {
  id: string;
  name: string;
  color?: string;
}

/**
 * Full deal response from API (snake_case)
 * Used for: GET /deals/{id}, POST /deals, PATCH /deals/{id}
 */
export interface DealApiResponse {
  id: string;
  org_id: string;
  owner_id?: string;
  name: string;
  pipeline: PipelineMinimal;
  stage: PipelineStageMinimal;
  value: string; // Decimal as string
  currency: string;
  probability?: number;
  weighted_value: string; // Decimal as string
  expected_close_date?: string;
  actual_close_date?: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  loss_reason?: string;
  loss_notes?: string;
  contact?: ContactMinimal;
  company?: CompanyMinimal;
  converted_from_lead_id?: string;
  description?: string;
  custom_fields?: Record<string, unknown>;
  tags?: TagMinimal[];
  line_items?: Record<string, unknown>[];
  stage_entered_at: string;
  last_activity_at?: string;
  activity_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Deal list item response from API (snake_case)
 * Used for: GET /deals (list endpoint)
 */
export interface DealListApiResponse {
  id: string;
  name: string;
  stage: PipelineStageMinimal;
  value: string;
  currency: string;
  weighted_value: string;
  expected_close_date?: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  contact?: ContactMinimal;
  company?: CompanyMinimal;
  tags?: TagMinimal[];
  owner_id?: string;
  description?: string;
  stage_entered_at: string;
  last_activity_at?: string;
  created_at: string;
}

// =============================================================================
// FRONTEND VIEW MODEL TYPES (camelCase for UI)
// =============================================================================

/**
 * Stage view model for frontend
 */
export interface StageViewModel {
  id: string;
  name: string;
  probability: number;
  order: number;
  isWon: boolean;
  isLost: boolean;
  color?: string;
}

/**
 * Frontend deal view model (camelCase)
 * Used for: UI display, React components
 */
export interface DealViewModel {
  id: string;
  orgId?: string;
  ownerId?: string;
  name: string;
  // Pipeline & Stage
  pipelineId: string;
  pipelineName: string;
  pipelineCurrency: string;
  stageId: string;
  stageName: string;
  stage: StageViewModel;
  // Value
  value: number;
  currency: string;
  probability: number;
  weightedValue: number;
  // Dates
  expectedCloseDate?: string;
  actualCloseDate?: string;
  stageEnteredAt: string;
  // Status
  status: 'open' | 'won' | 'lost' | 'abandoned';
  lossReason?: string;
  lossNotes?: string;
  // Relations
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  companyId?: string;
  companyName?: string;
  convertedFromLeadId?: string;
  // Additional
  description?: string;
  customFields?: Record<string, unknown>;
  tags?: TagMinimal[];
  tagIds?: string[];
  lineItems?: Record<string, unknown>[];
  // Activity
  lastActivityAt?: string;
  activityCount?: number;
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  created: string; // Formatted date
  // Computed
  initials: string;
}

/**
 * Deal request payload to API (snake_case)
 * Used for: POST /deals, PATCH /deals/{id}
 */
export interface DealApiRequest {
  name: string;
  pipeline_id: string;
  stage_id: string;
  value?: number;
  currency?: string;
  probability?: number;
  expected_close_date?: string;
  contact_id?: string;
  company_id?: string;
  description?: string;
  custom_fields?: Record<string, unknown>;
  tag_ids?: string[];
  owner_id?: string;
}

/**
 * Query params for listing deals
 */
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

export interface DealQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  pipeline_id?: string;
  stage_id?: string;
  owner_id?: string;
  contact_id?: string;
  company_id?: string;
  order_by?: string;
  filters?: FilterGroup;
}

/**
 * Deal statistics
 */
export interface DealStats {
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  openValue: number;
  wonValue: number;
  lostValue: number;
  avgDealSize: number;
}

/**
 * Backend deal statistics (snake_case)
 */
interface BackendDealStats {
  total: number;
  by_status?: Record<string, number>;
  total_value?: number;
  open_value?: number;
  won_value?: number;
  lost_value?: number;
  avg_deal_size?: number;
}

/**
 * Paginated response for deals
 */
export interface PaginatedDealsResponse {
  data: DealViewModel[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    stats?: DealStats;
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
 * Move stage request
 */
export interface MoveStageRequest {
  stage_id: string;
}

/**
 * Win deal request
 */
export interface WinDealRequest {
  actual_close_date?: string;
  notes?: string;
}

/**
 * Lose deal request
 */
export interface LoseDealRequest {
  loss_reason: string;
  loss_notes?: string;
}

/**
 * Reopen deal request
 */
export interface ReopenDealRequest {
  stage_id?: string;
}

/**
 * Form data type for deals
 */
export interface DealFormData {
  name?: string;
  pipelineId?: string;
  stageId?: string;
  value?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  contactId?: string;
  companyId?: string;
  description?: string;
  customFields?: Record<string, unknown>;
  tagIds?: string[];
  ownerId?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert null to undefined for consistent handling
 */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Parse decimal string to number
 */
function parseDecimal(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
}

/**
 * Transform API list response to frontend view model
 */
function toDealViewModel(response: DealListApiResponse): DealViewModel {
  const tagIds = response.tags?.map(tag => tag.id);
  
  return {
    id: response.id,
    name: response.name,
    // Pipeline & Stage (from nested stage object)
    pipelineId: '', // Not available in list response
    pipelineName: '',
    pipelineCurrency: response.currency,
    stageId: response.stage.id,
    stageName: response.stage.name,
    stage: {
      id: response.stage.id,
      name: response.stage.name,
      probability: response.stage.probability,
      order: response.stage.order,
      isWon: response.stage.is_won,
      isLost: response.stage.is_lost,
      color: response.stage.color,
    },
    // Value
    value: parseDecimal(response.value),
    currency: response.currency,
    probability: response.stage.probability,
    weightedValue: parseDecimal(response.weighted_value),
    // Dates
    expectedCloseDate: nullToUndefined(response.expected_close_date),
    stageEnteredAt: response.stage_entered_at,
    // Status
    status: response.status,
    // Relations
    contactId: response.contact?.id,
    contactName: response.contact?.full_name,
    contactEmail: response.contact?.email,
    companyId: response.company?.id,
    companyName: response.company?.name,
    // Additional
    description: nullToUndefined(response.description),
    // Tags
    tags: response.tags,
    tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
    // Activity
    lastActivityAt: nullToUndefined(response.last_activity_at),
    // Timestamps
    createdAt: response.created_at,
    created: formatDate(response.created_at),
    // Computed
    ownerId: nullToUndefined(response.owner_id),
    initials: getInitials(response.name),
  };
}

/**
 * Transform full API response to frontend view model
 */
function toFullDealViewModel(response: DealApiResponse): DealViewModel {
  const tagIds = response.tags?.map(tag => tag.id);
  
  return {
    id: response.id,
    orgId: response.org_id,
    ownerId: nullToUndefined(response.owner_id),
    name: response.name,
    // Pipeline & Stage
    pipelineId: response.pipeline.id,
    pipelineName: response.pipeline.name,
    pipelineCurrency: response.pipeline.currency,
    stageId: response.stage.id,
    stageName: response.stage.name,
    stage: {
      id: response.stage.id,
      name: response.stage.name,
      probability: response.stage.probability,
      order: response.stage.order,
      isWon: response.stage.is_won,
      isLost: response.stage.is_lost,
      color: response.stage.color,
    },
    // Value
    value: parseDecimal(response.value),
    currency: response.currency,
    probability: response.probability ?? response.stage.probability,
    weightedValue: parseDecimal(response.weighted_value),
    // Dates
    expectedCloseDate: nullToUndefined(response.expected_close_date),
    actualCloseDate: nullToUndefined(response.actual_close_date),
    stageEnteredAt: response.stage_entered_at,
    // Status
    status: response.status,
    lossReason: nullToUndefined(response.loss_reason),
    lossNotes: nullToUndefined(response.loss_notes),
    // Relations
    contactId: response.contact?.id,
    contactName: response.contact?.full_name,
    contactEmail: response.contact?.email,
    companyId: response.company?.id,
    companyName: response.company?.name,
    convertedFromLeadId: nullToUndefined(response.converted_from_lead_id),
    // Additional
    description: nullToUndefined(response.description),
    customFields: nullToUndefined(response.custom_fields),
    tags: response.tags,
    tagIds: nullToUndefined(tagIds),
    lineItems: nullToUndefined(response.line_items),
    // Activity
    lastActivityAt: nullToUndefined(response.last_activity_at),
    activityCount: response.activity_count,
    // Timestamps
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    created: formatDate(response.created_at),
    // Computed
    initials: getInitials(response.name),
  };
}

/**
 * Transform frontend form data to backend payload
 */
function toApiRequest(data: DealFormData): DealApiRequest {
  const payload: DealApiRequest = {
    name: data.name || '',
    pipeline_id: data.pipelineId || '',
    stage_id: data.stageId || '',
  };

  if (data.value !== undefined) payload.value = data.value;
  if (data.currency) payload.currency = data.currency;
  if (data.probability !== undefined) payload.probability = data.probability;
  if (data.expectedCloseDate) payload.expected_close_date = data.expectedCloseDate;
  if (data.contactId) payload.contact_id = data.contactId;
  if (data.companyId) payload.company_id = data.companyId;
  if (data.description) payload.description = data.description;
  if (data.customFields) payload.custom_fields = data.customFields;
  if (data.tagIds && data.tagIds.length > 0) payload.tag_ids = data.tagIds;
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
 * Get initials from deal name (first 2 letters of first word)
 */
function getInitials(name: string): string {
  if (!name) return 'DL';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// =============================================================================
// DEALS API
// =============================================================================

export const dealsApi = {
  /**
   * Get all deals with pagination and filtering
   */
  getAll: async (params: DealQueryParams = {}): Promise<PaginatedDealsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.pipeline_id) queryParams.set('pipeline_id', params.pipeline_id);
    if (params.stage_id) queryParams.set('stage_id', params.stage_id);
    if (params.owner_id) queryParams.set('owner_id', params.owner_id);
    if (params.contact_id) queryParams.set('contact_id', params.contact_id);
    if (params.company_id) queryParams.set('company_id', params.company_id);
    if (params.order_by) queryParams.set('order_by', params.order_by);
    
    // Serialize advanced filters as JSON
    if (params.filters && params.filters.conditions.length > 0) {
      queryParams.set('filters', JSON.stringify(params.filters));
    }

    const url = `/crm/api/v1/deals${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get<PaginatedResponse<DealListApiResponse, BackendDealStats>>(url);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    const backendMeta = response.data!.meta;
    
    return {
      data: response.data!.data.map(toDealViewModel),
      meta: {
        page: backendMeta.page,
        page_size: backendMeta.page_size,
        total: backendMeta.total,
        stats: backendMeta.stats ? {
          total: backendMeta.stats.total,
          byStatus: backendMeta.stats.by_status || {},
          totalValue: backendMeta.stats.total_value || 0,
          openValue: backendMeta.stats.open_value || 0,
          wonValue: backendMeta.stats.won_value || 0,
          lostValue: backendMeta.stats.lost_value || 0,
          avgDealSize: backendMeta.stats.avg_deal_size || 0,
        } : undefined,
      },
    };
  },

  /**
   * Get deal by ID (UUID)
   */
  getById: async (id: string): Promise<DealViewModel> => {
    const response = await apiClient.get<DealApiResponse>(`/crm/api/v1/deals/${id}`);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullDealViewModel(response.data!);
  },

  /**
   * Create a new deal
   */
  create: async (data: DealFormData): Promise<DealViewModel> => {
    const payload = toApiRequest(data);
    const response = await apiClient.post<DealApiResponse>('/crm/api/v1/deals', payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullDealViewModel(response.data!);
  },

  /**
   * Update a deal
   */
  update: async (id: string, data: DealFormData): Promise<DealViewModel> => {
    const payload = toApiRequest(data);
    const response = await apiClient.patch<DealApiResponse>(`/crm/api/v1/deals/${id}`, payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullDealViewModel(response.data!);
  },

  /**
   * Delete a deal
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/crm/api/v1/deals/${id}`);
    
    if (response.status !== 204 && response.status !== 200 && response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Bulk delete deals
   */
  bulkDelete: async (ids: string[]): Promise<BulkOperationResult> => {
    const response = await apiClient.post<BulkOperationResult>(
      '/crm/api/v1/deals/bulk-delete',
      { ids }
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data!;
  },

  /**
   * Move deal to a different stage
   */
  moveStage: async (id: string, stageId: string): Promise<DealViewModel> => {
    const response = await apiClient.post<DealApiResponse>(
      `/crm/api/v1/deals/${id}/move-stage`,
      { stage_id: stageId }
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullDealViewModel(response.data!);
  },

  /**
   * Mark deal as won
   */
  win: async (id: string, params?: WinDealRequest): Promise<DealViewModel> => {
    const response = await apiClient.post<DealApiResponse>(
      `/crm/api/v1/deals/${id}/win`,
      params || {}
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullDealViewModel(response.data!);
  },

  /**
   * Mark deal as lost
   */
  lose: async (id: string, params: LoseDealRequest): Promise<DealViewModel> => {
    const response = await apiClient.post<DealApiResponse>(
      `/crm/api/v1/deals/${id}/lose`,
      {
        loss_reason: params.loss_reason,
        loss_notes: params.loss_notes,
      }
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullDealViewModel(response.data!);
  },

  /**
   * Reopen a closed deal
   */
  reopen: async (id: string, params?: ReopenDealRequest): Promise<DealViewModel> => {
    const response = await apiClient.post<DealApiResponse>(
      `/crm/api/v1/deals/${id}/reopen`,
      params ? { stage_id: params.stage_id } : {}
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toFullDealViewModel(response.data!);
  },

  /**
   * Get deal forecast
   */
  getForecast: async (params?: { days?: number; pipeline_id?: string }): Promise<DealForecast> => {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.set('days', params.days.toString());
    if (params?.pipeline_id) queryParams.set('pipeline_id', params.pipeline_id);

    const url = `/crm/api/v1/deals/forecast${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get<DealForecast>(url);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data!;
  },
};

/**
 * Deal forecast response
 */
export interface DealForecast {
  period_start: string;
  period_end: string;
  total_deals: number;
  total_value: number;
  weighted_value: number;
  by_stage: Array<{
    stage_id: string;
    stage_name: string;
    count: number;
    value: number;
    weighted_value: number;
  }>;
}
