import { apiClient } from './client';

export interface ActivityV2 {
  id: string;
  org_id?: string;
  owner_id?: string;
  activity_type: 'task' | 'note' | 'call' | 'email' | 'meeting';
  subject: string;
  description?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date?: string | null;
  completed_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  call_direction?: 'inbound' | 'outbound' | null;
  call_outcome?: 'answered' | 'voicemail' | 'no_answer' | 'busy' | 'failed' | null;
  email_direction?: 'sent' | 'received' | null;
  email_message_id?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  deal_id?: string | null;
  lead_id?: string | null;
  assigned_to_id?: string | null;
  created_by_id?: string | null;
  reminder_at?: string | null;
  reminder_sent?: boolean;
  display_owner?: string;
  display_assigned_to?: string;
  display_contact?: string;
  display_company?: string;
  display_deal?: string;
  display_lead?: string;
  is_overdue?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateActivityV2Input {
  activity_type: ActivityV2['activity_type'];
  subject: string;
  description?: string;
  status?: ActivityV2['status'];
  priority?: ActivityV2['priority'];
  due_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  call_direction?: string;
  call_outcome?: string;
  email_direction?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  lead_id?: string;
  assigned_to_id?: string;
  reminder_at?: string;
}

export interface ActivityV2Stats {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  overdue: number;
}

export interface ActivityV2ListParams {
  activity_type?: string;
  status?: string;
  priority?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  lead_id?: string;
  assigned_to?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  email_direction?: string;
}

const BASE_URL = '/crm/api/v2/activities';

export const activitiesV2Api = {
  list: async (params?: ActivityV2ListParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.set(key, String(value));
        }
      });
    }
    const url = queryParams.toString() ? `${BASE_URL}/?${queryParams}` : `${BASE_URL}/`;
    const response = await apiClient.get<{ count: number; results: ActivityV2[] }>(url);
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get<ActivityV2>(`${BASE_URL}/${id}/`);
    return response.data;
  },

  create: async (data: CreateActivityV2Input) => {
    const response = await apiClient.post<ActivityV2>(`${BASE_URL}/`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<ActivityV2>) => {
    const response = await apiClient.patch<ActivityV2>(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`${BASE_URL}/${id}/`);
  },

  restore: async (id: string) => {
    const response = await apiClient.post<ActivityV2>(`${BASE_URL}/${id}/restore/`);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.post<ActivityV2>(`${BASE_URL}/${id}/complete/`);
    return response.data;
  },

  stats: async (activityType?: string) => {
    const url = activityType
      ? `${BASE_URL}/stats/?activity_type=${activityType}`
      : `${BASE_URL}/stats/`;
    const response = await apiClient.get<ActivityV2Stats>(url);
    return response.data;
  },

  calendar: async (start: string, end: string) => {
    const response = await apiClient.get<{ results: ActivityV2[] }>(
      `${BASE_URL}/calendar/?start=${start}&end=${end}`
    );
    return response.data;
  },

  upcoming: async (days?: number) => {
    const url = days ? `${BASE_URL}/upcoming/?days=${days}` : `${BASE_URL}/upcoming/`;
    const response = await apiClient.get<{ results: ActivityV2[] }>(url);
    return response.data;
  },

  overdue: async () => {
    const response = await apiClient.get<{ results: ActivityV2[] }>(`${BASE_URL}/overdue/`);
    return response.data;
  },

  mine: async (params?: { page?: number; page_size?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.page_size) queryParams.set('page_size', String(params.page_size));
    const url = queryParams.toString() ? `${BASE_URL}/mine/?${queryParams}` : `${BASE_URL}/mine/`;
    const response = await apiClient.get<{ count: number; results: ActivityV2[] }>(url);
    return response.data;
  },

  bulkDelete: async (ids: string[]) => {
    const response = await apiClient.post<{ deleted: number }>(`${BASE_URL}/bulk_delete/`, { ids });
    return response.data;
  },

  bulkUpdate: async (ids: string[], updates: Record<string, string>) => {
    const response = await apiClient.post<{ updated: number }>(
      `${BASE_URL}/bulk_update/`, { ids, updates }
    );
    return response.data;
  },

  trend: async (days?: number, activityType?: string) => {
    const qp = new URLSearchParams();
    if (days) qp.set('days', String(days));
    if (activityType) qp.set('activity_type', activityType);
    const url = qp.toString()
      ? `${BASE_URL}/trend/?${qp}`
      : `${BASE_URL}/trend/`;
    const response = await apiClient.get<ActivityV2TrendResponse>(url);
    return response.data;
  },
};

export interface ActivityV2TrendResponse {
  days: number;
  daily: Array<{ date: string; count: number }>;
  by_type: Record<string, Array<{ date: string; count: number }>>;
  total: number;
}
