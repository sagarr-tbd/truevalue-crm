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
 * Email view model — a filtered view of ActivityViewModel where type='email'
 */
export interface EmailViewModel extends ActivityViewModel {
  initials: string;
  relatedTo?: string;
  relatedToType?: string;
}

/**
 * Email form data — wraps ActivityFormData, auto-sets activityType='email'
 */
export interface EmailFormData {
  subject: string;
  description?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  emailDirection?: string;
  dueDate?: string;
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
 * Query params for the emails list endpoint
 */
export interface EmailQueryParams {
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

/** Map ActivityViewModel → EmailViewModel with computed display fields */
function toEmailViewModel(activity: ActivityViewModel): EmailViewModel {
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
    : (activity.subject || 'E').substring(0, 2).toUpperCase();

  return {
    ...activity,
    initials,
    relatedTo,
    relatedToType,
  };
}

/** Convert EmailFormData → ActivityFormData (adds activityType='email') */
function toActivityFormData(data: EmailFormData): ActivityFormData {
  return {
    activityType: 'email',
    subject: data.subject,
    description: data.description,
    status: data.status,
    priority: data.priority,
    emailDirection: data.emailDirection,
    dueDate: data.dueDate,
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

export const emailsApi = {
  /**
   * Get emails (activities with type='email') with server-side pagination
   */
  getAll: async (params?: EmailQueryParams): Promise<{
    data: EmailViewModel[];
    meta: { total: number; page: number; page_size: number; stats?: ActivityStats };
  }> => {
    const filtersJson = params?.filters && params.filters.conditions.length > 0
      ? JSON.stringify(params.filters)
      : undefined;

    const result = await activitiesApi.getAll({
      activity_type: 'email',
      page: params?.page,
      page_size: params?.page_size,
      status: params?.status as ActivityStatus | undefined,
      search: params?.search,
      filters: filtersJson,
    });

    return {
      data: result.data.map(toEmailViewModel),
      meta: result.meta,
    };
  },

  /**
   * Get single email by ID
   */
  getById: async (id: string): Promise<EmailViewModel> => {
    const activity = await activitiesApi.getById(id);
    return toEmailViewModel(activity);
  },

  /**
   * Create a new email log
   */
  create: async (data: EmailFormData): Promise<EmailViewModel> => {
    const activity = await activitiesApi.create(toActivityFormData(data));
    return toEmailViewModel(activity);
  },

  /**
   * Update an email log
   */
  update: async (id: string, data: Partial<EmailFormData>): Promise<EmailViewModel> => {
    const activity = await activitiesApi.update(id, {
      ...data,
      activityType: 'email',
    });
    return toEmailViewModel(activity);
  },

  /**
   * Delete an email log
   */
  delete: async (id: string): Promise<void> => {
    await activitiesApi.delete(id);
  },

  /**
   * Mark email as completed
   */
  complete: async (id: string): Promise<EmailViewModel> => {
    const activity = await activitiesApi.complete(id);
    return toEmailViewModel(activity);
  },

  /**
   * Bulk delete emails
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
   * Bulk update emails
   */
  bulkUpdate: async (
    ids: string[],
    data: Partial<EmailFormData>
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await activitiesApi.update(id, {
            ...data,
            activityType: 'email',
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
