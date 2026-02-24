/**
 * Data Sharing Rules API client.
 *
 * Calls go through the gateway: /permission/api/v1/sharing-rules/...
 */
import { apiClient } from './client';

const BASE = '/permission/api/v1';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SharingType = 'private' | 'public_read' | 'public_read_write';

export interface SharingException {
  share_with: 'all' | 'roles' | 'roles_and_subordinates' | 'territories' | 'groups';
  role_ids?: string[];
  territory_ids?: string[];
  group_ids?: string[];
  access: 'read' | 'write';
}

export interface SharingRuleItem {
  id: string;
  org_id: string;
  module: string;
  default_sharing: SharingType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharingRuleDetail extends SharingRuleItem {
  exceptions: SharingException[];
}

export interface CreateSharingRuleData {
  module: string;
  default_sharing: SharingType;
  exceptions?: SharingException[];
}

export interface UpdateSharingRuleData {
  default_sharing?: SharingType;
  exceptions?: SharingException[];
  is_active?: boolean;
}

// Module display configuration
export const CRM_MODULES = [
  { code: 'contacts', label: 'Contacts', icon: 'Users' },
  { code: 'companies', label: 'Companies', icon: 'Building2' },
  { code: 'leads', label: 'Leads', icon: 'UserPlus' },
  { code: 'deals', label: 'Deals', icon: 'Handshake' },
  { code: 'activities', label: 'Activities', icon: 'Calendar' },
  { code: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
  { code: 'notes', label: 'Notes', icon: 'StickyNote' },
  { code: 'documents', label: 'Documents', icon: 'FileText' },
] as const;

export const SHARING_TYPE_OPTIONS = [
  { value: 'private', label: 'Private', description: 'Only owner and hierarchy can access' },
  { value: 'public_read', label: 'Public Read Only', description: 'Everyone can view, only owner can edit' },
  { value: 'public_read_write', label: 'Public Read/Write', description: 'Everyone can view and edit' },
] as const;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const sharingRulesApi = {
  /**
   * List all sharing rules for the organization.
   * GET /permission/api/v1/sharing-rules
   */
  listRules: async (activeOnly = true): Promise<SharingRuleItem[]> => {
    const params = activeOnly ? '' : '?active_only=false';
    const res = await apiClient.get<{ rules: SharingRuleItem[] }>(`${BASE}/sharing-rules${params}`);
    
    if (res.error) {
      console.error('[SharingRulesAPI] listRules failed:', res.error);
      return [];
    }
    return res.data?.rules ?? [];
  },

  /**
   * Get a single sharing rule by ID.
   * GET /permission/api/v1/sharing-rules/:ruleId
   */
  getRule: async (ruleId: string): Promise<SharingRuleDetail | null> => {
    const res = await apiClient.get<SharingRuleDetail>(`${BASE}/sharing-rules/${ruleId}`);
    
    if (res.error) {
      console.error('[SharingRulesAPI] getRule failed:', res.error);
      return null;
    }
    return res.data ?? null;
  },

  /**
   * Get sharing rule for a specific module.
   * GET /permission/api/v1/sharing-rules/module/:module
   */
  getRuleByModule: async (module: string): Promise<SharingRuleDetail | null> => {
    const res = await apiClient.get<SharingRuleDetail>(`${BASE}/sharing-rules/module/${module}`);
    
    if (res.error) {
      // 404 means no rule exists yet for this module
      if (res.status === 404) {
        return null;
      }
      console.error('[SharingRulesAPI] getRuleByModule failed:', res.error);
      return null;
    }
    return res.data ?? null;
  },

  /**
   * Create a new sharing rule.
   * POST /permission/api/v1/sharing-rules
   */
  createRule: async (data: CreateSharingRuleData): Promise<SharingRuleDetail> => {
    const res = await apiClient.post<SharingRuleDetail>(`${BASE}/sharing-rules`, data);
    
    if (res.error) {
      console.error('[SharingRulesAPI] createRule failed:', res.error);
      throw new Error(res.error.message || 'Failed to create sharing rule');
    }
    return res.data!;
  },

  /**
   * Update an existing sharing rule.
   * PUT /permission/api/v1/sharing-rules/:ruleId
   */
  updateRule: async (ruleId: string, data: UpdateSharingRuleData): Promise<SharingRuleDetail> => {
    const res = await apiClient.put<SharingRuleDetail>(`${BASE}/sharing-rules/${ruleId}`, data);
    
    if (res.error) {
      console.error('[SharingRulesAPI] updateRule failed:', res.error);
      throw new Error(res.error.message || 'Failed to update sharing rule');
    }
    return res.data!;
  },

  /**
   * Delete a sharing rule.
   * DELETE /permission/api/v1/sharing-rules/:ruleId
   */
  deleteRule: async (ruleId: string): Promise<void> => {
    const res = await apiClient.delete(`${BASE}/sharing-rules/${ruleId}`);
    
    if (res.error) {
      console.error('[SharingRulesAPI] deleteRule failed:', res.error);
      throw new Error(res.error.message || 'Failed to delete sharing rule');
    }
  },

  /**
   * Get effective sharing type for a module (considers defaults).
   * This is a helper that returns the default if no rule exists.
   */
  getEffectiveSharing: async (module: string): Promise<SharingType> => {
    const rule = await sharingRulesApi.getRuleByModule(module);
    return rule?.default_sharing ?? 'private';
  },

  /**
   * Ensure all modules have sharing rules (create defaults if needed).
   * This is called when setting up an organization.
   */
  ensureDefaultRules: async (): Promise<SharingRuleDetail[]> => {
    const existingRules = await sharingRulesApi.listRules();
    const existingModules = new Set(existingRules.map(r => r.module));
    
    const createdRules: SharingRuleDetail[] = [];
    
    for (const module of CRM_MODULES) {
      if (!existingModules.has(module.code)) {
        try {
          const rule = await sharingRulesApi.createRule({
            module: module.code,
            default_sharing: 'private',
            exceptions: [],
          });
          createdRules.push(rule);
        } catch (error) {
          console.error(`Failed to create default rule for ${module.code}:`, error);
        }
      }
    }
    
    return createdRules;
  },
};
