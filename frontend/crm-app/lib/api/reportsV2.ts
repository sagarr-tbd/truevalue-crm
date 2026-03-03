import { apiClient } from './client';

export interface DashboardV2Response {
  counts: {
    contacts: number;
    companies: number;
    leads: number;
    deals: number;
    activities: number;
  };
  deals: {
    open: number;
    won: number;
    lost: number;
    total_value: string;
    open_value: string;
    won_value: string;
  };
  activities: {
    total: number;
    overdue: number;
  };
  last_30_days: {
    new_contacts: number;
    new_leads: number;
    deals_won: number;
    revenue_won: string;
  };
}

export interface PipelineReportV2Response {
  period_days: number;
  stage_distribution: Array<{ stage: string; count: number; value: string }>;
  conversion: {
    total_created: number;
    won: number;
    lost: number;
    win_rate: number;
    avg_deal_value: string;
    avg_days_to_close: number | null;
  };
  monthly_trend: Array<{
    month: string;
    created: number;
    won: number;
    lost: number;
    revenue: string;
  }>;
}

export interface LeadConversionReportV2Response {
  period_days: number;
  summary: {
    total: number;
    by_status: Record<string, number>;
    conversion_rate: number;
  };
  by_source: Array<{
    source: string;
    total: number;
    converted: number;
    conversion_rate: number;
  }>;
  monthly_trend: Array<{
    month: string;
    created: number;
    converted: number;
    lost: number;
  }>;
}

export const reportsV2Api = {
  dashboard: async () => {
    const response = await apiClient.get<DashboardV2Response>(
      '/crm/api/v2/reports/dashboard/'
    );
    return response.data;
  },

  pipeline: async (params?: { pipeline_id?: string; days?: number }) => {
    const qp = new URLSearchParams();
    if (params?.pipeline_id) qp.set('pipeline_id', params.pipeline_id);
    if (params?.days) qp.set('days', String(params.days));
    const url = qp.toString()
      ? `/crm/api/v2/reports/pipeline/?${qp}`
      : '/crm/api/v2/reports/pipeline/';
    const response = await apiClient.get<PipelineReportV2Response>(url);
    return response.data;
  },

  leadConversion: async (params?: { days?: number }) => {
    const qp = new URLSearchParams();
    if (params?.days) qp.set('days', String(params.days));
    const url = qp.toString()
      ? `/crm/api/v2/reports/lead-conversion/?${qp}`
      : '/crm/api/v2/reports/lead-conversion/';
    const response = await apiClient.get<LeadConversionReportV2Response>(url);
    return response.data;
  },
};
