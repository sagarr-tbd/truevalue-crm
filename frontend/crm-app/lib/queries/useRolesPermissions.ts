import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  permissionsApi,
  type PermissionItem,
  type RoleItem,
  type RoleDetail,
} from '@/lib/api/permissions-api';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const permKeys = {
  all: ['permissions'] as const,
  permissions: (category?: string) => [...permKeys.all, 'list', category] as const,
  roles: () => [...permKeys.all, 'roles'] as const,
  roleDetail: (id: string) => [...permKeys.all, 'roles', id] as const,
  rolePermissions: (id: string) => [...permKeys.all, 'roles', id, 'permissions'] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all permissions (optionally filtered by category). */
export function usePermissions(category?: string) {
  return useQuery<PermissionItem[]>({
    queryKey: permKeys.permissions(category),
    queryFn: () => permissionsApi.listPermissions(category),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch all roles visible to the org. */
export function useRoles() {
  return useQuery<RoleItem[]>({
    queryKey: permKeys.roles(),
    queryFn: () => permissionsApi.listRoles(true),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single role with its permission codes. */
export function useRoleDetail(roleId: string | null) {
  return useQuery<RoleDetail | null>({
    queryKey: permKeys.roleDetail(roleId!),
    queryFn: () => permissionsApi.getRole(roleId!),
    enabled: !!roleId,
    staleTime: 60 * 1000,
  });
}

/** Fetch the permission items assigned to a role. */
export function useRolePermissions(roleId: string | null) {
  return useQuery<PermissionItem[]>({
    queryKey: permKeys.rolePermissions(roleId!),
    queryFn: () => permissionsApi.getRolePermissions(roleId!),
    enabled: !!roleId,
    staleTime: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Replace all permissions for a role. */
export function useSetRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, codes }: { roleId: string; codes: string[] }) =>
      permissionsApi.setRolePermissions(roleId, codes),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: permKeys.roleDetail(vars.roleId) });
      qc.invalidateQueries({ queryKey: permKeys.rolePermissions(vars.roleId) });
    },
  });
}
