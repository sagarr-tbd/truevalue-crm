"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { TaskFormDrawer } from "@/components/Forms/Activities";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import { toSnakeCaseOperator } from "@/lib/utils";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useTasks, 
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  useBulkDeleteTasks, 
  useBulkUpdateTasks,
  type TaskQueryParams,
  type TaskViewModel,
  type TaskFormData,
} from "@/lib/queries/useTasks";
import { tasksApi } from "@/lib/api/tasks";
import { useContactOptions } from "@/lib/queries/useContacts";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useDealOptions } from "@/lib/queries/useDeals";
import { useLeadOptions } from "@/lib/queries/useLeads";
import { useUIStore } from "@/stores";
import { usePermission, TASKS_WRITE, TASKS_DELETE } from "@/lib/permissions";
import { TokenManager } from "@/lib/api/client";
import type { Task } from "@/lib/types";

// Lazy load heavy components that are only used conditionally
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
    high: "bg-orange-50 text-orange-600",
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

/** Convert ISO string → YYYY-MM-DD for <input type="date"> */
function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().split("T")[0];
  } catch {
    return iso.split("T")[0] || "";
  }
}

/** Convert ISO string → YYYY-MM-DDTHH:MM for <input type="datetime-local"> */
function toDateTimeLocalValue(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso.slice(0, 16) || "";
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TasksPage() {
  const router = useRouter();
  
  // Zustand (UI state)
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
  
  // Initialize filters from store
  const tasksFilters = filters.tasks || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(tasksFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(tasksFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Debounce search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Advanced Filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const { presets, addPreset, deletePreset } = useFilterPresets("tasks");

  // Entity options for advanced filters
  const { data: contactOptions = [] } = useContactOptions();
  const { data: companyOptions = [] } = useCompanyOptions();
  const { data: dealOptions = [] } = useDealOptions();
  const { data: leadOptions = [] } = useLeadOptions();

  // Build query params for server-side pagination (including advanced filters)
  const queryParams: TaskQueryParams = useMemo(() => {
    const params: TaskQueryParams = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter as TaskQueryParams['status'] || undefined,
    };
    
    // Add advanced filters if present
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

  const exportParams = useMemo(() => {
    const p: Record<string, string> = { type: 'task' };
    if (debouncedSearchQuery) p.search = debouncedSearchQuery;
    if (statusFilter) p.status = statusFilter;
    if (filterGroup && filterGroup.conditions.length > 0) {
      p.filters = JSON.stringify({
        logic: (filterGroup.logic?.toLowerCase() || 'and'),
        conditions: filterGroup.conditions.map(c => ({
          field: c.field, operator: toSnakeCaseOperator(c.operator), value: c.value,
        })),
      });
    }
    return p;
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  // React Query (server data) - with pagination
  const { data: tasksResponse, isLoading } = useTasks(queryParams);
  const tasks = useMemo(() => tasksResponse?.data ?? [], [tasksResponse?.data]);
  const totalItems = tasksResponse?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Stats from API response (includes all tasks, not just current page)
  const apiStats = tasksResponse?.meta?.stats;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();
  const bulkDelete = useBulkDeleteTasks();
  const bulkUpdate = useBulkUpdateTasks();
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('tasks', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskViewModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Filter dropdown ref for click outside
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Advanced filter fields configuration
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
      label: 'Title',
      type: 'text',
      placeholder: 'Enter task title...',
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

  // Page-specific keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New task",
        action: () => {
          setEditingTask(null);
          setFormMode("add");
          setDefaultView("quick");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  // Filter options for quick dropdown (using API stats for counts)
  const filterOptions = useMemo(() => [
    {
      label: "All Tasks",
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

  // Stats calculations using API stats (includes all tasks, not just current page)
  const stats = useMemo(() => {
    const totalTasks = apiStats?.total ?? totalItems;
    const inProgress = apiStats?.byStatus?.['in_progress'] ?? 0;
    const completed = apiStats?.byStatus?.['completed'] ?? 0;
    const overdue = apiStats?.overdue ?? 0;

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
  }, [apiStats, totalItems]);

  // Handlers
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

  // Delete handlers
  const handleDeleteClick = (task: TaskViewModel) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete?.id) return;
    
    setIsDeleting(true);
    
    try {
      await deleteTask.mutateAsync(taskToDelete.id);
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  // Bulk operation handlers
  const handleSelectAllTasks = () => {
    setSelectedTasks(tasks.map(t => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedTasks([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedTasks);
      setSelectedTasks([]);
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
        ids: selectedTasks, 
        data: { status: status as TaskFormData['status'] } 
      });
      setSelectedTasks([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Bulk update error:", error);
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
      const params = new URLSearchParams({ type: "task", ids: selectedTasks.join(",") });
      const resp = await fetch(`${baseUrl}/crm/api/v1/activities/export?${params}`, {
        headers: { ...(TokenManager.getAccessToken() ? { Authorization: `Bearer ${TokenManager.getAccessToken()}` } : {}) },
      });
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
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export tasks");
    }
  };

  // Helper to get display value for filter conditions
  const getFilterDisplayValue = (field: FilterField | undefined, value: string): string => {
    if (!field || !value) return value;
    
    if (field.type === 'select' && field.options) {
      const option = field.options.find(opt => opt.value === value);
      if (option) return option.label;
    }
    
    return value;
  };

  // Filter chips data
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
          setFilterGroup({
            ...filterGroup,
            conditions: newConditions,
          });
        }
      }
    }
  };

  const handleClearAllFilters = () => {
    setStatusFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    clearModuleFilters('tasks');
  };

  // Edit handler — fetches full task details from API before opening form
  const handleEditTask = async (task: TaskViewModel) => {
    setFormMode("edit");
    
    try {
      const fullTask = await tasksApi.getById(task.id);
      
      setEditingTask({
        id: fullTask.id,
        subject: fullTask.subject,
        description: fullTask.description,
        priority: fullTask.priority,
        status: fullTask.status,
        dueDate: toDateInputValue(fullTask.dueDate),
        assignedTo: fullTask.assignedTo,
        contactId: fullTask.contact?.id,
        companyId: fullTask.company?.id,
        dealId: fullTask.deal?.id,
        leadId: fullTask.lead?.id,
        reminderAt: toDateTimeLocalValue(fullTask.reminderAt),
      });
    } catch (error) {
      console.error("Failed to fetch task details:", error);
      toast.error("Failed to load task details");
      // Fallback to minimal data from list
      setEditingTask({
        id: task.id,
        subject: task.subject,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: toDateInputValue(task.dueDate),
        assignedTo: task.assignedTo,
      });
    }
    setFormDrawerOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: Partial<Task>) => {
    try {
      const taskData: TaskFormData = {
        subject: data.subject || "",
        description: data.description,
        priority: data.priority as TaskFormData['priority'],
        status: data.status as TaskFormData['status'],
        dueDate: data.dueDate,
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        leadId: data.leadId,
        assignedTo: data.assignedTo,
        reminderAt: data.reminderAt,
      };

      if (formMode === "edit" && editingTask?.id) {
        await updateTask.mutateAsync({ id: editingTask.id, data: taskData });
      } else {
        await createTask.mutateAsync(taskData);
      }
      
      setFormDrawerOpen(false);
      setEditingTask(null);
    } catch (error) {
      throw error;
    }
  };

  // Table columns - no sorting (matches leads pattern)
  const columns = useMemo(() => [
    {
      key: "subject",
      label: "Task",
      render: (_value: unknown, row: TaskViewModel) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/activities/tasks/${row.id}`)}
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
      key: "priority",
      label: "Priority",
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(value)}`}>
          {PRIORITY_DISPLAY[value] || value}
        </span>
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
      key: "dueDate",
      label: "Due Date",
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
      render: (_value: unknown, row: TaskViewModel) => (
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
    {
      key: "createdAt",
      label: "Created",
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDate(value)}
        </div>
      ),
    },
  ], [router]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Tasks"
        icon={CheckSquare}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} tasks`}
        searchPlaceholder="Search tasks by title or description..."
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
            
            {/* Mobile Advanced Filter Button */}
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
            
            {/* Filter Dropdown */}
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

            {/* Advanced Filter Button - Desktop */}
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

            {can(TASKS_WRITE) && (
              <ExportButton
                exportUrl="/crm/api/v1/activities/export"
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
                  setDefaultView("quick");
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

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <FilterChips
          chips={filterChips}
          onRemove={handleRemoveFilterChip}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Advanced Filter Drawer */}
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

      {/* Bulk Actions Toolbar */}
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

      {/* Stats Cards */}
      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={tasks}
          columns={columns}
          selectedIds={selectedTasks}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No tasks found"
          emptyDescription="Try adjusting your search or filters, or add a new task"
          renderActions={(row: TaskViewModel) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/activities/tasks/${row.id}`),
                },
                ...(can(TASKS_WRITE)
                  ? [
                      {
                        label: "Edit Task",
                        icon: Edit,
                        onClick: () => handleEditTask(row),
                      },
                      {
                        label: "Mark Complete",
                        icon: Check,
                        onClick: () => completeTask.mutateAsync(row.id),
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
                        onClick: () => handleDeleteClick(row),
                      },
                    ]
                  : []),
              ]}
            />
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/activities/tasks/${task.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {task.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {task.subject}
                      </h3>
                      {task.relatedTo && (
                        <p className="text-sm text-muted-foreground">
                          {task.relatedTo}
                        </p>
                      )}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/activities/tasks/${task.id}`),
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
                                onClick: () => completeTask.mutateAsync(task.id),
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
                      ]}
                    />
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
                    <span>Due: {formatDate(task.dueDate)}</span>
                  </div>
                  {task.relatedTo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flag className="h-4 w-4" />
                      <span>{task.relatedTo}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {STATUS_DISPLAY[task.status] || task.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {PRIORITY_DISPLAY[task.priority] || task.priority}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
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
          statusFilter ? `filtered by ${STATUS_DISPLAY[statusFilter] || statusFilter}` : undefined
        }
      />

      {/* Delete Confirmation Modal */}
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

      {/* Task Form Drawer */}
      <TaskFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
        mode={formMode}
        defaultView={defaultView}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedTasks.length}
        itemName="task"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedTasks.length}
        title="Update Task Status"
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
