"use client";

import { useState, useCallback } from "react";
import {
  Tag as TagIcon,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from "@/lib/queries/useTags";
import type { Tag } from "@/lib/api/tags";
import { usePermission, CONTACTS_WRITE, CONTACTS_DELETE } from "@/lib/permissions";

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#22C55E",
  "#14B8A6", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6",
  "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#6B7280",
];

const ENTITY_TYPES = [
  { value: "all", label: "All Entities" },
  { value: "contact", label: "Contacts" },
  { value: "company", label: "Companies" },
  { value: "deal", label: "Deals" },
  { value: "lead", label: "Leads" },
];

interface TagFormState {
  name: string;
  color: string;
  entity_type: string;
}

const DEFAULT_FORM: TagFormState = { name: "", color: "#3B82F6", entity_type: "all" };

export default function TagManagementSettings() {
  const { can } = usePermission();
  const canWrite = can(CONTACTS_WRITE);
  const canDelete = can(CONTACTS_DELETE);

  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all_filter");
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form, setForm] = useState<TagFormState>(DEFAULT_FORM);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const filteredTags = tags.filter((tag) => {
    const matchesSearch = tag.name.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      filterType === "all_filter" || tag.entity_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleOpenCreate = useCallback(() => {
    setEditingTag(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }, []);

  const handleOpenEdit = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setForm({
      name: tag.name,
      color: tag.color || "#3B82F6",
      entity_type: tag.entity_type || "all",
    });
    setShowForm(true);
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingTag(null);
    setForm(DEFAULT_FORM);
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    if (editingTag) {
      await updateTag.mutateAsync({
        id: editingTag.id,
        data: { name: form.name.trim(), color: form.color, entity_type: form.entity_type },
      });
    } else {
      await createTag.mutateAsync({
        name: form.name.trim(),
        color: form.color,
        entity_type: form.entity_type,
      });
    }
    handleCancel();
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    await deleteTag.mutateAsync(tagToDelete.id);
    setTagToDelete(null);
  };

  const isSaving = createTag.isPending || updateTag.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-primary" />
            Tag Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage tags used to categorize contacts, companies, deals, and leads.
          </p>
        </div>
        {!showForm && canWrite && (
          <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            New Tag
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold">
            {editingTag ? "Edit Tag" : "Create New Tag"}
          </h3>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. VIP, Hot Lead, Partner..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    form.color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {form.color === c && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Entity type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Applies To
            </label>
            <select
              value={form.entity_type}
              onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={!form.name.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingTag ? "Save Changes" : "Create Tag"}
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={handleCancel}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all_filter">All Types</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tags List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TagIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">
            {tags.length === 0 ? "No tags yet" : "No tags match your search"}
          </p>
          <p className="text-xs mt-1">
            {tags.length === 0
              ? "Create your first tag to start categorizing records."
              : "Try a different search term or filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color || "#6B7280" }}
                />
                <span className="text-sm font-medium truncate">{tag.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                  {ENTITY_TYPES.find((t) => t.value === tag.entity_type)?.label || tag.entity_type}
                </span>
                {tag.usage_count !== undefined && tag.usage_count > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {tag.usage_count} {tag.usage_count === 1 ? "record" : "records"}
                  </span>
                )}
              </div>
              {(canWrite || canDelete) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenEdit(tag)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setTagToDelete(tag)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {tags.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {filteredTags.length} of {tags.length} tags shown
        </p>
      )}

      {/* Delete confirmation */}
      <ConfirmationModal
        isOpen={!!tagToDelete}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tag"
        description={`Are you sure you want to delete "${tagToDelete?.name}"? This will remove the tag from all records it's applied to.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        icon={Trash2}
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        confirmClassName="bg-destructive hover:bg-destructive/90 text-white"
        isLoading={deleteTag.isPending}
      />
    </div>
  );
}
