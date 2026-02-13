/**
 * Form Config Utilities
 * 
 * Helper functions for working with form configurations.
 * These utilities handle deep cloning while preserving React elements and non-serializable values.
 */

import type { FormDrawerConfig, FormSection, FormFieldConfig } from "@/components/Forms/FormDrawer/types";

/**
 * Deep clone a field config, preserving icon React elements
 */
function cloneFieldConfig(field: FormFieldConfig): FormFieldConfig {
  const cloned: FormFieldConfig = {
    ...field,
    // Preserve icon as-is (React element)
    icon: field.icon,
  };
  
  // Clone options array if present (need explicit cast due to union type)
  if (field.options) {
    cloned.options = [...field.options] as FormFieldConfig['options'];
  }
  
  return cloned;
}

/**
 * Deep clone a section config, preserving icon React elements
 */
function cloneSectionConfig(section: FormSection): FormSection {
  return {
    ...section,
    // Preserve icon as-is (React element)
    icon: section.icon,
    // Deep clone fields array
    fields: section.fields.map(cloneFieldConfig),
  };
}

/**
 * Deep clone a form config, preserving React elements and non-serializable values.
 * This replaces the JSON.parse/JSON.stringify workaround.
 * 
 * @param config - The source form config to clone
 * @returns A deep clone of the config with preserved React elements
 */
export function cloneFormConfig(config: FormDrawerConfig): FormDrawerConfig {
  return {
    // Primitive values
    entity: config.entity,
    
    // Preserve React element as-is
    entityIcon: config.entityIcon,
    
    // Preserve Zod schema reference (should not be mutated)
    schema: config.schema,
    
    // Clone default values object
    defaultValues: { ...config.defaultValues },
    
    // Clone quick form sections if present
    quickFormSections: config.quickFormSections?.map(section => ({
      ...section,
      icon: section.icon, // Preserve React element
      fields: [...section.fields],
    })),
    
    // Deep clone detailed sections
    detailedSections: config.detailedSections.map(cloneSectionConfig),
  };
}

/**
 * Update field options in a cloned config by field name
 * 
 * @param config - The form config to update (should be a clone)
 * @param fieldName - The name of the field to update
 * @param options - The new options to set
 */
export function updateFieldOptions(
  config: FormDrawerConfig,
  fieldName: string,
  options: Array<{ value: string; label: string }>
): void {
  for (const section of config.detailedSections) {
    const field = section.fields.find(f => f.name === fieldName);
    if (field) {
      field.options = options;
      return;
    }
  }
}

/**
 * Batch update multiple field options in a cloned config
 * 
 * @param config - The form config to update (should be a clone)
 * @param updates - Map of field names to their new options
 */
export function batchUpdateFieldOptions(
  config: FormDrawerConfig,
  updates: Record<string, Array<{ value: string; label: string }>>
): void {
  for (const section of config.detailedSections) {
    for (const field of section.fields) {
      if (field.name in updates) {
        field.options = updates[field.name];
      }
    }
  }
}

/**
 * Update a specific field in a cloned config
 * Useful for setting callbacks or other non-option properties
 * 
 * @param config - The form config to update (should be a clone)
 * @param fieldName - The name of the field to update
 * @param update - Partial field config to merge
 */
export function updateField(
  config: FormDrawerConfig,
  fieldName: string,
  update: Partial<FormFieldConfig>
): void {
  for (const section of config.detailedSections) {
    const field = section.fields.find(f => f.name === fieldName);
    if (field) {
      Object.assign(field, update);
      return;
    }
  }
}
