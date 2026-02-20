"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Sliders,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  useCustomFields,
  useUpdateCustomField,
  useDeleteCustomField,
  type CustomFieldDefinition,
} from "@/lib/queries/useCustomFields";
import { usePermission, CONTACTS_WRITE, CONTACTS_DELETE } from "@/lib/permissions";
import { CustomFieldFormModal } from "./CustomFieldFormModal";

const ENTITY_TYPES = [
  { value: "all", label: "All Entities" },
  { value: "contact", label: "Contacts" },
  { value: "company", label: "Companies" },
  { value: "deal", label: "Deals" },
  { value: "lead", label: "Leads" },
];

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Text Area",
  number: "Number",
  decimal: "Decimal",
  date: "Date",
  datetime: "Date & Time",
  checkbox: "Checkbox",
  select: "Dropdown",
  multi_select: "Multi-Select",
  email: "Email",
  phone: "Phone",
  url: "URL",
};

export default function CustomFieldsSettings() {
  const { can } = usePermission();
  const canWrite = can(CONTACTS_WRITE);
  const canDelete = can(CONTACTS_DELETE);

  const { data: customFields = [], isLoading } = useCustomFields();
  const updateCustomField = useUpdateCustomField();
  const deleteCustomField = useDeleteCustomField();

  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldDefinition | null>(null);

  const filteredFields = useMemo(() => {
    return customFields.filter((field) => {
      const matchesSearch =
        field.name.toLowerCase().includes(search.toLowerCase()) ||
        field.label.toLowerCase().includes(search.toLowerCase());
      const matchesEntity = filterEntity === "all" || field.entityType === filterEntity;
      const matchesActive =
        filterActive === "all" ||
        (filterActive === "active" && field.isActive) ||
        (filterActive === "inactive" && !field.isActive);
      return matchesSearch && matchesEntity && matchesActive;
    });
  }, [customFields, search, filterEntity, filterActive]);

  const handleOpenCreate = useCallback(() => {
    setEditingField(null);
    setShowFormModal(true);
  }, []);

  const handleOpenEdit = useCallback((field: CustomFieldDefinition) => {
    setEditingField(field);
    setShowFormModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowFormModal(false);
    setEditingField(null);
  }, []);

  const handleToggleActive = async (field: CustomFieldDefinition) => {
    await updateCustomField.mutateAsync({
      id: field.id,
      data: { isActive: !field.isActive },
    });
  };

  const handleDelete = async () => {
    if (!fieldToDelete) return;
    await deleteCustomField.mutateAsync(fieldToDelete.id);
    setFieldToDelete(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Custom Fields
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define custom fields for contacts, companies, deals, and leads
          </p>
        </div>
        {canWrite && (
          <Button onClick={handleOpenCreate} size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New Custom Field
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Entity Filter */}
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
        >
          {ENTITY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Custom Fields List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredFields.length === 0 ? (
        <div className="text-center py-12">
          <Sliders className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {search || filterEntity !== "all" || filterActive !== "all"
              ? "No custom fields found"
              : "No custom fields yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {search || filterEntity !== "all" || filterActive !== "all"
              ? "Try adjusting your filters"
              : "Create custom fields to extend your entities with additional data"}
          </p>
          {canWrite && !search && filterEntity === "all" && filterActive === "all" && (
            <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Custom Field
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Field Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredFields.map((field) => (
                  <tr
                    key={field.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {field.label}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {field.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-normal">
                        {FIELD_TYPE_LABELS[field.fieldType] || field.fieldType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground capitalize">
                        {field.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => canWrite && handleToggleActive(field)}
                        disabled={!canWrite}
                        className={`flex items-center gap-1.5 text-sm ${
                          canWrite ? "cursor-pointer" : "cursor-not-allowed"
                        }`}
                      >
                        {field.isActive ? (
                          <>
                            <Eye className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{field.order}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canWrite && (
                          <button
                            onClick={() => handleOpenEdit(field)}
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setFieldToDelete(field)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Count */}
      {!isLoading && filteredFields.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredFields.length} of {customFields.length} custom field
          {customFields.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <CustomFieldFormModal
          isOpen={showFormModal}
          onClose={handleCloseModal}
          editingField={editingField}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!fieldToDelete}
        onClose={() => setFieldToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Custom Field"
        description={
          fieldToDelete
            ? `Are you sure you want to delete "${fieldToDelete.label}"? This will remove the field definition, but existing data will be preserved.`
            : ""
        }
        confirmLabel="Delete"
        confirmClassName="bg-destructive hover:bg-destructive/90 text-white"
      />
    </div>
  );
}
