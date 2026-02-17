/**
 * Permission Service API client.
 *
 * Calls go through the gateway: /permission/api/v1/...
 */
import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  category: string;
  resource: string;
  action: string;
}

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  role_type: 'system' | 'custom';
  level: number;
}

export interface RoleDetail extends RoleItem {
  description: string;
  org_id: string | null;
  is_editable: boolean;
  permissions: string[];  // permission codes
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = '/permission/api/v1';

export const permissionsApi = {
  /**
   * List all available permissions, optionally filtered by category.
   * GET /permission/api/v1/permissions?category=crm
   */
  listPermissions: async (category?: string): Promise<PermissionItem[]> => {
    let url = `${BASE}/permissions`;
    if (category) url += `?category=${category}`;

    const res = await apiClient.get<{ permissions: PermissionItem[] }>(url);
    if (res.error) {
      console.error('[PermissionsAPI] listPermissions failed:', res.error);
      return [];
    }
    return res.data?.permissions ?? [];
  },

  /**
   * List all roles visible to the current org.
   * GET /permission/api/v1/roles?include_system=true
   */
  listRoles: async (includeSystem = true): Promise<RoleItem[]> => {
    const res = await apiClient.get<{ roles: RoleItem[] }>(
      `${BASE}/roles?include_system=${includeSystem}`,
    );
    if (res.error) {
      console.error('[PermissionsAPI] listRoles failed:', res.error);
      return [];
    }
    return res.data?.roles ?? [];
  },

  /**
   * Get role details including its permission codes.
   * GET /permission/api/v1/roles/:roleId
   */
  getRole: async (roleId: string): Promise<RoleDetail | null> => {
    const res = await apiClient.get<RoleDetail>(`${BASE}/roles/${roleId}`);
    if (res.error) {
      console.error('[PermissionsAPI] getRole failed:', res.error);
      return null;
    }
    return res.data ?? null;
  },

  /**
   * Get the permission codes assigned to a role.
   * GET /permission/api/v1/roles/:roleId/permissions
   */
  getRolePermissions: async (roleId: string): Promise<PermissionItem[]> => {
    const res = await apiClient.get<{ permissions: PermissionItem[] }>(
      `${BASE}/roles/${roleId}/permissions`,
    );
    if (res.error) {
      console.error('[PermissionsAPI] getRolePermissions failed:', res.error);
      return [];
    }
    return res.data?.permissions ?? [];
  },

  /**
   * Replace all permissions for a role.
   * PUT /permission/api/v1/roles/:roleId/permissions
   */
  setRolePermissions: async (
    roleId: string,
    permissionCodes: string[],
  ): Promise<PermissionItem[]> => {
    const res = await apiClient.put<{ permissions: PermissionItem[] }>(
      `${BASE}/roles/${roleId}/permissions`,
      { permissions: permissionCodes },
    );
    if (res.error) {
      console.error('[PermissionsAPI] setRolePermissions failed:', res.error);
      throw new Error(res.error.message || 'Failed to update permissions');
    }
    return res.data?.permissions ?? [];
  },
};
