import { useQuery } from '@tanstack/react-query';
import { membersApi, OrganizationMember, MemberOption } from '@/lib/api/members';

/**
 * Query keys for organization members
 */
export const memberKeys = {
  all: ['members'] as const,
  list: () => [...memberKeys.all, 'list'] as const,
  options: () => [...memberKeys.all, 'options'] as const,
};

/**
 * Hook to fetch all organization members
 */
export function useMembers() {
  return useQuery({
    queryKey: memberKeys.list(),
    queryFn: () => membersApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch members as select options (for owner dropdown)
 */
export function useMemberOptions() {
  return useQuery({
    queryKey: memberKeys.options(),
    queryFn: () => membersApi.getAsOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

// Re-export types
export type { OrganizationMember, MemberOption };
