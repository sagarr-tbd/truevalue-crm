"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DollarSign,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Mail,
  FileText,
  TrendingUp,
  Target,
  CheckCircle2,
  Building2,
  User,
  Calendar,
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
import { DealFormDrawer, type Deal as DealType } from "@/components/Forms/Sales";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useDeals, 
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal, 
  useBulkDeleteDeals, 
  useBulkUpdateDeals 
} from "@/lib/queries/useDeals";
import { useUIStore } from "@/stores";
import { KanbanBoard } from "@/components/KanbanBoard";

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

export default function DealsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: deals = [], isLoading } = useDeals();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const bulkDelete = useBulkDeleteDeals();
  const bulkUpdate = useBulkUpdateDeals();
  
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
  const dealsFilters = filters.deals || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(dealsFilters.search || "");
  const [stageFilter, setStageFilter] = useState<string | null>(dealsFilters.stage || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStage, setShowBulkUpdateStage] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Advanced filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  
  // Filter presets
  const {
    presets: filterPresets,
    addPreset,
    deletePreset,
  } = useFilterPresets("deals");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('deals', {
      search: searchQuery,
      stage: stageFilter,
    });
  }, [searchQuery, stageFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<typeof deals[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Partial<DealType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof deals[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'dealName', label: 'Deal Name' },
    { key: 'company', label: 'Company' },
    { key: 'contactName', label: 'Contact' },
    { key: 'amount', label: 'Amount' },
    { key: 'stage', label: 'Stage' },
    { key: 'probability', label: 'Probability' },
    { key: 'closeDate', label: 'Close Date' },
    { key: 'owner', label: 'Owner' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'dealName',
      label: 'Deal Name',
      type: 'text',
    },
    {
      key: 'company',
      label: 'Company',
      type: 'text',
    },
    {
      key: 'stage',
      label: 'Stage',
      type: 'select',
      options: [
        { label: 'Prospecting', value: 'Prospecting' },
        { label: 'Qualification', value: 'Qualification' },
        { label: 'Proposal', value: 'Proposal' },
        { label: 'Negotiation', value: 'Negotiation' },
        { label: 'Closed Won', value: 'Closed Won' },
        { label: 'Closed Lost', value: 'Closed Lost' },
      ],
    },
    {
      key: 'contactName',
      label: 'Contact',
      type: 'text',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredDeals = useMemo(() => {
    let filtered = deals;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (deal) =>
          deal.dealName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          deal.company?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          deal.contactName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Stage filter
    if (stageFilter) {
      filtered = filtered.filter((deal) => deal.stage === stageFilter);
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
  }, [deals, debouncedSearchQuery, stageFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedDeals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDeals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDeals, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalRevenue = deals.reduce((sum, deal) => sum + deal.amount, 0);
    const wonDeals = deals.filter((d) => d.stage === "Closed Won");
    const wonRevenue = wonDeals.reduce((sum, deal) => sum + deal.amount, 0);
    const activeDeals = deals.filter((d) => !d.stage.startsWith("Closed"));
    const pipeline = activeDeals.reduce((sum, deal) => sum + deal.amount, 0);

    return [
      {
        label: "Total Pipeline",
        value: `$${(pipeline / 1000).toFixed(0)}K`,
        icon: TrendingUp,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 15, isPositive: true },
        description: `${activeDeals.length} active deals`,
      },
      {
        label: "Won Revenue",
        value: `$${(wonRevenue / 1000).toFixed(0)}K`,
        icon: CheckCircle2,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 12, isPositive: true },
        description: `${wonDeals.length} deals closed`,
      },
      {
        label: "Avg Deal Size",
        value: `$${deals.length > 0 ? ((totalRevenue / deals.length) / 1000).toFixed(0) : 0}K`,
        icon: Target,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Total Deals",
        value: deals.length,
        icon: DollarSign,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
    ];
  }, [deals]);

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
      label: "All Deals",
      value: null,
      count: deals.length,
    },
    {
      label: "Prospecting",
      value: "Prospecting",
      count: deals.filter((d) => d.stage === "Prospecting").length,
    },
    {
      label: "Qualification",
      value: "Qualification",
      count: deals.filter((d) => d.stage === "Qualification").length,
    },
    {
      label: "Proposal",
      value: "Proposal",
      count: deals.filter((d) => d.stage === "Proposal").length,
    },
    {
      label: "Negotiation",
      value: "Negotiation",
      count: deals.filter((d) => d.stage === "Negotiation").length,
    },
    {
      label: "Closed Won",
      value: "Closed Won",
      count: deals.filter((d) => d.stage === "Closed Won").length,
    },
    {
      label: "Closed Lost",
      value: "Closed Lost",
      count: deals.filter((d) => d.stage === "Closed Lost").length,
    },
  ], [deals]);

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
    if (selectedDeals.length === paginatedDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(paginatedDeals.map((d) => d.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedDeals.includes(numId)) {
      setSelectedDeals(selectedDeals.filter((dId) => dId !== numId));
    } else {
      setSelectedDeals([...selectedDeals, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (deal: typeof deals[0]) => {
    setDealToDelete(deal);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dealToDelete?.id) return;
    
    try {
      await deleteDeal.mutateAsync(dealToDelete.id);
      setIsDeleteModalOpen(false);
      setDealToDelete(null);
    } catch (error) {
      console.error("Error deleting deal:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDealToDelete(null);
  };

  // Form handlers
  const handleAddDeal = () => {
    setFormMode("add");
    setEditingDeal(null);
    setFormDrawerOpen(true);
  };

  const handleEditDeal = (deal: typeof deals[0]) => {
    setFormMode("edit");
    setEditingDeal({
      dealName: deal.dealName,
      amount: deal.amount,
      stage: deal.stage as any,
      probability: deal.probability,
      closeDate: deal.closeDate,
      accountId: deal.company,
      contactId: deal.contactName,
      assignedTo: deal.owner,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<DealType>) => {
    try {
      if (formMode === "add") {
      const newDeal = {
        dealName: data.dealName || "",
        company: data.accountId || "",
        contactName: data.contactId || "",
        amount: data.amount || 0,
        stage: data.stage || "Prospecting",
        probability: data.probability || 10,
        closeDate: data.closeDate || "",
        owner: data.assignedTo || "Unassigned",
      };
        await createDeal.mutateAsync(newDeal);
      } else if (editingDeal) {
        // Find the deal ID from the deals list
        const dealToUpdate = deals.find(d => 
          d.dealName === editingDeal.dealName
        );
        
        if (dealToUpdate?.id) {
          const updatedDeal = {
            dealName: data.dealName || "",
            company: data.accountId || "",
            contactName: data.contactId || "",
            amount: data.amount || 0,
            stage: data.stage || "Prospecting",
            probability: data.probability || 10,
            closeDate: data.closeDate || "",
            owner: data.assignedTo || "Unassigned",
          };
          await updateDeal.mutateAsync({ id: dealToUpdate.id, data: updatedDeal });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingDeal(null);
    } catch (error) {
      console.error("Error submitting deal:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllDeals = () => {
    setSelectedDeals(filteredDeals.map(d => d.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedDeals([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedDeals);
      setSelectedDeals([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting deals:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStage = async (stage: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedDeals, data: { stage } });
      setSelectedDeals([]);
      setShowBulkUpdateStage(false);
    } catch (error) {
      console.error("Error bulk updating deals:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredDeals.filter(deal => deal.id !== undefined && selectedDeals.includes(deal.id));
    
    if (selectedData.length === 0) {
      toast.error("No deals selected for export");
      return;
    }

    try {
      // Use the same export columns as the main ExportButton
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-deals-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} deals`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export deals");
    }
  };

  // Filter chips data
  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    
    if (stageFilter) {
      chips.push({
        id: 'stage-filter',
        label: 'Stage',
        value: stageFilter,
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
  }, [stageFilter, filterGroup, filterFields]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === 'stage-filter') {
      setStageFilter(null);
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
    setStageFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    clearModuleFilters('deals');
  };

  // Get stage color helper
  const getStageColor = (stage: string) => {
    const colors = {
      Prospecting: "bg-muted text-muted-foreground",
      Qualification: "bg-secondary/10 text-secondary",
      Proposal: "bg-accent/10 text-accent",
      Negotiation: "bg-primary/10 text-primary",
      "Closed Won": "bg-primary/20 text-primary",
      "Closed Lost": "bg-destructive/10 text-destructive",
    };
    return colors[stage as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New deal",
        action: () => {
          setEditingDeal(null);
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
      key: "dealName",
      label: "Deal",
      sortable: true,
      render: (_value: unknown, row: typeof deals[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/deals/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.dealName}</div>
            <div className="text-sm text-muted-foreground">{row.company}</div>
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-foreground">
          ${value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: "probability",
      label: "Probability",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground w-10 text-right">
            {value}%
          </span>
        </div>
      ),
    },
    {
      key: "closeDate",
      label: "Close Date",
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
        title="Deals"
        icon={DollarSign}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${deals.length} deals in pipeline`}
        searchPlaceholder="Search deals by name, company, or contact..."
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
            <ViewToggle 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              showLabels={false} 
              showKanban={true}
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
                title="Filter deals by stage"
              >
                <Filter className="h-4 w-4 mr-2" />
                {stageFilter
                  ? filterOptions.find((f) => f.value === stageFilter)?.label
                  : "All Deals"}
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
                          setStageFilter(option.value);
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
                        {stageFilter === option.value && (
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
              title="Import deals from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredDeals}
              columns={exportColumns}
              filename="deals-export"
              title="Deals Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new deal"
              onClick={handleAddDeal}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
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
        {selectedDeals.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedDeals.length}
            totalCount={filteredDeals.length}
            onSelectAll={handleSelectAllDeals}
            onDeselectAll={handleDeselectAll}
            onDelete={() => setShowBulkDelete(true)}
            onExport={handleBulkExport}
            onUpdateStatus={() => setShowBulkUpdateStage(true)}
            statusLabel="Stage"
            isProcessing={isBulkProcessing}
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedDeals}
          columns={columns}
          selectedIds={selectedDeals}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No deals found"
          emptyDescription="Try adjusting your search or filters, or add a new deal"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/sales/deals/${row.id}`),
                },
                {
                  label: "Edit Deal",
                  icon: Edit,
                  onClick: () => handleEditDeal(row),
                },
                {
                  label: "Send Email",
                  icon: Mail,
                  onClick: () => window.location.href = `mailto:${row.contactName}`,
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
      ) : viewMode === "kanban" ? (
        /* Kanban View */
        <KanbanBoard
          deals={filteredDeals}
          onDealMove={async (dealId, newStage) => {
            try {
              await updateDeal.mutateAsync({ 
                id: dealId, 
                data: { stage: newStage as "Prospecting" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" } 
              });
            } catch (error) {
              console.error("Error moving deal:", error);
            }
          }}
          onDealClick={(deal) => router.push(`/sales/deals/${deal.id}`)}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedDeals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/deals/${deal.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {deal.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {deal.dealName}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {deal.company}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/sales/deals/${deal.id}`),
                        },
                        {
                          label: "Edit Deal",
                          icon: Edit,
                          onClick: () => handleEditDeal(deal),
                        },
                        {
                          label: "Send Email",
                          icon: Mail,
                          onClick: () => window.location.href = `mailto:${deal.contactName}`,
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(deal),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      ${(deal.amount / 1000).toFixed(0)}K
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                      {deal.stage}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Probability</span>
                      <span className="font-semibold text-foreground">{deal.probability}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${deal.probability}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="h-4 w-4" />
                    <span>Close: {deal.closeDate}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{deal.owner}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination (hidden in Kanban view) */}
      {viewMode !== "kanban" && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDeals.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedDeals([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedDeals([]);
        }}
        filterInfo={
          stageFilter ? `filtered by ${stageFilter}` : undefined
        }
      />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Deal"
        description="Are you sure you want to delete this deal? This will permanently remove it from your CRM and cannot be undone."
        itemName={dealToDelete?.dealName}
        itemType="Deal"
        icon={DollarSign}
        isDeleting={deleteDeal.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedDeals.length}
        itemName="deal"
      />

      {/* Bulk Update Stage Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStage}
        onClose={() => setShowBulkUpdateStage(false)}
        onConfirm={handleBulkUpdateStage}
        itemCount={selectedDeals.length}
        title="Update Stage"
        field="stage"
        options={[
          { label: 'Prospecting', value: 'Prospecting' },
          { label: 'Qualification', value: 'Qualification' },
          { label: 'Proposal', value: 'Proposal' },
          { label: 'Negotiation', value: 'Negotiation' },
          { label: 'Closed Won', value: 'Closed Won' },
          { label: 'Closed Lost', value: 'Closed Lost' },
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

      {/* Deal Form Drawer */}
      <DealFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingDeal(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDeal}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
