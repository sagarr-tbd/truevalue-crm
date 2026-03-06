import { useQuery } from '@tanstack/react-query';
import { dealsV2Api, dealsV2ExtApi, type DealV2, type DealV2ListItem, type DealV2QueryParams } from '@/lib/api/dealsV2';
import { createEntityV2QueryKeys, createEntityV2Hooks } from './useEntityV2';

export type { DealV2Stats, DealV2ForecastResponse, DealV2AnalysisResponse } from '@/lib/api/dealsV2';

export const dealsV2QueryKeys = createEntityV2QueryKeys('dealsV2');

const hooks = createEntityV2Hooks<DealV2, DealV2ListItem, DealV2QueryParams>(
  dealsV2Api,
  dealsV2QueryKeys,
  'Deal',
  'Deals',
);

export const useDealsV2 = hooks.useList;
export const useDealV2 = hooks.useDetail;
export const useDealsV2Stats = hooks.useStats;
export const useCreateDealV2 = hooks.useCreate;
export const useUpdateDealV2 = hooks.useUpdate;
export const useDeleteDealV2 = hooks.useDelete;
export const useBulkDeleteDealsV2 = hooks.useBulkDelete;
export const useBulkUpdateDealsV2 = hooks.useBulkUpdate;

export function useDealV2Options() {
  return useQuery({
    queryKey: [...dealsV2QueryKeys.all, 'options'],
    queryFn: async () => {
      const res = await dealsV2Api.list({ page_size: 200 } as DealV2QueryParams);
      return (res.results || []).map((d) => ({
        value: d.id,
        label: d.display_name || d.entity_data?.title || d.id,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDealV2Forecast(params?: { days?: number; pipeline_id?: string }) {
  return useQuery({
    queryKey: [...dealsV2QueryKeys.all, 'forecast', params],
    queryFn: () => dealsV2ExtApi.forecast(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDealV2Analysis(params?: { days?: number; pipeline_id?: string }) {
  return useQuery({
    queryKey: [...dealsV2QueryKeys.all, 'analysis', params],
    queryFn: () => dealsV2ExtApi.analysis(params),
    staleTime: 2 * 60 * 1000,
  });
}
