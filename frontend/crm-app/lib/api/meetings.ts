import {
  activitiesApi,
  ActivityViewModel,
  ActivityFormData,
  ActivityStatus,
  ActivityPriority,
  ActivityStats,
} from './activities';

// ============================================================================
// TYPES
// ============================================================================

export interface MeetingViewModel extends ActivityViewModel {
  initials: string;
  relatedTo?: string;
  relatedToType?: string;
}

export interface MeetingFormData {
  subject: string;
  description?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  leadId?: string;
  assignedTo?: string;
  reminderAt?: string;
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

export interface FilterGroup {
  logic: 'and' | 'or';
  conditions: FilterCondition[];
}

export interface MeetingQueryParams {
  page?: number;
  page_size?: number;
  status?: ActivityStatus;
  priority?: string;
  search?: string;
  order_by?: string;
  filters?: FilterGroup;
}

// ============================================================================
// HELPERS
// ============================================================================

function toMeetingViewModel(activity: ActivityViewModel): MeetingViewModel {
  let relatedTo: string | undefined;
  let relatedToType: string | undefined;

  if (activity.contact) {
    relatedTo = activity.contact.name;
    relatedToType = 'Contact';
  } else if (activity.company) {
    relatedTo = activity.company.name;
    relatedToType = 'Company';
  } else if (activity.deal) {
    relatedTo = activity.deal.name;
    relatedToType = 'Deal';
  } else if (activity.lead) {
    relatedTo = activity.lead.name;
    relatedToType = 'Lead';
  }

  const words = (activity.subject || '').split(' ').filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (activity.subject || 'M').substring(0, 2).toUpperCase();

  return {
    ...activity,
    initials,
    relatedTo,
    relatedToType,
  };
}

function toActivityFormData(data: MeetingFormData): ActivityFormData {
  return {
    activityType: 'meeting',
    subject: data.subject,
    description: data.description,
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate,
    startTime: data.startTime,
    endTime: data.endTime,
    durationMinutes: data.durationMinutes,
    contactId: data.contactId,
    companyId: data.companyId,
    dealId: data.dealId,
    leadId: data.leadId,
    assignedTo: data.assignedTo,
    reminderAt: data.reminderAt,
  };
}

// ============================================================================
// API
// ============================================================================

export const meetingsApi = {
  getAll: async (params?: MeetingQueryParams): Promise<{
    data: MeetingViewModel[];
    meta: { total: number; page: number; page_size: number; stats?: ActivityStats };
  }> => {
    const filtersJson = params?.filters && params.filters.conditions.length > 0
      ? JSON.stringify(params.filters)
      : undefined;

    const result = await activitiesApi.getAll({
      activity_type: 'meeting',
      page: params?.page,
      page_size: params?.page_size,
      status: params?.status as ActivityStatus | undefined,
      search: params?.search,
      filters: filtersJson,
    });

    return {
      data: result.data.map(toMeetingViewModel),
      meta: result.meta,
    };
  },

  getById: async (id: string): Promise<MeetingViewModel> => {
    const activity = await activitiesApi.getById(id);
    return toMeetingViewModel(activity);
  },

  create: async (data: MeetingFormData): Promise<MeetingViewModel> => {
    const activity = await activitiesApi.create(toActivityFormData(data));
    return toMeetingViewModel(activity);
  },

  update: async (id: string, data: Partial<MeetingFormData>): Promise<MeetingViewModel> => {
    const activity = await activitiesApi.update(id, {
      ...data,
      activityType: 'meeting',
    });
    return toMeetingViewModel(activity);
  },

  delete: async (id: string): Promise<void> => {
    await activitiesApi.delete(id);
  },

  complete: async (id: string): Promise<MeetingViewModel> => {
    const activity = await activitiesApi.complete(id);
    return toMeetingViewModel(activity);
  },

  bulkDelete: async (ids: string[]): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await activitiesApi.delete(id);
          success++;
        } catch {
          failed++;
        }
      })
    );

    return { success, failed };
  },

  bulkUpdate: async (
    ids: string[],
    data: Partial<MeetingFormData>
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await activitiesApi.update(id, {
            ...data,
            activityType: 'meeting',
          });
          success++;
        } catch {
          failed++;
        }
      })
    );

    return { success, failed };
  },
};
