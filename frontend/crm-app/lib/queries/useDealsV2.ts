import { dealsV2Api, type DealV2, type DealV2ListItem, type DealV2QueryParams } from '@/lib/api/dealsV2';
import { createEntityV2QueryKeys, createEntityV2Hooks } from './useEntityV2';

export type { DealV2Stats } from '@/lib/api/dealsV2';

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
