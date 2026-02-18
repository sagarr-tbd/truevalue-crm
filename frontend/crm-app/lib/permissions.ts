/**
 * CRM Permission constants and utilities.
 *
 * Permission codes match the Permission Service seed data.
 * Format: resource:action
 *
 * The JWT token contains `roles: string[]` and `permissions: string[]`.
 * Both GatewayUser and JWTUser expose these on the decoded token.
 */

import { useCallback } from 'react';
import { TokenManager, decodeJWT } from './api/client';

// ---------------------------------------------------------------------------
// Permission code constants
// ---------------------------------------------------------------------------

// Contacts
export const CONTACTS_READ = 'contacts:read';
export const CONTACTS_WRITE = 'contacts:write';
export const CONTACTS_DELETE = 'contacts:delete';
export const CONTACTS_EXPORT = 'contacts:export';
export const CONTACTS_IMPORT = 'contacts:import';

// Companies
export const COMPANIES_READ = 'companies:read';
export const COMPANIES_WRITE = 'companies:write';
export const COMPANIES_DELETE = 'companies:delete';

// Deals
export const DEALS_READ = 'deals:read';
export const DEALS_WRITE = 'deals:write';
export const DEALS_DELETE = 'deals:delete';
export const DEALS_MANAGE_PIPELINE = 'deals:manage_pipeline';

// Leads
export const LEADS_READ = 'leads:read';
export const LEADS_WRITE = 'leads:write';
export const LEADS_DELETE = 'leads:delete';

// Tasks
export const TASKS_READ = 'tasks:read';
export const TASKS_WRITE = 'tasks:write';
export const TASKS_DELETE = 'tasks:delete';

// Activities (calls, meetings, emails, notes)
export const ACTIVITIES_READ = 'activities:read';
export const ACTIVITIES_WRITE = 'activities:write';
export const ACTIVITIES_DELETE = 'activities:delete';

// Reports
export const REPORTS_READ = 'reports:read';
export const REPORTS_WRITE = 'reports:write';
export const REPORTS_EXPORT = 'reports:export';

// Dashboards
export const DASHBOARDS_READ = 'dashboards:read';
export const DASHBOARDS_WRITE = 'dashboards:write';

// Org management
export const ORG_READ = 'org:read';
export const ORG_WRITE = 'org:write';
export const ORG_DELETE = 'org:delete';
export const ORG_MANAGE_MEMBERS = 'org:manage_members';
export const ORG_MANAGE_INVITES = 'org:manage_invites';
export const ORG_MANAGE_SETTINGS = 'org:manage_settings';

// Roles
export const ROLES_READ = 'roles:read';
export const ROLES_WRITE = 'roles:write';
export const ROLES_DELETE = 'roles:delete';
export const ROLES_ASSIGN = 'roles:assign';

// Administration
export const BILLING_READ = 'billing:read';
export const BILLING_WRITE = 'billing:write';
export const AUDIT_READ = 'audit:read';

// ---------------------------------------------------------------------------
// Role constants
// ---------------------------------------------------------------------------

export const ROLE_SUPER_ADMIN = 'super_admin';
export const ROLE_ORG_ADMIN = 'org_admin';
export const ROLE_OWNER = 'owner';
export const ROLE_ADMIN = 'admin';
export const ROLE_MANAGER = 'manager';
export const ROLE_MEMBER = 'member';
export const ROLE_VIEWER = 'viewer';

const ADMIN_ROLES = new Set([ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN, ROLE_OWNER, ROLE_ADMIN]);

// ---------------------------------------------------------------------------
// Core helpers (no React dependency)
// ---------------------------------------------------------------------------

export interface UserClaims {
  roles: string[];
  permissions: string[];
}

function getClaims(): UserClaims {
  const token = TokenManager.getAccessToken();
  if (!token) return { roles: [], permissions: [] };

  const decoded = decodeJWT(token);
  return {
    roles: decoded?.roles ?? [],
    permissions: decoded?.permissions ?? [],
  };
}

/** Check if the current user has a specific permission (admin roles bypass). */
export function hasPermission(code: string): boolean {
  const { roles, permissions } = getClaims();
  if (roles.some((r) => ADMIN_ROLES.has(r))) return true;
  return permissions.includes(code);
}

/** Check if the current user has a specific role. */
export function hasRole(role: string): boolean {
  return getClaims().roles.includes(role);
}

/** Check if user is an admin (super_admin or org_admin). */
export function isAdmin(): boolean {
  return getClaims().roles.some((r) => ADMIN_ROLES.has(r));
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Hook that returns a stable `can` function and current roles/permissions.
 *
 * Usage:
 *   const { can } = usePermission();
 *   if (can(CONTACTS_WRITE)) { ... }
 */
export function usePermission() {
  // Read fresh claims on every render so token refreshes are picked up
  const claims = getClaims();
  const isAdminUser = claims.roles.some((r) => ADMIN_ROLES.has(r));

  const can = useCallback(
    (code: string) => {
      if (isAdminUser) return true;
      return claims.permissions.includes(code);
    },
    [isAdminUser, claims.permissions],
  );

  return {
    can,
    roles: claims.roles,
    permissions: claims.permissions,
    isAdmin: isAdminUser,
  };
}
