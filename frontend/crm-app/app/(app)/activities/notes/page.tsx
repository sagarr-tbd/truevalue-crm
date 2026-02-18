"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FileText,
  Plus,
  Filter,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Clock,
  Flag,
  ChevronDown,
  Check,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { NoteFormDrawer } from "@/components/Forms/Activities";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { toSnakeCaseOperator } from "@/lib/utils";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useBulkDeleteNotes,
  useBulkUpdateNotes,
  type NoteQueryParams,
  type NoteViewModel,
  type NoteFormData,
} from "@/lib/queries/useNotes";
import { notesApi } from "@/lib/api/notes";
import { useContactOptions } from "@/lib/queries/useContacts";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useDealOptions } from "@/lib/queries/useDeals";
import { useLeadOptions } from "@/lib/queries/useLeads";
import { useUIStore } from "@/stores";
import { usePermission, ACTIVITIES_WRITE, ACTIVITIES_DELETE } from "@/lib/permissions";
import type { Note } from "@/lib/types";

const DeleteConfirmationModal = dynamic(
  () => import("@/components/DeleteConfirmationModal"),
  { ssr: false }
);

const BulkDeleteModal = dynamic(
  () => import("@/components/BulkDeleteModal").then(mod => ({ default: mod.BulkDeleteModal })),
  { ssr: false }
);

const BulkUpdateModal = dynamic(
  () => import("@/components/BulkUpdateModal").then(mod => ({ default: mod.BulkUpdateModal })),
  { ssr: false }
) as typeof import("@/components/BulkUpdateModal").BulkUpdateModal;

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    completed: "bg-primary/10 text-primary",
    in_progress: "bg-accent/10 text-accent",
    pending: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    urgent: "bg-destructive/10 text-destructive",
    high: "bg-orange-100 text-orange-700",
    normal: "bg-primary/10 text-primary",
    low: "bg-muted text-muted-foreground",
  };
  return colors[priority] || "bg-muted text-muted-foreground";
};

const PRIORITY_DISPLAY: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

function formatDate(isoDate?: string): string {
  if (!isoDate) return "—";
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function NotesPage() {
  const router = useRouter();

  const {
    viewMode,
    showStats,
    setViewMode,
    toggleStats,
    filters,
    setModuleFilters,
    clearModuleFilters,
    defaultItemsPerPage: defaultPerPage,
  } = useUIStore();

  const { can } = usePermission();

  const notesFilters = filters.notes || {};

  const [searchQuery, setSearchQuery] = useState(notesFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(notesFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const { presets, addPreset, deletePreset } = useFilterPresets("notes");

  const { data: contactOptions = [] } = useContactOptions();
  const { data: companyOptions = [] } = useCompanyOptions();
  const { data: dealOptions = [] } = useDealOptions();
  const { data: leadOptions = [] } = useLeadOptions();

  const queryParams: NoteQueryParams = useMemo(() => {
    const params: NoteQueryParams = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter as NoteQueryParams['status'] || undefined,
    };

    if (filterGroup && filterGroup.conditions.length > 0) {
      params.filters = {
        logic: (filterGroup.logic?.toLowerCase() || 'and') as 'and' | 'or',
        conditions: filterGroup.conditions.map(c => ({
          field: c.field,
          operator: toSnakeCaseOperator(c.operator),
          value: c.value,
        })),
      };
    }

    return params;
  }, [currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, filterGroup]);

  const { data: notesResponse, isLoading } = useNotes(queryParams);
  const notes = useMemo(() => notesResponse?.data ?? [], [notesResponse?.data]);
  const totalItems = notesResponse?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const apiStats = notesResponse?.meta?.stats;

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const bulkDelete = useBulkDeleteNotes();
  const bulkUpdate = useBulkUpdateNotes();

  useEffect(() => {
    setModuleFilters('notes', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<NoteViewModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const exportColumns: ExportColumn<NoteViewModel>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'description', label: 'Content' },
    { key: 'status', label: 'Status', format: (v) => v ? STATUS_DISPLAY[String(v)] || String(v) : '' },
    { key: 'priority', label: 'Priority', format: (v) => v ? PRIORITY_DISPLAY[String(v)] || String(v) : '' },
    { key: 'relatedTo', label: 'Related To' },
    { key: 'createdAt', label: 'Created Date', format: (v) => v ? formatDate(String(v)) : '' },
  ], []);

  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      key: 'subject',
      label: 'Subject',
      type: 'text',
      placeholder: 'Enter note title...',
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Urgent', value: 'urgent' },
        { label: 'High', value: 'high' },
        { label: 'Normal', value: 'normal' },
        { label: 'Low', value: 'low' },
      ],
    },
    {
      key: 'contactId',
      label: 'Contact',
      type: 'select',
      options: contactOptions,
    },
    {
      key: 'companyId',
      label: 'Company',
      type: 'select',
      options: companyOptions,
    },
    {
      key: 'dealId',
      label: 'Deal',
      type: 'select',
      options: dealOptions,
    },
    {
      key: 'leadId',
      label: 'Lead',
      type: 'select',
      options: leadOptions,
    },
  ], [contactOptions, companyOptions, dealOptions, leadOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New note",
        action: () => {
          setEditingNote(null);
          setFormMode("add");
          setDefaultView("quick");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  const filterOptions = useMemo(() => [
    {
      label: "All Notes",
      value: null,
      count: apiStats?.total ?? totalItems,
    },
    {
      label: "Pending",
      value: "pending",
      count: apiStats?.byStatus?.['pending'] ?? 0,
    },
    {
      label: "In Progress",
      value: "in_progress",
      count: apiStats?.byStatus?.['in_progress'] ?? 0,
    },
    {
      label: "Completed",
      value: "completed",
      count: apiStats?.byStatus?.['completed'] ?? 0,
    },
    {
      label: "Cancelled",
      value: "cancelled",
      count: apiStats?.byStatus?.['cancelled'] ?? 0,
    },
  ], [apiStats, totalItems]);

  const stats = useMemo(() => {
    const totalNotes = apiStats?.total ?? totalItems;
    const inProgress = apiStats?.byStatus?.['in_progress'] ?? 0;
    const completed = apiStats?.byStatus?.['completed'] ?? 0;
    const pending = apiStats?.byStatus?.['pending'] ?? 0;

    return [
      {
        label: "Total Notes",
        value: totalNotes,
        icon: FileText,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Pending",
        value: pending,
        icon: Clock,
        iconBgColor: "bg-muted",
        iconColor: "text-muted-foreground",
      },
      {
        label: "In Progress",
        value: inProgress,
        icon: AlertCircle,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Completed",
        value: completed,
        icon: Check,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
      },
    ];
  }, [apiStats, totalItems]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedNotes.length === notes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(notes.map((n) => n.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedNotes.includes(strId)) {
      setSelectedNotes(selectedNotes.filter((nId) => nId !== strId));
    } else {
      setSelectedNotes([...selectedNotes, strId]);
    }
  };

  const handleDeleteClick = (note: NoteViewModel) => {
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteNote.mutateAsync(noteToDelete.id);
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setNoteToDelete(null);
  };

  const handleSelectAllNotes = () => {
    setSelectedNotes(notes.map(n => n.id));
  };

  const handleDeselectAll = () => {
    setSelectedNotes([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedNotes);
      setSelectedNotes([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({
        ids: selectedNotes,
        data: { status: status as NoteFormData['status'] }
      });
      setSelectedNotes([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Bulk update error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = notes.filter(note => selectedNotes.includes(note.id));
    if (selectedData.length === 0) {
      toast.error("No notes selected for export");
      return;
    }
    try {
      exportToCSV(
        selectedData,
        exportColumns,
        `selected-notes-${new Date().toISOString().split('T')[0]}.csv`
      );
      toast.success(`Successfully exported ${selectedData.length} notes`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export notes");
    }
  };

  const getFilterDisplayValue = (field: FilterField | undefined, value: string): string => {
    if (!field || !value) return value;
    if (field.type === 'select' && field.options) {
      const option = field.options.find(opt => opt.value === value);
      if (option) return option.label;
    }
    return value;
  };

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (statusFilter) {
      chips.push({
        id: 'status-filter',
        label: 'Status',
        value: STATUS_DISPLAY[statusFilter] || statusFilter,
        color: 'primary',
      });
    }
    if (filterGroup && filterGroup.conditions.length > 0) {
      filterGroup.conditions.forEach((condition, index) => {
        const field = filterFields.find(f => f.key === condition.field);
        const displayValue = getFilterDisplayValue(field, condition.value);
        chips.push({
          id: `advanced-filter-${index}`,
          label: field?.label || condition.field,
          value: `${condition.operator}: ${displayValue}`,
          color: 'secondary',
        });
      });
    }
    return chips;
  }, [statusFilter, filterGroup, filterFields]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === 'status-filter') {
      setStatusFilter(null);
    } else if (chipId.startsWith('advanced-filter')) {
      const index = parseInt(chipId.split('-')[2]);
      if (filterGroup) {
        const newConditions = filterGroup.conditions.filter((_, i) => i !== index);
        if (newConditions.length === 0) {
          setFilterGroup(null);
        } else {
          setFilterGroup({ ...filterGroup, conditions: newConditions });
        }
      }
    }
  };

  const handleClearAllFilters = () => {
    setStatusFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    clearModuleFilters('notes');
  };

  const handleEditNote = async (note: NoteViewModel) => {
    setFormMode("edit");
    try {
      const fullNote = await notesApi.getById(note.id);
      setEditingNote({
        id: fullNote.id,
        subject: fullNote.subject,
        description: fullNote.description,
        status: fullNote.status,
        priority: fullNote.priority,
        assignedTo: fullNote.assignedTo,
        contactId: fullNote.contact?.id,
        companyId: fullNote.company?.id,
        dealId: fullNote.deal?.id,
        leadId: fullNote.lead?.id,
      });
    } catch (error) {
      console.error("Failed to fetch note details:", error);
      toast.error("Failed to load note details");
      setEditingNote({
        id: note.id,
        subject: note.subject,
        description: note.description,
        status: note.status,
        priority: note.priority,
        assignedTo: note.assignedTo,
      });
    }
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Note>) => {
    try {
      const noteData: NoteFormData = {
        subject: data.subject || "",
        description: data.description,
        status: data.status as NoteFormData['status'],
        priority: data.priority as NoteFormData['priority'],
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        leadId: data.leadId,
        assignedTo: data.assignedTo,
      };

      if (formMode === "edit" && editingNote?.id) {
        await updateNote.mutateAsync({ id: editingNote.id, data: noteData });
      } else {
        await createNote.mutateAsync(noteData);
      }

      setFormDrawerOpen(false);
      setEditingNote(null);
    } catch (error) {
      throw error;
    }
  };

  const columns = useMemo(() => [
    {
      key: "subject",
      label: "Note",
      render: (_value: unknown, row: NoteViewModel) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/activities/notes/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.subject}</div>
            {row.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">{row.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {STATUS_DISPLAY[value] || value}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(value)}`}>
          {value ? (PRIORITY_DISPLAY[value] || value) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: "relatedTo",
      label: "Related To",
      render: (_value: unknown, row: NoteViewModel) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {row.relatedTo ? (
            <>
              <Flag className="h-4 w-4" />
              <span>{row.relatedTo}</span>
              {row.relatedToType && (
                <span className="text-xs text-muted-foreground/60">({row.relatedToType})</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </div>
      ),
    },
  ], [router]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notes"
        icon={FileText}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} notes`}
        searchPlaceholder="Search notes by title or content..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStats()}
              title={showStats ? "Hide Statistics" : "Show Statistics"}
            >
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              title="Open advanced filters"
              className="sm:hidden"
            >
              <Filter className="h-4 w-4" />
              {filterGroup && filterGroup.conditions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {filterGroup.conditions.length}
                </span>
              )}
            </Button>

            <div className="relative" ref={filterDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter notes by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Notes"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border py-2 z-50"
                  >
                    {filterOptions.map((option) => (
                      <button
                        key={option.value || "all"}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setShowFilterDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span>{option.label}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {option.count}
                          </span>
                        </div>
                        {statusFilter === option.value && (
                          <Check className="h-4 w-4 text-brand-teal" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              title="Open advanced filters"
              className="hidden sm:flex"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Advanced Filters</span>
              <span className="md:hidden">Advanced</span>
              {filterGroup && filterGroup.conditions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {filterGroup.conditions.length}
                </span>
              )}
            </Button>

            {can(ACTIVITIES_WRITE) && (
              <ExportButton
                data={notes}
                columns={exportColumns}
                filename={`notes-${new Date().toISOString().split('T')[0]}`}
                title="Notes Export"
              />
            )}
            {can(ACTIVITIES_WRITE) && (
              <Button
                onClick={() => {
                  setFormMode("add");
                  setEditingNote(null);
                  setDefaultView("quick");
                  setFormDrawerOpen(true);
                }}
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Create a new note"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            )}
          </>
        }
      />

      {filterChips.length > 0 && (
        <FilterChips
          chips={filterChips}
          onRemove={handleRemoveFilterChip}
          onClearAll={handleClearAllFilters}
        />
      )}

      <AdvancedFilter
        fields={filterFields}
        onApply={(group) => {
          setFilterGroup(group);
          setCurrentPage(1);
        }}
        onClear={() => {
          setFilterGroup(null);
          setCurrentPage(1);
        }}
        initialGroup={filterGroup || undefined}
        presets={presets}
        onSavePreset={addPreset}
        onLoadPreset={(preset) => {
          setFilterGroup(preset.group);
          setCurrentPage(1);
        }}
        onDeletePreset={deletePreset}
        isDrawer={true}
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        drawerPosition="right"
      />

      {selectedNotes.length > 0 && (can(ACTIVITIES_WRITE) || can(ACTIVITIES_DELETE)) && (
        <BulkActionsToolbar
          selectedCount={selectedNotes.length}
          totalCount={totalItems}
          onSelectAll={handleSelectAllNotes}
          onDeselectAll={handleDeselectAll}
          onDelete={can(ACTIVITIES_DELETE) ? () => setShowBulkDelete(true) : undefined}
          onExport={handleBulkExport}
          onUpdateStatus={can(ACTIVITIES_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined}
          isProcessing={isBulkProcessing}
        />
      )}

      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {viewMode === "list" ? (
        <DataTable
          data={notes}
          columns={columns}
          selectedIds={selectedNotes}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No notes found"
          emptyDescription="Try adjusting your search or filters, or create a new note"
          renderActions={(row: NoteViewModel) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/activities/notes/${row.id}`),
                },
                ...(can(ACTIVITIES_WRITE)
                  ? [{ label: "Edit Note" as const, icon: Edit, onClick: () => handleEditNote(row) }]
                  : []),
                ...(can(ACTIVITIES_WRITE) || can(ACTIVITIES_DELETE)
                  ? [{ divider: true as const, label: "", onClick: () => {} }]
                  : []),
                ...(can(ACTIVITIES_DELETE)
                  ? [
                      {
                        label: "Delete" as const,
                        icon: Trash2,
                        variant: "danger" as const,
                        onClick: () => handleDeleteClick(row),
                      },
                    ]
                  : []),
              ]}
            />
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/activities/notes/${note.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {note.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{note.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/activities/notes/${note.id}`),
                        },
                        ...(can(ACTIVITIES_WRITE)
                          ? [{ label: "Edit Note" as const, icon: Edit, onClick: () => handleEditNote(note) }]
                          : []),
                        ...(can(ACTIVITIES_WRITE) || can(ACTIVITIES_DELETE)
                          ? [{ divider: true as const, label: "", onClick: () => {} }]
                          : []),
                        ...(can(ACTIVITIES_DELETE)
                          ? [
                              {
                                label: "Delete" as const,
                                icon: Trash2,
                                variant: "danger" as const,
                                onClick: () => handleDeleteClick(note),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </div>
                {note.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{note.description}</p>
                )}
                <div className="space-y-2">
                  {note.relatedTo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flag className="h-4 w-4" />
                      <span>{note.relatedTo}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                    {STATUS_DISPLAY[note.status] || note.status}
                  </span>
                  {note.priority && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.priority)}`}>
                      {PRIORITY_DISPLAY[note.priority] || note.priority}
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedNotes([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedNotes([]);
        }}
        filterInfo={
          statusFilter ? `filtered by ${STATUS_DISPLAY[statusFilter] || statusFilter}` : undefined
        }
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        description="Are you sure you want to delete this note? This will permanently remove it from your CRM and cannot be undone."
        itemName={noteToDelete?.subject}
        itemType="Note"
        icon={FileText}
        isDeleting={isDeleting}
      />

      <NoteFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingNote}
        mode={formMode}
        defaultView={defaultView}
      />

      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedNotes.length}
        itemName="note"
      />

      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedNotes.length}
        title="Update Note Status"
        field="Status"
        options={[
          { label: 'Pending', value: 'pending' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ]}
      />
    </div>
  );
}
