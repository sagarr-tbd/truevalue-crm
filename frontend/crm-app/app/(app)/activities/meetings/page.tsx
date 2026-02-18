"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Users,
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
import { MeetingFormDrawer } from "@/components/Forms/Activities";
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
  useMeetings,
  useCreateMeeting,
  useUpdateMeeting,
  useDeleteMeeting,
  useCompleteMeeting,
  useBulkDeleteMeetings,
  useBulkUpdateMeetings,
  type MeetingQueryParams,
  type MeetingViewModel,
  type MeetingFormData,
} from "@/lib/queries/useMeetings";
import { meetingsApi } from "@/lib/api/meetings";
import { useContactOptions } from "@/lib/queries/useContacts";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useDealOptions } from "@/lib/queries/useDeals";
import { useLeadOptions } from "@/lib/queries/useLeads";
import { useUIStore } from "@/stores";
import { usePermission, ACTIVITIES_WRITE, ACTIVITIES_DELETE } from "@/lib/permissions";
import type { Meeting } from "@/lib/types";

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

const PRIORITY_DISPLAY: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
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
    high: "bg-orange-50 text-orange-600",
    normal: "bg-accent/10 text-accent",
    low: "bg-muted text-muted-foreground",
  };
  return colors[priority] || "bg-muted text-muted-foreground";
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

export default function MeetingsPage() {
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

  const meetingsFilters = filters.meetings || {};

  const [searchQuery, setSearchQuery] = useState(meetingsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(meetingsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const { presets, addPreset, deletePreset } = useFilterPresets("meetings");

  // Entity options for advanced filters
  const { data: contactOptions = [] } = useContactOptions();
  const { data: companyOptions = [] } = useCompanyOptions();
  const { data: dealOptions = [] } = useDealOptions();
  const { data: leadOptions = [] } = useLeadOptions();

  const queryParams: MeetingQueryParams = useMemo(() => {
    const params: MeetingQueryParams = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter as MeetingQueryParams['status'] || undefined,
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

  const { data: meetingsResponse, isLoading } = useMeetings(queryParams);
  const meetings = useMemo(() => meetingsResponse?.data ?? [], [meetingsResponse?.data]);
  const totalItems = meetingsResponse?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const apiStats = meetingsResponse?.meta?.stats;

  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const completeMeeting = useCompleteMeeting();
  const bulkDelete = useBulkDeleteMeetings();
  const bulkUpdate = useBulkUpdateMeetings();

  useEffect(() => {
    setModuleFilters('meetings', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingViewModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Partial<Meeting> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const exportColumns: ExportColumn<MeetingViewModel>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'subject', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'priority', label: 'Priority', format: (v) => v ? PRIORITY_DISPLAY[String(v)] || String(v) : '' },
    { key: 'status', label: 'Status', format: (v) => v ? STATUS_DISPLAY[String(v)] || String(v) : '' },
    { key: 'dueDate', label: 'Date', format: (v) => v ? formatDate(String(v)) : '' },
    { key: 'durationMinutes', label: 'Duration (min)' },
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
      label: 'Title',
      type: 'text',
      placeholder: 'Enter meeting title...',
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
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
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
    shortcuts: [{
      key: "n",
      meta: true,
      ctrl: true,
      description: "New meeting",
      action: () => {
        setEditingMeeting(null);
        setFormMode("add");
        setDefaultView("quick");
        setFormDrawerOpen(true);
      },
    }],
  });

  const filterOptions = useMemo(() => [
    { label: "All Meetings", value: null, count: apiStats?.total ?? totalItems },
    { label: "Pending", value: "pending", count: apiStats?.byStatus?.['pending'] ?? 0 },
    { label: "In Progress", value: "in_progress", count: apiStats?.byStatus?.['in_progress'] ?? 0 },
    { label: "Completed", value: "completed", count: apiStats?.byStatus?.['completed'] ?? 0 },
    { label: "Cancelled", value: "cancelled", count: apiStats?.byStatus?.['cancelled'] ?? 0 },
  ], [apiStats, totalItems]);

  const stats = useMemo(() => [
    { label: "Total Meetings", value: apiStats?.total ?? totalItems, icon: Users, iconBgColor: "bg-primary/10", iconColor: "text-primary" },
    { label: "In Progress", value: apiStats?.byStatus?.['in_progress'] ?? 0, icon: Clock, iconBgColor: "bg-accent/10", iconColor: "text-accent" },
    { label: "Completed", value: apiStats?.byStatus?.['completed'] ?? 0, icon: Check, iconBgColor: "bg-primary/20", iconColor: "text-primary" },
    { label: "Overdue", value: apiStats?.overdue ?? 0, icon: AlertCircle, iconBgColor: "bg-destructive/10", iconColor: "text-destructive" },
  ], [apiStats, totalItems]);

  const handleSelectAll = () => {
    setSelectedMeetings(selectedMeetings.length === meetings.length ? [] : meetings.map(m => m.id));
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    setSelectedMeetings(prev => prev.includes(strId) ? prev.filter(mId => mId !== strId) : [...prev, strId]);
  };

  const handleDeleteClick = (meeting: MeetingViewModel) => {
    setMeetingToDelete(meeting);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!meetingToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteMeeting.mutateAsync(meetingToDelete.id);
      setIsDeleteModalOpen(false);
      setMeetingToDelete(null);
    } catch (error) {
      console.error("Error deleting meeting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setMeetingToDelete(null);
  };

  const handleSelectAllMeetings = () => { setSelectedMeetings(meetings.map(m => m.id)); };
  const handleDeselectAll = () => { setSelectedMeetings([]); };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedMeetings);
      setSelectedMeetings([]);
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
      await bulkUpdate.mutateAsync({ ids: selectedMeetings, data: { status: status as MeetingFormData['status'] } });
      setSelectedMeetings([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Bulk update error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = meetings.filter(m => selectedMeetings.includes(m.id));
    if (selectedData.length === 0) { toast.error("No meetings selected for export"); return; }
    try {
      exportToCSV(selectedData, exportColumns, `selected-meetings-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Successfully exported ${selectedData.length} meetings`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export meetings");
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
      chips.push({ id: 'status-filter', label: 'Status', value: STATUS_DISPLAY[statusFilter] || statusFilter, color: 'primary' });
    }
    if (filterGroup && filterGroup.conditions.length > 0) {
      filterGroup.conditions.forEach((condition, index) => {
        const field = filterFields.find(f => f.key === condition.field);
        const displayValue = getFilterDisplayValue(field, condition.value);
        chips.push({ id: `advanced-filter-${index}`, label: field?.label || condition.field, value: `${condition.operator}: ${displayValue}`, color: 'secondary' });
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
        setFilterGroup(newConditions.length === 0 ? null : { ...filterGroup, conditions: newConditions });
      }
    }
  };

  const handleClearAllFilters = () => {
    setStatusFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    clearModuleFilters('meetings');
  };

  const handleEditMeeting = async (meeting: MeetingViewModel) => {
    setFormMode("edit");
    try {
      const fullMeeting = await meetingsApi.getById(meeting.id);
      setEditingMeeting({
        id: fullMeeting.id,
        subject: fullMeeting.subject,
        description: fullMeeting.description,
        status: fullMeeting.status,
        priority: fullMeeting.priority,
        dueDate: toDateInputValue(fullMeeting.dueDate),
        startTime: toDateTimeLocalValue(fullMeeting.startTime),
        endTime: toDateTimeLocalValue(fullMeeting.endTime),
        durationMinutes: fullMeeting.durationMinutes,
        assignedTo: fullMeeting.assignedTo,
        contactId: fullMeeting.contact?.id,
        companyId: fullMeeting.company?.id,
        dealId: fullMeeting.deal?.id,
        leadId: fullMeeting.lead?.id,
        reminderAt: toDateTimeLocalValue(fullMeeting.reminderAt),
      });
    } catch (error) {
      console.error("Failed to fetch meeting details:", error);
      toast.error("Failed to load meeting details");
      setEditingMeeting({
        id: meeting.id,
        subject: meeting.subject,
        description: meeting.description,
        status: meeting.status,
        priority: meeting.priority,
        dueDate: toDateInputValue(meeting.dueDate),
        durationMinutes: meeting.durationMinutes,
        assignedTo: meeting.assignedTo,
      });
    }
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Meeting>) => {
    try {
      const meetingData: MeetingFormData = {
        subject: data.subject || "",
        description: data.description,
        status: data.status as MeetingFormData['status'],
        priority: data.priority as MeetingFormData['priority'],
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

      if (formMode === "edit" && editingMeeting?.id) {
        await updateMeeting.mutateAsync({ id: editingMeeting.id, data: meetingData });
      } else {
        await createMeeting.mutateAsync(meetingData);
      }

      setFormDrawerOpen(false);
      setEditingMeeting(null);
    } catch (error) {
      throw error;
    }
  };

  const columns = useMemo(() => [
    {
      key: "subject",
      label: "Meeting",
      render: (_value: unknown, row: MeetingViewModel) => (
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push(`/activities/meetings/${row.id}`)}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">{row.initials}</div>
          <div>
            <div className="font-semibold text-foreground">{row.subject}</div>
            {row.description && <div className="text-sm text-muted-foreground line-clamp-1">{row.description}</div>}
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
      render: (_value: unknown, row: MeetingViewModel) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {row.relatedTo ? (
            <>
              <Flag className="h-4 w-4" />
              <span>{row.relatedTo}</span>
              {row.relatedToType && <span className="text-xs text-muted-foreground/60">({row.relatedToType})</span>}
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
      <PageHeader
        title="Meetings"
        icon={Users}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} meetings`}
        searchPlaceholder="Search meetings by title or description..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toggleStats()} title={showStats ? "Hide Statistics" : "Show Statistics"}>
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} />
            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} title="Open advanced filters" className="sm:hidden">
              <Filter className="h-4 w-4" />
              {filterGroup && filterGroup.conditions.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">{filterGroup.conditions.length}</span>}
            </Button>

            <div className="relative" ref={filterDropdownRef}>
              <Button variant="outline" size="sm" onClick={() => setShowFilterDropdown(!showFilterDropdown)} title="Filter meetings by status">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find(f => f.value === statusFilter)?.label : "All Meetings"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.1 }} className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border py-2 z-50">
                    {filterOptions.map(option => (
                      <button key={option.value || "all"} onClick={() => { setStatusFilter(option.value); setShowFilterDropdown(false); setCurrentPage(1); }} className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <span>{option.label}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{option.count}</span>
                        </div>
                        {statusFilter === option.value && <Check className="h-4 w-4 text-brand-teal" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} title="Open advanced filters" className="hidden sm:flex">
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Advanced Filters</span>
              <span className="md:hidden">Advanced</span>
              {filterGroup && filterGroup.conditions.length > 0 && <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">{filterGroup.conditions.length}</span>}
            </Button>

            {can(ACTIVITIES_WRITE) && (
              <ExportButton data={meetings} columns={exportColumns} filename={`meetings-${new Date().toISOString().split('T')[0]}`} title="Meetings Export" />
            )}
            {can(ACTIVITIES_WRITE) && (
              <Button onClick={() => { setFormMode("add"); setEditingMeeting(null); setDefaultView("quick"); setFormDrawerOpen(true); }} className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90" title="Schedule a new meeting">
                <Plus className="h-4 w-4 mr-2" />
                Add Meeting
              </Button>
            )}
          </>
        }
      />

      {filterChips.length > 0 && <FilterChips chips={filterChips} onRemove={handleRemoveFilterChip} onClearAll={handleClearAllFilters} />}

      <AdvancedFilter fields={filterFields} onApply={(group) => { setFilterGroup(group); setCurrentPage(1); }} onClear={() => { setFilterGroup(null); setCurrentPage(1); }} initialGroup={filterGroup || undefined} presets={presets} onSavePreset={addPreset} onLoadPreset={(preset) => { setFilterGroup(preset.group); setCurrentPage(1); }} onDeletePreset={deletePreset} isDrawer={true} isOpen={showAdvancedFilter} onClose={() => setShowAdvancedFilter(false)} drawerPosition="right" />

      {selectedMeetings.length > 0 && (can(ACTIVITIES_WRITE) || can(ACTIVITIES_DELETE)) && (
        <BulkActionsToolbar selectedCount={selectedMeetings.length} totalCount={totalItems} onSelectAll={handleSelectAllMeetings} onDeselectAll={handleDeselectAll} onDelete={can(ACTIVITIES_DELETE) ? () => setShowBulkDelete(true) : undefined} onExport={handleBulkExport} onUpdateStatus={can(ACTIVITIES_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined} isProcessing={isBulkProcessing} />
      )}

      <AnimatePresence>{showStats && <StatsCards stats={stats} columns={4} />}</AnimatePresence>

      {viewMode === "list" ? (
        <DataTable
          data={meetings}
          columns={columns}
          selectedIds={selectedMeetings}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No meetings found"
          emptyDescription="Try adjusting your search or filters, or schedule a new meeting"
          renderActions={(row: MeetingViewModel) => (
            <ActionMenu items={[
              { label: "View Details", icon: FileText, onClick: () => router.push(`/activities/meetings/${row.id}`) },
              { label: "Edit Meeting", icon: Edit, onClick: () => handleEditMeeting(row) },
              { label: "Mark Complete", icon: Check, onClick: () => completeMeeting.mutateAsync(row.id) },
              { divider: true, label: "", onClick: () => {} },
              { label: "Delete", icon: Trash2, variant: "danger" as const, onClick: () => handleDeleteClick(row) },
            ].filter(item => {
              if (item.label === "Delete") return can(ACTIVITIES_DELETE);
              if (["Edit", "Edit Meeting"].includes(item.label || "")) return can(ACTIVITIES_WRITE);
              return true;
            })} />
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting, index) => (
            <motion.div key={meeting.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/activities/meetings/${meeting.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">{meeting.initials}</div>
                    <div>
                      <h3 className="font-semibold text-foreground">{meeting.subject}</h3>
                      {meeting.relatedTo && <p className="text-sm text-muted-foreground">{meeting.relatedTo}</p>}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu items={[
                      { label: "View Details", icon: FileText, onClick: () => router.push(`/activities/meetings/${meeting.id}`) },
                      { label: "Edit Meeting", icon: Edit, onClick: () => handleEditMeeting(meeting) },
                      { label: "Mark Complete", icon: Check, onClick: () => completeMeeting.mutateAsync(meeting.id) },
                      { divider: true, label: "", onClick: () => {} },
                      { label: "Delete", icon: Trash2, variant: "danger" as const, onClick: () => handleDeleteClick(meeting) },
                    ].filter(item => {
                      if (item.label === "Delete") return can(ACTIVITIES_DELETE);
                      if (["Edit", "Edit Meeting"].includes(item.label || "")) return can(ACTIVITIES_WRITE);
                      return true;
                    })} />
                  </div>
                </div>
                {meeting.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{meeting.description}</p>}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /><span>Date: {formatDate(meeting.dueDate)}</span></div>
                  {meeting.durationMinutes && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /><span>{meeting.durationMinutes} min</span></div>}
                  {meeting.relatedTo && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Flag className="h-4 w-4" /><span>{meeting.relatedTo}</span></div>}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>{STATUS_DISPLAY[meeting.status] || meeting.status}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(meeting.priority)}`}>{PRIORITY_DISPLAY[meeting.priority] || meeting.priority}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <DataPagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={(page) => { setCurrentPage(page); setSelectedMeetings([]); }} onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); setSelectedMeetings([]); }} filterInfo={statusFilter ? `filtered by ${STATUS_DISPLAY[statusFilter] || statusFilter}` : undefined} />

      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} title="Delete Meeting" description="Are you sure you want to delete this meeting? This will permanently remove it from your CRM and cannot be undone." itemName={meetingToDelete?.subject} itemType="Meeting" icon={Users} isDeleting={isDeleting} />

      <MeetingFormDrawer isOpen={formDrawerOpen} onClose={() => { setFormDrawerOpen(false); setEditingMeeting(null); }} onSubmit={handleFormSubmit} initialData={editingMeeting} mode={formMode} defaultView={defaultView} />

      <BulkDeleteModal isOpen={showBulkDelete} onClose={() => setShowBulkDelete(false)} onConfirm={handleBulkDelete} itemCount={selectedMeetings.length} itemName="meeting" />

      <BulkUpdateModal<string> isOpen={showBulkUpdateStatus} onClose={() => setShowBulkUpdateStatus(false)} onConfirm={handleBulkUpdateStatus} itemCount={selectedMeetings.length} title="Update Meeting Status" field="Status" options={[
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ]} />
    </div>
  );
}
