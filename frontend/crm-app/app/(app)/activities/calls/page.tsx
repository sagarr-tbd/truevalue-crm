"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Phone,
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
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { CallFormDrawer } from "@/components/Forms/Activities";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import { toSnakeCaseOperator } from "@/lib/utils";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import {
  useCalls,
  useCreateCall,
  useUpdateCall,
  useDeleteCall,
  useCompleteCall,
  useBulkDeleteCalls,
  useBulkUpdateCalls,
  type CallQueryParams,
  type CallViewModel,
  type CallFormData,
} from "@/lib/queries/useCalls";
import { callsApi } from "@/lib/api/calls";
import { useContactOptions } from "@/lib/queries/useContacts";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useDealOptions } from "@/lib/queries/useDeals";
import { useLeadOptions } from "@/lib/queries/useLeads";
import { useUIStore } from "@/stores";
import { usePermission, ACTIVITIES_WRITE, ACTIVITIES_DELETE } from "@/lib/permissions";
import { TokenManager } from "@/lib/api/client";
import type { Call } from "@/lib/types";

// Lazy load heavy components
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

const DIRECTION_DISPLAY: Record<string, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
};

const OUTCOME_DISPLAY: Record<string, string> = {
  answered: "Answered",
  voicemail: "Voicemail",
  no_answer: "No Answer",
  busy: "Busy",
  failed: "Failed",
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

const getDirectionIcon = (direction?: string) => {
  return direction === "inbound" ? PhoneIncoming : PhoneOutgoing;
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

function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().split("T")[0];
  } catch {
    return iso.split("T")[0] || "";
  }
}

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

export default function CallsPage() {
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

  const callsFilters = filters.calls || {};

  // State management
  const [searchQuery, setSearchQuery] = useState(callsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(callsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedCalls, setSelectedCalls] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Debounce search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Advanced Filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const { presets, addPreset, deletePreset } = useFilterPresets("calls");

  // Entity options for advanced filters
  const { data: contactOptions = [] } = useContactOptions();
  const { data: companyOptions = [] } = useCompanyOptions();
  const { data: dealOptions = [] } = useDealOptions();
  const { data: leadOptions = [] } = useLeadOptions();

  // Build query params for server-side pagination
  const queryParams: CallQueryParams = useMemo(() => {
    const params: CallQueryParams = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter as CallQueryParams['status'] || undefined,
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

  const exportParams = useMemo(() => {
    const p: Record<string, string> = { type: 'call' };
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
  const { data: callsResponse, isLoading } = useCalls(queryParams);
  const calls = useMemo(() => callsResponse?.data ?? [], [callsResponse?.data]);
  const totalItems = callsResponse?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Stats from API response
  const apiStats = callsResponse?.meta?.stats;

  const createCall = useCreateCall();
  const updateCall = useUpdateCall();
  const deleteCall = useDeleteCall();
  const completeCall = useCompleteCall();
  const bulkDelete = useBulkDeleteCalls();
  const bulkUpdate = useBulkUpdateCalls();

  // Save filters to store
  useEffect(() => {
    setModuleFilters('calls', {
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
  const [callToDelete, setCallToDelete] = useState<CallViewModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<Partial<Call> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Filter dropdown ref
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Advanced filter fields
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
      placeholder: 'Enter call subject...',
    },
    {
      key: 'call_direction',
      label: 'Direction',
      type: 'select',
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
      ],
    },
    {
      key: 'call_outcome',
      label: 'Outcome',
      type: 'select',
      options: [
        { label: 'Answered', value: 'answered' },
        { label: 'Voicemail', value: 'voicemail' },
        { label: 'No Answer', value: 'no_answer' },
        { label: 'Busy', value: 'busy' },
        { label: 'Failed', value: 'failed' },
      ],
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New call",
        action: () => {
          setEditingCall(null);
          setFormMode("add");
          setDefaultView("quick");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  // Filter options for quick dropdown
  const filterOptions = useMemo(() => [
    {
      label: "All Calls",
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

  // Stats cards
  const stats = useMemo(() => {
    const totalCalls = apiStats?.total ?? totalItems;
    const inProgress = apiStats?.byStatus?.['in_progress'] ?? 0;
    const completed = apiStats?.byStatus?.['completed'] ?? 0;
    const overdue = apiStats?.overdue ?? 0;

    return [
      {
        label: "Total Calls",
        value: totalCalls,
        icon: Phone,
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
    if (selectedCalls.length === calls.length) {
      setSelectedCalls([]);
    } else {
      setSelectedCalls(calls.map((c) => c.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedCalls.includes(strId)) {
      setSelectedCalls(selectedCalls.filter((cId) => cId !== strId));
    } else {
      setSelectedCalls([...selectedCalls, strId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (call: CallViewModel) => {
    setCallToDelete(call);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!callToDelete?.id) return;

    setIsDeleting(true);

    try {
      await deleteCall.mutateAsync(callToDelete.id);
      setIsDeleteModalOpen(false);
      setCallToDelete(null);
    } catch (error) {
      console.error("Error deleting call:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCallToDelete(null);
  };

  // Bulk operation handlers
  const handleSelectAllCalls = () => {
    setSelectedCalls(calls.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCalls([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedCalls);
      setSelectedCalls([]);
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
        ids: selectedCalls,
        data: { status: status as CallFormData['status'] }
      });
      setSelectedCalls([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Bulk update error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedCalls.length === 0) {
      toast.error("No calls selected for export");
      return;
    }
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const params = new URLSearchParams({ type: "call", ids: selectedCalls.join(",") });
      const resp = await fetch(`${baseUrl}/crm/api/v1/activities/export?${params}`, {
        headers: { ...(TokenManager.getAccessToken() ? { Authorization: `Bearer ${TokenManager.getAccessToken()}` } : {}) },
      });
      if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selected-calls-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedCalls.length} calls`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export calls");
    }
  };

  // Filter chips
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
    clearModuleFilters('calls');
  };

  // Edit handler — fetches full call details from API
  const handleEditCall = async (call: CallViewModel) => {
    setFormMode("edit");

    try {
      const fullCall = await callsApi.getById(call.id);

      setEditingCall({
        id: fullCall.id,
        subject: fullCall.subject,
        description: fullCall.description,
        callDirection: fullCall.callDirection as Call["callDirection"],
        callOutcome: fullCall.callOutcome as Call["callOutcome"],
        status: fullCall.status,
        priority: fullCall.priority,
        dueDate: toDateInputValue(fullCall.dueDate),
        startTime: toDateTimeLocalValue(fullCall.startTime),
        endTime: toDateTimeLocalValue(fullCall.endTime),
        durationMinutes: fullCall.durationMinutes,
        assignedTo: fullCall.assignedTo,
        contactId: fullCall.contact?.id,
        companyId: fullCall.company?.id,
        dealId: fullCall.deal?.id,
        leadId: fullCall.lead?.id,
        reminderAt: toDateTimeLocalValue(fullCall.reminderAt),
      });
    } catch (error) {
      console.error("Failed to fetch call details:", error);
      toast.error("Failed to load call details");
      setEditingCall({
        id: call.id,
        subject: call.subject,
        description: call.description,
        callDirection: call.callDirection as Call["callDirection"],
        callOutcome: call.callOutcome as Call["callOutcome"],
        status: call.status,
        priority: call.priority,
        dueDate: toDateInputValue(call.dueDate),
        durationMinutes: call.durationMinutes,
        assignedTo: call.assignedTo,
      });
    }
    setFormDrawerOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: Partial<Call>) => {
    try {
      const callData: CallFormData = {
        subject: data.subject || "",
        description: data.description,
        callDirection: data.callDirection,
        callOutcome: data.callOutcome,
        status: data.status as CallFormData['status'],
        priority: data.priority as CallFormData['priority'],
        dueDate: data.dueDate,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        leadId: data.leadId,
        assignedTo: data.assignedTo,
        reminderAt: data.reminderAt,
      };

      if (formMode === "edit" && editingCall?.id) {
        await updateCall.mutateAsync({ id: editingCall.id, data: callData });
      } else {
        await createCall.mutateAsync(callData);
      }

      setFormDrawerOpen(false);
      setEditingCall(null);
    } catch (error) {
      throw error;
    }
  };

  // Table columns - no sorting (matches tasks pattern)
  const columns = useMemo(() => [
    {
      key: "subject",
      label: "Call",
      render: (_value: unknown, row: CallViewModel) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/activities/calls/${row.id}`)}
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
      key: "callDirection",
      label: "Direction",
      render: (value: string) => {
        const DirectionIcon = getDirectionIcon(value);
        return (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <DirectionIcon className="h-4 w-4 text-muted-foreground" />
            {DIRECTION_DISPLAY[value] || value || "—"}
          </div>
        );
      },
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
      key: "callOutcome",
      label: "Outcome",
      render: (value: string) => (
        <span className="text-sm text-foreground">
          {value ? (OUTCOME_DISPLAY[value] || value) : "—"}
        </span>
      ),
    },
    {
      key: "dueDate",
      label: "Date",
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: "durationMinutes",
      label: "Duration",
      render: (value: number) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {value ? `${value} min` : "—"}
        </div>
      ),
    },
    {
      key: "relatedTo",
      label: "Related To",
      render: (_value: unknown, row: CallViewModel) => (
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
      {/* Header */}
      <PageHeader
        title="Calls"
        icon={Phone}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} calls`}
        searchPlaceholder="Search calls by subject or description..."
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
                title="Filter calls by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Calls"}
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

            {can(ACTIVITIES_WRITE) && (
              <ExportButton
                exportUrl="/crm/api/v1/activities/export"
                exportParams={exportParams}
                filename="calls"
                totalRecords={totalItems}
              />
            )}
            {can(ACTIVITIES_WRITE) && (
              <Button
                onClick={() => {
                  setFormMode("add");
                  setEditingCall(null);
                  setDefaultView("quick");
                  setFormDrawerOpen(true);
                }}
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Log a new call"
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Call
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
      {selectedCalls.length > 0 && (can(ACTIVITIES_WRITE) || can(ACTIVITIES_DELETE)) && (
        <BulkActionsToolbar
          selectedCount={selectedCalls.length}
          totalCount={totalItems}
          onSelectAll={handleSelectAllCalls}
          onDeselectAll={handleDeselectAll}
          onDelete={can(ACTIVITIES_DELETE) ? () => setShowBulkDelete(true) : undefined}
          onExport={handleBulkExport}
          onUpdateStatus={can(ACTIVITIES_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined}
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
          data={calls}
          columns={columns}
          selectedIds={selectedCalls}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No calls found"
          emptyDescription="Try adjusting your search or filters, or log a new call"
          renderActions={(row: CallViewModel) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/activities/calls/${row.id}`),
                },
                ...(can(ACTIVITIES_WRITE)
                  ? [
                      { label: "Edit Call", icon: Edit, onClick: () => handleEditCall(row) },
                      { label: "Mark Complete", icon: Check, onClick: () => completeCall.mutateAsync(row.id) },
                    ]
                  : []),
                ...(can(ACTIVITIES_DELETE)
                  ? [
                      { divider: true, label: "", onClick: () => {} },
                      { label: "Delete", icon: Trash2, variant: "danger" as const, onClick: () => handleDeleteClick(row) },
                    ]
                  : []),
              ]}
            />
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calls.map((call, index) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/activities/calls/${call.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {call.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{call.subject}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {call.callDirection === "inbound" ? <PhoneIncoming className="h-3 w-3" /> : <PhoneOutgoing className="h-3 w-3" />}
                        {DIRECTION_DISPLAY[call.callDirection || ''] || call.callDirection}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/activities/calls/${call.id}`),
                        },
                        ...(can(ACTIVITIES_WRITE)
                          ? [
                              { label: "Edit Call", icon: Edit, onClick: () => handleEditCall(call) },
                              { label: "Mark Complete", icon: Check, onClick: () => completeCall.mutateAsync(call.id) },
                            ]
                          : []),
                        ...(can(ACTIVITIES_DELETE)
                          ? [
                              { divider: true, label: "", onClick: () => {} },
                              { label: "Delete", icon: Trash2, variant: "danger" as const, onClick: () => handleDeleteClick(call) },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </div>
                {call.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{call.description}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Date: {formatDate(call.dueDate)}</span>
                  </div>
                  {call.durationMinutes && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{call.durationMinutes} min</span>
                    </div>
                  )}
                  {call.relatedTo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flag className="h-4 w-4" />
                      <span>{call.relatedTo}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                    {STATUS_DISPLAY[call.status] || call.status}
                  </span>
                  {call.callOutcome && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {OUTCOME_DISPLAY[call.callOutcome] || call.callOutcome}
                    </span>
                  )}
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
          setSelectedCalls([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedCalls([]);
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
        title="Delete Call"
        description="Are you sure you want to delete this call? This will permanently remove it from your CRM and cannot be undone."
        itemName={callToDelete?.subject}
        itemType="Call"
        icon={Phone}
        isDeleting={isDeleting}
      />

      {/* Call Form Drawer */}
      <CallFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingCall(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCall}
        mode={formMode}
        defaultView={defaultView}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedCalls.length}
        itemName="call"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedCalls.length}
        title="Update Call Status"
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
