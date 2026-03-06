"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  CheckSquare,
  Plus,
  Filter,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Clock,
  Flag,
  ChevronDown,
  Check,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { ActivityV2FormDrawer } from "@/components/Forms/ActivitiesV2";
import {
  useActivitiesV2,
  useActivitiesV2Stats,
  useCreateActivityV2,
  useUpdateActivityV2,
  useDeleteActivityV2,
  useCompleteActivityV2,
  useBulkDeleteActivitiesV2,
  useBulkUpdateActivitiesV2,
} from "@/lib/queries/useActivitiesV2";
import type {
  ActivityV2,
  CreateActivityV2Input,
  ActivityV2ListParams,
} from "@/lib/api/activitiesV2";
import { toast } from "sonner";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { useUIStore } from "@/stores";
import { usePermission, TASKS_WRITE, TASKS_DELETE } from "@/lib/permissions";
import { TokenManager } from "@/lib/api/client";
import { useMemberOptions } from "@/lib/queries/useMembers";

// Lazy load heavy components
const DeleteConfirmationModal = dynamic(
  () => import("@/components/DeleteConfirmationModal"),
  { ssr: false }
);

const BulkDeleteModal = dynamic(
  () =>
    import("@/components/BulkDeleteModal").then((mod) => ({
      default: mod.BulkDeleteModal,
    })),
  { ssr: false }
);

import { BulkUpdateModal } from "@/components/BulkUpdateModal";

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const PRIORITY_DISPLAY: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    urgent: "bg-destructive/10 text-destructive",
    high: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    normal: "bg-accent/10 text-accent",
    low: "bg-muted text-muted-foreground",
  };
  return colors[priority] || "bg-muted text-muted-foreground";
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

function formatDate(isoDate?: string | null): string {
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

/** Get initials from subject for avatar */
function getInitialsFromSubject(subject?: string | null): string {
  if (!subject?.trim()) return "T";
  const words = subject.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return subject.slice(0, 2).toUpperCase();
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TasksV2Page() {
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

  const tasksV2Filters = (filters as Record<string, Record<string, unknown>>)["tasks-v2"] || {};

  const [searchQuery, setSearchQuery] = useState<string>(
    (tasksV2Filters.search as string) || ""
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(
    (tasksV2Filters.status as string) || null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { presets, addPreset, deletePreset } = useFilterPresets("tasks-v2");

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Build query params - filter by activity_type: "task"
  const queryParams = useMemo<ActivityV2ListParams>(() => {
    const params: ActivityV2ListParams = {
      activity_type: "task",
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter || undefined,
    };

    if (filterGroup && filterGroup.conditions.length > 0) {
      params.filters = JSON.stringify({
        conditions: filterGroup.conditions,
        logic: filterGroup.logic,
      });
    }

    return params;
  }, [currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, filterGroup]);

  const { data: response, isLoading } = useActivitiesV2(queryParams);
  const { data: statsData } = useActivitiesV2Stats("task");
  const { data: memberOptions = [] } = useMemberOptions();

  const resolveMemberName = useCallback(
    (userId?: string | null): string | null => {
      if (!userId) return null;
      const member = memberOptions.find((m) => m.value === userId);
      return member?.label || null;
    },
    [memberOptions]
  );

  const createActivityV2 = useCreateActivityV2();
  const updateActivityV2 = useUpdateActivityV2();
  const deleteActivityV2 = useDeleteActivityV2();
  const completeActivityV2 = useCompleteActivityV2();
  const bulkDeleteActivities = useBulkDeleteActivitiesV2();
  const bulkUpdateActivities = useBulkUpdateActivitiesV2();

  const tasks = response?.results || [];
  const totalItems = response?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    (setModuleFilters as (module: string, filters: Record<string, unknown>) => void)(
      "tasks-v2",
      { search: searchQuery, status: statusFilter }
    );
  }, [searchQuery, statusFilter, setModuleFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ActivityV2 | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ActivityV2 | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

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
        description: "New task",
        action: () => {
          if (!can(TASKS_WRITE)) return;
          setEditingTask(null);
          setFormMode("add");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  const filterOptions = useMemo(() => {
    const byStatus = statsData?.by_status || {};
    const total = statsData?.total ?? totalItems;
    return [
      { label: "All Tasks", value: null, count: total },
      { label: "Pending", value: "pending", count: byStatus.pending || 0 },
      {
        label: "In Progress",
        value: "in_progress",
        count: byStatus.in_progress || 0,
      },
      { label: "Completed", value: "completed", count: byStatus.completed || 0 },
      { label: "Cancelled", value: "cancelled", count: byStatus.cancelled || 0 },
    ];
  }, [statsData, totalItems]);

  const stats = useMemo(() => {
    const totalTasks = statsData?.total ?? totalItems;
    const inProgress = statsData?.by_status?.in_progress ?? 0;
    const completed = statsData?.by_status?.completed ?? 0;
    const overdue = statsData?.overdue ?? 0;

    return [
      {
        label: "Total Tasks",
        value: totalTasks,
        icon: CheckSquare,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "In Progress",
        value: inProgress,
        icon: Clock,
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
      {
        label: "Overdue",
        value: overdue,
        icon: AlertCircle,
        iconBgColor: "bg-destructive/10",
        iconColor: "text-destructive",
      },
    ];
  }, [statsData, totalItems]);

  const exportParams = useMemo(() => {
    const p: Record<string, string> = { activity_type: "task" };
    if (debouncedSearchQuery) p.search = debouncedSearchQuery;
    if (statusFilter) p.status = statusFilter;
    if (filterGroup && filterGroup.conditions.length > 0) {
      p.filters = JSON.stringify({
        conditions: filterGroup.conditions,
        logic: filterGroup.logic,
      });
    }
    return p;
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((t) => t.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedTasks.includes(strId)) {
      setSelectedTasks(selectedTasks.filter((tId) => tId !== strId));
    } else {
      setSelectedTasks([...selectedTasks, strId]);
    }
  };

  const handleDeleteClick = (task: ActivityV2) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete?.id) return;

    setIsDeleting(true);

    try {
      await deleteActivityV2.mutateAsync(taskToDelete.id);
      toast.success("Task deleted successfully");
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const handleSelectAllTasks = () => {
    setSelectedTasks(tasks.map((t) => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedTasks([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDeleteActivities.mutateAsync(selectedTasks);
      setSelectedTasks([]);
      setShowBulkDelete(false);
    } catch {
      // Error toast handled by mutation hook
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedTasks.length === 0) {
      toast.error("No tasks selected for export");
      return;
    }
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const params = new URLSearchParams({
        activity_type: "task",
        ids: selectedTasks.join(","),
      });
      const resp = await fetch(
        `${baseUrl}/crm/api/v2/activities/export/?${params}`,
        {
          headers: {
            ...(TokenManager.getAccessToken()
              ? { Authorization: `Bearer ${TokenManager.getAccessToken()}` }
              : {}),
          },
        }
      );
      if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selected-tasks-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedTasks.length} tasks`);
    } catch {
      toast.error("Failed to export tasks");
    }
  };

  const handleBulkUpdateStatus = async (
    newStatus: "pending" | "in_progress" | "completed" | "cancelled"
  ) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdateActivities.mutateAsync({
        ids: selectedTasks,
        updates: { status: newStatus },
      });
      setSelectedTasks([]);
      setShowBulkUpdateStatus(false);
    } catch {
      // Error toast handled by mutation hook
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleEditTask = useCallback((task: ActivityV2) => {
    setFormMode("edit");
    const fullTask = tasks.find((t) => t.id === task.id);
    if (fullTask) {
      setEditingTask(fullTask);
      setFormDrawerOpen(true);
    }
  }, [tasks]);

  const handleFormSubmit = async (data: CreateActivityV2Input) => {
    try {
      if (formMode === "edit" && editingTask?.id) {
        await updateActivityV2.mutateAsync({ id: editingTask.id, data });
      } else {
        await createActivityV2.mutateAsync(data);
      }

      setFormDrawerOpen(false);
      setEditingTask(null);
      toast.success(formMode === "edit" ? "Task updated" : "Task created");
    } catch {
      throw new Error("Failed to save task");
    }
  };

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Pending", value: "pending" },
          { label: "In Progress", value: "in_progress" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ],
      },
      {
        key: "subject",
        label: "Subject",
        type: "text",
        placeholder: "Enter task subject...",
      },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: [
          { label: "Urgent", value: "urgent" },
          { label: "High", value: "high" },
          { label: "Normal", value: "normal" },
          { label: "Low", value: "low" },
        ],
      },
    ],
    []
  );

  const getFilterDisplayValue = (field: FilterField | undefined, value: string): string => {
    if (!field || !value) return value;
    if (field.type === "select" && field.options) {
      const option = field.options.find((opt) => opt.value === value);
      if (option) return option.label;
    }
    return value;
  };

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];

    if (statusFilter) {
      chips.push({
        id: "status-filter",
        label: "Status",
        value: STATUS_DISPLAY[statusFilter] || statusFilter,
        color: "primary",
      });
    }

    if (filterGroup && filterGroup.conditions.length > 0) {
      filterGroup.conditions.forEach((condition, index) => {
        const field = filterFields.find((f) => f.key === condition.field);
        const displayValue = getFilterDisplayValue(field, condition.value);
        chips.push({
          id: `advanced-filter-${index}`,
          label: field?.label || condition.field,
          value: `${condition.operator}: ${displayValue}`,
          color: "secondary",
        });
      });
    }

    return chips;
  }, [statusFilter, filterGroup, filterFields]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === "status-filter") {
      setStatusFilter(null);
    } else if (chipId.startsWith("advanced-filter")) {
      const index = parseInt(chipId.split("-")[2], 10);
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
    setSearchQuery("");
    setFilterGroup(null);
    (clearModuleFilters as (module: string) => void)("tasks-v2");
  };

  const columns = useMemo(
    () => [
      {
        key: "subject",
        label: "Task",
        render: (_value: unknown, row: ActivityV2) => (
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(`/activities-v2/tasks/${row.id}`)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
              {getInitialsFromSubject(row.subject)}
            </div>
            <div>
              <div className="font-semibold text-foreground">{row.subject}</div>
              {row.description && (
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {row.description}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "priority",
        label: "Priority",
        render: (value: string) => (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(value)}`}
          >
            {PRIORITY_DISPLAY[value] || value}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (value: string) => (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}
          >
            {STATUS_DISPLAY[value] || value}
          </span>
        ),
      },
      {
        key: "due_date",
        label: "Due Date",
        render: (value: string) => (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {formatDate(value)}
          </div>
        ),
      },
      {
        key: "related_to",
        label: "Related To",
        render: (_value: unknown, row: ActivityV2) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {row.display_contact || row.display_company ? (
              <>
                <Flag className="h-4 w-4" />
                <span>{row.display_contact || row.display_company}</span>
              </>
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </div>
        ),
      },
      {
        key: "assigned_to",
        label: "Assigned To",
        render: (_value: unknown, row: ActivityV2) => {
          const name = row.display_assigned_to || resolveMemberName(row.assigned_to_id);
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {name ? (
                <>
                  <User className="h-4 w-4" />
                  <span>{name}</span>
                </>
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </div>
          );
        },
      },
      {
        key: "created_at",
        label: "Created",
        render: (value: string) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDate(value)}
          </div>
        ),
      },
    ],
    [router, resolveMemberName]
  );

  const actionMenuItems = useCallback(
    (task: ActivityV2) => [
      {
        label: "View Details",
        icon: FileText,
        onClick: () => router.push(`/activities-v2/tasks/${task.id}`),
      },
      ...(can(TASKS_WRITE)
        ? [
            {
              label: "Edit Task",
              icon: Edit,
              onClick: () => handleEditTask(task),
            },
            {
              label: "Mark Complete",
              icon: Check,
              disabled: task.status === "completed",
              onClick: () => {
                completeActivityV2.mutate(task.id);
                toast.success("Task marked complete");
              },
            },
          ]
        : []),
      ...(can(TASKS_DELETE)
        ? [
            { divider: true, label: "", onClick: () => {} },
            {
              label: "Delete",
              icon: Trash2,
              variant: "danger" as const,
              onClick: () => handleDeleteClick(task),
            },
          ]
        : []),
    ],
    [router, can, handleEditTask, completeActivityV2]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tasks"
        icon={CheckSquare}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} tasks`}
        searchPlaceholder="Search tasks by subject or description..."
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
              {showStats ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} />

            <div className="relative" ref={filterDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter tasks by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Tasks"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-56 bg-background rounded-lg shadow-lg border border-border py-2 z-50"
                  >
                    {filterOptions.map((option) => (
                      <button
                        key={option.value ?? "all"}
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

            {can(TASKS_WRITE) && (
              <ExportButton
                exportUrl="/crm/api/v2/activities/export/"
                exportParams={exportParams}
                filename="tasks"
                totalRecords={totalItems}
              />
            )}
            {can(TASKS_WRITE) && (
              <Button
                onClick={() => {
                  setFormMode("add");
                  setEditingTask(null);
                  setFormDrawerOpen(true);
                }}
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Add a new task"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
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
        initialGroup={filterGroup ?? undefined}
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

      {selectedTasks.length > 0 && (can(TASKS_WRITE) || can(TASKS_DELETE)) && (
        <BulkActionsToolbar
          selectedCount={selectedTasks.length}
          totalCount={totalItems}
          onSelectAll={handleSelectAllTasks}
          onDeselectAll={handleDeselectAll}
          onDelete={can(TASKS_DELETE) ? () => setShowBulkDelete(true) : undefined}
          onExport={handleBulkExport}
          onUpdateStatus={can(TASKS_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined}
          isProcessing={isBulkProcessing}
        />
      )}

      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {viewMode === "list" ? (
        <DataTable
          data={tasks}
          columns={columns}
          selectedIds={selectedTasks}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={can(TASKS_WRITE) || can(TASKS_DELETE)}
          loading={isLoading}
          emptyMessage="No tasks found"
          emptyDescription="Try adjusting your search or filters, or add a new task"
          renderActions={(row: ActivityV2) => (
            <ActionMenu items={actionMenuItems(row)} />
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/activities-v2/tasks/${task.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {getInitialsFromSubject(task.subject)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{task.subject}</h3>
                      {(task.display_contact || task.display_company) && (
                        <p className="text-sm text-muted-foreground">
                          {task.display_contact || task.display_company}
                        </p>
                      )}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu items={actionMenuItems(task)} />
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {formatDate(task.due_date)}</span>
                  </div>
                  {(task.display_contact || task.display_company) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flag className="h-4 w-4" />
                      <span>{task.display_contact || task.display_company}</span>
                    </div>
                  )}
                  {(task.display_assigned_to || resolveMemberName(task.assigned_to_id)) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{task.display_assigned_to || resolveMemberName(task.assigned_to_id)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                  >
                    {STATUS_DISPLAY[task.status] || task.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                  >
                    {PRIORITY_DISPLAY[task.priority] || task.priority}
                  </span>
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
          setSelectedTasks([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedTasks([]);
        }}
        filterInfo={
          statusFilter
            ? `filtered by ${STATUS_DISPLAY[statusFilter] || statusFilter}`
            : undefined
        }
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        description="Are you sure you want to delete this task? This will permanently remove it from your CRM and cannot be undone."
        itemName={taskToDelete?.subject}
        itemType="Task"
        icon={CheckSquare}
        isDeleting={isDeleting}
      />

      <ActivityV2FormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
        mode={formMode}
        activityType="task"
      />

      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedTasks.length}
        itemName="task"
      />

      <BulkUpdateModal<"pending" | "in_progress" | "completed" | "cancelled">
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedTasks.length}
        title="Update Task Status"
        field="Status"
        options={[
          { label: "Pending", value: "pending" },
          { label: "In Progress", value: "in_progress" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ]}
      />
    </div>
  );
}
