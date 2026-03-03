import { useQuery } from '@tanstack/react-query';
import { searchV2Api, type SearchV2Response, type SearchV2Item } from '@/lib/api/searchV2';

export function useSearchV2(query: string, enabled = true) {
  return useQuery<SearchV2Response>({
    queryKey: ['search-v2', query],
    queryFn: () => searchV2Api.search(query, 5),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function flattenSearchResults(data: SearchV2Response | undefined): SearchV2Item[] {
  if (!data) return [];
  return [
    ...data.contacts,
    ...data.companies,
    ...data.deals,
    ...data.leads,
  ];
}

export type { SearchV2Response, SearchV2Item };
