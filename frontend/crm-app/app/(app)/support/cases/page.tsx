"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Briefcase,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Mail,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
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
import { CaseFormDrawer } from "@/components/Forms/Support";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useCases, 
  useCreateCase,
  useUpdateCase,
  useDeleteCase, 
  useBulkDeleteCases, 
  useBulkUpdateCases 
} from "@/lib/queries/useCases";
import { useUIStore } from "@/stores";
import type { Case } from "@/lib/types";

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

export default function CasesPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: cases = [], isLoading } = useCases();
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const deleteCase = useDeleteCase();
  const bulkDelete = useBulkDeleteCases();
  const bulkUpdate = useBulkUpdateCases();
  
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
  const casesFilters = filters.cases || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(casesFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(casesFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedCases, setSelectedCases] = useState<number[]>([]);
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
  } = useFilterPresets("cases");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('cases', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<typeof cases[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Partial<Case> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof cases[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'caseNumber', label: 'Case Number' },
    { key: 'subject', label: 'Subject' },
    { key: 'customer', label: 'Customer' },
    { key: 'contactName', label: 'Contact Name' },
    { key: 'contactEmail', label: 'Contact Email' },
    { key: 'contactPhone', label: 'Contact Phone' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'type', label: 'Type' },
    { key: 'assignedTo', label: 'Assigned To' },
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
      key: 'customer',
      label: 'Customer',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Open', value: 'Open' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Resolved', value: 'Resolved' },
        { label: 'Closed', value: 'Closed' },
        { label: 'Escalated', value: 'Escalated' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' },
        { label: 'Urgent', value: 'Urgent' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'Technical', value: 'Technical' },
        { label: 'Billing', value: 'Billing' },
        { label: 'Feature Request', value: 'Feature Request' },
        { label: 'Bug', value: 'Bug' },
        { label: 'General Inquiry', value: 'General Inquiry' },
      ],
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredCases = useMemo(() => {
    let filtered = cases;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (caseItem) =>
          caseItem.subject?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          caseItem.customer?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          caseItem.caseNumber?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          caseItem.contactName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((caseItem) => caseItem.status === statusFilter);
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
  }, [cases, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCases, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const openCases = cases.filter((c) => c.status === "Open").length;
    const inProgress = cases.filter((c) => c.status === "In Progress").length;
    const resolved = cases.filter((c) => c.status === "Resolved").length;

    return [
      {
        label: "Total Cases",
        value: totalCases,
        icon: Briefcase,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Open Cases",
        value: openCases,
        icon: AlertCircle,
        iconBgColor: "bg-destructive/10",
        iconColor: "text-destructive",
      },
      {
        label: "In Progress",
        value: inProgress,
        icon: Clock,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Resolved",
        value: resolved,
        icon: CheckCircle2,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 15, isPositive: true },
      },
    ];
  }, [cases]);

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
      label: "All Cases",
      value: null,
      count: cases.length,
    },
    {
      label: "Open",
      value: "Open",
      count: cases.filter((c) => c.status === "Open").length,
    },
    {
      label: "In Progress",
      value: "In Progress",
      count: cases.filter((c) => c.status === "In Progress").length,
    },
    {
      label: "Resolved",
      value: "Resolved",
      count: cases.filter((c) => c.status === "Resolved").length,
    },
    {
      label: "Closed",
      value: "Closed",
      count: cases.filter((c) => c.status === "Closed").length,
    },
    {
      label: "Escalated",
      value: "Escalated",
      count: cases.filter((c) => c.status === "Escalated").length,
    },
  ], [cases]);

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
    if (selectedCases.length === paginatedCases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(paginatedCases.map((c) => c.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedCases.includes(numId)) {
      setSelectedCases(selectedCases.filter((cId) => cId !== numId));
    } else {
      setSelectedCases([...selectedCases, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (caseItem: typeof cases[0]) => {
    setCaseToDelete(caseItem);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!caseToDelete?.id) return;
    
    try {
      await deleteCase.mutateAsync(caseToDelete.id);
      setIsDeleteModalOpen(false);
      setCaseToDelete(null);
    } catch (error) {
      console.error("Error deleting case:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCaseToDelete(null);
  };

  // Form handlers
  const handleAddCase = () => {
    setFormMode("add");
    setEditingCase(null);
    setFormDrawerOpen(true);
  };

  const handleEditCase = (caseItem: typeof cases[0]) => {
    setFormMode("edit");
    setEditingCase(caseItem);
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Case>) => {
    try {
      if (formMode === "add") {
        const newCase = {
          subject: data.subject || "",
          description: data.description,
          customer: data.customer || "",
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          priority: data.priority || "Medium",
          status: data.status || "Open",
          type: data.type || "General Inquiry",
          category: data.category,
          assignedTo: data.assignedTo || "Unassigned",
          dueDate: data.dueDate,
          tags: data.tags || [],
        };
        await createCase.mutateAsync(newCase);
      } else if (editingCase) {
        // Find the case ID from the cases list
        const caseToUpdate = cases.find(c => 
          c.id === editingCase.id ||
          c.caseNumber === editingCase.caseNumber
        );
        
        if (caseToUpdate?.id) {
          const updatedCase = {
            subject: data.subject,
            description: data.description,
            customer: data.customer,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            priority: data.priority,
            status: data.status,
            type: data.type,
            category: data.category,
            assignedTo: data.assignedTo,
            dueDate: data.dueDate,
            tags: data.tags,
          };
          await updateCase.mutateAsync({ id: caseToUpdate.id, data: updatedCase });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingCase(null);
    } catch (error) {
      console.error("Error submitting case:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllCases = () => {
    setSelectedCases(filteredCases.map(c => c.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedCases([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedCases);
      setSelectedCases([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting cases:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ 
        ids: selectedCases, 
        data: { status: status as "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated" } 
      });
      setSelectedCases([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Error bulk updating cases:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredCases.filter(caseItem => caseItem.id !== undefined && selectedCases.includes(caseItem.id));
    
    if (selectedData.length === 0) {
      toast.error("No cases selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-cases-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} cases`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export cases");
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
    clearModuleFilters('cases');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Open: "bg-destructive/10 text-destructive",
      "In Progress": "bg-accent/10 text-accent",
      Resolved: "bg-secondary/10 text-secondary",
      Closed: "bg-muted text-muted-foreground",
      Escalated: "bg-destructive/20 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Get priority color helper
  const getPriorityColor = (priority: string) => {
    const colors = {
      Low: "bg-muted text-muted-foreground",
      Medium: "bg-accent/10 text-accent",
      High: "bg-destructive/10 text-destructive",
      Urgent: "bg-destructive/20 text-destructive font-semibold",
    };
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New case",
        action: () => {
          setEditingCase(null);
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
      key: "caseNumber",
      label: "Case",
      sortable: true,
      render: (_value: unknown, row: typeof cases[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/support/cases/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.caseNumber}</div>
            <div className="text-sm text-muted-foreground truncate max-w-xs">{row.subject}</div>
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-foreground">{value}</span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(value)}`}>
          {value}
        </span>
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
      key: "type",
      label: "Type",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value}</span>
      ),
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-foreground">{value}</span>
      ),
    },
    {
      key: "created",
      label: "Created On",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Cases"
        icon={Briefcase}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${cases.length} cases`}
        searchPlaceholder="Search cases by number, subject, or customer..."
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
                title="Filter cases by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Cases"}
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

            <Button 
              variant="outline" 
              size="sm"
              title="Import cases from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredCases}
              columns={exportColumns}
              filename="cases-export"
              title="Cases Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new case"
              onClick={handleAddCase}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Case
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
        {selectedCases.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedCases.length}
            totalCount={filteredCases.length}
            onSelectAll={handleSelectAllCases}
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
          data={paginatedCases}
          columns={columns}
          selectedIds={selectedCases}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No cases found"
          emptyDescription="Try adjusting your search or filters, or add a new case"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/support/cases/${row.id}`),
                },
                {
                  label: "Edit Case",
                  icon: Edit,
                  onClick: () => handleEditCase(row),
                },
                {
                  label: "Email Customer",
                  icon: Mail,
                  onClick: () => window.location.href = `mailto:${row.contactEmail || ''}`,
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
          {paginatedCases.map((caseItem, index) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/support/cases/${caseItem.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {caseItem.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {caseItem.caseNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.customer}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/support/cases/${caseItem.id}`),
                        },
                        {
                          label: "Edit Case",
                          icon: Edit,
                          onClick: () => handleEditCase(caseItem),
                        },
                        {
                          label: "Email Customer",
                          icon: Mail,
                          onClick: () => window.location.href = `mailto:${caseItem.contactEmail || ''}`,
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(caseItem),
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {caseItem.subject}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{caseItem.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                    {caseItem.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Assigned: {caseItem.assignedTo}</span>
                  <span>{caseItem.created}</span>
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
        totalItems={filteredCases.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedCases([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedCases([]);
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
        title="Delete Case"
        description="Are you sure you want to delete this case? This will permanently remove it from your system and cannot be undone."
        itemName={caseToDelete?.caseNumber}
        itemType="Case"
        icon={Briefcase}
        isDeleting={deleteCase.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedCases.length}
        itemName="case"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedCases.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Open', value: 'Open' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Resolved', value: 'Resolved' },
          { label: 'Closed', value: 'Closed' },
          { label: 'Escalated', value: 'Escalated' },
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

      {/* Case Form Drawer */}
      <CaseFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingCase(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCase}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
