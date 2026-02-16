import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  meetingsApi,
  MeetingQueryParams,
  MeetingFormData,
  MeetingViewModel,
} from '@/lib/api/meetings';
import type { ActivityStats } from '@/lib/api/activities';
import { toast } from 'sonner';

export type { MeetingQueryParams, MeetingFormData, MeetingViewModel, ActivityStats };

// ============================================================================
// QUERY KEYS
// ============================================================================

export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  list: (params?: MeetingQueryParams) => [...meetingKeys.lists(), params] as const,
  detail: (id: string) => [...meetingKeys.all, 'detail', id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useMeetings(params: MeetingQueryParams = {}) {
  return useQuery({
    queryKey: meetingKeys.list(params),
    queryFn: () => meetingsApi.getAll(params),
    staleTime: 60 * 1000,
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => meetingsApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MeetingFormData) => meetingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Meeting created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create meeting');
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MeetingFormData> }) =>
      meetingsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Meeting updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update meeting');
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => meetingsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: meetingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Meeting deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete meeting');
    },
  });
}

export function useCompleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => meetingsApi.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Meeting completed!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete meeting');
    },
  });
}

export function useBulkDeleteMeetings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => meetingsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${result.success} meetings deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete meetings');
    },
  });
}

export function useBulkUpdateMeetings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<MeetingFormData> }) =>
      meetingsApi.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`${result.success} meetings updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update meetings');
    },
  });
}
