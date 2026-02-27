"use client";

import { useEffect, useMemo, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown } from 'lucide-react';
import { FormSectionField } from '@/lib/api/formsV2';
import { apiClient } from '@/lib/api/client';

interface FieldRendererProps {
  field: FormSectionField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isSubmitting?: boolean;
}

interface LookupOption {
  id: string;
  label: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

// Separate component for lookup fields to properly use hooks
function LookupField({
  field,
  register,
  isSubmitting,
  isReadonly,
  isRequired,
  validationRules,
  errorClasses,
  baseInputClasses,
  fieldName,
  error,
}: {
  field: FormSectionField;
  register: UseFormRegister<any>;
  isSubmitting: boolean;
  isReadonly: boolean;
  isRequired: boolean;
  validationRules: any;
  errorClasses: string;
  baseInputClasses: string;
  fieldName: string;
  error: string | undefined;
}) {
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Type guard to check if options is a lookup config object
  const isLookupOptions = (opts: any): opts is { entity?: string; api_endpoint?: string; data_path?: string; display_field?: string; value_field?: string } => {
    return opts && typeof opts === 'object' && !Array.isArray(opts) && ('entity' in opts || 'api_endpoint' in opts);
  };
  
  const lookupConfig = isLookupOptions(field.options) ? field.options : {};
  const entity = lookupConfig.entity || 'user';
  let apiEndpoint = lookupConfig.api_endpoint;
  const dataPath = lookupConfig.data_path || 'options';
  const displayField = lookupConfig.display_field || 'label';
  const valueField = lookupConfig.value_field || 'id';
  
  useEffect(() => {
    const fetchOptions = async () => {
      if (!apiEndpoint) return;
      
      setLoading(true);
      try {
        // Replace __ORG_ID__ placeholder with actual org_id from user token
        const getCookie = (name: string) => {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name) return decodeURIComponent(value);
          }
          return null;
        };
        
        const token = getCookie('access_token');
        if (token && apiEndpoint.includes('__ORG_ID__')) {
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          apiEndpoint = apiEndpoint.replace('__ORG_ID__', decoded.org_id);
        }
        
        const response = await apiClient.get<any>(apiEndpoint);
        if (response.data) {
          const dataArray = dataPath.split('.').reduce((obj, key) => obj?.[key], response.data) || [];
          setOptions(dataArray.map((item: any) => ({
            id: item[valueField],
            label: item[displayField] || item[valueField] || 'Unknown',
            ...item
          })));
        }
      } catch (error) {
        console.error(`Failed to fetch ${entity} options:`, error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [apiEndpoint, entity, dataPath, displayField, valueField]);
  
  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const search = searchTerm.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(search) ||
      option.email?.toLowerCase().includes(search) ||
      option.role?.toLowerCase().includes(search)
    );
  }, [options, searchTerm]);
  
  return (
    <>
      <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
        {field.label}
        {isRequired && <span className="text-destructive">*</span>}
      </label>
      
      {loading ? (
        <div className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          Loading {entity}s...
        </div>
      ) : options.length > 0 ? (
        <div className="space-y-2">
          {/* Search Input */}
          {options.length > 5 && (
            <Input
              type="text"
              placeholder={`Search ${entity}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-sm"
              disabled={isSubmitting || isReadonly}
            />
          )}
          
          {/* Dropdown */}
          <div className="relative">
            <select
              id={fieldName}
              className={`${baseInputClasses} ${errorClasses} appearance-none pr-10 cursor-pointer hover:border-primary/50 transition-colors`}
              disabled={isSubmitting || isReadonly}
              {...register(fieldName, validationRules)}
            >
              <option value="" className="text-muted-foreground">
                {field.placeholder || `Select ${entity}`}
              </option>
              {filteredOptions.map((option) => (
                <option 
                  key={option.id} 
                  value={option.id}
                  className="py-2"
                >
                  {option.label}
                  {option.email && ` (${option.email})`}
                  {option.role && ` - ${option.role}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          
          {/* Results count when searching */}
          {searchTerm && (
            <p className="text-xs text-muted-foreground">
              {filteredOptions.length} of {options.length} {entity}(s) found
            </p>
          )}
        </div>
      ) : (
        <div className="w-full rounded-lg border border-dashed border-input bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground text-center">
          No {entity}s available
        </div>
      )}
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.help_text && !error && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </>
  );
}

export function FieldRenderer({
  field,
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
}: FieldRendererProps) {
  const fieldName = `dynamicFields.${field.name}`;
  const watchedValue = watch(fieldName);
  
  const dynamicFieldsErrors = errors.dynamicFields as Record<string, { message?: string }> | undefined;
  const error = dynamicFieldsErrors?.[field.name]?.message;

  const isRequired = field.is_required || false;
  const isReadonly = field.readonly || false;

  // Apply default value on mount if field is empty and default_value exists
  useEffect(() => {
    if (field.default_value !== undefined && field.default_value !== null && field.default_value !== '') {
      const currentValue = watch(fieldName);
      
      // Only set default if current value is empty/undefined
      if (currentValue === undefined || currentValue === null || currentValue === '') {
        setValue(fieldName, field.default_value, { shouldValidate: false });
      }
    }
  }, [field.name, field.default_value, fieldName, setValue, watch]);

  // Evaluate conditional visibility
  const isVisible = useMemo(() => {
    if (!field.conditional || !field.conditional.show_if) {
      return true; // No conditions = always visible
    }

    const condition = field.conditional.show_if;
    const conditionFieldName = `dynamicFields.${condition.field}`;
    const conditionFieldValue = watch(conditionFieldName);
    
    // Evaluate based on operator
    switch (condition.operator) {
      case 'equals':
      case '==':
        return conditionFieldValue === condition.value;
      
      case 'not_equals':
      case '!=':
        return conditionFieldValue !== condition.value;
      
      case 'contains':
        return String(conditionFieldValue || '').includes(String(condition.value));
      
      case 'not_contains':
        return !String(conditionFieldValue || '').includes(String(condition.value));
      
      case 'greater_than':
      case '>':
        return Number(conditionFieldValue) > Number(condition.value);
      
      case 'less_than':
      case '<':
        return Number(conditionFieldValue) < Number(condition.value);
      
      case 'is_empty':
        return !conditionFieldValue || conditionFieldValue === '';
      
      case 'is_not_empty':
        return conditionFieldValue && conditionFieldValue !== '';
      
      default:
        return true; // Unknown operator = show field
    }
  }, [field.conditional, watch]);

  // Don't render if field should be hidden
  if (!isVisible) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[FieldRenderer] ${field.name}:`, {
      label: field.label,
      isRequired: isRequired,
      fieldType: field.field_type,
      defaultValue: field.default_value,
      isVisible: isVisible,
      conditional: field.conditional,
    });
  }

  const validationRules = buildValidationRules(field, isRequired);

  const baseInputClasses =
    "w-full rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-muted-foreground/50 transition-all duration-200";

  const errorClasses = error ? "border-destructive" : "";

  return (
    <div className="space-y-2">
      {renderFieldByType()}
    </div>
  );

  function renderFieldByType() {
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return renderTextInput();

      case 'textarea':
        return renderTextarea();

      case 'number':
      case 'decimal':
      case 'currency':
      case 'percentage':
        return renderNumberInput();

      case 'date':
        return renderDateInput();

      case 'datetime':
        return renderDateTimeInput();

      case 'checkbox':
      case 'boolean':
        return renderCheckbox();

      case 'select':
        return renderSelect();

      case 'multi_select':
        return renderMultiSelect();

      case 'lookup':
        return renderLookup();

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Unsupported field type: {field.field_type}
          </div>
        );
    }
  }

  function renderTextInput() {
    const inputType = field.field_type === 'phone' ? 'tel' 
      : field.field_type === 'url' ? 'url' 
      : field.field_type;

    return (
      <>
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
        </label>
        <Input
          id={fieldName}
          type={inputType}
          placeholder={field.placeholder || ''}
          disabled={isSubmitting || isReadonly}
          value={watchedValue || ''}
          className={errorClasses}
          {...register(fieldName, validationRules)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.help_text && !error && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </>
    );
  }

  function renderTextarea() {
    return (
      <>
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
        </label>
        <Textarea
          id={fieldName}
          placeholder={field.placeholder || ''}
          disabled={isSubmitting || isReadonly}
          value={watchedValue || ''}
          rows={4}
          className={errorClasses}
          {...register(fieldName, validationRules)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.help_text && !error && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </>
    );
  }

  function renderNumberInput() {
    const step = field.field_type === 'decimal' || field.field_type === 'currency' ? '0.01' : '1';
    const prefix = field.field_type === 'currency' 
      ? (field.options as any)?.currency === 'USD' ? '$' : '' 
      : '';
    const suffix = field.field_type === 'percentage' ? '%' : '';

    return (
      <>
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
        </label>
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            id={fieldName}
            type="number"
            step={step}
            placeholder={field.placeholder || ''}
            disabled={isSubmitting || isReadonly}
            className={`${errorClasses} ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-7' : ''}`}
            {...register(fieldName, {
              ...validationRules,
              setValueAs: (value) => {
                if (value === '' || value === null) return undefined;
                const num = field.field_type === 'decimal' || field.field_type === 'currency'
                  ? parseFloat(value)
                  : parseInt(value, 10);
                return isNaN(num) ? undefined : num;
              },
            })}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.help_text && !error && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </>
    );
  }

  function renderDateInput() {
    return (
      <>
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
        </label>
        <Input
          id={fieldName}
          type="date"
          placeholder={field.placeholder || ''}
          disabled={isSubmitting || isReadonly}
          value={watchedValue || ''}
          className={errorClasses}
          {...register(fieldName, validationRules)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.help_text && !error && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </>
    );
  }

  function renderDateTimeInput() {
    return (
      <>
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
        </label>
        <Input
          id={fieldName}
          type="datetime-local"
          placeholder={field.placeholder || ''}
          disabled={isSubmitting || isReadonly}
          value={watchedValue || ''}
          className={errorClasses}
          {...register(fieldName, validationRules)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.help_text && !error && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </>
    );
  }

  function renderCheckbox() {
    return (
      <div className="flex items-center gap-2">
        <input
          id={fieldName}
          type="checkbox"
          disabled={isSubmitting || isReadonly}
          className="h-4 w-4 rounded border-input"
          {...register(fieldName)}
        />
        <label htmlFor={fieldName} className="text-sm font-medium">
          {field.label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </label>
        {field.help_text && (
          <p className="text-xs text-muted-foreground ml-2">{field.help_text}</p>
        )}
      </div>
    );
  }

  function renderSelect() {
    const options = (field.options as any)?.options || [];

    return (
      <>
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
        </label>
        <div className="relative">
          <select
            id={fieldName}
            className={`${baseInputClasses} ${errorClasses} h-11 px-3 pr-10 appearance-none`}
            disabled={isSubmitting || isReadonly}
            value={watchedValue || ''}
            {...register(fieldName, validationRules)}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.help_text && !error && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </>
    );
  }

  function renderMultiSelect() {
    const options = (field.options as any)?.options || [];

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setValue(fieldName, selectedOptions);
    };

    return (
      <>
        <label htmlFor={fieldName} className="text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
        </label>
        <select
          id={fieldName}
          multiple
          className={`${baseInputClasses} ${errorClasses} min-h-[120px] px-3 py-2`}
          disabled={isSubmitting || isReadonly}
          value={watchedValue || []}
          onChange={handleMultiSelectChange}
        >
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple options</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.help_text && !error && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </>
    );
  }

  function renderLookup() {
    return (
      <LookupField
        field={field}
        register={register}
        isSubmitting={isSubmitting}
        isReadonly={isReadonly}
        isRequired={isRequired}
        validationRules={validationRules}
        errorClasses={errorClasses}
        baseInputClasses={baseInputClasses}
        fieldName={fieldName}
        error={error}
      />
    );
  }
}

function buildValidationRules(field: FormSectionField, isRequired: boolean) {
  const rules: any = {};

  if (isRequired) {
    rules.required = `${field.label} is required`;
  }

  const validationRules = field.validation_rules || {};

  if (process.env.NODE_ENV === 'development') {
    console.log(`[buildValidationRules] ${field.name}:`, {
      isRequired,
      validationRules,
      builtRules: rules,
    });
  }

  if (validationRules.pattern) {
    rules.pattern = {
      value: new RegExp(validationRules.pattern as string),
      message: (validationRules as any).message || `Invalid ${field.label} format`,
    };
  }

  if ((validationRules as any).minLength) {
    rules.minLength = {
      value: (validationRules as any).minLength,
      message: `${field.label} must be at least ${(validationRules as any).minLength} characters`,
    };
  }

  if ((validationRules as any).maxLength) {
    rules.maxLength = {
      value: (validationRules as any).maxLength,
      message: `${field.label} must be at most ${(validationRules as any).maxLength} characters`,
    };
  }

  if ((validationRules as any).min !== undefined) {
    rules.min = {
      value: (validationRules as any).min,
      message: `${field.label} must be at least ${(validationRules as any).min}`,
    };
  }

  if ((validationRules as any).max !== undefined) {
    rules.max = {
      value: (validationRules as any).max,
      message: `${field.label} must be at most ${(validationRules as any).max}`,
    };
  }

  return rules;
}
