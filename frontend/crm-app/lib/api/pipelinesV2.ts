import { apiClient } from './client';

export interface PipelineStageV2 {
  id: string;
  name: string;
  probability: number;
  order: number;
  is_won: boolean;
  is_lost: boolean;
  rotting_days?: number | null;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineV2 {
  id: string;
  org_id?: string;
  owner_id?: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  is_active: boolean;
  currency: string;
  order: number;
  stages: PipelineStageV2[];
  stage_count?: number;
  deal_count?: number;
  total_value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePipelineV2Input {
  name: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  currency?: string;
  order?: number;
  stages?: Partial<PipelineStageV2>[];
}

export interface PipelineV2Stats {
  pipeline_id: string;
  pipeline_name: string;
  total_deals: number;
  total_value: string;
  by_stage: Record<string, {
    count: number;
    value: string;
    probability: number;
    color: string;
  }>;
}

const BASE_URL = '/crm/api/v2/pipelines';

export const pipelinesV2Api = {
  list: async (params?: { is_active?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) {
      queryParams.set('is_active', String(params.is_active));
    }
    const url = queryParams.toString() ? `${BASE_URL}/?${queryParams}` : `${BASE_URL}/`;
    const response = await apiClient.get<{ results: PipelineV2[] }>(url);
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get<PipelineV2>(`${BASE_URL}/${id}/`);
    return response.data;
  },

  create: async (data: CreatePipelineV2Input) => {
    const response = await apiClient.post<PipelineV2>(`${BASE_URL}/`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<PipelineV2>) => {
    const response = await apiClient.patch<PipelineV2>(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`${BASE_URL}/${id}/`);
  },

  restore: async (id: string) => {
    const response = await apiClient.post<PipelineV2>(`${BASE_URL}/${id}/restore/`);
    return response.data;
  },

  setDefault: async (id: string) => {
    const response = await apiClient.post<PipelineV2>(`${BASE_URL}/${id}/set_default/`);
    return response.data;
  },

  addStage: async (pipelineId: string, data: Partial<PipelineStageV2>) => {
    const response = await apiClient.post<PipelineStageV2>(
      `${BASE_URL}/${pipelineId}/stages/`, data
    );
    return response.data;
  },

  updateStage: async (pipelineId: string, stageId: string, data: Partial<PipelineStageV2>) => {
    const response = await apiClient.patch<PipelineStageV2>(
      `${BASE_URL}/${pipelineId}/stages/${stageId}/`, data
    );
    return response.data;
  },

  deleteStage: async (pipelineId: string, stageId: string) => {
    await apiClient.delete(`${BASE_URL}/${pipelineId}/stages/${stageId}/delete/`);
  },

  reorderStages: async (pipelineId: string, stageIds: string[]) => {
    const response = await apiClient.post<PipelineV2>(
      `${BASE_URL}/${pipelineId}/reorder_stages/`, { stage_ids: stageIds }
    );
    return response.data;
  },

  stats: async (pipelineId: string) => {
    const response = await apiClient.get<PipelineV2Stats>(
      `${BASE_URL}/${pipelineId}/stats/`
    );
    return response.data;
  },
};
