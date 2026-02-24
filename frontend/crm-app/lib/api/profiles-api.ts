/**
 * Profiles API client.
 *
 * Calls go through the gateway: /permission/api/v1/profiles/...
 */
import { apiClient } from './client';

const BASE = '/permission/api/v1';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

export interface ProfileItem {
  id: string;
  code: string;
  name: string;
  description: string;
  profile_type: 'system' | 'custom';
  is_default: boolean;
  is_editable: boolean;
  is_active: boolean;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileDetail extends ProfileItem {
  module_permissions: Record<string, ModulePermission>;
  tool_permissions: Record<string, boolean>;
  admin_permissions: Record<string, boolean>;
}

export interface CreateProfileData {
  code: string;
  name: string;
  description?: string;
  module_permissions?: Record<string, ModulePermission>;
  tool_permissions?: Record<string, boolean>;
  admin_permissions?: Record<string, boolean>;
  is_default?: boolean;
}

export interface UpdateProfileData {
  name?: string;
  description?: string;
  module_permissions?: Record<string, ModulePermission>;
  tool_permissions?: Record<string, boolean>;
  admin_permissions?: Record<string, boolean>;
  is_default?: boolean;
  is_active?: boolean;
}

export interface CloneProfileData {
  source_profile_id: string;
  new_code: string;
  new_name: string;
}

export interface ProfileAssignment {
  id: string;
  user_id: string;
  org_id: string;
  profile_id: string;
  profile_name: string;
  assigned_by: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const profilesApi = {
  /**
   * List all profiles for the current organization.
   * GET /permission/api/v1/profiles
   */
  listProfiles: async (includeSystem = true, activeOnly = true): Promise<ProfileItem[]> => {
    const params = new URLSearchParams();
    if (!includeSystem) params.append('include_system', 'false');
    if (!activeOnly) params.append('active_only', 'false');
    
    const url = `${BASE}/profiles${params.toString() ? '?' + params.toString() : ''}`;
    const res = await apiClient.get<{ profiles: ProfileItem[] }>(url);
    
    if (res.error) {
      console.error('[ProfilesAPI] listProfiles failed:', res.error);
      return [];
    }
    return res.data?.profiles ?? [];
  },

  /**
   * Get a single profile with full permission details.
   * GET /permission/api/v1/profiles/:profileId
   */
  getProfile: async (profileId: string): Promise<ProfileDetail | null> => {
    const res = await apiClient.get<ProfileDetail>(`${BASE}/profiles/${profileId}`);
    
    if (res.error) {
      console.error('[ProfilesAPI] getProfile failed:', res.error);
      return null;
    }
    return res.data ?? null;
  },

  /**
   * Create a new profile.
   * POST /permission/api/v1/profiles
   */
  createProfile: async (data: CreateProfileData): Promise<ProfileDetail> => {
    const res = await apiClient.post<ProfileDetail>(`${BASE}/profiles`, data);
    
    if (res.error) {
      console.error('[ProfilesAPI] createProfile failed:', res.error);
      throw new Error(res.error.message || 'Failed to create profile');
    }
    return res.data!;
  },

  /**
   * Update an existing profile.
   * PUT /permission/api/v1/profiles/:profileId
   */
  updateProfile: async (profileId: string, data: UpdateProfileData): Promise<ProfileDetail> => {
    const res = await apiClient.put<ProfileDetail>(`${BASE}/profiles/${profileId}`, data);
    
    if (res.error) {
      console.error('[ProfilesAPI] updateProfile failed:', res.error);
      throw new Error(res.error.message || 'Failed to update profile');
    }
    return res.data!;
  },

  /**
   * Delete a profile.
   * DELETE /permission/api/v1/profiles/:profileId
   */
  deleteProfile: async (profileId: string): Promise<void> => {
    const res = await apiClient.delete(`${BASE}/profiles/${profileId}`);
    
    if (res.error) {
      console.error('[ProfilesAPI] deleteProfile failed:', res.error);
      throw new Error(res.error.message || 'Failed to delete profile');
    }
  },

  /**
   * Clone an existing profile.
   * POST /permission/api/v1/profiles/clone
   */
  cloneProfile: async (data: CloneProfileData): Promise<ProfileDetail> => {
    const res = await apiClient.post<ProfileDetail>(`${BASE}/profiles/clone`, data);
    
    if (res.error) {
      console.error('[ProfilesAPI] cloneProfile failed:', res.error);
      throw new Error(res.error.message || 'Failed to clone profile');
    }
    return res.data!;
  },

  /**
   * List all profile assignments.
   * GET /permission/api/v1/profile-assignments
   */
  listAssignments: async (): Promise<ProfileAssignment[]> => {
    const res = await apiClient.get<{ assignments: ProfileAssignment[] }>(`${BASE}/profile-assignments`);
    
    if (res.error) {
      console.error('[ProfilesAPI] listAssignments failed:', res.error);
      return [];
    }
    return res.data?.assignments ?? [];
  },

  /**
   * Assign a profile to a user.
   * POST /permission/api/v1/profile-assignments
   */
  assignProfile: async (userId: string, profileId: string): Promise<ProfileAssignment> => {
    const res = await apiClient.post<ProfileAssignment>(`${BASE}/profile-assignments`, {
      user_id: userId,
      profile_id: profileId,
    });
    
    if (res.error) {
      console.error('[ProfilesAPI] assignProfile failed:', res.error);
      throw new Error(res.error.message || 'Failed to assign profile');
    }
    return res.data!;
  },

  /**
   * Get a user's profile.
   * GET /permission/api/v1/users/:userId/profile
   */
  getUserProfile: async (userId: string): Promise<ProfileItem | null> => {
    const res = await apiClient.get<ProfileItem>(`${BASE}/users/${userId}/profile`);
    
    if (res.error) {
      console.error('[ProfilesAPI] getUserProfile failed:', res.error);
      return null;
    }
    return res.data ?? null;
  },

  /**
   * Get current user's profile.
   * GET /permission/api/v1/me/profile
   */
  getMyProfile: async (): Promise<ProfileItem | null> => {
    const res = await apiClient.get<ProfileItem>(`${BASE}/me/profile`);
    
    if (res.error) {
      console.error('[ProfilesAPI] getMyProfile failed:', res.error);
      return null;
    }
    return res.data ?? null;
  },

  /**
   * Check if user has a specific profile permission.
   * POST /permission/api/v1/check-profile
   */
  checkPermission: async (module: string, action: string): Promise<boolean> => {
    const res = await apiClient.post<{ allowed: boolean }>(`${BASE}/check-profile`, {
      module,
      action,
    });
    
    if (res.error) {
      console.error('[ProfilesAPI] checkPermission failed:', res.error);
      return false;
    }
    return res.data?.allowed ?? false;
  },
};
