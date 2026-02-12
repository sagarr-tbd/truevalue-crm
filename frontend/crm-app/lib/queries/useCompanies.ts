import { useQuery } from '@tanstack/react-query';
import { companiesApi, Company, CompanyOption } from '@/lib/api/companies';

/**
 * Query keys for companies
 */
export const companyKeys = {
  all: ['companies'] as const,
  list: () => [...companyKeys.all, 'list'] as const,
  options: () => [...companyKeys.all, 'options'] as const,
};

/**
 * Hook to fetch all companies
 */
export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.list(),
    queryFn: () => companiesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - companies don't change often
  });
}

/**
 * Hook to fetch companies as select options
 */
export function useCompanyOptions() {
  return useQuery({
    queryKey: companyKeys.options(),
    queryFn: () => companiesApi.getAsOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

// Re-export types
export type { Company, CompanyOption };
