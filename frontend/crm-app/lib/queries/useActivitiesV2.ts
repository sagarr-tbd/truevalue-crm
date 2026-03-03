import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  activitiesV2Api,
  ActivityV2,
  CreateActivityV2Input,
  ActivityV2ListParams,
} from '@/lib/api/activitiesV2';

const ACTIVITIES_KEY = ['activities-v2'];

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: Record<string, unknown> } }).response;
    if (resp?.data) {
      const d = resp.data;
      if (typeof d.detail === 'string') return d.detail;
      if (typeof d.error === 'string') return d.error;
      const first = Object.values(d)[0];
      if (Array.isArray(first) && first.length > 0) return String(first[0]);
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function useActivitiesV2(params?: ActivityV2ListParams) {
  return useQuery({
    queryKey: [...ACTIVITIES_KEY, params],
    queryFn: () => activitiesV2Api.list(params),
  });
}

export function useActivityV2(id: string | undefined) {
  return useQuery({
    queryKey: [...ACTIVITIES_KEY, id],
    queryFn: () => activitiesV2Api.get(id!),
    enabled: !!id,
  });
}

export function useActivitiesV2Stats(activityType?: string) {
  return useQuery({
    queryKey: [...ACTIVITIES_KEY, 'stats', activityType],
    queryFn: () => activitiesV2Api.stats(activityType),
  });
}

export function useActivitiesV2Calendar(start: string, end: string) {
  return useQuery({
    queryKey: [...ACTIVITIES_KEY, 'calendar', start, end],
    queryFn: () => activitiesV2Api.calendar(start, end),
    enabled: !!start && !!end,
  });
}

export function useActivitiesV2Upcoming(days?: number) {
  return useQuery({
    queryKey: [...ACTIVITIES_KEY, 'upcoming', days],
    queryFn: () => activitiesV2Api.upcoming(days),
  });
}

export function useActivitiesV2Overdue() {
  return useQuery({
    queryKey: [...ACTIVITIES_KEY, 'overdue'],
    queryFn: () => activitiesV2Api.overdue(),
  });
}

export function useActivitiesV2Mine(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: [...ACTIVITIES_KEY, 'mine', params],
    queryFn: () => activitiesV2Api.mine(params),
  });
}

export function useCreateActivityV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityV2Input) => activitiesV2Api.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY }),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to create activity')),
  });
}

export function useUpdateActivityV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ActivityV2> | CreateActivityV2Input }) =>
      activitiesV2Api.update(id, data as Partial<ActivityV2>),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY }),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to update activity')),
  });
}

export function useDeleteActivityV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesV2Api.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY }),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to delete activity')),
  });
}

export function useCompleteActivityV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesV2Api.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY }),
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to complete activity')),
  });
}

export function useBulkDeleteActivitiesV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => activitiesV2Api.bulkDelete(ids),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
      toast.success(`${data?.deleted ?? 0} activities deleted`);
    },
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to bulk delete activities')),
  });
}

export function useBulkUpdateActivitiesV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Record<string, string> }) =>
      activitiesV2Api.bulkUpdate(ids, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ACTIVITIES_KEY });
      toast.success(`${data?.updated ?? 0} activities updated`);
    },
    onError: (err) => toast.error(extractErrorMessage(err, 'Failed to bulk update activities')),
  });
}
