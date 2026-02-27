import { apiClient } from './client';

export interface FormSectionField {
  name: string;
  label: string;
  field_type: string;
  is_required: boolean;
  is_unique?: boolean;
  is_searchable?: boolean;
  placeholder?: string;
  help_text?: string;
  validation_rules?: Record<string, unknown>;
  options?: 
    | Array<{ value: string; label: string; color?: string }> // For select, multi_select, radio
    | { // For lookup fields
        entity?: string;
        api_endpoint?: string;
        data_path?: string;
        display_field?: string;
        value_field?: string;
      };
  default_value?: unknown;
  width: 'half' | 'full' | 'third' | 'two-thirds';
  readonly?: boolean;
  conditional?: {
    show_if: {
      field: string;
      operator: string;
      value: unknown;
    };
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  columns: number;
  collapsible?: boolean;
  fields: FormSectionField[];
}

export interface FormSchema {
  version: string;
  layout?: {
    type: string;
    columns?: number;
  };
  sections: FormSection[];
  validation?: {
    cross_field_rules?: unknown[];
  };
}

export interface FormDefinitionApiResponse {
  id: string;
  org_id: string;
  entity_type: 'lead' | 'contact' | 'company' | 'deal';
  name: string;
  description?: string;
  is_default: boolean;
  form_type: 'create' | 'edit' | 'quick_add' | 'web_form' | 'detail_view';
  schema: FormSchema;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FormDefinition {
  id: string;
  orgId: string;
  entityType: 'lead' | 'contact' | 'company' | 'deal';
  name: string;
  description?: string;
  isDefault: boolean;
  formType: 'create' | 'edit' | 'quick_add' | 'web_form' | 'detail_view';
  schema: FormSchema;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormSchemaApiResponse {
  id: string;
  name: string;
  entity_type: 'lead' | 'contact' | 'company' | 'deal';
  form_type: 'create' | 'edit' | 'quick_add' | 'web_form';
  schema: FormSchema;
}

export interface FormSchemaResponse {
  id: string;
  name: string;
  entityType: 'lead' | 'contact' | 'company' | 'deal';
  formType: 'create' | 'edit' | 'quick_add' | 'web_form';
  schema: FormSchema;
}

function transformFormDefinition(form: FormDefinitionApiResponse): FormDefinition {
  return {
    id: form.id,
    orgId: form.org_id,
    entityType: form.entity_type,
    name: form.name,
    description: form.description,
    isDefault: form.is_default,
    formType: form.form_type,
    schema: form.schema,
    isActive: form.is_active,
    createdBy: form.created_by,
    updatedBy: form.updated_by,
    createdAt: form.created_at,
    updatedAt: form.updated_at,
  };
}

function transformFormSchema(response: FormSchemaApiResponse): FormSchemaResponse {
  return {
    id: response.id,
    name: response.name,
    entityType: response.entity_type,
    formType: response.form_type,
    schema: response.schema,
  };
}

export const formsV2Api = {
  async listForms(
    entityType: 'lead' | 'contact' | 'company' | 'deal',
    formType?: 'create' | 'edit' | 'quick_add' | 'web_form'
  ): Promise<FormDefinition[]> {
    const params: { entity_type: string; form_type?: string } = { entity_type: entityType };
    if (formType) {
      params.form_type = formType;
    }
    
    const response = await apiClient.get<{
      count: number;
      results: FormDefinitionApiResponse[];
    }>(
      `/crm/api/v2/forms/definitions/`,
      { params }
    );
    return (response.data?.results || []).map(transformFormDefinition);
  },

  async getFormSchema(
    entityType: 'lead' | 'contact' | 'company' | 'deal',
    formType: 'create' | 'edit' | 'quick_add' | 'web_form' = 'create'
  ): Promise<FormSchemaResponse> {
    const response = await apiClient.get<FormSchemaApiResponse>(
      `/crm/api/v2/forms/definitions/get-schema/`,
      {
        params: {
          entity_type: entityType,
          form_type: formType,
        },
      }
    );
    if (!response.data) throw new Error('Form schema not found');
    return transformFormSchema(response.data);
  },

  async getFormSchemaById(formId: string): Promise<FormSchemaResponse> {
    const response = await apiClient.get<FormSchemaApiResponse>(
      `/crm/api/v2/forms/definitions/get-schema/`,
      {
        params: { form_id: formId },
      }
    );
    if (!response.data) throw new Error('Form schema not found');
    return transformFormSchema(response.data);
  },

  async getEntityTypes(): Promise<Array<{ value: string; label: string }>> {
    const response = await apiClient.get<{ entity_types: Array<{ value: string; label: string }> }>(
      `/crm/api/v2/forms/definitions/entity_types/`
    );
    return response.data?.entity_types || [];
  },

  async getFormTypes(): Promise<Array<{ value: string; label: string }>> {
    const response = await apiClient.get<{ form_types: Array<{ value: string; label: string }> }>(
      `/crm/api/v2/forms/definitions/form_types/`
    );
    return response.data?.form_types || [];
  },

  async updateFormSchema(
    formId: string,
    schema: FormSchema
  ): Promise<FormDefinition> {
    const response = await apiClient.patch<FormDefinitionApiResponse>(
      `/crm/api/v2/forms/definitions/${formId}/`,
      { schema }
    );
    if (!response.data) throw new Error('Failed to update form schema');
    return transformFormDefinition(response.data);
  },

  async getFormDefinition(id: string): Promise<FormDefinition> {
    const response = await apiClient.get<FormDefinitionApiResponse>(
      `/crm/api/v2/forms/definitions/${id}/`
    );
    if (!response.data) throw new Error('Form definition not found');
    return transformFormDefinition(response.data);
  },

  async getFieldTypes(): Promise<Array<{ value: string; label: string }>> {
    return [
      { value: 'text', label: 'Text' },
      { value: 'textarea', label: 'Text Area' },
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
      { value: 'url', label: 'URL' },
      { value: 'number', label: 'Number' },
      { value: 'decimal', label: 'Decimal' },
      { value: 'currency', label: 'Currency' },
      { value: 'percentage', label: 'Percentage' },
      { value: 'date', label: 'Date' },
      { value: 'datetime', label: 'Date & Time' },
      { value: 'time', label: 'Time' },
      { value: 'select', label: 'Dropdown' },
      { value: 'multi_select', label: 'Multi Select' },
      { value: 'radio', label: 'Radio Buttons' },
      { value: 'checkbox', label: 'Checkbox' },
      { value: 'boolean', label: 'Yes/No' },
    ];
  },
};
