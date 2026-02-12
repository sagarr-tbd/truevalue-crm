import { ReactNode } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";

export type FormView = "quick" | "detailed";

export type FieldType = 
  | "text" 
  | "email" 
  | "tel" 
  | "number" 
  | "textarea" 
  | "select" 
  | "date" 
  | "time"
  | "datetime-local"
  | "tags" 
  | "profile"
  | "checkbox";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[] | { value: string; label: string }[];
  icon?: ReactNode;
  helperText?: string;
  disabled?: boolean;
}

export interface FieldGroup {
  gridClass: string; // e.g., "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  fields: Array<{
    name: string;
    colSpan?: string; // e.g., "sm:col-span-2"
    isPlaceholder?: boolean; // Empty div for spacing
  }>;
}

export interface FormSection {
  id: string;
  label: string;
  icon: ReactNode;
  fields: FormFieldConfig[];
  layout?: FieldGroup[]; // Optional custom layout groupings
}

export interface QuickFormSection {
  label: string;
  icon: ReactNode;
  fields: string[]; // field names
}

export interface FormDrawerConfig<T = any> {
  entity: string;
  entityIcon: ReactNode;
  schema: any;
  defaultValues: Record<string, any>;
  quickFormFields?: string[]; // Legacy - for backward compatibility
  quickFormSections?: QuickFormSection[]; // New - sections with headers
  detailedSections: FormSection[];
}

export interface FormDrawerProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<T>) => Promise<void>;
  initialData?: Partial<T> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
  config: FormDrawerConfig<T>;
}

export interface FormFieldProps {
  field: FormFieldConfig;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: any;
  isSubmitting: boolean;
}
