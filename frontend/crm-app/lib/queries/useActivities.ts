import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  activitiesApi, 
  ActivityViewModel, 
  ActivityFormData,
  ActivityType,
  ActivityStatus,
} from '@/lib/api/activities';

export type { ActivityViewModel, ActivityFormData, ActivityType, ActivityStatus };

/**
 * Query parameters for activities
 */
export interface ActivityQueryParams {
  page?: number;
  page_size?: number;
  activity_type?: ActivityType;
  status?: ActivityStatus;
  contact_id?: string;
  deal_id?: string;
  lead_id?: string;
  search?: string;
}

/**
 * Hook to fetch activities with pagination
 */
export function useActivities(params?: ActivityQueryParams) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => activitiesApi.getAll(params),
  });
}

/**
 * Hook to fetch a single activity
 */
export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: () => activitiesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch contact timeline (activities for a contact)
 */
export function useContactTimeline(contactId: string) {
  return useQuery({
    queryKey: ['contacts', contactId, 'timeline'],
    queryFn: () => activitiesApi.getContactTimeline(contactId),
    enabled: !!contactId,
  });
}

/**
 * Hook to fetch lead activities
 */
export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: ['leads', leadId, 'activities'],
    queryFn: () => activitiesApi.getAll({ lead_id: leadId, page_size: 50 }),
    enabled: !!leadId,
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch upcoming activities
 */
export function useUpcomingActivities() {
  return useQuery({
    queryKey: ['activities', 'upcoming'],
    queryFn: () => activitiesApi.getUpcoming(),
  });
}

/**
 * Hook to fetch overdue activities
 */
export function useOverdueActivities() {
  return useQuery({
    queryKey: ['activities', 'overdue'],
    queryFn: () => activitiesApi.getOverdue(),
  });
}

/**
 * Hook to fetch activity stats
 */
export function useActivityStats() {
  return useQuery({
    queryKey: ['activities', 'stats'],
    queryFn: () => activitiesApi.getStats(),
  });
}

/**
 * Hook to fetch activity trend (daily counts by type for charts)
 */
export function useActivityTrend(days: number = 30) {
  return useQuery({
    queryKey: ['activities', 'trend', days],
    queryFn: () => activitiesApi.getActivityTrend(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create an activity
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ActivityFormData) => activitiesApi.create(data),
    onSuccess: (newActivity) => {
      // Invalidate all activity queries
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      // Invalidate contact timeline if linked to a contact
      if (newActivity.contact?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['contacts', newActivity.contact.id, 'timeline'] 
        });
      }
    },
  });
}

/**
 * Hook to update an activity
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ActivityFormData> }) =>
      activitiesApi.update(id, data),
    onSuccess: (updatedActivity) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      if (updatedActivity.contact?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['contacts', updatedActivity.contact.id, 'timeline'] 
        });
      }
    },
  });
}

/**
 * Hook to delete an activity
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

/**
 * Hook to complete an activity
 */
export function useCompleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activitiesApi.complete(id),
    onSuccess: (completedActivity) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      if (completedActivity.contact?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['contacts', completedActivity.contact.id, 'timeline'] 
        });
      }
    },
  });
}
