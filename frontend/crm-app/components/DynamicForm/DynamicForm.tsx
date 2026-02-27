"use client";

import { useFormSchema } from '@/lib/queries/useFormsV2';
import { Loader2, Edit3 } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { FieldRenderer } from './FieldRenderer';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface DynamicFormProps {
  entityType: 'lead' | 'contact' | 'company' | 'deal';
  formType?: 'create' | 'edit' | 'quick_add' | 'web_form';
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isSubmitting?: boolean;
  showEditLayout?: boolean;
  activeSection?: string; // For sidebar navigation
}

export function DynamicForm({
  entityType,
  formType = 'create',
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  showEditLayout = true,
  activeSection,
}: DynamicFormProps) {
  const router = useRouter();
  
  const { data: formSchema, isLoading, error } = useFormSchema(entityType, formType);

  const handleEditLayout = () => {
    router.push(`/sales-v2/${entityType}s/layout`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-sm text-muted-foreground">
          Loading form...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load form: {error.message}
        </p>
      </div>
    );
  }

  if (!formSchema) {
    return (
      <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          No form configuration found for {entityType}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showEditLayout && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditLayout}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Layout
          </Button>
        </div>
      )}

      {formSchema.schema.sections
        .filter((section) => !activeSection || section.id === activeSection)
        .map((section) => (
        <div
          key={section.id}
          className="space-y-4"
        >
          <div className="pb-3">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {section.description}
              </p>
            )}
          </div>

          <div
            className={`grid gap-4`}
            style={{
              gridTemplateColumns: `repeat(${section.columns || 1}, minmax(0, 1fr))`,
            }}
          >
            {section.fields.map((field, fieldIdx) => {
              const colSpan = {
                half: 1,
                full: section.columns || 1,
                third: 1,
                'two-thirds': Math.max(1, Math.floor((section.columns || 1) * 2 / 3)),
              }[field.width || 'full'];

              return (
                <div
                  key={`${section.id}-${field.name}-${fieldIdx}`}
                  style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
                >
                  <FieldRenderer
                    field={field}
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                    isSubmitting={isSubmitting}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
