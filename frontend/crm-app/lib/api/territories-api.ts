/**
 * Territories API client.
 *
 * Calls go through the gateway: /permission/api/v1/territories/...
 */
import { apiClient } from './client';

const BASE = '/permission/api/v1';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TerritoryItem {
  id: string;
  code: string;
  name: string;
  description: string;
  parent_territory_id: string | null;
  org_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TerritoryHierarchy extends TerritoryItem {
  children: TerritoryHierarchy[];
}

export interface TerritoryDetail extends TerritoryItem {
  assignment_rules: AssignmentRules;
  user_count: number;
  account_count: number;
}

export interface AssignmentRules {
  country?: string[];
  state?: string[];
  city?: string[];
  industry?: string[];
  [key: string]: string[] | undefined;
}

export interface CreateTerritoryData {
  code: string;
  name: string;
  description?: string;
  parent_territory_id?: string;
  assignment_rules?: AssignmentRules;
}

export interface UpdateTerritoryData {
  name?: string;
  description?: string;
  parent_territory_id?: string | null;
  assignment_rules?: AssignmentRules;
  is_active?: boolean;
}

export interface TerritoryUserAssignment {
  id: string;
  territory_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  assignment_type: 'manager' | 'member';
  created_at: string;
}

export interface TerritoryAccountAssignment {
  id: string;
  territory_id: string;
  account_id: string;
  account_name: string;
  org_id: string;
  source: 'manual' | 'auto';
  created_at: string;
}

export interface AssignUserData {
  user_id: string;
  assignment_type: 'manager' | 'member';
}

export interface AssignAccountData {
  account_id: string;
  source?: 'manual' | 'auto';
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const territoriesApi = {
  /**
   * List all territories (flat list).
   * GET /permission/api/v1/territories
   */
  listTerritories: async (activeOnly = true): Promise<TerritoryItem[]> => {
    const params = activeOnly ? '' : '?active_only=false';
    const res = await apiClient.get<{ territories: TerritoryItem[] }>(`${BASE}/territories${params}`);
    
    if (res.error) {
      console.error('[TerritoriesAPI] listTerritories failed:', res.error);
      return [];
    }
    return res.data?.territories ?? [];
  },

  /**
   * Get territory hierarchy (tree structure).
   * GET /permission/api/v1/territories/hierarchy
   */
  getHierarchy: async (): Promise<TerritoryHierarchy[]> => {
    const res = await apiClient.get<{ hierarchy: TerritoryHierarchy[] }>(`${BASE}/territories/hierarchy`);
    
    if (res.error) {
      console.error('[TerritoriesAPI] getHierarchy failed:', res.error);
      return [];
    }
    return res.data?.hierarchy ?? [];
  },

  /**
   * Get a single territory with details.
   * GET /permission/api/v1/territories/:territoryId
   */
  getTerritory: async (territoryId: string): Promise<TerritoryDetail | null> => {
    const res = await apiClient.get<TerritoryDetail>(`${BASE}/territories/${territoryId}`);
    
    if (res.error) {
      console.error('[TerritoriesAPI] getTerritory failed:', res.error);
      return null;
    }
    return res.data ?? null;
  },

  /**
   * Create a new territory.
   * POST /permission/api/v1/territories
   */
  createTerritory: async (data: CreateTerritoryData): Promise<TerritoryDetail> => {
    const res = await apiClient.post<TerritoryDetail>(`${BASE}/territories`, data);
    
    if (res.error) {
      console.error('[TerritoriesAPI] createTerritory failed:', res.error);
      throw new Error(res.error.message || 'Failed to create territory');
    }
    return res.data!;
  },

  /**
   * Update an existing territory.
   * PUT /permission/api/v1/territories/:territoryId
   */
  updateTerritory: async (territoryId: string, data: UpdateTerritoryData): Promise<TerritoryDetail> => {
    const res = await apiClient.put<TerritoryDetail>(`${BASE}/territories/${territoryId}`, data);
    
    if (res.error) {
      console.error('[TerritoriesAPI] updateTerritory failed:', res.error);
      throw new Error(res.error.message || 'Failed to update territory');
    }
    return res.data!;
  },

  /**
   * Delete a territory.
   * DELETE /permission/api/v1/territories/:territoryId
   */
  deleteTerritory: async (territoryId: string): Promise<void> => {
    const res = await apiClient.delete(`${BASE}/territories/${territoryId}`);
    
    if (res.error) {
      console.error('[TerritoriesAPI] deleteTerritory failed:', res.error);
      throw new Error(res.error.message || 'Failed to delete territory');
    }
  },

  /**
   * Get users assigned to a territory.
   * GET /permission/api/v1/territories/:territoryId/users
   */
  getTerritoryUsers: async (territoryId: string): Promise<TerritoryUserAssignment[]> => {
    const res = await apiClient.get<{ users: TerritoryUserAssignment[] }>(
      `${BASE}/territories/${territoryId}/users`
    );
    
    if (res.error) {
      console.error('[TerritoriesAPI] getTerritoryUsers failed:', res.error);
      return [];
    }
    return res.data?.users ?? [];
  },

  /**
   * Assign a user to a territory.
   * POST /permission/api/v1/territories/:territoryId/users
   */
  assignUser: async (territoryId: string, data: AssignUserData): Promise<TerritoryUserAssignment> => {
    const res = await apiClient.post<TerritoryUserAssignment>(
      `${BASE}/territories/${territoryId}/users`,
      data
    );
    
    if (res.error) {
      console.error('[TerritoriesAPI] assignUser failed:', res.error);
      throw new Error(res.error.message || 'Failed to assign user to territory');
    }
    return res.data!;
  },

  /**
   * Remove a user from a territory.
   * DELETE /permission/api/v1/territories/:territoryId/users/:userId
   */
  removeUser: async (territoryId: string, userId: string): Promise<void> => {
    const res = await apiClient.delete(`${BASE}/territories/${territoryId}/users/${userId}`);
    
    if (res.error) {
      console.error('[TerritoriesAPI] removeUser failed:', res.error);
      throw new Error(res.error.message || 'Failed to remove user from territory');
    }
  },

  /**
   * Get accounts assigned to a territory.
   * GET /permission/api/v1/territories/:territoryId/accounts
   */
  getTerritoryAccounts: async (territoryId: string): Promise<TerritoryAccountAssignment[]> => {
    const res = await apiClient.get<{ accounts: TerritoryAccountAssignment[] }>(
      `${BASE}/territories/${territoryId}/accounts`
    );
    
    if (res.error) {
      console.error('[TerritoriesAPI] getTerritoryAccounts failed:', res.error);
      return [];
    }
    return res.data?.accounts ?? [];
  },

  /**
   * Assign an account to a territory.
   * POST /permission/api/v1/territories/:territoryId/accounts
   */
  assignAccount: async (territoryId: string, data: AssignAccountData): Promise<TerritoryAccountAssignment> => {
    const res = await apiClient.post<TerritoryAccountAssignment>(
      `${BASE}/territories/${territoryId}/accounts`,
      data
    );
    
    if (res.error) {
      console.error('[TerritoriesAPI] assignAccount failed:', res.error);
      throw new Error(res.error.message || 'Failed to assign account to territory');
    }
    return res.data!;
  },

  /**
   * Remove an account from a territory.
   * DELETE /permission/api/v1/territories/:territoryId/accounts/:accountId
   */
  removeAccount: async (territoryId: string, accountId: string): Promise<void> => {
    const res = await apiClient.delete(`${BASE}/territories/${territoryId}/accounts/${accountId}`);
    
    if (res.error) {
      console.error('[TerritoriesAPI] removeAccount failed:', res.error);
      throw new Error(res.error.message || 'Failed to remove account from territory');
    }
  },

  /**
   * Get territories assigned to a user.
   * GET /permission/api/v1/users/:userId/territories
   */
  getUserTerritories: async (userId: string): Promise<TerritoryItem[]> => {
    const res = await apiClient.get<{ territories: TerritoryItem[] }>(
      `${BASE}/users/${userId}/territories`
    );
    
    if (res.error) {
      console.error('[TerritoriesAPI] getUserTerritories failed:', res.error);
      return [];
    }
    return res.data?.territories ?? [];
  },

  /**
   * Get current user's territories.
   * GET /permission/api/v1/me/territories
   */
  getMyTerritories: async (): Promise<TerritoryItem[]> => {
    const res = await apiClient.get<{ territories: TerritoryItem[] }>(`${BASE}/me/territories`);
    
    if (res.error) {
      console.error('[TerritoriesAPI] getMyTerritories failed:', res.error);
      return [];
    }
    return res.data?.territories ?? [];
  },
};
