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

export interface NoteViewModel extends ActivityViewModel {
  initials: string;
  relatedTo?: string;
  relatedToType?: string;
}

export interface NoteFormData {
  subject: string;
  description?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  leadId?: string;
  assignedTo?: string;
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

export interface NoteQueryParams {
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

function toNoteViewModel(activity: ActivityViewModel): NoteViewModel {
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
    : (activity.subject || 'N').substring(0, 2).toUpperCase();

  return {
    ...activity,
    initials,
    relatedTo,
    relatedToType,
  };
}

function toActivityFormData(data: NoteFormData): ActivityFormData {
  return {
    activityType: 'note',
    subject: data.subject,
    description: data.description,
    status: data.status,
    priority: data.priority,
    contactId: data.contactId,
    companyId: data.companyId,
    dealId: data.dealId,
    leadId: data.leadId,
    assignedTo: data.assignedTo,
  };
}

// ============================================================================
// API
// ============================================================================

export const notesApi = {
  getAll: async (params?: NoteQueryParams): Promise<{
    data: NoteViewModel[];
    meta: { total: number; page: number; page_size: number; stats?: ActivityStats };
  }> => {
    const filtersJson = params?.filters && params.filters.conditions.length > 0
      ? JSON.stringify(params.filters)
      : undefined;

    const result = await activitiesApi.getAll({
      activity_type: 'note',
      page: params?.page,
      page_size: params?.page_size,
      status: params?.status as ActivityStatus | undefined,
      search: params?.search,
      filters: filtersJson,
    });

    return {
      data: result.data.map(toNoteViewModel),
      meta: result.meta,
    };
  },

  getById: async (id: string): Promise<NoteViewModel> => {
    const activity = await activitiesApi.getById(id);
    return toNoteViewModel(activity);
  },

  create: async (data: NoteFormData): Promise<NoteViewModel> => {
    const activity = await activitiesApi.create(toActivityFormData(data));
    return toNoteViewModel(activity);
  },

  update: async (id: string, data: Partial<NoteFormData>): Promise<NoteViewModel> => {
    const activity = await activitiesApi.update(id, {
      ...data,
      activityType: 'note',
    });
    return toNoteViewModel(activity);
  },

  delete: async (id: string): Promise<void> => {
    await activitiesApi.delete(id);
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
    data: Partial<NoteFormData>
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await activitiesApi.update(id, {
            ...data,
            activityType: 'note',
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
