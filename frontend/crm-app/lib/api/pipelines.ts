import { apiClient } from './client';

// =============================================================================
// API RESPONSE TYPES (snake_case from backend)
// =============================================================================

/**
 * Pipeline stage response from API
 */
export interface PipelineStageApiResponse {
  id: string;
  pipeline: string;
  name: string;
  probability: number;
  order: number;
  is_won: boolean;
  is_lost: boolean;
  is_closed: boolean;
  rotting_days?: number;
  color?: string;
  deal_count: number;
  deal_value: number;
  created_at: string;
  updated_at: string;
}

/**
 * Pipeline response from API (with stages)
 */
export interface PipelineApiResponse {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  currency: string;
  order: number;
  stages: PipelineStageApiResponse[];
  total_deals: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

/**
 * Pipeline list response from API (minimal)
 */
export interface PipelineListApiResponse {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  currency: string;
  stage_count: number;
  created_at: string;
}

// =============================================================================
// FRONTEND VIEW MODEL TYPES (camelCase for UI)
// =============================================================================

/**
 * Pipeline stage view model
 */
export interface PipelineStageViewModel {
  id: string;
  pipelineId: string;
  name: string;
  probability: number;
  order: number;
  isWon: boolean;
  isLost: boolean;
  isClosed: boolean;
  rottingDays?: number;
  color?: string;
  dealCount: number;
  dealValue: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pipeline view model (with stages)
 */
export interface PipelineViewModel {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  currency: string;
  order: number;
  stages: PipelineStageViewModel[];
  totalDeals: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pipeline list item view model
 */
export interface PipelineListViewModel {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  currency: string;
  stageCount: number;
  createdAt: string;
}

/**
 * Stage info for Kanban column
 */
export interface KanbanStage {
  id: string;
  name: string;
  probability: number;
  order: number;
  isWon: boolean;
  isLost: boolean;
  color?: string;
}

/**
 * Kanban column with deals
 */
export interface KanbanColumn {
  stage: KanbanStage;
  deals: KanbanDeal[];
  totalValue: number;
}

/**
 * Kanban deal item
 */
export interface KanbanDeal {
  id: string;
  name: string;
  value: number;
  currency: string;
  weightedValue: number;
  expectedCloseDate?: string;
  contactName?: string;
  companyName?: string;
  ownerId?: string;
  stageId: string;
  stageEnteredAt: string;
  lastActivityAt?: string;
  tags?: Array<{ id: string; name: string; color?: string }>;
  initials: string;
}

/**
 * Kanban response
 */
export interface KanbanResponse {
  pipeline: {
    id: string;
    name: string;
    currency: string;
  };
  columns: KanbanColumn[];
  totalDeals: number;
  totalValue: number;
}

/**
 * Pipeline form data
 */
export interface PipelineFormData {
  name: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  currency?: string;
}

/**
 * Stage form data
 */
export interface StageFormData {
  name: string;
  probability?: number;
  isWon?: boolean;
  isLost?: boolean;
  rottingDays?: number;
  color?: string;
}

/**
 * Pipeline stats response
 */
export interface PipelineStatsResponse {
  pipelineId: string;
  pipelineName: string;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  wonValue: number;
  winRate: number;
  avgDealSize: number;
  avgTimeToClose: number;
  byStage: Array<{
    stageId: string;
    stageName: string;
    dealCount: number;
    dealValue: number;
  }>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Transform stage API response to view model
 */
function toStageViewModel(response: PipelineStageApiResponse): PipelineStageViewModel {
  return {
    id: response.id,
    pipelineId: response.pipeline,
    name: response.name,
    probability: response.probability,
    order: response.order,
    isWon: response.is_won,
    isLost: response.is_lost,
    isClosed: response.is_closed,
    rottingDays: response.rotting_days,
    color: response.color,
    dealCount: response.deal_count,
    dealValue: parseFloat(String(response.deal_value)) || 0,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Transform pipeline API response to view model
 */
function toPipelineViewModel(response: PipelineApiResponse): PipelineViewModel {
  return {
    id: response.id,
    orgId: response.org_id,
    name: response.name,
    description: response.description,
    isDefault: response.is_default,
    isActive: response.is_active,
    currency: response.currency,
    order: response.order,
    stages: response.stages.map(toStageViewModel),
    totalDeals: response.total_deals,
    totalValue: parseFloat(String(response.total_value)) || 0,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Transform pipeline list API response to view model
 */
function toPipelineListViewModel(response: PipelineListApiResponse): PipelineListViewModel {
  return {
    id: response.id,
    name: response.name,
    isDefault: response.is_default,
    isActive: response.is_active,
    currency: response.currency,
    stageCount: response.stage_count,
    createdAt: response.created_at,
  };
}

/**
 * Get initials from deal name
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
// PIPELINES API
// =============================================================================

export const pipelinesApi = {
  /**
   * Get all pipelines
   */
  getAll: async (): Promise<PipelineListViewModel[]> => {
    const response = await apiClient.get<{ data: PipelineListApiResponse[] }>('/crm/api/v1/pipelines');
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data!.data.map(toPipelineListViewModel);
  },

  /**
   * Get pipeline by ID (with stages)
   */
  getById: async (id: string): Promise<PipelineViewModel> => {
    const response = await apiClient.get<PipelineApiResponse>(`/crm/api/v1/pipelines/${id}`);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toPipelineViewModel(response.data!);
  },

  /**
   * Get default pipeline
   */
  getDefault: async (): Promise<PipelineViewModel | null> => {
    try {
      const pipelines = await pipelinesApi.getAll();
      const defaultPipeline = pipelines.find(p => p.isDefault);
      
      if (!defaultPipeline) {
        // Return first pipeline if no default
        if (pipelines.length > 0) {
          return await pipelinesApi.getById(pipelines[0].id);
        }
        return null;
      }
      
      return await pipelinesApi.getById(defaultPipeline.id);
    } catch {
      return null;
    }
  },

  /**
   * Create a new pipeline
   */
  create: async (data: PipelineFormData): Promise<PipelineViewModel> => {
    const payload = {
      name: data.name,
      description: data.description,
      is_default: data.isDefault ?? false,
      is_active: data.isActive ?? true,
      currency: data.currency ?? 'USD',
    };
    
    const response = await apiClient.post<PipelineApiResponse>('/crm/api/v1/pipelines', payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toPipelineViewModel(response.data!);
  },

  /**
   * Update a pipeline
   */
  update: async (id: string, data: Partial<PipelineFormData>): Promise<PipelineViewModel> => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.isDefault !== undefined) payload.is_default = data.isDefault;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    if (data.currency !== undefined) payload.currency = data.currency;
    
    const response = await apiClient.patch<PipelineApiResponse>(`/crm/api/v1/pipelines/${id}`, payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toPipelineViewModel(response.data!);
  },

  /**
   * Delete a pipeline
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/crm/api/v1/pipelines/${id}`);
    
    if (response.status !== 204 && response.status !== 200 && response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Get pipeline stats
   */
  getStats: async (id: string): Promise<PipelineStatsResponse> => {
    const response = await apiClient.get<{
      pipeline_id: string;
      pipeline_name: string;
      total_deals: number;
      open_deals: number;
      won_deals: number;
      lost_deals: number;
      total_value: number;
      won_value: number;
      win_rate: number;
      avg_deal_size: number;
      avg_time_to_close: number;
      by_stage: Array<{
        stage_id: string;
        stage_name: string;
        deal_count: number;
        deal_value: number;
      }>;
    }>(`/crm/api/v1/pipelines/${id}/stats`);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    const data = response.data!;
    return {
      pipelineId: data.pipeline_id,
      pipelineName: data.pipeline_name,
      totalDeals: data.total_deals,
      openDeals: data.open_deals,
      wonDeals: data.won_deals,
      lostDeals: data.lost_deals,
      totalValue: parseFloat(String(data.total_value)) || 0,
      wonValue: parseFloat(String(data.won_value)) || 0,
      winRate: data.win_rate,
      avgDealSize: parseFloat(String(data.avg_deal_size)) || 0,
      avgTimeToClose: data.avg_time_to_close,
      byStage: (data.by_stage || []).map(s => ({
        stageId: s.stage_id,
        stageName: s.stage_name,
        dealCount: s.deal_count,
        dealValue: parseFloat(String(s.deal_value)) || 0,
      })),
    };
  },

  /**
   * Get Kanban view for a pipeline
   */
  getKanban: async (pipelineId: string): Promise<KanbanResponse> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any>(`/crm/api/v1/pipelines/${pipelineId}/kanban`);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    const data = response.data!;
    
    return {
      pipeline: {
        id: data.pipeline.id,
        name: data.pipeline.name,
        currency: data.pipeline.currency,
      },
      columns: data.stages.map((stage: {
        id: string;
        name: string;
        probability: number;
        order: number;
        is_won: boolean;
        is_lost: boolean;
        color?: string;
        deals: Array<{
          id: string;
          name: string;
          value: string | number;
          currency: string;
          weighted_value: string | number;
          expected_close_date?: string;
          contact?: { name: string };
          company?: { name: string };
          owner_id?: string;
          stage_entered_at: string;
          last_activity_at?: string;
          tags?: Array<{ id: string; name: string; color?: string }>;
        }>;
        total_value: number;
        deal_count: number;
      }) => ({
        stage: {
          id: stage.id,
          name: stage.name,
          probability: stage.probability,
          order: stage.order,
          isWon: stage.is_won,
          isLost: stage.is_lost,
          color: stage.color,
        },
        deals: stage.deals.map((deal: {
          id: string;
          name: string;
          value: string | number;
          currency: string;
          weighted_value: string | number;
          expected_close_date?: string;
          contact?: { name: string };
          company?: { name: string };
          owner_id?: string;
          stage_entered_at: string;
          last_activity_at?: string;
          tags?: Array<{ id: string; name: string; color?: string }>;
        }) => ({
          id: deal.id,
          name: deal.name,
          value: parseFloat(String(deal.value)) || 0,
          currency: deal.currency,
          weightedValue: parseFloat(String(deal.weighted_value)) || 0,
          expectedCloseDate: deal.expected_close_date,
          contactName: deal.contact?.name,
          companyName: deal.company?.name,
          ownerId: deal.owner_id,
          stageId: stage.id,
          stageEnteredAt: deal.stage_entered_at,
          lastActivityAt: deal.last_activity_at,
          tags: deal.tags,
          initials: getInitials(deal.name),
        })),
        totalValue: parseFloat(String(stage.total_value)) || 0,
      })),
      totalDeals: data.total_deals,
      totalValue: parseFloat(String(data.total_value)) || 0,
    };
  },

  // =========================================================================
  // STAGES API
  // =========================================================================

  /**
   * Get stages for a pipeline
   */
  getStages: async (pipelineId: string): Promise<PipelineStageViewModel[]> => {
    const response = await apiClient.get<{ data: PipelineStageApiResponse[] }>(
      `/crm/api/v1/pipelines/${pipelineId}/stages`
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data!.data.map(toStageViewModel);
  },

  /**
   * Create a new stage
   */
  createStage: async (pipelineId: string, data: StageFormData): Promise<PipelineStageViewModel> => {
    const payload = {
      name: data.name,
      probability: data.probability ?? 0,
      is_won: data.isWon ?? false,
      is_lost: data.isLost ?? false,
      rotting_days: data.rottingDays,
      color: data.color,
    };
    
    const response = await apiClient.post<PipelineStageApiResponse>(
      `/crm/api/v1/pipelines/${pipelineId}/stages`,
      payload
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toStageViewModel(response.data!);
  },

  /**
   * Update a stage
   */
  updateStage: async (
    pipelineId: string,
    stageId: string,
    data: Partial<StageFormData>
  ): Promise<PipelineStageViewModel> => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.probability !== undefined) payload.probability = data.probability;
    if (data.isWon !== undefined) payload.is_won = data.isWon;
    if (data.isLost !== undefined) payload.is_lost = data.isLost;
    if (data.rottingDays !== undefined) payload.rotting_days = data.rottingDays;
    if (data.color !== undefined) payload.color = data.color;
    
    const response = await apiClient.patch<PipelineStageApiResponse>(
      `/crm/api/v1/pipelines/${pipelineId}/stages/${stageId}`,
      payload
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return toStageViewModel(response.data!);
  },

  /**
   * Delete a stage
   */
  deleteStage: async (pipelineId: string, stageId: string): Promise<void> => {
    const response = await apiClient.delete(
      `/crm/api/v1/pipelines/${pipelineId}/stages/${stageId}`
    );
    
    if (response.status !== 204 && response.status !== 200 && response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Reorder stages
   */
  reorderStages: async (pipelineId: string, stageIds: string[]): Promise<void> => {
    const response = await apiClient.post(
      `/crm/api/v1/pipelines/${pipelineId}/stages/reorder`,
      { stage_ids: stageIds }
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
  },
};
