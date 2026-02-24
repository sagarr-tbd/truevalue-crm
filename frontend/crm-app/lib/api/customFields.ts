import { apiClient } from './client';

/**
 * Custom Field Definition API Response (snake_case from backend)
 */
export interface CustomFieldDefinitionApiResponse {
  id: string;
  org_id: string;
  entity_type: 'contact' | 'company' | 'deal' | 'lead';
  name: string;
  label: string;
  field_type: 'text' | 'textarea' | 'number' | 'decimal' | 'date' | 'datetime' | 'checkbox' | 'select' | 'multi_select' | 'email' | 'phone' | 'url';
  is_required: boolean;
  is_unique: boolean;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  options: Array<{ value: string; label: string; color?: string }>;
  validation: Record<string, any>;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Custom Field Definition (camelCase for frontend)
 */
export interface CustomFieldDefinition {
  id: string;
  orgId: string;
  entityType: 'contact' | 'company' | 'deal' | 'lead';
  name: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'number' | 'decimal' | 'date' | 'datetime' | 'checkbox' | 'select' | 'multi_select' | 'email' | 'phone' | 'url';
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  options: Array<{ value: string; label: string; color?: string }>;
  validation: Record<string, any>;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating custom field definitions
 */
export interface CustomFieldDefinitionFormData {
  entityType: 'contact' | 'company' | 'deal' | 'lead';
  name: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'number' | 'decimal' | 'date' | 'datetime' | 'checkbox' | 'select' | 'multi_select' | 'email' | 'phone' | 'url';
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string; color?: string }>;
  validation?: Record<string, any>;
  order?: number;
  isActive?: boolean;
}

/**
 * Convert API response (snake_case) to frontend format (camelCase)
 */
function transformCustomFieldDefinition(data: CustomFieldDefinitionApiResponse): CustomFieldDefinition {
  return {
    id: data.id,
    orgId: data.org_id,
    entityType: data.entity_type,
    name: data.name,
    label: data.label,
    fieldType: data.field_type,
    isRequired: data.is_required,
    isUnique: data.is_unique,
    defaultValue: data.default_value,
    placeholder: data.placeholder,
    helpText: data.help_text,
    options: data.options || [],
    validation: data.validation || {},
    order: data.order,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Convert frontend form data (camelCase) to API format (snake_case)
 */
function transformToApiFormat(data: CustomFieldDefinitionFormData): Record<string, any> {
  return {
    entity_type: data.entityType,
    name: data.name,
    label: data.label,
    field_type: data.fieldType,
    is_required: data.isRequired ?? false,
    is_unique: data.isUnique ?? false,
    default_value: data.defaultValue,
    placeholder: data.placeholder,
    help_text: data.helpText,
    options: data.options || [],
    validation: data.validation || {},
    order: data.order ?? 0,
    is_active: data.isActive ?? true,
  };
}

/**
 * Custom Fields API
 */
export const customFieldsApi = {
  /**
   * Get all custom field definitions for an entity type
   */
  async getAll(entityType?: 'contact' | 'company' | 'deal' | 'lead'): Promise<CustomFieldDefinition[]> {
    const params = entityType ? { entity_type: entityType } : {};
    const response = await apiClient.get<{ data: CustomFieldDefinitionApiResponse[] }>(
      '/crm/api/v1/custom-fields',
      { params }
    );
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    return response.data.data.map(transformCustomFieldDefinition);
  },

  /**
   * Get custom field definition by ID
   */
  async getById(id: string): Promise<CustomFieldDefinition> {
    const response = await apiClient.get<CustomFieldDefinitionApiResponse>(
      `/crm/api/v1/custom-fields/${id}`
    );
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    return transformCustomFieldDefinition(response.data);
  },

  /**
   * Create a new custom field definition
   */
  async create(data: CustomFieldDefinitionFormData): Promise<CustomFieldDefinition> {
    const response = await apiClient.post<CustomFieldDefinitionApiResponse>(
      '/crm/api/v1/custom-fields',
      transformToApiFormat(data)
    );
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    return transformCustomFieldDefinition(response.data);
  },

  /**
   * Update a custom field definition
   */
  async update(id: string, data: Partial<CustomFieldDefinitionFormData>): Promise<CustomFieldDefinition> {
    const response = await apiClient.patch<CustomFieldDefinitionApiResponse>(
      `/crm/api/v1/custom-fields/${id}`,
      transformToApiFormat(data as CustomFieldDefinitionFormData)
    );
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    return transformCustomFieldDefinition(response.data);
  },

  /**
   * Delete a custom field definition
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/crm/api/v1/custom-fields/${id}`);
  },
};
