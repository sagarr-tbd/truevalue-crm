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
  User,
  PhoneIncoming,
  PhoneOutgoing,
  ChevronDown,
  Check,
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
import type { CallDisplay } from "@/lib/api/mock/calls";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useCalls, 
  useCreateCall,
  useUpdateCall,
  useDeleteCall, 
  useBulkDeleteCalls, 
  useBulkUpdateCalls 
} from "@/lib/queries/useCalls";
import { useUIStore } from "@/stores";

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

export default function CallsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: calls = [], isLoading } = useCalls();
  const createCall = useCreateCall();
  const updateCall = useUpdateCall();
  const deleteCall = useDeleteCall();
  const bulkDelete = useBulkDeleteCalls();
  const bulkUpdate = useBulkUpdateCalls();
  
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
  
  // Initialize filters from store
  const callsFilters = filters.calls || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(callsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(callsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedCalls, setSelectedCalls] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Advanced filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  
  // Filter presets
  const {
    presets: filterPresets,
    addPreset,
    deletePreset,
  } = useFilterPresets("calls");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('calls', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [callToDelete, setCallToDelete] = useState<typeof calls[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<Partial<CallDisplay> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof calls[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'description', label: 'Description' },
    { key: 'direction', label: 'Direction' },
    { key: 'status', label: 'Status' },
    { key: 'duration', label: 'Duration' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'contactName', label: 'Contact Name' },
    { key: 'contactPhone', label: 'Contact Phone' },
    { key: 'relatedTo', label: 'Related To' },
    { key: 'callBy', label: 'Call By' },
    { key: 'outcome', label: 'Outcome' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'subject',
      label: 'Subject',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Missed', value: 'Missed' },
      ],
    },
    {
      key: 'direction',
      label: 'Direction',
      type: 'select',
      options: [
        { label: 'Incoming', value: 'Incoming' },
        { label: 'Outgoing', value: 'Outgoing' },
      ],
    },
    {
      key: 'contactName',
      label: 'Contact Name',
      type: 'text',
    },
    {
      key: 'relatedTo',
      label: 'Related To',
      type: 'text',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredCalls = useMemo(() => {
    let filtered = calls;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (call) =>
          call.subject?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          call.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          call.contactName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          call.relatedTo?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((call) => call.status === statusFilter);
    }

    // Advanced filter
    if (filterGroup && filterGroup.conditions.length > 0) {
      filtered = filterData(filtered, filterGroup);
    }

    // Sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof typeof a];
        const bValue = b[sortColumn as keyof typeof b];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [calls, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCalls.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCalls, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalCalls = calls.length;
    const scheduled = calls.filter((c) => c.status === "Scheduled").length;
    const completed = calls.filter((c) => c.status === "Completed").length;
    const missed = calls.filter((c) => c.status === "Missed").length;

    return [
      {
        label: "Total Calls",
        value: totalCalls,
        icon: Phone,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Scheduled",
        value: scheduled,
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
        trend: { value: 15, isPositive: true },
      },
      {
        label: "Missed",
        value: missed,
        icon: PhoneIncoming,
        iconBgColor: "bg-destructive/10",
        iconColor: "text-destructive",
      },
    ];
  }, [calls]);

  // Filter dropdown ref for click outside
  const filterDropdownRef = useRef<HTMLDivElement>(null);

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

  // Filter options
  const filterOptions = useMemo(() => [
    {
      label: "All Calls",
      value: null,
      count: calls.length,
    },
    {
      label: "Scheduled",
      value: "Scheduled",
      count: calls.filter((c) => c.status === "Scheduled").length,
    },
    {
      label: "Completed",
      value: "Completed",
      count: calls.filter((c) => c.status === "Completed").length,
    },
    {
      label: "Missed",
      value: "Missed",
      count: calls.filter((c) => c.status === "Missed").length,
    },
  ], [calls]);

  // Handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedCalls.length === paginatedCalls.length) {
      setSelectedCalls([]);
    } else {
      setSelectedCalls(paginatedCalls.map((c) => c.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedCalls.includes(numId)) {
      setSelectedCalls(selectedCalls.filter((cId) => cId !== numId));
    } else {
      setSelectedCalls([...selectedCalls, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (call: typeof calls[0]) => {
    setCallToDelete(call);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!callToDelete?.id) return;
    
    try {
      await deleteCall.mutateAsync(callToDelete.id);
      setIsDeleteModalOpen(false);
      setCallToDelete(null);
    } catch {
      // Error is handled by React Query hook
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCallToDelete(null);
  };

  // Form handlers
  const handleAddCall = () => {
    setFormMode("add");
    setEditingCall(null);
    setFormDrawerOpen(true);
  };

  const handleEditCall = (call: typeof calls[0]) => {
    setFormMode("edit");
    setEditingCall({
      subject: call.subject,
      description: call.description,
      direction: call.direction,
      status: call.status,
      duration: call.duration,
      date: call.date,
      time: call.time,
      contactName: call.contactName,
      contactPhone: call.contactPhone,
      relatedTo: call.relatedTo,
      callBy: call.callBy,
      outcome: call.outcome,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<CallDisplay>) => {
    try {
      if (formMode === "add") {
        await createCall.mutateAsync(data);
      } else if (editingCall) {
        // Find the call ID from the calls list
        const callToUpdate = calls.find(c => 
          c.subject === editingCall.subject ||
          (c.date === editingCall.date && c.contactName === editingCall.contactName)
        );
        
        if (callToUpdate?.id) {
          await updateCall.mutateAsync({ id: callToUpdate.id, data });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingCall(null);
    } catch (error) {
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllCalls = () => {
    setSelectedCalls(filteredCalls.map(c => c.id).filter((id): id is number => id !== undefined));
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
    } catch {
      // Error is handled by React Query hook
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedCalls, data: { status: status as "Scheduled" | "Completed" | "Missed" } });
      setSelectedCalls([]);
      setShowBulkUpdateStatus(false);
    } catch {
      // Error is handled by React Query hook
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredCalls.filter(call => call.id !== undefined && selectedCalls.includes(call.id));
    
    if (selectedData.length === 0) {
      toast.error("No calls selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-calls-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} calls`);
    } catch {
      toast.error("Failed to export calls");
    }
  };

  // Filter chips data
  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    
    if (statusFilter) {
      chips.push({
        id: 'status-filter',
        label: 'Status',
        value: statusFilter,
        color: 'primary',
      });
    }
    
    if (filterGroup && filterGroup.conditions.length > 0) {
      filterGroup.conditions.forEach((condition, index) => {
        const field = filterFields.find(f => f.key === condition.field);
        chips.push({
          id: `advanced-filter-${index}`,
          label: field?.label || condition.field,
          value: `${condition.operator}: ${condition.value}`,
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

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Completed: "bg-primary/10 text-primary",
      Scheduled: "bg-accent/10 text-accent",
      Missed: "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Get direction icon helper
  const getDirectionIcon = (direction: string) => {
    return direction === "Incoming" ? PhoneIncoming : PhoneOutgoing;
  };

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

  // Table columns
  const columns = [
    {
      key: "subject",
      label: "Call Subject",
      sortable: true,
      render: (_value: unknown, row: typeof calls[0]) => {
        return (
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(`/activities/calls/${row.id}`)}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
              {row.initials}
            </div>
            <div>
              <div className="font-semibold text-foreground">{row.subject}</div>
              <div className="text-sm text-muted-foreground">{row.description}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: "direction",
      label: "Direction",
      sortable: true,
      render: (value: string) => {
        const DirectionIcon = getDirectionIcon(value);
        return (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <DirectionIcon className="h-4 w-4 text-muted-foreground" />
            {value}
          </div>
        );
      },
    },
    {
      key: "contactName",
      label: "Contact",
      sortable: true,
      render: (_value: unknown, row: typeof calls[0]) => (
        <div>
          <div className="text-sm font-medium text-foreground">{row.contactName}</div>
          <div className="text-xs text-muted-foreground">{row.contactPhone}</div>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date & Time",
      sortable: true,
      render: (_value: unknown, row: typeof calls[0]) => (
        <div>
          <div className="text-sm text-foreground">{row.date}</div>
          <div className="text-xs text-muted-foreground">{row.time}</div>
        </div>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {value || "N/A"}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Calls"
        icon={Phone}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${calls.length} calls`}
        searchPlaceholder="Search calls by subject, contact, or description..."
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

            <ExportButton
              data={filteredCalls}
              columns={exportColumns}
              filename="calls-export"
              title="Calls Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Log a new call"
              onClick={handleAddCall}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Call
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <FilterChips
          chips={filterChips}
          onRemove={handleRemoveFilterChip}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedCalls.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedCalls.length}
            totalCount={filteredCalls.length}
            onSelectAll={handleSelectAllCalls}
            onDeselectAll={handleDeselectAll}
            onDelete={() => setShowBulkDelete(true)}
            onExport={handleBulkExport}
            onUpdateStatus={() => setShowBulkUpdateStatus(true)}
            statusLabel="Status"
            isProcessing={isBulkProcessing}
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedCalls}
          columns={columns}
          selectedIds={selectedCalls}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No calls found"
          emptyDescription="Try adjusting your search or filters, or log a new call"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/activities/calls/${row.id}`),
                },
                {
                  label: "Edit Call",
                  icon: Edit,
                  onClick: () => handleEditCall(row),
                },
                {
                  label: "Mark Complete",
                  icon: Check,
                  onClick: () => row.id && updateCall.mutateAsync({ id: row.id, data: { status: "Completed" } }),
                },
                { divider: true, label: "", onClick: () => {} },
                {
                  label: "Delete",
                  icon: Trash2,
                  variant: "danger",
                  onClick: () => handleDeleteClick(row),
                },
              ]}
            />
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCalls.map((call, index) => (
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
                      <h3 className="font-semibold text-foreground">
                        {call.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {call.direction === "Incoming" ? <PhoneIncoming className="h-3 w-3" /> : <PhoneOutgoing className="h-3 w-3" />}
                        {call.direction}
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
                          {
                            label: "Edit Call",
                            icon: Edit,
                            onClick: () => handleEditCall(call),
                          },
                          {
                            label: "Mark Complete",
                            icon: Check,
                            onClick: () => call.id && updateCall.mutateAsync({ id: call.id, data: { status: "Completed" } }),
                          },
                          { divider: true, label: "", onClick: () => {} },
                          {
                            label: "Delete",
                            icon: Trash2,
                            variant: "danger",
                            onClick: () => handleDeleteClick(call),
                          },
                        ]}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {call.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{call.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{call.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{call.date} at {call.time}</span>
                    </div>
                    {call.duration && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{call.duration}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status || "")}`}>
                      {call.status}
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
        totalItems={filteredCalls.length}
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
          statusFilter ? `filtered by ${statusFilter}` : undefined
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
        isDeleting={deleteCall.isPending}
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
        title="Update Status"
        field="status"
        options={[
          { label: 'Scheduled', value: 'Scheduled' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Missed', value: 'Missed' },
        ]}
      />

      {/* Advanced Filter Modal */}
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
        presets={filterPresets}
        onSavePreset={(preset) => {
          addPreset(preset);
        }}
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

      {/* Call Form Drawer */}
      <CallFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingCall(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCall ?? undefined}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
