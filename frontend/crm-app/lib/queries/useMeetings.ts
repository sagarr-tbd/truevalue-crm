import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingsApi } from "@/lib/api/meetings";
import type { MeetingDisplay } from "@/lib/api/mock/meetings";
import { toast } from "sonner";

// Query Keys
export const meetingKeys = {
  all: ["meetings"] as const,
  lists: () => [...meetingKeys.all, "list"] as const,
  detail: (id: number) => [...meetingKeys.all, "detail", id] as const,
};

// GET all meetings
export function useMeetings() {
  return useQuery({
    queryKey: meetingKeys.lists(),
    queryFn: meetingsApi.getAll,
  });
}

// GET single meeting
export function useMeeting(id: number) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => meetingsApi.getById(id),
    enabled: !!id,
  });
}

// CREATE meeting
export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: meetingsApi.create,
    onMutate: async (newMeeting) => {
      await queryClient.cancelQueries({ queryKey: meetingKeys.lists() });
      const previous = queryClient.getQueryData(meetingKeys.lists());
      
      queryClient.setQueryData(meetingKeys.lists(), (old: MeetingDisplay[] = []) => [
        { ...newMeeting, id: Date.now() } as MeetingDisplay,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newMeeting, context) => {
      if (context?.previous) {
        queryClient.setQueryData(meetingKeys.lists(), context.previous);
      }
      toast.error("Failed to create meeting");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast.success("Meeting created successfully!");
    },
  });
}

// UPDATE meeting
export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MeetingDisplay> }) =>
      meetingsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast.success("Meeting updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update meeting");
    },
  });
}

// DELETE meeting
export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: meetingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast.success("Meeting deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete meeting");
    },
  });
}

// BULK DELETE
export function useBulkDeleteMeetings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: meetingsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast.success(`${ids.length} meetings deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete meetings");
    },
  });
}

// BULK UPDATE
export function useBulkUpdateMeetings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<MeetingDisplay> }) =>
      meetingsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast.success(`${ids.length} meetings updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update meetings");
    },
  });
}
