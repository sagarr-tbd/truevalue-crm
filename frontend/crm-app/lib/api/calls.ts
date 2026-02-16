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

/**
 * Call view model — a filtered view of ActivityViewModel where type='call'
 */
export interface CallViewModel extends ActivityViewModel {
  initials: string;
  relatedTo?: string;
  relatedToType?: string;
}

/**
 * Call form data — wraps ActivityFormData, auto-sets activityType='call'
 */
export interface CallFormData {
  subject: string;
  description?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  callDirection?: string;
  callOutcome?: string;
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
 * Query params for the calls list endpoint
 */
export interface CallQueryParams {
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

/** Map ActivityViewModel → CallViewModel with computed display fields */
function toCallViewModel(activity: ActivityViewModel): CallViewModel {
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
    : (activity.subject || 'C').substring(0, 2).toUpperCase();

  return {
    ...activity,
    initials,
    relatedTo,
    relatedToType,
  };
}

/** Convert CallFormData → ActivityFormData (adds activityType='call') */
function toActivityFormData(data: CallFormData): ActivityFormData {
  return {
    activityType: 'call',
    subject: data.subject,
    description: data.description,
    status: data.status,
    priority: data.priority,
    callDirection: data.callDirection,
    callOutcome: data.callOutcome,
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

export const callsApi = {
  /**
   * Get calls (activities with type='call') with server-side pagination
   */
  getAll: async (params?: CallQueryParams): Promise<{
    data: CallViewModel[];
    meta: { total: number; page: number; page_size: number; stats?: ActivityStats };
  }> => {
    const filtersJson = params?.filters && params.filters.conditions.length > 0
      ? JSON.stringify(params.filters)
      : undefined;

    const result = await activitiesApi.getAll({
      activity_type: 'call',
      page: params?.page,
      page_size: params?.page_size,
      status: params?.status as ActivityStatus | undefined,
      search: params?.search,
      filters: filtersJson,
    });

    return {
      data: result.data.map(toCallViewModel),
      meta: result.meta,
    };
  },

  /**
   * Get single call by ID
   */
  getById: async (id: string): Promise<CallViewModel> => {
    const activity = await activitiesApi.getById(id);
    return toCallViewModel(activity);
  },

  /**
   * Create a new call
   */
  create: async (data: CallFormData): Promise<CallViewModel> => {
    const activity = await activitiesApi.create(toActivityFormData(data));
    return toCallViewModel(activity);
  },

  /**
   * Update a call
   */
  update: async (id: string, data: Partial<CallFormData>): Promise<CallViewModel> => {
    const activity = await activitiesApi.update(id, {
      ...data,
      activityType: 'call',
    });
    return toCallViewModel(activity);
  },

  /**
   * Delete a call
   */
  delete: async (id: string): Promise<void> => {
    await activitiesApi.delete(id);
  },

  /**
   * Mark call as completed
   */
  complete: async (id: string): Promise<CallViewModel> => {
    const activity = await activitiesApi.complete(id);
    return toCallViewModel(activity);
  },

  /**
   * Bulk delete calls (sequential, no bulk endpoint on backend)
   */
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

  /**
   * Bulk update calls (sequential, no bulk endpoint on backend)
   */
  bulkUpdate: async (
    ids: string[],
    data: Partial<CallFormData>
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await activitiesApi.update(id, {
            ...data,
            activityType: 'call',
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
