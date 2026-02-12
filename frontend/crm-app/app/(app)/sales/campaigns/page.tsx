"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Megaphone,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Mail,
  Users,
  DollarSign,
  ChevronDown,
  Check,
  TrendingUp,
  MousePointer,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { CampaignFormDrawer, type Campaign as CampaignType } from "@/components/Forms/Sales";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useCampaigns, 
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign, 
  useBulkDeleteCampaigns, 
  useBulkUpdateCampaigns 
} from "@/lib/queries/useCampaigns";
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

export default function CampaignsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: campaigns = [], isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const bulkDelete = useBulkDeleteCampaigns();
  const bulkUpdate = useBulkUpdateCampaigns();
  
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
  const campaignsFilters = filters.campaigns || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(campaignsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(campaignsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
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
  } = useFilterPresets("campaigns");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('campaigns', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<typeof campaigns[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<CampaignType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof campaigns[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Campaign Name' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'budget', label: 'Budget' },
    { key: 'spent', label: 'Spent' },
    { key: 'leads', label: 'Leads' },
    { key: 'conversions', label: 'Conversions' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'owner', label: 'Owner' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'name',
      label: 'Campaign Name',
      type: 'text',
    },
    {
      key: 'type',
      label: 'Type',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Planned', value: 'Planned' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (campaign) =>
          campaign.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          campaign.type?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((campaign) => campaign.status === statusFilter);
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
  }, [campaigns, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const activeCampaigns = campaigns.filter((c) => c.status === "Active");
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

    return [
      {
        label: "Active Campaigns",
        value: activeCampaigns.length,
        icon: Megaphone,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        description: `${campaigns.length} total`,
      },
      {
        label: "Total Leads",
        value: totalLeads.toLocaleString(),
        icon: Users,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 24, isPositive: true },
      },
      {
        label: "Total Revenue",
        value: `$${(totalRevenue / 1000000).toFixed(1)}M`,
        icon: DollarSign,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 32, isPositive: true },
      },
      {
        label: "ROI",
        value: `${roi.toFixed(0)}%`,
        icon: TrendingUp,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
        description: `$${(totalSpent / 1000).toFixed(0)}K spent`,
      },
    ];
  }, [campaigns]);

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
      label: "All Campaigns",
      value: null,
      count: campaigns.length,
    },
    {
      label: "Active",
      value: "Active",
      count: campaigns.filter((c) => c.status === "Active").length,
    },
    {
      label: "Planned",
      value: "Planned",
      count: campaigns.filter((c) => c.status === "Planned").length,
    },
    {
      label: "Completed",
      value: "Completed",
      count: campaigns.filter((c) => c.status === "Completed").length,
    },
  ], [campaigns]);

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
    if (selectedCampaigns.length === paginatedCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(paginatedCampaigns.map((c) => c.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedCampaigns.includes(numId)) {
      setSelectedCampaigns(selectedCampaigns.filter((cId) => cId !== numId));
    } else {
      setSelectedCampaigns([...selectedCampaigns, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (campaign: typeof campaigns[0]) => {
    setCampaignToDelete(campaign);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete?.id) return;
    
    try {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      setIsDeleteModalOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCampaignToDelete(null);
  };

  // Form handlers
  const handleAddCampaign = () => {
    setFormMode("add");
    setEditingCampaign(null);
    setFormDrawerOpen(true);
  };

  const handleEditCampaign = (campaign: typeof campaigns[0]) => {
    setFormMode("edit");
    setEditingCampaign({
      name: campaign.name,
      type: campaign.type as any,
      status: campaign.status as any,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: campaign.budget,
      assignedTo: campaign.owner,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<CampaignType>) => {
    try {
      if (formMode === "add") {
      const newCampaign = {
        name: data.name || "",
        type: data.type || "Email",
        status: data.status || "Planned",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        budget: data.budget || 0,
        owner: data.assignedTo || "Unassigned",
      };
        await createCampaign.mutateAsync(newCampaign);
      } else if (editingCampaign) {
        // Find the campaign ID from the campaigns list
        const campaignToUpdate = campaigns.find(c => 
          c.name === editingCampaign.name
        );
        
        if (campaignToUpdate?.id) {
          const updatedCampaign = {
            name: data.name || "",
            type: data.type || "Email",
            status: data.status || "Planned",
            startDate: data.startDate || "",
            endDate: data.endDate || "",
            budget: data.budget || 0,
            owner: data.assignedTo || "Unassigned",
          };
          await updateCampaign.mutateAsync({ id: campaignToUpdate.id, data: updatedCampaign });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error("Error submitting campaign:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllCampaigns = () => {
    setSelectedCampaigns(filteredCampaigns.map(c => c.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedCampaigns([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedCampaigns);
      setSelectedCampaigns([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting campaigns:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedCampaigns, data: { status } });
      setSelectedCampaigns([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Error bulk updating campaigns:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredCampaigns.filter(campaign => campaign.id !== undefined && selectedCampaigns.includes(campaign.id));
    
    if (selectedData.length === 0) {
      toast.error("No campaigns selected for export");
      return;
    }

    try {
      // Use the same export columns as the main ExportButton
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-campaigns-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} campaigns`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export campaigns");
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
    clearModuleFilters('campaigns');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Active: "bg-primary/20 text-primary",
      Planned: "bg-accent/10 text-accent",
      Completed: "bg-secondary/10 text-secondary",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New campaign",
        action: () => {
          setEditingCampaign(null);
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
      key: "name",
      label: "Campaign",
      sortable: true,
      render: (_value: unknown, row: typeof campaigns[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/campaigns/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.type}</div>
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
      key: "leads",
      label: "Leads",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "conversions",
      label: "Conversions",
      sortable: true,
      render: (value: number, row: typeof campaigns[0]) => (
        <div>
          <div className="flex items-center gap-2">
            <MousePointer className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-primary">{value}</span>
          </div>
          {row.leads > 0 && (
            <div className="text-xs text-muted-foreground">
              {((value / row.leads) * 100).toFixed(1)}% rate
            </div>
          )}
        </div>
      ),
    },
    {
      key: "revenue",
      label: "Revenue",
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-foreground">
          ${(value / 1000).toFixed(0)}K
        </span>
      ),
    },
    {
      key: "endDate",
      label: "End Date",
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
        title="Campaigns"
        icon={Megaphone}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${campaigns.length} marketing campaigns`}
        searchPlaceholder="Search campaigns by name or type..."
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
                title="Filter campaigns by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Campaigns"}
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
              title="Import campaigns from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredCampaigns}
              columns={exportColumns}
              filename="campaigns-export"
              title="Campaigns Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new campaign"
              onClick={handleAddCampaign}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
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
        {selectedCampaigns.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedCampaigns.length}
            totalCount={filteredCampaigns.length}
            onSelectAll={handleSelectAllCampaigns}
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
          data={paginatedCampaigns}
          columns={columns}
          selectedIds={selectedCampaigns}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No campaigns found"
          emptyDescription="Try adjusting your search or filters, or create a new campaign"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/sales/campaigns/${row.id}`),
                },
                {
                  label: "View Analytics",
                  icon: BarChart3,
                  onClick: () => router.push(`/sales/campaigns/${row.id}/analytics`),
                },
                {
                  label: "Edit Campaign",
                  icon: Edit,
                  onClick: () => handleEditCampaign(row),
                },
                {
                  label: "Send Email",
                  icon: Mail,
                  onClick: () => window.location.href = `mailto:`,
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
          {paginatedCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/campaigns/${campaign.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {campaign.initials}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{campaign.type}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/sales/campaigns/${campaign.id}`),
                        },
                        {
                          label: "View Analytics",
                          icon: BarChart3,
                          onClick: () => router.push(`/sales/campaigns/${campaign.id}/analytics`),
                        },
                        {
                          label: "Edit Campaign",
                          icon: Edit,
                          onClick: () => handleEditCampaign(campaign),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(campaign),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {campaign.endDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Leads</p>
                      <p className="text-lg font-bold text-foreground">
                        {campaign.leads}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Conv.</p>
                      <p className="text-lg font-bold text-primary">
                        {campaign.conversions}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="text-lg font-bold text-primary">
                        ${(campaign.revenue / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Budget</span>
                      <span className="text-sm font-semibold text-foreground">
                        ${(campaign.budget / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground pt-3 border-t border-border">
                    Owner: {campaign.owner}
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
        totalItems={filteredCampaigns.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedCampaigns([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedCampaigns([]);
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
        title="Delete Campaign"
        description="Are you sure you want to delete this campaign? All campaign data and analytics will be lost."
        itemName={campaignToDelete?.name}
        itemType="Campaign"
        icon={Megaphone}
        isDeleting={deleteCampaign.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedCampaigns.length}
        itemName="campaign"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedCampaigns.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Active', value: 'Active' },
          { label: 'Planned', value: 'Planned' },
          { label: 'Completed', value: 'Completed' },
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

      {/* Campaign Form Drawer */}
      <CampaignFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingCampaign(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCampaign}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
