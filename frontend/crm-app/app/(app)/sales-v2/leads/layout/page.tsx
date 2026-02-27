"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  GripVertical, Plus, Trash2, Settings, Save, 
  ArrowLeft, Eye, Type, Mail,
  Hash, Calendar, ToggleLeft, List, FileText,
  Phone, Link as LinkIcon, DollarSign, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formsV2Api, type FormDefinition, type FormSectionField } from "@/lib/api/formsV2";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formsV2QueryKeys } from "@/lib/queries/useFormsV2";
import { motion, AnimatePresence } from "framer-motion";

type InlineFieldDefinition = FormSectionField;

interface FormSection {
  id: string;
  title: string;
  description?: string;
  columns: number;
  fields: InlineFieldDefinition[];
}

const FIELD_TYPE_ICONS = {
  text: Type,
  textarea: FileText,
  email: Mail,
  phone: Phone,
  url: LinkIcon,
  number: Hash,
  decimal: Hash,
  currency: DollarSign,
  percentage: Hash,
  date: Calendar,
  datetime: Calendar,
  time: Calendar,
  select: List,
  multi_select: List,
  radio: ToggleLeft,
  checkbox: ToggleLeft,
  boolean: ToggleLeft,
};

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'textarea', label: 'Text Area', icon: FileText },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'url', label: 'URL', icon: LinkIcon },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'decimal', label: 'Decimal', icon: Hash },
  { value: 'currency', label: 'Currency', icon: DollarSign },
  { value: 'percentage', label: 'Percentage', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'datetime', label: 'Date & Time', icon: Calendar },
  { value: 'time', label: 'Time', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'multi_select', label: 'Multi Select', icon: List },
  { value: 'radio', label: 'Radio Buttons', icon: ToggleLeft },
  { value: 'checkbox', label: 'Checkbox', icon: ToggleLeft },
  { value: 'boolean', label: 'Yes/No', icon: ToggleLeft },
];

export default function LeadFormLayoutEditor() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewFieldDialog, setShowNewFieldDialog] = useState(false);
  const [showFieldPropertiesDialog, setShowFieldPropertiesDialog] = useState(false);
  const [targetSectionIndex, setTargetSectionIndex] = useState<number>(0);
  const [editingField, setEditingField] = useState<{
    sectionIndex: number;
    fieldIndex: number;
    field: InlineFieldDefinition;
  } | null>(null);
  
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    field_type: 'text',
    is_required: false,
    is_unique: false,
    is_searchable: true,
    placeholder: '',
    help_text: '',
    options: [] as Array<{ value: string; label: string; color?: string }>,
    validation_rules: {} as Record<string, unknown>,
    default_value: '' as any,
    width: 'full' as 'half' | 'full' | 'third' | 'two-thirds',
    readonly: false,
    conditional: null as { show_if: { field: string; operator: string; value: any } } | null,
  });

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const schema = await formsV2Api.getFormSchema('lead', 'create');
      setFormDefinition(schema as unknown as FormDefinition);
      setSections(schema.schema.sections as FormSection[]);
    } catch {
      toast.error('Failed to load form data');
    }
  };

  const handleCreateField = () => {
    if (!newField.label || !newField.field_type) {
      toast.error('Please provide field label and type');
      return;
    }

    const fieldName = newField.name || newField.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    if (['select', 'multi_select', 'radio'].includes(newField.field_type) && newField.options.length === 0) {
      toast.error('Please add at least one option for this field type');
      return;
    }

    const existingFieldNames = sections.flatMap(s => s.fields.map(f => f.name));
    if (existingFieldNames.includes(fieldName)) {
      toast.error(`Field name "${fieldName}" already exists`);
      return;
    }

    const inlineField: InlineFieldDefinition = {
      name: fieldName,
      label: newField.label,
      field_type: newField.field_type as any,
      is_required: newField.is_required,
      is_unique: newField.is_unique,
      is_searchable: newField.is_searchable,
      placeholder: newField.placeholder || undefined,
      help_text: newField.help_text || undefined,
      default_value: newField.default_value || undefined,
      width: newField.width,
      readonly: newField.readonly,
      conditional: newField.conditional || undefined,
    };

    if (['select', 'multi_select', 'radio'].includes(newField.field_type) && newField.options.length > 0) {
      inlineField.options = newField.options;
    }

    if (Object.keys(newField.validation_rules).length > 0) {
      inlineField.validation_rules = newField.validation_rules;
    }

    const updatedSections = [...sections];
    if (updatedSections.length === 0) {
      updatedSections.push({
        id: `section_${Date.now()}`,
        title: 'General Information',
        columns: 2,
        fields: [inlineField]
      });
    } else {
      const sectionIdx = Math.min(targetSectionIndex, updatedSections.length - 1);
      updatedSections[sectionIdx].fields.push(inlineField);
    }

    setSections(updatedSections);
    
    toast.success(`Field "${newField.label}" created!`);
    setShowNewFieldDialog(false);
    resetNewField();
  };

  const resetNewField = () => {
    setNewField({
      name: '',
      label: '',
      field_type: 'text',
      is_required: false,
      is_unique: false,
      is_searchable: true,
      placeholder: '',
      help_text: '',
      options: [],
      validation_rules: {},
      default_value: '',
      width: 'full',
      readonly: false,
      conditional: null,
    });
  };

  const handleAddOption = () => {
    const newOption = {
      value: `option_${Date.now()}`,
      label: 'New Option',
    };
    setNewField({
      ...newField,
      options: [...newField.options, newOption]
    });
  };

  const handleUpdateOption = (index: number, updates: Partial<{ value: string; label: string; color?: string }>) => {
    const updatedOptions = [...newField.options];
    updatedOptions[index] = { ...updatedOptions[index], ...updates };
    setNewField({
      ...newField,
      options: updatedOptions
    });
  };

  const handleRemoveOption = (index: number) => {
    setNewField({
      ...newField,
      options: newField.options.filter((_, i) => i !== index)
    });
  };

  const handleAddSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      description: 'Section description (optional)',
      columns: 2,
      fields: [],
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveField = (sectionIndex: number, fieldIndex: number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].fields.splice(fieldIndex, 1);
    setSections(updatedSections);
  };

  const handleEditFieldProperties = (sectionIndex: number, fieldIndex: number) => {
    const field = sections[sectionIndex].fields[fieldIndex];
    setEditingField({
      sectionIndex,
      fieldIndex,
      field: { ...field },
    });
    setShowFieldPropertiesDialog(true);
  };

  const handleSaveFieldProperties = () => {
    if (!editingField) return;

    const updatedSections = [...sections];
    updatedSections[editingField.sectionIndex].fields[editingField.fieldIndex] = editingField.field;
    setSections(updatedSections);
    
    setEditingField(null);
    setShowFieldPropertiesDialog(false);
    toast.success('Field properties updated');
  };

  const handleDragEnd = (result: {
    source: { index: number; droppableId: string };
    destination: { index: number; droppableId: string } | null | undefined;
  }) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      const sectionId = source.droppableId;
      const sectionIndex = sections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;

      const updatedSections = [...sections];
      const newFields = Array.from(updatedSections[sectionIndex].fields);
      const [removed] = newFields.splice(source.index, 1);
      newFields.splice(destination.index, 0, removed);
      updatedSections[sectionIndex].fields = newFields;
      setSections(updatedSections);
    } 
    else {
      const sourceSectionIndex = sections.findIndex(s => s.id === source.droppableId);
      const destSectionIndex = sections.findIndex(s => s.id === destination.droppableId);
      
      if (sourceSectionIndex === -1 || destSectionIndex === -1) return;

      const updatedSections = [...sections];
      
      const sourceFields = Array.from(updatedSections[sourceSectionIndex].fields);
      const [movedField] = sourceFields.splice(source.index, 1);
      updatedSections[sourceSectionIndex].fields = sourceFields;
      
      const destFields = Array.from(updatedSections[destSectionIndex].fields);
      destFields.splice(destination.index, 0, movedField);
      updatedSections[destSectionIndex].fields = destFields;
      
      setSections(updatedSections);
      toast.success(`Moved "${movedField.label}" to ${updatedSections[destSectionIndex].title}`);
    }
  };

  const handleSave = async () => {
    if (!formDefinition) {
      toast.error('No form definition loaded');
      return;
    }

    setIsSaving(true);
    try {
      await formsV2Api.updateFormSchema(formDefinition.id, {
        version: '1.0',
        sections: sections,
      });

      queryClient.invalidateQueries({ 
        queryKey: formsV2QueryKeys.formSchema('lead', 'create')
      });

      toast.success('Form layout saved successfully!');
    } catch {
      toast.error('Failed to save form layout');
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldIcon = (fieldType: string) => {
    return FIELD_TYPE_ICONS[fieldType as keyof typeof FIELD_TYPE_ICONS] || Type;
  };

  const needsOptions = (fieldType: string) => {
    return ['select', 'multi_select', 'radio'].includes(fieldType);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 py-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                Lead Form Layout Editor (V2)
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-xs text-gray-500">Customize your lead form layout</p>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => router.push('/sales-v2/leads')}
                  className="text-xs text-primary hover:text-primary/80 h-auto p-0 -ml-1 sm:ml-0"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back to Leads
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="text-xs text-muted-foreground hidden lg:block">
                {sections.length} section{sections.length !== 1 ? 's' : ''} • {sections.reduce((acc, s) => acc + s.fields.length, 0)} field{sections.reduce((acc, s) => acc + s.fields.length, 0) !== 1 ? 's' : ''}
              </div>
              <Button
                onClick={() => {
                  setTargetSectionIndex(0);
                  setShowNewFieldDialog(true);
                }}
                size="sm"
                className="h-8 text-xs sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">New Field</span>
                <span className="sm:hidden">Field</span>
              </Button>
              <Button
                onClick={handleAddSection}
                variant="outline"
                size="sm"
                className="h-8 text-xs sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">Add Section</span>
                <span className="sm:hidden">Section</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/sales-v2/leads')}
                size="sm"
                className="h-8 hidden md:inline-flex"
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="h-8 text-xs sm:text-sm"
              >
                <Save className="h-4 w-4 mr-1 sm:mr-1.5" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 sm:py-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {sections.map((section, sectionIndex) => (
                <Card key={section.id} className="p-4 bg-card shadow-sm">
                  <div className="mb-3 pb-2 border-b border-border">
                    <Input
                      value={section.title}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sectionIndex].title = e.target.value;
                        setSections(newSections);
                      }}
                      className="text-base font-semibold border-none px-0 focus-visible:ring-0 text-foreground mb-1 h-7"
                      placeholder="Section Title"
                    />
                    <Input
                      value={section.description || ''}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sectionIndex].description = e.target.value;
                        setSections(newSections);
                      }}
                      className="text-xs text-muted-foreground border-none px-0 focus-visible:ring-0 h-6"
                      placeholder="Section description (optional)"
                    />
                  </div>

                  <Droppable droppableId={section.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[60px] rounded-lg transition-all ${
                          snapshot.isDraggingOver 
                            ? 'bg-primary/5 border-2 border-dashed border-primary/40 p-2' 
                            : 'border-2 border-transparent'
                        }`}
                      >
                        {section.fields.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground text-xs">
                            {snapshot.isDraggingOver 
                              ? 'Drop field here to add to this section' 
                              : 'No fields in this section. Click "Add Field Here" below or drag fields from other sections.'}
                          </div>
                        )}

                        {section.fields.map((field, fieldIndex) => {
                          const Icon = getFieldIcon(field.field_type);

                          return (
                            <Draggable
                              key={`${section.id}-${field.name}`}
                              draggableId={`${section.id}-${field.name}`}
                              index={fieldIndex}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`border rounded-md p-2.5 bg-card transition-all ${
                                    snapshot.isDragging 
                                      ? 'shadow-lg ring-2 ring-primary opacity-90' 
                                      : 'shadow-sm hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing hover:text-primary" />
                                    </div>

                                    <Icon className="h-4 w-4 text-muted-foreground" />

                                    <div className="flex-1">
                                      <div className="font-medium text-foreground flex items-center gap-1.5 text-sm">
                                        {field.label}
                                        {field.is_required && <span className="text-destructive text-xs">*</span>}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {field.field_type} • {field.width === 'full' ? 'Full Width' : field.width === 'half' ? '50%' : field.width}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditFieldProperties(sectionIndex, fieldIndex)}
                                        className="text-muted-foreground hover:text-primary h-7 w-7 p-0"
                                      >
                                        <Settings className="h-3.5 w-3.5" />
                                      </Button>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveField(sectionIndex, fieldIndex)}
                                        className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTargetSectionIndex(sectionIndex);
                          setShowNewFieldDialog(true);
                        }}
                        className="text-primary h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Field Here
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                      onClick={() => setSections(sections.filter((_, i) => i !== sectionIndex))}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove Section
                    </Button>
                  </div>
                </Card>
              ))}

              {sections.length === 0 && (
                <div className="lg:col-span-2">
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-3 text-sm">No sections yet</p>
                    <Button onClick={handleAddSection} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Section
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          </DragDropContext>
      </div>

      <AnimatePresence>
        {showNewFieldDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setShowNewFieldDialog(false)}
            />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold truncate">Create New Field</h2>
                      {sections.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Will be added to: <span className="font-medium">{sections[Math.min(targetSectionIndex, sections.length - 1)]?.title}</span>
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewFieldDialog(false)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {sections.length > 1 && (
                    <div>
                      <Label className="text-xs mb-1 block">Add to Section *</Label>
                      <select
                        value={targetSectionIndex}
                        onChange={(e) => setTargetSectionIndex(parseInt(e.target.value))}
                        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm h-8"
                      >
                        {sections.map((section, idx) => (
                          <option key={section.id} value={idx}>
                            {section.title} ({section.fields.length} fields)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Field Label *</Label>
                      <Input
                        value={newField.label}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                        placeholder="e.g., Company Name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Field Name</Label>
                      <Input
                        value={newField.name}
                        onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                        placeholder="e.g., company_name (auto-generated)"
                        className="h-8 text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">Leave empty to auto-generate</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Field Type *</Label>
                    <select
                      value={newField.field_type}
                      onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm h-8"
                    >
                      {FIELD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {needsOptions(newField.field_type) && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs">Options *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddOption}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {newField.options.map((option, index) => (
                          <div key={index} className="flex gap-1.5">
                            <Input
                              value={option.label}
                              onChange={(e) => handleUpdateOption(index, { label: e.target.value })}
                              placeholder="Option label"
                              className="h-8 text-sm flex-1"
                            />
                            <Input
                              value={option.value}
                              onChange={(e) => handleUpdateOption(index, { value: e.target.value })}
                              placeholder="Value"
                              className="h-8 text-sm flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOption(index)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Placeholder</Label>
                      <Input
                        value={newField.placeholder}
                        onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Width</Label>
                      <select
                        value={newField.width}
                        onChange={(e) => setNewField({ ...newField, width: e.target.value as any })}
                        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm h-8"
                      >
                        <option value="full">Full Width</option>
                        <option value="half">Half Width (50%)</option>
                        <option value="third">Third Width (33%)</option>
                        <option value="two-thirds">Two Thirds (66%)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Help Text</Label>
                    <Textarea
                      value={newField.help_text}
                      onChange={(e) => setNewField({ ...newField, help_text: e.target.value })}
                      placeholder="Help text to guide users"
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold">Conditional Visibility (Optional)</Label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newField.conditional !== null}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewField({
                                ...newField,
                                conditional: {
                                  show_if: {
                                    field: '',
                                    operator: 'equals',
                                    value: ''
                                  }
                                }
                              });
                            } else {
                              setNewField({ ...newField, conditional: null });
                            }
                          }}
                          className="rounded border-gray-300 h-3.5 w-3.5"
                        />
                        <span className="text-xs">Enable Conditional</span>
                      </label>
                    </div>

                    {newField.conditional && (
                      <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-muted-foreground">Show this field when:</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs mb-1 block">Field</Label>
                            <select
                              value={newField.conditional.show_if.field}
                              onChange={(e) => setNewField({
                                ...newField,
                                conditional: {
                                  ...newField.conditional!,
                                  show_if: {
                                    ...newField.conditional!.show_if,
                                    field: e.target.value
                                  }
                                }
                              })}
                              className="w-full rounded-md border border-input bg-white px-2 py-1 text-xs h-7"
                            >
                              <option value="">Select field...</option>
                              {sections.flatMap(s => s.fields).map(f => (
                                <option key={f.name} value={f.name}>{f.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">Operator</Label>
                            <select
                              value={newField.conditional.show_if.operator}
                              onChange={(e) => setNewField({
                                ...newField,
                                conditional: {
                                  ...newField.conditional!,
                                  show_if: {
                                    ...newField.conditional!.show_if,
                                    operator: e.target.value
                                  }
                                }
                              })}
                              className="w-full rounded-md border border-input bg-white px-2 py-1 text-xs h-7"
                            >
                              <option value="equals">Equals</option>
                              <option value="not_equals">Not Equals</option>
                              <option value="contains">Contains</option>
                              <option value="not_contains">Not Contains</option>
                              <option value="greater_than">Greater Than</option>
                              <option value="less_than">Less Than</option>
                              <option value="is_empty">Is Empty</option>
                              <option value="is_not_empty">Is Not Empty</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">Value</Label>
                            <Input
                              value={newField.conditional.show_if.value}
                              onChange={(e) => setNewField({
                                ...newField,
                                conditional: {
                                  ...newField.conditional!,
                                  show_if: {
                                    ...newField.conditional!.show_if,
                                    value: e.target.value
                                  }
                                }
                              })}
                              placeholder="Value..."
                              className="h-7 text-xs"
                              disabled={['is_empty', 'is_not_empty'].includes(newField.conditional.show_if.operator)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-3 border-t">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        id="required"
                        checked={newField.is_required}
                        onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
                        className="rounded border-gray-300 h-3.5 w-3.5"
                      />
                      <span className="text-xs">Required</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        id="unique"
                        checked={newField.is_unique}
                        onChange={(e) => setNewField({ ...newField, is_unique: e.target.checked })}
                        className="rounded border-gray-300 h-3.5 w-3.5"
                      />
                      <span className="text-xs">Unique</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        id="searchable"
                        checked={newField.is_searchable}
                        onChange={(e) => setNewField({ ...newField, is_searchable: e.target.checked })}
                        className="rounded border-gray-300 h-3.5 w-3.5"
                      />
                      <span className="text-xs">Searchable</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        id="readonly"
                        checked={newField.readonly}
                        onChange={(e) => setNewField({ ...newField, readonly: e.target.checked })}
                        className="rounded border-gray-300 h-3.5 w-3.5"
                      />
                      <span className="text-xs">Read-only</span>
                    </label>
                  </div>
                </div>

                <div className="p-3 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewFieldDialog(false);
                      resetNewField();
                    }}
                    size="sm"
                    className="h-8"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateField} size="sm" className="h-8">
                    Create Field
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFieldPropertiesDialog && editingField && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setShowFieldPropertiesDialog(false)}
            />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-base sm:text-lg font-semibold truncate flex-1 min-w-0">
                      Edit Field: {editingField.field.label}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFieldPropertiesDialog(false)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Field Label</Label>
                      <Input
                        value={editingField.field.label}
                        onChange={(e) => setEditingField({
                          ...editingField,
                          field: { ...editingField.field, label: e.target.value }
                        })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Width</Label>
                      <select
                        value={editingField.field.width}
                        onChange={(e) => setEditingField({
                          ...editingField,
                          field: { ...editingField.field, width: e.target.value as any }
                        })}
                        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm h-8"
                      >
                        <option value="full">Full Width</option>
                        <option value="half">Half Width (50%)</option>
                        <option value="third">Third Width (33%)</option>
                        <option value="two-thirds">Two Thirds (66%)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Placeholder</Label>
                    <Input
                      value={editingField.field.placeholder || ''}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        field: { ...editingField.field, placeholder: e.target.value }
                      })}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Help Text</Label>
                    <Textarea
                      value={editingField.field.help_text || ''}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        field: { ...editingField.field, help_text: e.target.value }
                      })}
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  {needsOptions(editingField.field.field_type) && editingField.field.options && Array.isArray(editingField.field.options) && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs">Options</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentOptions = Array.isArray(editingField.field.options) ? editingField.field.options : [];
                            setEditingField({
                              ...editingField,
                              field: {
                                ...editingField.field,
                                options: [...currentOptions, { value: `option_${Date.now()}`, label: 'New Option' }]
                              }
                            });
                          }}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {(editingField.field.options as Array<{ value: string; label: string }>).map((option: { value: string; label: string }, index: number) => (
                          <div key={index} className="flex gap-1.5">
                            <Input
                              value={option.label}
                              onChange={(e) => {
                                const currentOptions = editingField.field.options as Array<{ value: string; label: string }>;
                                const newOptions = [...currentOptions];
                                newOptions[index] = { ...newOptions[index], label: e.target.value };
                                setEditingField({
                                  ...editingField,
                                  field: { ...editingField.field, options: newOptions }
                                });
                              }}
                              placeholder="Option label"
                              className="h-8 text-sm flex-1"
                            />
                            <Input
                              value={option.value}
                              onChange={(e) => {
                                const currentOptions = editingField.field.options as Array<{ value: string; label: string }>;
                                const newOptions = [...currentOptions];
                                newOptions[index] = { ...newOptions[index], value: e.target.value };
                                setEditingField({
                                  ...editingField,
                                  field: { ...editingField.field, options: newOptions }
                                });
                              }}
                              placeholder="Value"
                              className="h-8 text-sm flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentOptions = editingField.field.options as Array<{ value: string; label: string }>;
                                const newOptions = [...currentOptions];
                                newOptions.splice(index, 1);
                                setEditingField({
                                  ...editingField,
                                  field: { ...editingField.field, options: newOptions }
                                });
                              }}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        id="edit-required"
                        checked={editingField.field.is_required}
                        onChange={(e) => setEditingField({
                          ...editingField,
                          field: { ...editingField.field, is_required: e.target.checked }
                        })}
                        className="rounded border-gray-300 h-3.5 w-3.5"
                      />
                      <span className="text-xs">Required</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        id="edit-readonly"
                        checked={editingField.field.readonly}
                        onChange={(e) => setEditingField({
                          ...editingField,
                          field: { ...editingField.field, readonly: e.target.checked }
                        })}
                        className="rounded border-gray-300 h-3.5 w-3.5"
                      />
                      <span className="text-xs">Read-only</span>
                    </label>
                  </div>
                </div>

                <div className="p-3 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFieldPropertiesDialog(false);
                      setEditingField(null);
                    }}
                    size="sm"
                    className="h-8"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveFieldProperties} size="sm" className="h-8">
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
