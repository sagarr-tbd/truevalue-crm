import { apiClient, TokenManager, decodeJWT } from './client';

/**
 * Organization member from API
 */
export interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  title?: string;
  department?: string;
}

/**
 * Member option for select fields
 */
export interface MemberOption {
  value: string;
  label: string;
}

/**
 * Paginated response from Org Service
 * API returns: { members: [...], pagination: { total, page, page_size, ... } }
 */
interface PaginatedResponse {
  members: OrganizationMember[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

/**
 * Invite from API
 */
export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

/**
 * Get the current organization ID from JWT token
 */
function getCurrentOrgId(): string | null {
  const token = TokenManager.getAccessToken();
  if (!token) return null;
  
  const claims = decodeJWT(token);
  return claims?.org_id || null;
}

/**
 * Organization Members API
 */
export const membersApi = {
  /**
   * Get all organization members
   */
  getAll: async (params?: { page_size?: number; status?: string }): Promise<OrganizationMember[]> => {
    const orgId = getCurrentOrgId();
    if (!orgId) {
      console.warn('[MembersAPI] No organization ID found in token');
      return [];
    }

    const pageSize = params?.page_size || 100;
    let url = `/org/api/v1/orgs/${orgId}/members?page_size=${pageSize}`;
    
    if (params?.status) {
      url += `&status=${params.status}`;
    }

    const response = await apiClient.get<PaginatedResponse>(url);
    
    if (response.error) {
      console.error('[MembersAPI] Failed to fetch members:', response.error);
      return [];
    }

    return response.data?.members || [];
  },

  /**
   * Get active members as select options
   */
  getAsOptions: async (): Promise<MemberOption[]> => {
    const members = await membersApi.getAll({ status: 'active', page_size: 100 });

    return members.map(member => ({
      value: member.user_id,
      label: `${member.first_name || ''} ${member.last_name || ''}`.trim()
        || member.display_name
        || 'Unknown',
    }));
  },

  /**
   * Update a member's role.
   * PATCH /org/api/v1/orgs/{orgId}/members/{userId}
   */
  updateRole: async (userId: string, role: string): Promise<OrganizationMember | null> => {
    const orgId = getCurrentOrgId();
    if (!orgId) return null;

    const response = await apiClient.patch<OrganizationMember>(
      `/org/api/v1/orgs/${orgId}/members/${userId}`,
      { role },
    );

    if (response.error) {
      console.error('[MembersAPI] Failed to update role:', response.error);
      throw new Error(response.error.message || 'Failed to update role');
    }

    return response.data ?? null;
  },

  /**
   * Remove a member from the organization.
   * DELETE /org/api/v1/orgs/{orgId}/members/{userId}
   */
  removeMember: async (userId: string): Promise<void> => {
    const orgId = getCurrentOrgId();
    if (!orgId) return;

    const response = await apiClient.delete(`/org/api/v1/orgs/${orgId}/members/${userId}`);

    if (response.error) {
      console.error('[MembersAPI] Failed to remove member:', response.error);
      throw new Error(response.error.message || 'Failed to remove member');
    }
  },

  /**
   * Send an invitation.
   * POST /org/api/v1/orgs/{orgId}/invites
   */
  inviteMember: async (email: string, role: string): Promise<Invitation | null> => {
    const orgId = getCurrentOrgId();
    if (!orgId) return null;

    const response = await apiClient.post<Invitation>(
      `/org/api/v1/orgs/${orgId}/invites`,
      { email, role },
    );

    if (response.error) {
      console.error('[MembersAPI] Failed to send invitation:', response.error);
      throw new Error(response.error.message || 'Failed to send invitation');
    }

    return response.data ?? null;
  },
};
