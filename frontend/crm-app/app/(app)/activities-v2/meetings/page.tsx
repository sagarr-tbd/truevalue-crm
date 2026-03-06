"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Calendar as CalendarIcon,
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
  Users,
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
import { usePermission, ACTIVITIES_WRITE, ACTIVITIES_DELETE } from "@/lib/permissions";
import { TokenManager } from "@/lib/api/client";

const DeleteConfirmationModal = dynamic(
  () => import("@/components/DeleteConfirmationModal"),
  { ssr: false }
);

const BulkDeleteModal = dynamic(
  () => import("@/components/BulkDeleteModal").then((mod) => ({ default: mod.BulkDeleteModal })),
  { ssr: false }
);

import { BulkUpdateModal } from "@/components/BulkUpdateModal";

const PRIORITY_DISPLAY: Record<string, string> = {
  urgent: "Urgent", high: "High", normal: "Normal", low: "Low",
};

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Pending", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
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
    return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return isoDate; }
}

function getInitialsFromSubject(subject?: string | null): string {
  if (!subject?.trim()) return "M";
  const words = subject.trim().split(/\s+/);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return subject.slice(0, 2).toUpperCase();
}

export default function MeetingsV2Page() {
  const router = useRouter();
  const { viewMode, showStats, setViewMode, toggleStats, filters, setModuleFilters, clearModuleFilters, defaultItemsPerPage: defaultPerPage } = useUIStore();
  const { can } = usePermission();

  const meetingsFilters = (filters as Record<string, Record<string, unknown>>)["meetings-v2"] || {};
  const [searchQuery, setSearchQuery] = useState<string>((meetingsFilters.search as string) || "");
  const [statusFilter, setStatusFilter] = useState<string | null>((meetingsFilters.status as string) || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { presets, addPreset, deletePreset } = useFilterPresets("meetings-v2");
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const queryParams = useMemo<ActivityV2ListParams>(() => {
    const params: ActivityV2ListParams = {
      activity_type: "meeting",
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter || undefined,
    };
    if (filterGroup && filterGroup.conditions.length > 0) {
      const statusCond = filterGroup.conditions.find((c) => c.field === "status");
      const priorityCond = filterGroup.conditions.find((c) => c.field === "priority");
      if (statusCond?.value) params.status = statusCond.value;
      if (priorityCond?.value) params.priority = priorityCond.value;
    }
    return params;
  }, [currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, filterGroup]);

  const { data: response, isLoading } = useActivitiesV2(queryParams);
  const { data: statsData } = useActivitiesV2Stats("meeting");

  const createActivity = useCreateActivityV2();
  const updateActivity = useUpdateActivityV2();
  const deleteActivity = useDeleteActivityV2();
  const completeActivity = useCompleteActivityV2();
  const bulkDelete = useBulkDeleteActivitiesV2();
  const bulkUpdate = useBulkUpdateActivitiesV2();

  const meetings = response?.results || [];
  const totalItems = response?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    (setModuleFilters as (m: string, f: Record<string, unknown>) => void)("meetings-v2", { search: searchQuery, status: statusFilter });
  }, [searchQuery, statusFilter, setModuleFilters]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearchQuery, statusFilter, filterGroup]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ActivityV2 | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityV2 | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterDropdown]);

  useKeyboardShortcuts({
    shortcuts: [{ key: "n", meta: true, ctrl: true, description: "New meeting", action: () => { if (!can(ACTIVITIES_WRITE)) return; setEditingItem(null); setFormMode("add"); setFormDrawerOpen(true); } }],
  });

  const filterOptions = useMemo(() => {
    const byStatus = statsData?.by_status || {};
    const total = statsData?.total ?? totalItems;
    return [
      { label: "All Meetings", value: null, count: total },
      { label: "Pending", value: "pending", count: byStatus.pending || 0 },
      { label: "In Progress", value: "in_progress", count: byStatus.in_progress || 0 },
      { label: "Completed", value: "completed", count: byStatus.completed || 0 },
      { label: "Cancelled", value: "cancelled", count: byStatus.cancelled || 0 },
    ];
  }, [statsData, totalItems]);

  const stats = useMemo(() => [
    { label: "Total Meetings", value: statsData?.total ?? totalItems, icon: Users, iconBgColor: "bg-primary/10", iconColor: "text-primary" },
    { label: "In Progress", value: statsData?.by_status?.in_progress ?? 0, icon: Clock, iconBgColor: "bg-accent/10", iconColor: "text-accent" },
    { label: "Completed", value: statsData?.by_status?.completed ?? 0, icon: Check, iconBgColor: "bg-primary/20", iconColor: "text-primary" },
    { label: "Overdue", value: statsData?.overdue ?? 0, icon: AlertCircle, iconBgColor: "bg-destructive/10", iconColor: "text-destructive" },
  ], [statsData, totalItems]);

  const handleSelectAll = () => { setSelectedItems(selectedItems.length === meetings.length ? [] : meetings.map(m => m.id)); };
  const handleSelectRow = (id: string | number) => { const s = String(id); setSelectedItems(selectedItems.includes(s) ? selectedItems.filter(i => i !== s) : [...selectedItems, s]); };

  const handleDeleteClick = (item: ActivityV2) => { setItemToDelete(item); setIsDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    try { await deleteActivity.mutateAsync(itemToDelete.id); toast.success("Meeting deleted"); setIsDeleteModalOpen(false); setItemToDelete(null); }
    catch { toast.error("Failed to delete meeting"); }
    finally { setIsDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try { await bulkDelete.mutateAsync(selectedItems); setSelectedItems([]); setShowBulkDelete(false); toast.success("Meetings deleted"); }
    catch { toast.error("Failed to delete meetings"); }
    finally { setIsBulkProcessing(false); }
  };

  const handleBulkUpdateStatus = async (newStatus: "pending" | "in_progress" | "completed" | "cancelled") => {
    setIsBulkProcessing(true);
    try { await bulkUpdate.mutateAsync({ ids: selectedItems, updates: { status: newStatus } }); setSelectedItems([]); setShowBulkUpdateStatus(false); toast.success("Meetings updated"); }
    catch { toast.error("Failed to update meetings"); }
    finally { setIsBulkProcessing(false); }
  };

  const exportParams = useMemo(() => {
    const p: Record<string, string> = { activity_type: "meeting" };
    if (debouncedSearchQuery) p.search = debouncedSearchQuery;
    if (statusFilter) p.status = statusFilter;
    if (filterGroup && filterGroup.conditions.length > 0) {
      const statusCond = filterGroup.conditions.find((c) => c.field === "status");
      const priorityCond = filterGroup.conditions.find((c) => c.field === "priority");
      if (statusCond?.value) p.status = statusCond.value;
      if (priorityCond?.value) p.priority = priorityCond.value;
    }
    return p;
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  const handleBulkExport = async () => {
    if (selectedItems.length === 0) {
      toast.error("No meetings selected for export");
      return;
    }
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const params = new URLSearchParams({ activity_type: "meeting", ids: selectedItems.join(",") });
      const resp = await fetch(`${baseUrl}/crm/api/v2/activities/export/?${params}`, {
        headers: {
          ...(TokenManager.getAccessToken() ? { Authorization: `Bearer ${TokenManager.getAccessToken()}` } : {}),
        },
      });
      if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selected-meetings-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedItems.length} meetings`);
    } catch {
      toast.error("Failed to export meetings");
    }
  };

  const handleEditItem = useCallback((item: ActivityV2) => {
    setFormMode("edit");
    const full = meetings.find(m => m.id === item.id);
    if (full) { setEditingItem(full); setFormDrawerOpen(true); }
  }, [meetings]);

  const handleFormSubmit = async (data: CreateActivityV2Input) => {
    try {
      if (formMode === "edit" && editingItem?.id) { await updateActivity.mutateAsync({ id: editingItem.id, data }); }
      else { await createActivity.mutateAsync(data); }
      setFormDrawerOpen(false); setEditingItem(null);
      toast.success(formMode === "edit" ? "Meeting updated" : "Meeting created");
    } catch { throw new Error("Failed to save meeting"); }
  };

  const filterFields: FilterField[] = useMemo(() => [
    { key: "status", label: "Status", type: "select", options: [{ label: "Pending", value: "pending" }, { label: "In Progress", value: "in_progress" }, { label: "Completed", value: "completed" }, { label: "Cancelled", value: "cancelled" }] },
    { key: "subject", label: "Subject", type: "text", placeholder: "Enter meeting subject..." },
    { key: "priority", label: "Priority", type: "select", options: [{ label: "Urgent", value: "urgent" }, { label: "High", value: "high" }, { label: "Normal", value: "normal" }, { label: "Low", value: "low" }] },
  ], []);

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (statusFilter) chips.push({ id: "status-filter", label: "Status", value: STATUS_DISPLAY[statusFilter] || statusFilter, color: "primary" });
    if (filterGroup && filterGroup.conditions.length > 0) {
      filterGroup.conditions.forEach((c, i) => {
        const f = filterFields.find(ff => ff.key === c.field);
        const dv = f?.type === "select" && f.options ? f.options.find(o => o.value === c.value)?.label || c.value : c.value;
        chips.push({ id: `advanced-filter-${i}`, label: f?.label || c.field, value: `${c.operator}: ${dv}`, color: "secondary" });
      });
    }
    return chips;
  }, [statusFilter, filterGroup, filterFields]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === "status-filter") setStatusFilter(null);
    else if (chipId.startsWith("advanced-filter") && filterGroup) {
      const idx = parseInt(chipId.split("-")[2], 10);
      const nc = filterGroup.conditions.filter((_, i) => i !== idx);
      setFilterGroup(nc.length === 0 ? null : { ...filterGroup, conditions: nc });
    }
  };

  const handleClearAllFilters = () => { setStatusFilter(null); setSearchQuery(""); setFilterGroup(null); (clearModuleFilters as (m: string) => void)("meetings-v2"); };

  const columns = useMemo(() => [
    {
      key: "subject", label: "Meeting",
      render: (_v: unknown, row: ActivityV2) => (
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push(`/activities-v2/meetings/${row.id}`)}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">{getInitialsFromSubject(row.subject)}</div>
          <div><div className="font-semibold text-foreground">{row.subject}</div>{row.description && <div className="text-sm text-muted-foreground line-clamp-1">{row.description}</div>}</div>
        </div>
      ),
    },
    { key: "priority", label: "Priority", render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(v)}`}>{PRIORITY_DISPLAY[v] || v}</span> },
    { key: "status", label: "Status", render: (v: string) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(v)}`}>{STATUS_DISPLAY[v] || v}</span> },
    { key: "due_date", label: "Date", render: (v: string) => <div className="flex items-center gap-2 text-sm text-foreground"><CalendarIcon className="h-4 w-4 text-muted-foreground" />{formatDate(v)}</div> },
    { key: "duration_minutes", label: "Duration", render: (v: number | null) => <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{v ? `${v} min` : "—"}</div> },
    {
      key: "related_to", label: "Related To",
      render: (_v: unknown, row: ActivityV2) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {row.display_contact || row.display_company ? <><Flag className="h-4 w-4" /><span>{row.display_contact || row.display_company}</span></> : <span className="text-muted-foreground/50">—</span>}
        </div>
      ),
    },
    { key: "created_at", label: "Created", render: (v: string) => <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarIcon className="h-4 w-4" />{formatDate(v)}</div> },
  ], [router]);

  const actionMenuItems = useCallback((item: ActivityV2) => [
    { label: "View Details", icon: FileText, onClick: () => router.push(`/activities-v2/meetings/${item.id}`) },
    ...(can(ACTIVITIES_WRITE) ? [
      { label: "Edit Meeting", icon: Edit, onClick: () => handleEditItem(item) },
      { label: "Mark Complete", icon: Check, onClick: () => { completeActivity.mutate(item.id); toast.success("Meeting marked complete"); } },
    ] : []),
    ...(can(ACTIVITIES_DELETE) ? [
      { divider: true, label: "", onClick: () => {} },
      { label: "Delete", icon: Trash2, variant: "danger" as const, onClick: () => handleDeleteClick(item) },
    ] : []),
  ], [router, can, handleEditItem, completeActivity]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meetings"
        icon={Users}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} meetings`}
        searchPlaceholder="Search meetings by subject or description..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toggleStats()} title={showStats ? "Hide Statistics" : "Show Statistics"}>
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} />
            <div className="relative" ref={filterDropdownRef}>
              <Button variant="outline" size="sm" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                <Filter className="h-4 w-4 mr-2" />{statusFilter ? filterOptions.find(f => f.value === statusFilter)?.label : "All Meetings"}<ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.1 }} className="absolute right-0 mt-2 w-56 bg-background rounded-lg shadow-lg border border-border py-2 z-50">
                    {filterOptions.map(option => (
                      <button key={option.value ?? "all"} onClick={() => { setStatusFilter(option.value); setShowFilterDropdown(false); setCurrentPage(1); }} className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3"><span>{option.label}</span><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{option.count}</span></div>
                        {statusFilter === option.value && <Check className="h-4 w-4 text-brand-teal" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}>
              <Filter className="h-4 w-4 mr-2" /><span className="hidden md:inline">Advanced Filters</span><span className="md:hidden">Advanced</span>
              {filterGroup && filterGroup.conditions.length > 0 && <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">{filterGroup.conditions.length}</span>}
            </Button>
            {can(ACTIVITIES_WRITE) && (
              <ExportButton exportUrl="/crm/api/v2/activities/export/" exportParams={exportParams} filename="meetings" totalRecords={totalItems} />
            )}
            {can(ACTIVITIES_WRITE) && (
              <Button onClick={() => { setFormMode("add"); setEditingItem(null); setFormDrawerOpen(true); }} className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90" title="Schedule a new meeting">
                <Plus className="h-4 w-4 mr-2" />Add Meeting
              </Button>
            )}
          </>
        }
      />

      {filterChips.length > 0 && <FilterChips chips={filterChips} onRemove={handleRemoveFilterChip} onClearAll={handleClearAllFilters} />}

      <AdvancedFilter fields={filterFields} onApply={(g) => { setFilterGroup(g); setCurrentPage(1); }} onClear={() => { setFilterGroup(null); setCurrentPage(1); }} initialGroup={filterGroup ?? undefined} presets={presets} onSavePreset={addPreset} onLoadPreset={(p) => { setFilterGroup(p.group); setCurrentPage(1); }} onDeletePreset={deletePreset} isDrawer isOpen={showAdvancedFilter} onClose={() => setShowAdvancedFilter(false)} drawerPosition="right" />

      {selectedItems.length > 0 && (can(ACTIVITIES_WRITE) || can(ACTIVITIES_DELETE)) && (
        <BulkActionsToolbar selectedCount={selectedItems.length} totalCount={totalItems} onSelectAll={() => setSelectedItems(meetings.map(m => m.id))} onDeselectAll={() => setSelectedItems([])} onDelete={can(ACTIVITIES_DELETE) ? () => setShowBulkDelete(true) : undefined} onExport={handleBulkExport} onUpdateStatus={can(ACTIVITIES_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined} isProcessing={isBulkProcessing} />
      )}

      <AnimatePresence>{showStats && <StatsCards stats={stats} columns={4} />}</AnimatePresence>

      {viewMode === "list" ? (
        <DataTable data={meetings} columns={columns} selectedIds={selectedItems} onSelectAll={handleSelectAll} onSelectRow={handleSelectRow} showSelection={can(ACTIVITIES_WRITE) || can(ACTIVITIES_DELETE)} loading={isLoading} emptyMessage="No meetings found" emptyDescription="Try adjusting your search or filters, or schedule a new meeting"
          renderActions={(row: ActivityV2) => <ActionMenu items={actionMenuItems(row)} />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/activities-v2/meetings/${item.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">{getInitialsFromSubject(item.subject)}</div>
                    <div><h3 className="font-semibold text-foreground">{item.subject}</h3>{(item.display_contact || item.display_company) && <p className="text-sm text-muted-foreground">{item.display_contact || item.display_company}</p>}</div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}><ActionMenu items={actionMenuItems(item)} /></div>
                </div>
                {item.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarIcon className="h-4 w-4" /><span>Date: {formatDate(item.due_date)}</span></div>
                  {item.duration_minutes && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /><span>{item.duration_minutes} min</span></div>}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{STATUS_DISPLAY[item.status] || item.status}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>{PRIORITY_DISPLAY[item.priority] || item.priority}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <DataPagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={(p) => { setCurrentPage(p); setSelectedItems([]); }} onItemsPerPageChange={(i) => { setItemsPerPage(i); setCurrentPage(1); setSelectedItems([]); }} filterInfo={statusFilter ? `filtered by ${STATUS_DISPLAY[statusFilter] || statusFilter}` : undefined} />

      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }} onConfirm={handleDeleteConfirm} title="Delete Meeting" description="Are you sure you want to delete this meeting? This will permanently remove it from your CRM and cannot be undone." itemName={itemToDelete?.subject} itemType="Meeting" icon={Users} isDeleting={isDeleting} />

      <ActivityV2FormDrawer isOpen={formDrawerOpen} onClose={() => { setFormDrawerOpen(false); setEditingItem(null); }} onSubmit={handleFormSubmit} initialData={editingItem} mode={formMode} activityType="meeting" />

      <BulkDeleteModal isOpen={showBulkDelete} onClose={() => setShowBulkDelete(false)} onConfirm={handleBulkDelete} itemCount={selectedItems.length} itemName="meeting" />

      <BulkUpdateModal<"pending" | "in_progress" | "completed" | "cancelled">
        isOpen={showBulkUpdateStatus} onClose={() => setShowBulkUpdateStatus(false)} onConfirm={handleBulkUpdateStatus} itemCount={selectedItems.length} title="Update Meeting Status" field="Status"
        options={[{ label: "Pending", value: "pending" }, { label: "In Progress", value: "in_progress" }, { label: "Completed", value: "completed" }, { label: "Cancelled", value: "cancelled" }]}
      />
    </div>
  );
}
