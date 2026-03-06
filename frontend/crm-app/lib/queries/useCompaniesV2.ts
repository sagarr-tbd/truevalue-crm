import { useQuery } from '@tanstack/react-query';
import { companiesV2Api, type CompanyV2, type CompanyV2ListItem, type CompanyV2QueryParams } from '@/lib/api/companiesV2';
import { createEntityV2QueryKeys, createEntityV2Hooks } from './useEntityV2';

export type { CompanyV2Stats } from '@/lib/api/companiesV2';

export const companiesV2QueryKeys = createEntityV2QueryKeys('companiesV2');

const hooks = createEntityV2Hooks<CompanyV2, CompanyV2ListItem, CompanyV2QueryParams>(
  companiesV2Api,
  companiesV2QueryKeys,
  'Company',
  'Companies',
);

export const useCompaniesV2 = hooks.useList;
export const useCompanyV2 = hooks.useDetail;
export const useCompaniesV2Stats = hooks.useStats;
export const useCreateCompanyV2 = hooks.useCreate;
export const useUpdateCompanyV2 = hooks.useUpdate;
export const useDeleteCompanyV2 = hooks.useDelete;
export const useBulkDeleteCompaniesV2 = hooks.useBulkDelete;
export const useBulkUpdateCompaniesV2 = hooks.useBulkUpdate;

export function useCompanyV2Options() {
  return useQuery({
    queryKey: [...companiesV2QueryKeys.all, 'options'],
    queryFn: async () => {
      const res = await companiesV2Api.list({ page_size: 200 } as CompanyV2QueryParams);
      return (res.results || []).map((c) => ({
        value: c.id,
        label: c.display_name || c.entity_data?.name || c.id,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
