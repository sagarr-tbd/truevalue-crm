import { useQuery } from '@tanstack/react-query';
import { reportsV2Api } from '@/lib/api/reportsV2';

const REPORTS_KEY = ['reports-v2'];

export function useDashboardV2() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'dashboard'],
    queryFn: () => reportsV2Api.dashboard(),
    staleTime: 60 * 1000,
  });
}

export function usePipelineReportV2(params?: { pipeline_id?: string; days?: number }) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'pipeline', params],
    queryFn: () => reportsV2Api.pipeline(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLeadConversionReportV2(params?: { days?: number }) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'lead-conversion', params],
    queryFn: () => reportsV2Api.leadConversion(params),
    staleTime: 2 * 60 * 1000,
  });
}
