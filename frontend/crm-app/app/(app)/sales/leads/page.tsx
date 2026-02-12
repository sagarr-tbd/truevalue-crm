"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Target,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Mail,
  Phone,
  FileText,
  UserPlus,
  Calendar,
  ChevronDown,
  Check,
  Building2,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import type { Lead, LeadStatus, LeadRating } from "@/lib/types";
import { useKeyboardShortcuts, useFilterPresets, useDebounce, useTableColumns } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { ColumnSettings } from "@/components/DataTable";
import { toast } from "sonner";
import { 
  useLeads, 
  useCreateLead,
  useUpdateLead,
  useDeleteLead, 
  useBulkDeleteLeads, 
  useBulkUpdateLeads 
} from "@/lib/queries/useLeads";
import { useUIStore } from "@/stores";

// Lazy load heavy components that are only used conditionally
const LeadFormDrawer = dynamic(
  () => import("@/components/Forms/Sales").then(mod => ({ default: mod.LeadFormDrawer })),
  { ssr: false }
);

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

export default function LeadsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: leads = [], isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const bulkDelete = useBulkDeleteLeads();
  const bulkUpdate = useBulkUpdateLeads();
  
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
  const leadsFilters = filters.leads || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(leadsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(leadsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Debounce search query to prevent excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('leads', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<typeof leads[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form modal states - Unified Modal
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Filter dropdown ref for click outside
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Advanced Filter state
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { presets, addPreset, deletePreset } = useFilterPresets('leads');

  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Export columns configuration
  const exportColumns: ExportColumn<Lead>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status' },
    { key: 'rating', label: 'Rating' },
    { key: 'industry', label: 'Industry' },
    {
      key: 'expectedRevenue',
      label: 'Expected Revenue',
      format: (value) => value ? `$${value.toLocaleString()}` : ''
    },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'lastContact', label: 'Last Contact' },
  ], []);

  // Advanced filter fields configuration
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'New', value: 'New' },
        { label: 'Contacted', value: 'Contacted' },
        { label: 'Qualified', value: 'Qualified' },
        { label: 'Unqualified', value: 'Unqualified' },
      ],
    },
    {
      key: 'rating',
      label: 'Rating',
      type: 'select',
      options: [
        { label: 'Hot', value: 'Hot' },
        { label: 'Warm', value: 'Warm' },
        { label: 'Cold', value: 'Cold' },
      ],
    },
    {
      key: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter first name...',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter last name...',
    },
    {
      key: 'company',
      label: 'Company',
      type: 'text',
      placeholder: 'Enter company...',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'Enter email...',
    },
    {
      key: 'source',
      label: 'Source',
      type: 'select',
      options: [
        { label: 'Website', value: 'Website' },
        { label: 'Referral', value: 'Referral' },
        { label: 'LinkedIn', value: 'LinkedIn' },
        { label: 'Trade Show', value: 'Trade Show' },
        { label: 'Cold Call', value: 'Cold Call' },
        { label: 'Email Campaign', value: 'Email Campaign' },
      ],
    },
    {
      key: 'industry',
      label: 'Industry',
      type: 'text',
      placeholder: 'Enter industry...',
    },
    {
      key: 'expectedRevenue',
      label: 'Expected Revenue',
      type: 'number',
      placeholder: 'Enter amount...',
    },
  ], []);

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
        description: "New lead",
        action: () => {
          setEditingLead(null);
          setFormMode("add");
          setDefaultView("quick");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  // Filter options
  const filterOptions = useMemo(() => [
    {
      label: "All Leads",
      value: null,
      count: leads.length,
    },
    {
      label: "New",
      value: "New",
      count: leads.filter((l) => l.status === "New").length,
    },
    {
      label: "Contacted",
      value: "Contacted",
      count: leads.filter((l) => l.status === "Contacted").length,
    },
    {
      label: "Qualified",
      value: "Qualified",
      count: leads.filter((l) => l.status === "Qualified").length,
    },
    {
      label: "Unqualified",
      value: "Unqualified",
      count: leads.filter((l) => l.status === "Unqualified").length,
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (lead) =>
          lead.firstName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          lead.lastName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          lead.company.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter (simple dropdown)
    if (statusFilter) {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
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
  }, [leads, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const hotLeads = leads.filter((l) => l.rating === "Hot");
    const qualified = leads.filter((l) => l.status === "Qualified");
    const totalValue = leads.reduce((sum, lead) => sum + (lead.expectedRevenue || 0), 0);
    const avgValue = leads.length > 0 ? totalValue / leads.length : 0;

    return [
      {
        label: "Total Leads",
        value: leads.length,
        icon: Target,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Hot Leads",
        value: hotLeads.length,
        icon: Target,
        iconBgColor: "bg-destructive/10",
        iconColor: "text-destructive",
        description: `${((hotLeads.length / leads.length) * 100).toFixed(0)}% of total`,
      },
      {
        label: "Qualified",
        value: qualified.length,
        icon: UserPlus,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Est. Value",
        value: `$${(totalValue / 1000).toFixed(0)}K`,
        icon: DollarSign,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
        description: `Avg: $${(avgValue / 1000).toFixed(0)}K`,
      },
    ];
  }, []);

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
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map((l) => l.id).filter((id): id is number => id !== undefined));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedLeads.includes(numId)) {
      setSelectedLeads(selectedLeads.filter((lId) => lId !== numId));
    } else {
      setSelectedLeads([...selectedLeads, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (lead: typeof leads[0]) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete?.id) return;
    
    setIsDeleting(true);
    
    try {
      await deleteLead.mutateAsync(leadToDelete.id);
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error("Error deleting lead:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setLeadToDelete(null);
  };

  // Bulk operation handlers
  const handleSelectAllLeads = () => {
    setSelectedLeads(filteredLeads.map(l => l.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedLeads([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedLeads);
      setSelectedLeads([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (newStatus: LeadStatus) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedLeads, data: { status: newStatus } });
      setSelectedLeads([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Bulk update error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredLeads.filter(lead => lead.id !== undefined && selectedLeads.includes(lead.id));
    
    if (selectedData.length === 0) {
      toast.error("No leads selected for export");
      return;
    }

    try {
      // Use the same export columns as the main ExportButton
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-leads-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} leads`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export leads");
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
    clearModuleFilters('leads');
  };

  const handleAddLead = () => {
    setFormMode("add");
    setEditingLead(null);
    setFormDrawerOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setFormMode("edit");
    setEditingLead(lead);
    setFormDrawerOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: Partial<Lead>) => {
    try {
      if (formMode === "edit" && editingLead?.id) {
        await updateLead.mutateAsync({ id: editingLead.id, data });
      } else {
        await createLead.mutateAsync(data);
      }
      
      setFormDrawerOpen(false);
      setEditingLead(null);
    } catch (error) {
      throw error;
    }
  };

  // Get status and rating colors
  const getStatusColor = (status: string) => {
    const colors: Record<LeadStatus, string> = {
      New: "bg-secondary/10 text-secondary",
      Contacted: "bg-accent/10 text-accent",
      Qualified: "bg-primary/10 text-primary",
      Unqualified: "bg-muted text-muted-foreground",
    };
    return colors[status as LeadStatus] || "bg-muted text-muted-foreground";
  };

  const getRatingColor = (rating: string | undefined) => {
    if (!rating) return "bg-muted text-muted-foreground";
    const colors: Record<LeadRating, string> = {
      Hot: "bg-destructive/10 text-destructive",
      Warm: "bg-accent/10 text-accent",
      Cold: "bg-muted text-muted-foreground",
    };
    return colors[rating as LeadRating] || "bg-muted text-muted-foreground";
  };

  // Table columns - Memoize to prevent infinite loop
  const columns = useMemo(() => [
    {
      key: "firstName",
      label: "Name",
      sortable: true,
      render: (_: any, row: typeof leads[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/leads/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {row.company}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (_: any, row: typeof leads[0]) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {row.email}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {row.phone}
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
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (value: string | undefined) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(value)}`}>
          {value || "N/A"}
        </span>
      ),
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (value: string | undefined) => (
        <span className="text-sm text-foreground">{value || "N/A"}</span>
      ),
    },
    {
      key: "expectedRevenue",
      label: "Est. Value",
      sortable: true,
      render: (value: number) => (
        <span className="font-tabular font-semibold text-foreground">
          ${(value || 0).toLocaleString('en-US')}
        </span>
      ),
    },
    {
      key: "lastContact",
      label: "Last Contact",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {value}
        </div>
      ),
    },
  ], [router]); // Add router as dependency since it's used in the render functions

  // Table columns hook
  const {
    columnState,
    toggleColumnVisibility,
    reorderColumns,
    resetColumns,
  } = useTableColumns({
    columns,
    tableId: "leads-table",
    enablePersistence: true,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Leads"
        icon={Target}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${leads.length} leads in pipeline`}
        searchPlaceholder="Search leads by name, company, or email..."
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
            
            {/* Column Settings */}
            <ColumnSettings
              columns={columns}
              columnState={columnState}
              onToggleVisibility={toggleColumnVisibility}
              onReorder={reorderColumns}
              onReset={resetColumns}
            />
            
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
                title="Filter leads by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Leads"}
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

            {/* Advanced Filter Button */}
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
              title="Import leads from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredLeads}
              columns={exportColumns}
              filename={`leads-${new Date().toISOString().split('T')[0]}`}
              title="Leads Export"
            />
            <Button 
              onClick={() => {
                setFormMode("add");
                setEditingLead(null);
                setDefaultView("quick");
                setFormDrawerOpen(true);
              }}
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new lead"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
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
      {selectedLeads.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedLeads.length}
          totalCount={filteredLeads.length}
          onSelectAll={handleSelectAllLeads}
          onDeselectAll={handleDeselectAll}
          onDelete={() => setShowBulkDelete(true)}
          onExport={handleBulkExport}
          onUpdateStatus={() => setShowBulkUpdateStatus(true)}
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
          data={paginatedLeads}
          columns={columns}
          selectedIds={selectedLeads}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          emptyMessage="No leads found"
          emptyDescription="Try adjusting your search or filters, or add a new lead"
          tableId="leads-table"
          externalColumnState={columnState}
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/sales/leads/${row.id}`),
                },
                {
                  label: "Edit",
                  icon: Edit,
                  onClick: () => {
                    handleEditLead(row);
                    setDefaultView("detailed");
                  },
                },
                {
                  label: "Send Email",
                  icon: Mail,
                  onClick: () => console.log("Email", row.id),
                },
                {
                  label: "Call Lead",
                  icon: Phone,
                  onClick: () => console.log("Call", row.id),
                },
                {
                  label: "Convert to Contact",
                  icon: UserPlus,
                  onClick: () => console.log("Convert", row.id),
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
          {paginatedLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/leads/${lead.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {lead.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {lead.firstName} {lead.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {lead.company}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/sales/leads/${lead.id}`),
                        },
                        {
                          label: "Edit",
                          icon: Edit,
                          onClick: () => {
                            handleEditLead(lead);
                            setDefaultView("detailed");
                          },
                        },
                        {
                          label: "Send Email",
                          icon: Mail,
                          onClick: () => console.log("Email", lead.id),
                        },
                        {
                          label: "Call Lead",
                          icon: Phone,
                          onClick: () => console.log("Call", lead.id),
                        },
                        {
                          label: "Convert to Contact",
                          icon: UserPlus,
                          onClick: () => console.log("Convert", lead.id),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(lead),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(lead.rating)}`}>
                      {lead.rating || "N/A"}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{lead.phone || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Est. Value</span>
                    <span className="text-lg font-bold text-primary font-tabular">
                      ${((lead.expectedRevenue || 0) / 1000).toFixed(0)}K
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Last: {lead.lastContact}</span>
                  </div>
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
        totalItems={filteredLeads.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedLeads([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedLeads([]);
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
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This will permanently remove it from your CRM and cannot be undone."
        itemName={leadToDelete ? `${leadToDelete.firstName} ${leadToDelete.lastName}` : undefined}
        itemType="Lead"
        icon={Target}
        isDeleting={isDeleting}
      />

      {/* Unified Form Drawer */}
        <LeadFormDrawer
          isOpen={formDrawerOpen}
          onClose={() => {
            setFormDrawerOpen(false);
            setEditingLead(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingLead}
          mode={formMode}
          defaultView={defaultView}
        />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedLeads.length}
        itemName="lead"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<LeadStatus>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedLeads.length}
        title="Update Lead Status"
        field="Status"
        options={[
          { label: 'New', value: 'New' as LeadStatus },
          { label: 'Contacted', value: 'Contacted' as LeadStatus },
          { label: 'Qualified', value: 'Qualified' as LeadStatus },
          { label: 'Unqualified', value: 'Unqualified' as LeadStatus },
        ]}
      />
    </div>
  );
}
