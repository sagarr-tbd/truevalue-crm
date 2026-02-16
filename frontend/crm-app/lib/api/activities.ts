import { apiClient, PaginatedResponse } from './client';

/**
 * Activity types
 */
export type ActivityType = 'task' | 'note' | 'call' | 'email' | 'meeting';
export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ActivityPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Activity API response (snake_case from backend)
 */
export interface ActivityApiResponse {
  id: string;
  org_id: string;
  owner_id: string;
  activity_type: ActivityType;
  subject: string;
  description?: string | null;
  status: ActivityStatus;
  priority: ActivityPriority;
  due_date?: string | null;
  completed_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  call_direction?: string | null;
  call_outcome?: string | null;
  email_direction?: string | null;
  contact?: {
    id: string;
    full_name: string;
    email?: string;
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
  deal?: {
    id: string;
    name: string;
  } | null;
  lead?: {
    id: string;
    name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  assigned_to?: string | null;
  reminder_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Activity view model (camelCase for frontend)
 */
export interface ActivityViewModel {
  id: string;
  orgId: string;
  ownerId: string;
  type: ActivityType;
  subject: string;
  description?: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  dueDate?: string;
  completedAt?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  callDirection?: string;
  callOutcome?: string;
  emailDirection?: string;
  contact?: {
    id: string;
    name: string;
    email?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  deal?: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    name: string;
  };
  assignedTo?: string;
  reminderAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Activity create/update payload (snake_case for API)
 */
export interface ActivityApiRequest {
  activity_type: ActivityType;
  subject: string;
  description?: string | null;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  due_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  call_direction?: string | null;
  call_outcome?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  deal_id?: string | null;
  lead_id?: string | null;
  assigned_to?: string | null;
  reminder_at?: string | null;
}

/**
 * Activity form data (camelCase for frontend forms)
 */
export interface ActivityFormData {
  activityType: ActivityType;
  subject: string;
  description?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  callDirection?: string;
  callOutcome?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  leadId?: string;
  assignedTo?: string;
  reminderAt?: string;
}

/**
 * Activity statistics (camelCase for frontend)
 */
export interface ActivityStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
}

/**
 * Backend activity statistics (snake_case)
 */
interface BackendActivityStats {
  total: number;
  by_status?: Record<string, number>;
  by_priority?: Record<string, number>;
  overdue?: number;
}

/**
 * Transform API response to view model
 */
function toActivityViewModel(response: ActivityApiResponse): ActivityViewModel {
  return {
    id: response.id,
    orgId: response.org_id,
    ownerId: response.owner_id,
    type: response.activity_type,
    subject: response.subject,
    description: response.description ?? undefined,
    status: response.status,
    priority: response.priority,
    dueDate: response.due_date ?? undefined,
    completedAt: response.completed_at ?? undefined,
    startTime: response.start_time ?? undefined,
    endTime: response.end_time ?? undefined,
    durationMinutes: response.duration_minutes ?? undefined,
    callDirection: response.call_direction ?? undefined,
    callOutcome: response.call_outcome ?? undefined,
    emailDirection: response.email_direction ?? undefined,
    contact: response.contact ? {
      id: response.contact.id,
      name: response.contact.full_name,
      email: response.contact.email,
    } : undefined,
    company: response.company ? {
      id: response.company.id,
      name: response.company.name,
    } : undefined,
    deal: response.deal ? {
      id: response.deal.id,
      name: response.deal.name,
    } : undefined,
    lead: response.lead ? {
      id: response.lead.id,
      name: response.lead.full_name || response.lead.name || `${response.lead.first_name || ''} ${response.lead.last_name || ''}`.trim() || 'Unknown',
    } : undefined,
    assignedTo: response.assigned_to ?? undefined,
    reminderAt: response.reminder_at ?? undefined,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Transform form data to API request
 */
/**
 * Convert empty string to undefined (strip empty optional fields from payload)
 */
function emptyToUndefined(v: string | undefined): string | undefined {
  return v === '' ? undefined : v;
}

function toApiRequest(data: ActivityFormData): ActivityApiRequest {
  return {
    activity_type: data.activityType,
    subject: data.subject,
    description: emptyToUndefined(data.description),
    status: data.status,
    priority: data.priority,
    due_date: emptyToUndefined(data.dueDate),
    start_time: emptyToUndefined(data.startTime),
    end_time: emptyToUndefined(data.endTime),
    duration_minutes: data.durationMinutes,
    call_direction: emptyToUndefined(data.callDirection),
    call_outcome: emptyToUndefined(data.callOutcome),
    contact_id: emptyToUndefined(data.contactId),
    company_id: emptyToUndefined(data.companyId),
    deal_id: emptyToUndefined(data.dealId),
    lead_id: emptyToUndefined(data.leadId),
    assigned_to: emptyToUndefined(data.assignedTo),
    reminder_at: emptyToUndefined(data.reminderAt),
  };
}

/**
 * Activities API client
 */
export const activitiesApi = {
  /**
   * Get all activities with pagination and filters
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    activity_type?: ActivityType;
    status?: ActivityStatus;
    contact_id?: string;
    deal_id?: string;
    lead_id?: string;
    search?: string;
    filters?: string;
  }): Promise<{
    data: ActivityViewModel[];
    meta: {
      total: number;
      page: number;
      page_size: number;
      stats?: ActivityStats;
    };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params?.activity_type) queryParams.set('type', params.activity_type);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.contact_id) queryParams.set('contact_id', params.contact_id);
    if (params?.deal_id) queryParams.set('deal_id', params.deal_id);
    if (params?.lead_id) queryParams.set('lead_id', params.lead_id);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.filters) queryParams.set('filters', params.filters);

    const url = `/crm/api/v1/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<ActivityApiResponse, BackendActivityStats>>(url);

    if (response.error) {
      throw new Error(response.error.message);
    }

    const backendMeta = response.data!.meta;

    return {
      data: response.data!.data.map(toActivityViewModel),
      meta: {
        page: backendMeta.page,
        page_size: backendMeta.page_size,
        total: backendMeta.total,
        stats: backendMeta.stats ? {
          total: backendMeta.stats.total,
          byStatus: backendMeta.stats.by_status || {},
          byPriority: backendMeta.stats.by_priority || {},
          overdue: backendMeta.stats.overdue || 0,
        } : undefined,
      },
    };
  },

  /**
   * Get activity by ID
   */
  getById: async (id: string): Promise<ActivityViewModel> => {
    const response = await apiClient.get<ActivityApiResponse>(`/crm/api/v1/activities/${id}`);

    if (response.error) {
      throw new Error(response.error.message);
    }

    return toActivityViewModel(response.data!);
  },

  /**
   * Get activities for a contact (timeline)
   */
  getContactTimeline: async (contactId: string): Promise<ActivityViewModel[]> => {
    const response = await apiClient.get<{ data: ActivityApiResponse[] }>(
      `/crm/api/v1/contacts/${contactId}/timeline`
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!.data.map(toActivityViewModel);
  },

  /**
   * Get upcoming activities
   */
  getUpcoming: async (): Promise<ActivityViewModel[]> => {
    const response = await apiClient.get<{ data: ActivityApiResponse[] }>('/crm/api/v1/activities/upcoming');

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!.data.map(toActivityViewModel);
  },

  /**
   * Get overdue activities
   */
  getOverdue: async (): Promise<ActivityViewModel[]> => {
    const response = await apiClient.get<{ data: ActivityApiResponse[] }>('/crm/api/v1/activities/overdue');

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!.data.map(toActivityViewModel);
  },

  /**
   * Get activity stats
   */
  getStats: async (): Promise<{
    total: number;
    by_type: Record<ActivityType, number>;
    by_status: Record<ActivityStatus, number>;
    overdue: number;
    due_today: number;
    due_this_week: number;
  }> => {
    const response = await apiClient.get<{ data: {
      total: number;
      by_type: Record<ActivityType, number>;
      by_status: Record<ActivityStatus, number>;
      overdue: number;
      due_today: number;
      due_this_week: number;
    } }>('/crm/api/v1/activities/stats');

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!.data;
  },

  /**
   * Get activity trend (daily counts by type for charts)
   */
  getActivityTrend: async (days: number = 30): Promise<Array<{
    date: string;
    calls: number;
    meetings: number;
    emails: number;
  }>> => {
    const response = await apiClient.get<{ data: Array<{
      date: string;
      calls: number;
      meetings: number;
      emails: number;
    }> }>(`/crm/api/v1/activities/trend?days=${days}`);

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!.data;
  },

  /**
   * Create a new activity
   */
  create: async (data: ActivityFormData): Promise<ActivityViewModel> => {
    const response = await apiClient.post<ActivityApiResponse>(
      '/crm/api/v1/activities',
      toApiRequest(data)
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return toActivityViewModel(response.data!);
  },

  /**
   * Update an activity
   */
  update: async (id: string, data: Partial<ActivityFormData>): Promise<ActivityViewModel> => {
    // Convert empty strings to null for optional/UUID fields
    const emptyToNull = (v: string | undefined): string | null | undefined =>
      v === '' ? null : v;

    const payload: Partial<ActivityApiRequest> = {};
    if (data.activityType) payload.activity_type = data.activityType;
    if (data.subject) payload.subject = data.subject;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.status) payload.status = data.status;
    if (data.priority) payload.priority = data.priority;
    if (data.dueDate !== undefined) payload.due_date = emptyToNull(data.dueDate);
    if (data.startTime !== undefined) payload.start_time = emptyToNull(data.startTime);
    if (data.endTime !== undefined) payload.end_time = emptyToNull(data.endTime);
    if (data.durationMinutes !== undefined) payload.duration_minutes = data.durationMinutes;
    if (data.callDirection !== undefined) payload.call_direction = emptyToNull(data.callDirection);
    if (data.callOutcome !== undefined) payload.call_outcome = emptyToNull(data.callOutcome);
    if (data.contactId !== undefined) payload.contact_id = emptyToNull(data.contactId);
    if (data.companyId !== undefined) payload.company_id = emptyToNull(data.companyId);
    if (data.dealId !== undefined) payload.deal_id = emptyToNull(data.dealId);
    if (data.leadId !== undefined) payload.lead_id = emptyToNull(data.leadId);
    if (data.assignedTo !== undefined) payload.assigned_to = emptyToNull(data.assignedTo);
    if (data.reminderAt !== undefined) payload.reminder_at = emptyToNull(data.reminderAt);

    const response = await apiClient.patch<ActivityApiResponse>(
      `/crm/api/v1/activities/${id}`,
      payload
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return toActivityViewModel(response.data!);
  },

  /**
   * Delete an activity
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/crm/api/v1/activities/${id}`);

    if (response.error) {
      throw new Error(response.error.message);
    }
  },

  /**
   * Complete an activity
   */
  complete: async (id: string): Promise<ActivityViewModel> => {
    const response = await apiClient.post<ActivityApiResponse>(
      `/crm/api/v1/activities/${id}/complete`,
      {}
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return toActivityViewModel(response.data!);
  },
};
