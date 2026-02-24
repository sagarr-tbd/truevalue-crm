"use client";
import { useEffect } from "react";
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Loader2 } from "lucide-react";
import { useCustomFields, CustomFieldDefinition } from "@/lib/queries/useCustomFields";

interface CustomFieldsRendererProps {
  entityType: 'contact' | 'company' | 'deal' | 'lead';
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isSubmitting: boolean;
}

/**
 * CustomFieldsRenderer Component
 * 
 * Dynamically renders custom fields for an entity type.
 * Fetches custom field definitions from the API and renders appropriate input controls.
 * Values are stored in the `custom_fields` object on the form.
 */
export function CustomFieldsRenderer({
  entityType,
  register,
  errors,
  watch,
  setValue,
  isSubmitting,
}: CustomFieldsRendererProps) {
  const { data: customFields, isLoading } = useCustomFields(entityType);

  // Filter to only show active custom fields, sorted by order
  const activeCustomFields = customFields
    ?.filter((field) => field.isActive)
    .sort((a, b) => a.order - b.order) || [];

  // Initialize custom_fields object if it doesn't exist
  useEffect(() => {
    const currentCustomFields = watch('customFields');
    if (!currentCustomFields) {
      setValue('customFields', {});
    }
  }, [watch, setValue]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading custom fields...</span>
      </div>
    );
  }

  if (!activeCustomFields || activeCustomFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {activeCustomFields.map((field) => (
        <CustomFieldInput
          key={field.id}
          field={field}
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
}

/**
 * Render a single custom field input
 */
interface CustomFieldInputProps {
  field: CustomFieldDefinition;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isSubmitting: boolean;
}

function CustomFieldInput({
  field,
  register,
  errors,
  watch,
  setValue,
  isSubmitting,
}: CustomFieldInputProps) {
  const fieldName = `customFields.${field.name}`;
  const watchedValue = watch(fieldName);
  const customFieldErrors = errors.customFields as Record<string, { message?: string }> | undefined;
  const error = customFieldErrors?.[field.name]?.message;

  const baseInputClasses =
    "w-full rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-muted-foreground/50 transition-all duration-200";

  // Text, Email, Phone, URL
  if (['text', 'email', 'phone', 'url'].includes(field.fieldType)) {
    const inputType = field.fieldType === 'phone' ? 'tel' : field.fieldType === 'url' ? 'url' : field.fieldType;
    
    return (
      <div className="space-y-2">
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
        </label>
        <Input
          id={fieldName}
          type={inputType}
          placeholder={field.placeholder || ''}
          disabled={isSubmitting}
          value={watchedValue || ''}
          {...register(fieldName, {
            pattern: field.validation?.pattern
              ? {
                  value: new RegExp(field.validation.pattern),
                  message: field.validation.patternMessage || 'Invalid format',
                }
              : undefined,
            minLength: field.validation?.minLength
              ? {
                  value: field.validation.minLength,
                  message: `Must be at least ${field.validation.minLength} characters`,
                }
              : undefined,
            maxLength: field.validation?.maxLength
              ? {
                  value: field.validation.maxLength,
                  message: `Must be at most ${field.validation.maxLength} characters`,
                }
              : undefined,
          })}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helpText && !error && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Textarea
  if (field.fieldType === 'textarea') {
    return (
      <div className="space-y-2">
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
        </label>
        <Textarea
          id={fieldName}
          placeholder={field.placeholder || ''}
          disabled={isSubmitting}
          value={watchedValue || ''}
          rows={4}
          {...register(fieldName, {
            minLength: field.validation?.minLength
              ? {
                  value: field.validation.minLength,
                  message: `Must be at least ${field.validation.minLength} characters`,
                }
              : undefined,
            maxLength: field.validation?.maxLength
              ? {
                  value: field.validation.maxLength,
                  message: `Must be at most ${field.validation.maxLength} characters`,
                }
              : undefined,
          })}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helpText && !error && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Number or Decimal
  if (['number', 'decimal'].includes(field.fieldType)) {
    const validations: any = {};

    if (field.validation?.min !== undefined) {
      validations.min = (value: any) => {
        if (value === undefined || value === null) return true;
        return value >= field.validation.min || `Must be at least ${field.validation.min}`;
      };
    }

    if (field.validation?.max !== undefined) {
      validations.max = (value: any) => {
        if (value === undefined || value === null) return true;
        return value <= field.validation.max || `Must be at most ${field.validation.max}`;
      };
    }

    return (
      <div className="space-y-2">
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
        </label>
        <Input
          id={fieldName}
          type="number"
          step={field.fieldType === 'decimal' ? '0.01' : '1'}
          placeholder={field.placeholder || ''}
          disabled={isSubmitting}
          className={error ? 'border-destructive' : ''}
          {...register(fieldName, {
            setValueAs: (value) => {
              if (value === '' || value === null) return undefined;
              const num = field.fieldType === 'decimal' ? parseFloat(value) : parseInt(value, 10);
              return isNaN(num) ? undefined : num;
            },
            validate: Object.keys(validations).length > 0 ? validations : undefined,
          })}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helpText && !error && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Date
  if (field.fieldType === 'date') {
    return (
      <div className="space-y-2">
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
        </label>
        <Input
          id={fieldName}
          type="date"
          placeholder={field.placeholder || ''}
          disabled={isSubmitting}
          value={watchedValue || ''}
          {...register(fieldName)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helpText && !error && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // DateTime
  if (field.fieldType === 'datetime') {
    return (
      <div className="space-y-2">
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
        </label>
        <Input
          id={fieldName}
          type="datetime-local"
          placeholder={field.placeholder || ''}
          disabled={isSubmitting}
          value={watchedValue || ''}
          {...register(fieldName)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helpText && !error && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Checkbox
  if (field.fieldType === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <input
          id={fieldName}
          type="checkbox"
          disabled={isSubmitting}
          className="h-4 w-4 rounded border-input"
          {...register(fieldName)}
        />
        <label htmlFor={fieldName} className="text-sm font-medium">
          {field.label}
        </label>
        {field.helpText && (
          <p className="text-xs text-muted-foreground ml-2">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Select (Dropdown)
  if (field.fieldType === 'select') {
    return (
      <div className="space-y-2">
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
        </label>
        <div className="relative">
          <select
            id={fieldName}
            className={`${baseInputClasses} h-11 px-3 pr-10 appearance-none`}
            disabled={isSubmitting}
            value={watchedValue || ''}
            {...register(fieldName)}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helpText && !error && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Multi-Select
  if (field.fieldType === 'multi_select') {
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setValue(fieldName, selectedOptions);
    };

    return (
      <div className="space-y-2">
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
        </label>
        <select
          id={fieldName}
          multiple
          className={`${baseInputClasses} min-h-[120px] px-3 py-2`}
          disabled={isSubmitting}
          value={watchedValue || []}
          onChange={handleMultiSelectChange}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple options</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helpText && !error && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  return null;
}
