import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dealsApi, DealQueryParams, DealFormData, DealViewModel, LoseDealRequest, WinDealRequest, ReopenDealRequest } from "../api/deals";
import { toast } from "sonner";
import { KanbanResponse } from "../api/pipelines";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  list: (params: DealQueryParams) => [...dealKeys.lists(), params] as const,
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  forecast: (params?: { days?: number; pipeline_id?: string }) => [...dealKeys.all, "forecast", params] as const,
};

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Get all deals with pagination and filtering
 */
export function useDeals(params: DealQueryParams = {}) {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => dealsApi.getAll(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get single deal by ID
 */
export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => dealsApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get deal forecast
 */
export function useDealForecast(params?: { days?: number; pipeline_id?: string }) {
  return useQuery({
    queryKey: dealKeys.forecast(params),
    queryFn: () => dealsApi.getForecast(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - forecast changes less frequently
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DealFormData) => dealsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success("Deal created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create deal");
    },
  });
}

/**
 * Update a deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DealFormData }) =>
      dealsApi.update(id, data),
    onSuccess: (updatedDeal) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success("Deal updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update deal");
    },
  });
}

/**
 * Delete a deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: (_data, deletedId) => {
      // Remove the deleted deal's detail from cache
      queryClient.removeQueries({ queryKey: dealKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success("Deal deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete deal");
    },
  });
}

/**
 * Bulk delete deals
 */
export function useBulkDeleteDeals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => dealsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success(`${result.success} deals deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete deals");
    },
  });
}

/**
 * Move deal to a different stage
 */
export function useMoveStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      dealsApi.moveStage(id, stageId),
    onMutate: async ({ id, stageId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["pipelines"] });

      // Snapshot previous kanban data for all pipelines
      const previousKanbanData: Record<string, KanbanResponse | undefined> = {};
      
      // Get all kanban queries and optimistically update them
      const kanbanQueries = queryClient.getQueriesData<KanbanResponse>({
        queryKey: ["pipelines"],
        predicate: (query) => query.queryKey.includes("kanban"),
      });

      for (const [queryKey, data] of kanbanQueries) {
        if (data) {
          previousKanbanData[JSON.stringify(queryKey)] = data;
          
          // Find the deal and move it optimistically
          let dealToMove: KanbanResponse["columns"][0]["deals"][0] | undefined;
          let fromColumnIdx = -1;
          
          // Find the deal in current columns
          for (let i = 0; i < data.columns.length; i++) {
            const dealIdx = data.columns[i].deals.findIndex(d => d.id === id);
            if (dealIdx !== -1) {
              dealToMove = data.columns[i].deals[dealIdx];
              fromColumnIdx = i;
              break;
            }
          }
          
          if (dealToMove && fromColumnIdx !== -1) {
            // Create new columns with the deal moved
            const newColumns = data.columns.map((col, idx) => {
              if (idx === fromColumnIdx) {
                // Remove deal from source column
                return {
                  ...col,
                  deals: col.deals.filter(d => d.id !== id),
                  totalValue: col.totalValue - (dealToMove?.value || 0),
                };
              }
              if (col.stage.id === stageId) {
                // Add deal to target column
                const movedDeal = { ...dealToMove!, stageId };
                return {
                  ...col,
                  deals: [...col.deals, movedDeal],
                  totalValue: col.totalValue + (dealToMove?.value || 0),
                };
              }
              return col;
            });
            
            queryClient.setQueryData<KanbanResponse>(queryKey, {
              ...data,
              columns: newColumns,
            });
          }
        }
      }

      return { previousKanbanData };
    },
    onSuccess: (updatedDeal) => {
      toast.success(`Deal moved to ${updatedDeal.stageName}`);
    },
    onError: (error: Error, _variables, context) => {
      // Rollback to previous data
      if (context?.previousKanbanData) {
        for (const [keyStr, data] of Object.entries(context.previousKanbanData)) {
          if (data) {
            queryClient.setQueryData(JSON.parse(keyStr), data);
          }
        }
      }
      toast.error(error.message || "Failed to move deal");
    },
    onSettled: () => {
      // Invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });
}

/**
 * Mark deal as won
 */
export function useWinDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: WinDealRequest }) =>
      dealsApi.win(id, params),
    onSuccess: (updatedDeal) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast.success("Deal marked as won!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark deal as won");
    },
  });
}

/**
 * Mark deal as lost
 */
export function useLoseDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: LoseDealRequest }) =>
      dealsApi.lose(id, params),
    onSuccess: (updatedDeal) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast.success("Deal marked as lost");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark deal as lost");
    },
  });
}

/**
 * Reopen a closed deal
 */
export function useReopenDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: ReopenDealRequest }) =>
      dealsApi.reopen(id, params),
    onSuccess: (updatedDeal) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast.success("Deal reopened successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reopen deal");
    },
  });
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { DealViewModel, DealFormData, DealQueryParams };
