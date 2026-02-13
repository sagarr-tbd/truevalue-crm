"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from "lucide-react";
import type { FormFieldProps } from "./types";

export function FormField({ field, register, errors, watch, isSubmitting }: FormFieldProps) {
  const watchedValue = watch(field.name);
  const error = errors[field.name]?.message as string | undefined;

  const baseInputClasses = "w-full rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-muted-foreground/50 transition-all duration-200";

  // Text, Email, Tel, Number
  if (["text", "email", "tel", "number"].includes(field.type)) {
    return (
      <div className="space-y-2">
        <label htmlFor={field.name} className="text-sm font-medium flex items-center gap-1.5">
          {field.icon}
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </label>
        <Input
          id={field.name}
          type={field.type}
          placeholder={field.placeholder}
          disabled={isSubmitting || field.disabled}
          value={watchedValue || ""}
          {...register(field.name)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helperText && !error && (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        )}
      </div>
    );
  }

  // Textarea
  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <label htmlFor={field.name} className="text-sm font-medium flex items-center gap-1.5">
          {field.icon}
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </label>
        <Textarea
          id={field.name}
          placeholder={field.placeholder}
          disabled={isSubmitting || field.disabled}
          value={watchedValue || ""}
          rows={4}
          {...register(field.name)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helperText && !error && (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        )}
      </div>
    );
  }

  // Select
  if (field.type === "select") {
    const options = Array.isArray(field.options) 
      ? field.options 
      : [];

    // Get the register props and wrap onChange to call custom handler
    const registerProps = register(field.name);
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      // Call the react-hook-form onChange first
      registerProps.onChange(e);
      // Then call custom onChange if provided
      if (field.onChange) {
        field.onChange(e.target.value);
      }
    };

    return (
      <div className="space-y-2">
        <label htmlFor={field.name} className="text-sm font-medium flex items-center gap-1.5">
          {field.icon}
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </label>
        <div className="relative">
          {field.icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {field.icon}
            </div>
          )}
          <select
            id={field.name}
            className={`${baseInputClasses} h-11 ${field.icon ? 'pl-10' : 'pl-3'} pr-10 appearance-none`}
            disabled={isSubmitting || field.disabled}
            value={watchedValue || ""}
            {...registerProps}
            onChange={handleSelectChange}
          >
            <option value="">{field.placeholder || "Select..."}</option>
            {options.map((opt) => {
              const value = typeof opt === "string" ? opt : opt.value;
              const label = typeof opt === "string" ? opt : opt.label;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helperText && !error && (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        )}
      </div>
    );
  }

  // Date, Time, DateTime-Local
  if (["date", "time", "datetime-local"].includes(field.type)) {
    return (
      <div className="space-y-2">
        <label htmlFor={field.name} className="text-sm font-medium flex items-center gap-1.5">
          {field.icon}
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </label>
        <Input
          id={field.name}
          type={field.type}
          placeholder={field.placeholder}
          disabled={isSubmitting || field.disabled}
          value={watchedValue || ""}
          {...register(field.name)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.helperText && !error && (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        )}
      </div>
    );
  }

  // Checkbox
  if (field.type === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={field.name}
          type="checkbox"
          disabled={isSubmitting || field.disabled}
          className="h-4 w-4 rounded border-input"
          {...register(field.name)}
        />
        <label htmlFor={field.name} className="text-sm font-medium">
          {field.label}
        </label>
      </div>
    );
  }

  return null;
}
