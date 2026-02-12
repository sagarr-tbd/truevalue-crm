"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Calendar,
  Plus,
  Filter,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Clock,
  User,
  MapPin,
  Video,
  Users,
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
import { MeetingFormDrawer } from "@/components/Forms/Activities";
import type { MeetingDisplay } from "@/lib/api/mock/meetings";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useMeetings, 
  useCreateMeeting,
  useUpdateMeeting,
  useDeleteMeeting, 
  useBulkDeleteMeetings, 
  useBulkUpdateMeetings 
} from "@/lib/queries/useMeetings";
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

export default function MeetingsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: meetings = [], isLoading } = useMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const bulkDelete = useBulkDeleteMeetings();
  const bulkUpdate = useBulkUpdateMeetings();
  
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
  const meetingsFilters = filters.meetings || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(meetingsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(meetingsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedMeetings, setSelectedMeetings] = useState<number[]>([]);
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
  } = useFilterPresets("meetings");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('meetings', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<typeof meetings[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Partial<MeetingDisplay> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof meetings[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'duration', label: 'Duration' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'location', label: 'Location' },
    { key: 'organizer', label: 'Organizer' },
    { key: 'relatedTo', label: 'Related To' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'title',
      label: 'Title',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Cancelled', value: 'Cancelled' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'In Person', value: 'In Person' },
        { label: 'Video Call', value: 'Video Call' },
        { label: 'Phone Call', value: 'Phone Call' },
      ],
    },
    {
      key: 'organizer',
      label: 'Organizer',
      type: 'text',
    },
    {
      key: 'relatedTo',
      label: 'Related To',
      type: 'text',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredMeetings = useMemo(() => {
    let filtered = meetings;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (meeting) =>
          meeting.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          meeting.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          meeting.relatedTo?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((meeting) => meeting.status === statusFilter);
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
  }, [meetings, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedMeetings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMeetings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMeetings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMeetings.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalMeetings = meetings.length;
    const scheduled = meetings.filter((m) => m.status === "Scheduled").length;
    const completed = meetings.filter((m) => m.status === "Completed").length;
    const videoCall = meetings.filter((m) => m.type === "Video Call").length;

    return [
      {
        label: "Total Meetings",
        value: totalMeetings,
        icon: Calendar,
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
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Video Calls",
        value: videoCall,
        icon: Video,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
    ];
  }, [meetings]);

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
      label: "All Meetings",
      value: null,
      count: meetings.length,
    },
    {
      label: "Scheduled",
      value: "Scheduled",
      count: meetings.filter((m) => m.status === "Scheduled").length,
    },
    {
      label: "Completed",
      value: "Completed",
      count: meetings.filter((m) => m.status === "Completed").length,
    },
    {
      label: "Cancelled",
      value: "Cancelled",
      count: meetings.filter((m) => m.status === "Cancelled").length,
    },
  ], [meetings]);

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
    if (selectedMeetings.length === paginatedMeetings.length) {
      setSelectedMeetings([]);
    } else {
      setSelectedMeetings(paginatedMeetings.map((m) => m.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedMeetings.includes(numId)) {
      setSelectedMeetings(selectedMeetings.filter((mId) => mId !== numId));
    } else {
      setSelectedMeetings([...selectedMeetings, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (meeting: typeof meetings[0]) => {
    setMeetingToDelete(meeting);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!meetingToDelete?.id) return;
    
    try {
      await deleteMeeting.mutateAsync(meetingToDelete.id);
      setIsDeleteModalOpen(false);
      setMeetingToDelete(null);
    } catch {
      // Error is handled by React Query hook
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setMeetingToDelete(null);
  };

  // Form handlers
  const handleAddMeeting = () => {
    setFormMode("add");
    setEditingMeeting(null);
    setFormDrawerOpen(true);
  };

  const handleEditMeeting = (meeting: typeof meetings[0]) => {
    setFormMode("edit");
    setEditingMeeting({
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      type: meeting.type,
      status: meeting.status,
      location: meeting.location,
      organizer: meeting.organizer,
      attendees: meeting.attendees,
      relatedTo: meeting.relatedTo,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<MeetingDisplay>) => {
    try {
      if (formMode === "add") {
        await createMeeting.mutateAsync(data);
      } else if (editingMeeting) {
        // Find the meeting ID from the meetings list
        const meetingToUpdate = meetings.find(m => 
          m.title === editingMeeting.title ||
          (m.date === editingMeeting.date && m.time === editingMeeting.time)
        );
        
        if (meetingToUpdate?.id) {
          await updateMeeting.mutateAsync({ id: meetingToUpdate.id, data });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingMeeting(null);
    } catch (error) {
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllMeetings = () => {
    setSelectedMeetings(filteredMeetings.map(m => m.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedMeetings([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedMeetings);
      setSelectedMeetings([]);
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
      await bulkUpdate.mutateAsync({ ids: selectedMeetings, data: { status: status as "Scheduled" | "Completed" | "Cancelled" } });
      setSelectedMeetings([]);
      setShowBulkUpdateStatus(false);
    } catch {
      // Error is handled by React Query hook
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredMeetings.filter(meeting => meeting.id !== undefined && selectedMeetings.includes(meeting.id));
    
    if (selectedData.length === 0) {
      toast.error("No meetings selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-meetings-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} meetings`);
    } catch {
      toast.error("Failed to export meetings");
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
    clearModuleFilters('meetings');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Scheduled: "bg-accent/10 text-accent",
      Completed: "bg-primary/10 text-primary",
      Cancelled: "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Get type color helper
  const getTypeColor = (type: string) => {
    const colors = {
      "Video Call": "bg-primary/10 text-primary",
      "In Person": "bg-secondary/10 text-secondary",
      "Phone Call": "bg-accent/10 text-accent",
    };
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
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
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "title",
      label: "Meeting",
      sortable: true,
      render: (_value: unknown, row: typeof meetings[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/activities/meetings/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.title}</div>
            <div className="text-sm text-muted-foreground">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date & Time",
      sortable: true,
      render: (_value: unknown, row: typeof meetings[0]) => (
        <div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {row.date}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {row.time} ({row.duration})
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (value: string, row: typeof meetings[0]) => (
        <div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(value)}`}>
            {value}
          </span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{row.location}</span>
          </div>
        </div>
      ),
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
      key: "organizer",
      label: "Organizer",
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <User className="h-4 w-4 text-muted-foreground" />
          {value}
        </div>
      ),
    },
    {
      key: "attendees",
      label: "Attendees",
      render: (value: string[]) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {value.length} attendees
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Meetings"
        icon={Calendar}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${meetings.length} meetings`}
        searchPlaceholder="Search meetings by title, description, or related account..."
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
                title="Filter meetings by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Meetings"}
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
              data={filteredMeetings}
              columns={exportColumns}
              filename="meetings-export"
              title="Meetings Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Schedule a new meeting"
              onClick={handleAddMeeting}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
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
        {selectedMeetings.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedMeetings.length}
            totalCount={filteredMeetings.length}
            onSelectAll={handleSelectAllMeetings}
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
          data={paginatedMeetings}
          columns={columns}
          selectedIds={selectedMeetings}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No meetings found"
          emptyDescription="Try adjusting your search or filters, or schedule a new meeting"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/activities/meetings/${row.id}`),
                },
                {
                  label: "Edit Meeting",
                  icon: Edit,
                  onClick: () => handleEditMeeting(row),
                },
                {
                  label: "Join Meeting",
                  icon: Video,
                  onClick: () => row.id && updateMeeting.mutateAsync({ id: row.id, data: { status: "Completed" } }),
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
          {paginatedMeetings.map((meeting, index) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/activities/meetings/${meeting.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {meeting.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {meeting.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {meeting.organizer}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/activities/meetings/${meeting.id}`),
                        },
                        {
                          label: "Edit Meeting",
                          icon: Edit,
                          onClick: () => handleEditMeeting(meeting),
                        },
                        {
                          label: "Join Meeting",
                          icon: Video,
                          onClick: () => meeting.id && updateMeeting.mutateAsync({ id: meeting.id, data: { status: "Completed" } }),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(meeting),
                        },
                      ]}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {meeting.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{meeting.time} ({meeting.duration})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{meeting.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{meeting.attendees?.length || 0} attendees</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status || "")}`}>
                    {meeting.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(meeting.type || "")}`}>
                    {meeting.type}
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
        totalItems={filteredMeetings.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedMeetings([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedMeetings([]);
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
        title="Delete Meeting"
        description="Are you sure you want to delete this meeting? This will permanently remove it from your CRM and cannot be undone."
        itemName={meetingToDelete?.title}
        itemType="Meeting"
        icon={Calendar}
        isDeleting={deleteMeeting.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedMeetings.length}
        itemName="meeting"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedMeetings.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Scheduled', value: 'Scheduled' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Cancelled', value: 'Cancelled' },
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

      {/* Meeting Form Drawer */}
      <MeetingFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingMeeting(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingMeeting ?? undefined}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
