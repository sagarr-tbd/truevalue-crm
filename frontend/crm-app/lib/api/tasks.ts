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
 * Task view model — a filtered view of ActivityViewModel where type='task'
 * Uses the same shape with computed display helpers
 */
export interface TaskViewModel extends ActivityViewModel {
  /** Computed initials from subject (first 2 chars) */
  initials: string;
  /** Computed related entity name for display */
  relatedTo?: string;
  /** Computed related entity type (contact/company/deal/lead) */
  relatedToType?: string;
}

/**
 * Task form data — wraps ActivityFormData, auto-sets activityType='task'
 */
export interface TaskFormData {
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
 * Query params for the tasks list endpoint
 */
export interface TaskQueryParams {
  page?: number;
  page_size?: number;
  status?: ActivityStatus;
  priority?: string;
  search?: string;
  order_by?: string;
  overdue?: boolean;
  filters?: FilterGroup;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Map ActivityViewModel → TaskViewModel with computed display fields */
function toTaskViewModel(activity: ActivityViewModel): TaskViewModel {
  // Determine related entity for display
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

  // Compute initials from subject
  const words = (activity.subject || '').split(' ').filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (activity.subject || 'T').substring(0, 2).toUpperCase();

  return {
    ...activity,
    initials,
    relatedTo,
    relatedToType,
  };
}

/** Convert TaskFormData → ActivityFormData (adds activityType='task') */
function toActivityFormData(data: TaskFormData): ActivityFormData {
  return {
    activityType: 'task',
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

export const tasksApi = {
  /**
   * Get tasks (activities with type='task') with server-side pagination
   */
  getAll: async (params?: TaskQueryParams): Promise<{
    data: TaskViewModel[];
    meta: { total: number; page: number; page_size: number; stats?: ActivityStats };
  }> => {
    // Serialize advanced filters to JSON string (matching leads pattern)
    const filtersJson = params?.filters && params.filters.conditions.length > 0
      ? JSON.stringify(params.filters)
      : undefined;

    const result = await activitiesApi.getAll({
      activity_type: 'task',
      page: params?.page,
      page_size: params?.page_size,
      status: params?.status as ActivityStatus | undefined,
      search: params?.search,
      filters: filtersJson,
    });

    return {
      data: result.data.map(toTaskViewModel),
      meta: result.meta,
    };
  },

  /**
   * Get single task by ID
   */
  getById: async (id: string): Promise<TaskViewModel> => {
    const activity = await activitiesApi.getById(id);
    return toTaskViewModel(activity);
  },

  /**
   * Create a new task
   */
  create: async (data: TaskFormData): Promise<TaskViewModel> => {
    const activity = await activitiesApi.create(toActivityFormData(data));
    return toTaskViewModel(activity);
  },

  /**
   * Update a task
   */
  update: async (id: string, data: Partial<TaskFormData>): Promise<TaskViewModel> => {
    const activity = await activitiesApi.update(id, {
      ...data,
      activityType: 'task',
    });
    return toTaskViewModel(activity);
  },

  /**
   * Delete a task
   */
  delete: async (id: string): Promise<void> => {
    await activitiesApi.delete(id);
  },

  /**
   * Mark task as completed
   */
  complete: async (id: string): Promise<TaskViewModel> => {
    const activity = await activitiesApi.complete(id);
    return toTaskViewModel(activity);
  },

  /**
   * Bulk delete tasks (sequential, no bulk endpoint on backend)
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
   * Bulk update tasks (sequential, no bulk endpoint on backend)
   */
  bulkUpdate: async (
    ids: string[],
    data: Partial<TaskFormData>
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await activitiesApi.update(id, {
            ...data,
            activityType: 'task',
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
