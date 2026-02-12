import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "../api/campaigns";
import type { CampaignDisplay } from "../api/mock/campaigns";
import { toast } from "sonner";

// Query keys
export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  details: () => [...campaignKeys.all, "detail"] as const,
  detail: (id: number) => [...campaignKeys.details(), id] as const,
};

// Get all campaigns
export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.lists(),
    queryFn: () => campaignsApi.getAll(),
  });
}

// Get single campaign
export function useCampaign(id: number) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsApi.getById(id),
    enabled: !!id,
  });
}

// Create campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: campaignsApi.create,
    onMutate: async (newCampaign) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });
      const previous = queryClient.getQueryData(campaignKeys.lists());
      
      queryClient.setQueryData(campaignKeys.lists(), (old: CampaignDisplay[] = []) => [
        { ...newCampaign, id: Date.now() } as CampaignDisplay,
        ...old,
      ]);
      
      return { previous };
    },
    onError: (err, newCampaign, context) => {
      if (context?.previous) {
        queryClient.setQueryData(campaignKeys.lists(), context.previous);
      }
      toast.error("Failed to create campaign");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success("Campaign created successfully!");
    },
  });
}

// Update campaign
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CampaignDisplay> }) =>
      campaignsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success("Campaign updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update campaign");
    },
  });
}

// Delete campaign
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: campaignsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success("Campaign deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete campaign");
    },
  });
}

// Bulk delete campaigns
export function useBulkDeleteCampaigns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: campaignsApi.bulkDelete,
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success(`${ids.length} campaigns deleted successfully!`);
    },
    onError: () => {
      toast.error("Failed to delete campaigns");
    },
  });
}

// Bulk update campaigns
export function useBulkUpdateCampaigns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<CampaignDisplay> }) =>
      campaignsApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      toast.success(`${ids.length} campaigns updated successfully!`);
    },
    onError: () => {
      toast.error("Failed to update campaigns");
    },
  });
}
