import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { formsV2Api, FormSchemaResponse, FormDefinition } from '@/lib/api/formsV2';

export const formsV2QueryKeys = {
  all: ['forms-v2'] as const,
  
  formSchema: (entityType: string, formType: string) =>
    [...formsV2QueryKeys.all, 'schema', entityType, formType] as const,
  
  formSchemaById: (formId: string) =>
    [...formsV2QueryKeys.all, 'schema-by-id', formId] as const,
  
  fields: (entityType: string) =>
    [...formsV2QueryKeys.all, 'fields', entityType] as const,
  
  field: (id: string) =>
    [...formsV2QueryKeys.all, 'field', id] as const,
  
  forms: (entityType: string, formType?: string) =>
    [...formsV2QueryKeys.all, 'forms', entityType, formType] as const,
  
  fieldTypes: () =>
    [...formsV2QueryKeys.all, 'field-types'] as const,
  
  entityTypes: () =>
    [...formsV2QueryKeys.all, 'entity-types'] as const,
  
  formTypes: () =>
    [...formsV2QueryKeys.all, 'form-types'] as const,
};

export function useFormSchema(
  entityType: 'lead' | 'contact' | 'company' | 'deal',
  formType: 'create' | 'edit' | 'quick_add' | 'web_form' = 'create'
): UseQueryResult<FormSchemaResponse, Error> {
  return useQuery({
    queryKey: formsV2QueryKeys.formSchema(entityType, formType),
    queryFn: () => formsV2Api.getFormSchema(entityType, formType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });
}

export function useFormSchemaById(
  formId: string
): UseQueryResult<FormSchemaResponse, Error> {
  return useQuery({
    queryKey: formsV2QueryKeys.formSchemaById(formId),
    queryFn: () => formsV2Api.getFormSchemaById(formId),
    enabled: !!formId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}


export function useFieldTypes(): UseQueryResult<Array<{ value: string; label: string }>, Error> {
  return useQuery({
    queryKey: formsV2QueryKeys.fieldTypes(),
    queryFn: () => formsV2Api.getFieldTypes(),
    staleTime: 60 * 60 * 1000, // 1 hour (rarely changes)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

export function useFormDefinitions(
  entityType: 'lead' | 'contact' | 'company' | 'deal',
  formType?: 'create' | 'edit' | 'quick_add' | 'web_form'
): UseQueryResult<FormDefinition[], Error> {
  return useQuery({
    queryKey: formsV2QueryKeys.forms(entityType, formType),
    queryFn: () => formsV2Api.listForms(entityType, formType),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useEntityTypes(): UseQueryResult<Array<{ value: string; label: string }>, Error> {
  return useQuery({
    queryKey: formsV2QueryKeys.entityTypes(),
    queryFn: () => formsV2Api.getEntityTypes(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000,
  });
}

export function useFormTypes(): UseQueryResult<Array<{ value: string; label: string }>, Error> {
  return useQuery({
    queryKey: formsV2QueryKeys.formTypes(),
    queryFn: () => formsV2Api.getFormTypes(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000,
  });
}
