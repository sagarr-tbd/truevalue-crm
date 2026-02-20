"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateCustomField,
  useUpdateCustomField,
  type CustomFieldDefinition,
  type CustomFieldDefinitionFormData,
} from "@/lib/queries/useCustomFields";

interface CustomFieldFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingField: CustomFieldDefinition | null;
}

const ENTITY_TYPES = [
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "deal", label: "Deal" },
  { value: "lead", label: "Lead" },
];

const FIELD_TYPES = [
  { value: "text", label: "Text", description: "Single line text input" },
  { value: "textarea", label: "Text Area", description: "Multi-line text input" },
  { value: "email", label: "Email", description: "Email address" },
  { value: "phone", label: "Phone", description: "Phone number" },
  { value: "url", label: "URL", description: "Website URL" },
  { value: "number", label: "Number", description: "Integer number" },
  { value: "decimal", label: "Decimal", description: "Decimal number" },
  { value: "date", label: "Date", description: "Date picker" },
  { value: "datetime", label: "Date & Time", description: "Date and time picker" },
  { value: "checkbox", label: "Checkbox", description: "True/false toggle" },
  { value: "select", label: "Dropdown", description: "Single selection from options" },
  { value: "multi_select", label: "Multi-Select", description: "Multiple selections" },
];

// Reserved field names for each entity type (matches backend validation)
const RESERVED_FIELDS: Record<string, string[]> = {
  contact: [
    'id', 'org_id', 'owner_id', 'first_name', 'last_name', 'full_name',
    'email', 'phone', 'mobile', 'title', 'department', 'description',
    'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
    'linkedin_url', 'twitter_url', 'facebook_url', 'birth_date', 'lead_source',
    'do_not_call', 'do_not_email', 'opt_out', 'custom_fields', 'tags',
    'created_at', 'updated_at', 'deleted_at', 'is_deleted'
  ],
  company: [
    'id', 'org_id', 'owner_id', 'name', 'website', 'industry', 'size',
    'phone', 'email', 'address_line1', 'address_line2', 'city', 'state',
    'postal_code', 'country', 'description', 'annual_revenue', 'employee_count',
    'linkedin_url', 'twitter_url', 'facebook_url', 'custom_fields', 'tags',
    'parent_company', 'created_at', 'updated_at'
  ],
  lead: [
    'id', 'org_id', 'owner_id', 'first_name', 'last_name', 'full_name',
    'email', 'phone', 'mobile', 'company_name', 'title', 'website',
    'address_line1', 'city', 'state', 'postal_code', 'country', 'status',
    'source', 'source_detail', 'score', 'description', 'custom_fields',
    'tags', 'converted_at', 'converted_contact_id', 'converted_company_id',
    'converted_deal_id', 'converted_by', 'disqualified_reason', 'disqualified_at',
    'last_activity_at', 'last_contacted_at', 'created_at', 'updated_at',
    'deleted_at', 'is_deleted'
  ],
  deal: [
    'id', 'org_id', 'owner_id', 'name', 'pipeline', 'stage', 'value',
    'currency', 'probability', 'weighted_value', 'expected_close_date',
    'actual_close_date', 'stage_entered_at', 'status', 'loss_reason',
    'loss_notes', 'contact', 'company', 'converted_from_lead_id', 'description',
    'custom_fields', 'tags', 'line_items', 'last_activity_at', 'activity_count',
    'created_at', 'updated_at', 'deleted_at', 'is_deleted'
  ]
};

interface OptionItem {
  value: string;
  label: string;
  color?: string;
}

export function CustomFieldFormModal({
  isOpen,
  onClose,
  editingField,
}: CustomFieldFormModalProps) {
  const createCustomField = useCreateCustomField();
  const updateCustomField = useUpdateCustomField();

  const [form, setForm] = useState<CustomFieldDefinitionFormData>({
    entityType: "contact",
    name: "",
    label: "",
    fieldType: "text",
    isRequired: false,
    isUnique: false,
    defaultValue: "",
    placeholder: "",
    helpText: "",
    options: [],
    validation: {},
    order: 0,
    isActive: true,
  });

  const [options, setOptions] = useState<OptionItem[]>([]);
  const [newOption, setNewOption] = useState({ value: "", label: "" });
  const [validationRules, setValidationRules] = useState({
    min: "",
    max: "",
    minLength: "",
    maxLength: "",
    pattern: "",
  });
  const [fieldNameError, setFieldNameError] = useState<string>("");

  useEffect(() => {
    if (editingField) {
      setForm({
        entityType: editingField.entityType,
        name: editingField.name,
        label: editingField.label,
        fieldType: editingField.fieldType,
        isRequired: editingField.isRequired,
        isUnique: editingField.isUnique,
        defaultValue: editingField.defaultValue || "",
        placeholder: editingField.placeholder || "",
        helpText: editingField.helpText || "",
        options: editingField.options || [],
        validation: editingField.validation || {},
        order: editingField.order,
        isActive: editingField.isActive,
      });
      setOptions(editingField.options || []);
      setValidationRules({
        min: editingField.validation?.min?.toString() || "",
        max: editingField.validation?.max?.toString() || "",
        minLength: editingField.validation?.minLength?.toString() || "",
        maxLength: editingField.validation?.maxLength?.toString() || "",
        pattern: editingField.validation?.pattern || "",
      });
      setFieldNameError("");
    } else {
      // Reset form for new field
      setForm({
        entityType: "contact",
        name: "",
        label: "",
        fieldType: "text",
        isRequired: false,
        isUnique: false,
        defaultValue: "",
        placeholder: "",
        helpText: "",
        options: [],
        validation: {},
        order: 0,
        isActive: true,
      });
      setOptions([]);
      setValidationRules({
        min: "",
        max: "",
        minLength: "",
        maxLength: "",
        pattern: "",
      });
      setFieldNameError("");
    }
  }, [editingField, isOpen]);

  const handleAddOption = () => {
    if (!newOption.value || !newOption.label) return;
    setOptions([...options, { ...newOption }]);
    setNewOption({ value: "", label: "" });
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");
  };

  const checkFieldNameConflict = (name: string, entityType: string) => {
    const reservedFields = RESERVED_FIELDS[entityType] || [];
    if (reservedFields.includes(name.toLowerCase())) {
      return `Field name '${name}' conflicts with a built-in ${entityType} field. Try '${name}_custom' instead.`;
    }
    return "";
  };

  const handleLabelChange = (label: string) => {
    const generatedName = !editingField ? generateFieldName(label) : form.name;
    setForm((prev) => ({
      ...prev,
      label,
      name: generatedName,
    }));
    
    if (!editingField) {
      const error = checkFieldNameConflict(generatedName, form.entityType);
      setFieldNameError(error);
    }
  };

  const handleFieldNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    const error = checkFieldNameConflict(name, form.entityType);
    setFieldNameError(error);
  };

  const buildValidation = () => {
    const validation: Record<string, any> = {};
    if (validationRules.min) validation.min = parseFloat(validationRules.min);
    if (validationRules.max) validation.max = parseFloat(validationRules.max);
    if (validationRules.minLength) validation.minLength = parseInt(validationRules.minLength);
    if (validationRules.maxLength) validation.maxLength = parseInt(validationRules.maxLength);
    if (validationRules.pattern) validation.pattern = validationRules.pattern;
    return validation;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = buildValidation();
    const data: CustomFieldDefinitionFormData = {
      ...form,
      options: ["select", "multi_select"].includes(form.fieldType) ? options : undefined,
      validation: Object.keys(validation).length > 0 ? validation : undefined,
    };

    try {
      if (editingField) {
        await updateCustomField.mutateAsync({
          id: editingField.id,
          data,
        });
      } else {
        await createCustomField.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save custom field:", error);
    }
  };

  const needsOptions = ["select", "multi_select"].includes(form.fieldType);
  const needsMinMax = ["number", "decimal"].includes(form.fieldType);
  const needsLength = ["text", "textarea"].includes(form.fieldType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            {editingField ? "Edit Custom Field" : "Create Custom Field"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Entity Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Entity Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={form.entityType}
                    onChange={(e) => setForm({ ...form, entityType: e.target.value as any })}
                    disabled={!!editingField}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background disabled:opacity-50"
                    required
                  >
                    {ENTITY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Field Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={form.fieldType}
                    onChange={(e) => setForm({ ...form, fieldType: e.target.value as any })}
                    disabled={!!editingField}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background disabled:opacity-50"
                    required
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {FIELD_TYPES.find((t) => t.value === form.fieldType)?.description}
                  </p>
                </div>
              </div>

              {/* Label */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Label <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="e.g., Customer Tier"
                  required
                />
                <p className="text-xs text-muted-foreground">Display name shown in forms</p>
              </div>

              {/* Field Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Field Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFieldNameChange(e.target.value)}
                  placeholder="e.g., customer_tier"
                  disabled={!!editingField}
                  className={`font-mono ${fieldNameError ? 'border-destructive' : ''}`}
                  required
                />
                {fieldNameError && (
                  <p className="text-sm text-destructive">{fieldNameError}</p>
                )}
                {!fieldNameError && (
                  <p className="text-xs text-muted-foreground">
                    Internal name (lowercase, underscores only){editingField && " - cannot be changed"}
                  </p>
                )}
              </div>

              {/* Placeholder */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Placeholder</label>
                <Input
                  value={form.placeholder}
                  onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                  placeholder="e.g., Select tier..."
                />
              </div>

              {/* Help Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Help Text</label>
                <Input
                  value={form.helpText}
                  onChange={(e) => setForm({ ...form, helpText: e.target.value })}
                  placeholder="e.g., Choose the customer tier level"
                />
              </div>
            </div>

            {/* Options (for select/multi-select) */}
            {needsOptions && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Options</h3>

                {/* Existing Options */}
                {options.length > 0 && (
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <span className="text-sm font-mono">{option.value}</span>
                          <span className="text-sm">{option.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-1 hover:bg-destructive/10 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Option */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Value (e.g., gold)"
                    value={newOption.value}
                    onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Label (e.g., Gold)"
                    value={newOption.label}
                    onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddOption}
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Validation Rules */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Validation</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Min/Max for numbers */}
                {needsMinMax && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum Value</label>
                      <Input
                        type="number"
                        step={form.fieldType === "decimal" ? "0.01" : "1"}
                        value={validationRules.min}
                        onChange={(e) =>
                          setValidationRules({ ...validationRules, min: e.target.value })
                        }
                        placeholder="e.g., 0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum Value</label>
                      <Input
                        type="number"
                        step={form.fieldType === "decimal" ? "0.01" : "1"}
                        value={validationRules.max}
                        onChange={(e) =>
                          setValidationRules({ ...validationRules, max: e.target.value })
                        }
                        placeholder="e.g., 100"
                      />
                    </div>
                  </>
                )}

                {/* Min/Max Length for text */}
                {needsLength && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Min Length</label>
                      <Input
                        type="number"
                        value={validationRules.minLength}
                        onChange={(e) =>
                          setValidationRules({ ...validationRules, minLength: e.target.value })
                        }
                        placeholder="e.g., 3"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Length</label>
                      <Input
                        type="number"
                        value={validationRules.maxLength}
                        onChange={(e) =>
                          setValidationRules({ ...validationRules, maxLength: e.target.value })
                        }
                        placeholder="e.g., 100"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Pattern for text fields */}
              {needsLength && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pattern (Regex)</label>
                  <Input
                    value={validationRules.pattern}
                    onChange={(e) =>
                      setValidationRules({ ...validationRules, pattern: e.target.value })
                    }
                    placeholder="e.g., ^[A-Z]+$"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Regular expression for validation
                  </p>
                </div>
              )}
            </div>

            {/* Flags */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Settings</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">Active (show in forms)</span>
                </label>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Order</label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCustomField.isPending || updateCustomField.isPending || !!fieldNameError}
            >
              {editingField ? "Save Changes" : "Create Field"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
