"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LineChart,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Target,
  DollarSign,
  TrendingUp,
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
import { ForecastFormDrawer, type Forecast as ForecastType } from "@/components/Forms/Sales";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useForecasts, 
  useCreateForecast,
  useUpdateForecast,
  useDeleteForecast, 
  useBulkDeleteForecasts, 
  useBulkUpdateForecasts 
} from "@/lib/queries/useForecasts";
import { useUIStore } from "@/stores";
import type { ForecastDisplay } from "@/lib/api/mock/forecasts";

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

export default function ForecastsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: forecasts = [], isLoading } = useForecasts();
  const createForecast = useCreateForecast();
  const updateForecast = useUpdateForecast();
  const deleteForecast = useDeleteForecast();
  const bulkDelete = useBulkDeleteForecasts();
  const bulkUpdate = useBulkUpdateForecasts();
  
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
  const forecastsFilters = filters.forecasts || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(forecastsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(forecastsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedForecasts, setSelectedForecasts] = useState<number[]>([]);
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
  } = useFilterPresets("forecasts");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('forecasts', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [forecastToDelete, setForecastToDelete] = useState<ForecastDisplay | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingForecast, setEditingForecast] = useState<Partial<ForecastType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  // Export columns configuration
  const exportColumns: ExportColumn<ForecastDisplay>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'period', label: 'Period' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'targetRevenue', label: 'Target Revenue' },
    { key: 'committedRevenue', label: 'Committed Revenue' },
    { key: 'bestCase', label: 'Best Case' },
    { key: 'worstCase', label: 'Worst Case' },
    { key: 'actualRevenue', label: 'Actual Revenue' },
    { key: 'progress', label: 'Progress %' },
    { key: 'owner', label: 'Owner' },
    { key: 'dealsCount', label: 'Deals Count' },
    { key: 'status', label: 'Status' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'period',
      label: 'Period',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Planning', value: 'Planning' },
        { label: 'On Track', value: 'On Track' },
        { label: 'At Risk', value: 'At Risk' },
        { label: 'Achieved', value: 'Achieved' },
        { label: 'Missed', value: 'Missed' },
      ],
    },
    {
      key: 'owner',
      label: 'Owner',
      type: 'text',
    },
    {
      key: 'targetRevenue',
      label: 'Target Revenue',
      type: 'number',
    },
    {
      key: 'progress',
      label: 'Progress %',
      type: 'number',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredForecasts = useMemo(() => {
    let filtered = forecasts;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (forecast) =>
          forecast.period?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          forecast.owner?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((forecast) => forecast.status === statusFilter);
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
  }, [forecasts, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedForecasts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredForecasts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredForecasts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredForecasts.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalTarget = forecasts.reduce((sum, f) => sum + f.targetRevenue, 0);
    const totalCommitted = forecasts.reduce((sum, f) => sum + f.committedRevenue, 0);
    const totalActual = forecasts.reduce((sum, f) => sum + f.actualRevenue, 0);
    const avgProgress = forecasts.length > 0
      ? forecasts.reduce((sum, f) => sum + f.progress, 0) / forecasts.length
      : 0;

    return [
      {
        label: "Total Target",
        value: `$${(totalTarget / 1000000).toFixed(1)}M`,
        icon: Target,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Committed",
        value: `$${(totalCommitted / 1000000).toFixed(1)}M`,
        icon: DollarSign,
        iconBgColor: "bg-blue-500/10",
        iconColor: "text-blue-600",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Actual Revenue",
        value: `$${(totalActual / 1000000).toFixed(1)}M`,
        icon: TrendingUp,
        iconBgColor: "bg-green-500/10",
        iconColor: "text-green-600",
        trend: { value: 15, isPositive: true },
      },
      {
        label: "Avg Progress",
        value: `${avgProgress.toFixed(0)}%`,
        icon: LineChart,
        iconBgColor: "bg-purple-500/10",
        iconColor: "text-purple-600",
        trend: { value: 5, isPositive: true },
      },
    ];
  }, [forecasts]);

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
      label: "All Forecasts",
      value: null,
      count: forecasts.length,
    },
    {
      label: "On Track",
      value: "On Track",
      count: forecasts.filter((f) => f.status === "On Track").length,
    },
    {
      label: "At Risk",
      value: "At Risk",
      count: forecasts.filter((f) => f.status === "At Risk").length,
    },
    {
      label: "Planning",
      value: "Planning",
      count: forecasts.filter((f) => f.status === "Planning").length,
    },
    {
      label: "Achieved",
      value: "Achieved",
      count: forecasts.filter((f) => f.status === "Achieved").length,
    },
    {
      label: "Missed",
      value: "Missed",
      count: forecasts.filter((f) => f.status === "Missed").length,
    },
  ], [forecasts]);

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
    if (selectedForecasts.length === paginatedForecasts.length) {
      setSelectedForecasts([]);
    } else {
      setSelectedForecasts(paginatedForecasts.map((f) => f.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedForecasts.includes(numId)) {
      setSelectedForecasts(selectedForecasts.filter((fId) => fId !== numId));
    } else {
      setSelectedForecasts([...selectedForecasts, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (forecast: ForecastDisplay) => {
    setForecastToDelete(forecast);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!forecastToDelete?.id) return;
    
    try {
      await deleteForecast.mutateAsync(forecastToDelete.id);
      setIsDeleteModalOpen(false);
      setForecastToDelete(null);
    } catch {
      // Error handled by React Query
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setForecastToDelete(null);
  };

  // Form handlers
  const handleAddForecast = () => {
    setFormMode("add");
    setEditingForecast(null);
    setFormDrawerOpen(true);
  };

  const handleEditForecast = (forecast: ForecastDisplay) => {
    setFormMode("edit");
    setEditingForecast({
      id: forecast.id,
      period: forecast.period,
      startDate: forecast.startDate,
      endDate: forecast.endDate,
      targetRevenue: forecast.targetRevenue,
      committedRevenue: forecast.committedRevenue,
      bestCase: forecast.bestCase,
      worstCase: forecast.worstCase,
      status: forecast.status as ForecastType["status"],
      owner: forecast.owner,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<ForecastType>) => {
    try {
      if (formMode === "edit" && editingForecast?.id) {
        await updateForecast.mutateAsync({ 
          id: editingForecast.id, 
          data: {
            period: data.period,
            startDate: data.startDate,
            endDate: data.endDate,
            targetRevenue: data.targetRevenue,
            committedRevenue: data.committedRevenue,
            bestCase: data.bestCase,
            worstCase: data.worstCase,
            status: data.status,
            owner: data.owner,
          }
        });
      } else {
        await createForecast.mutateAsync({
          period: data.period || "",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          targetRevenue: data.targetRevenue || 0,
          committedRevenue: data.committedRevenue || 0,
          bestCase: data.bestCase || 0,
          worstCase: data.worstCase || 0,
          status: data.status || "Planning",
          owner: data.owner || "Unknown",
          actualRevenue: 0,
          dealsCount: 0,
        });
      }
      
      setFormDrawerOpen(false);
      setEditingForecast(null);
    } catch {
      // Error handled by React Query
    }
  };

  // Bulk operation handlers
  const handleSelectAllForecasts = () => {
    setSelectedForecasts(filteredForecasts.map(f => f.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedForecasts([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedForecasts);
      setSelectedForecasts([]);
      setShowBulkDelete(false);
    } catch {
      // Error handled by React Query
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedForecasts, data: { status } });
      setSelectedForecasts([]);
      setShowBulkUpdateStatus(false);
    } catch {
      // Error handled by React Query
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredForecasts.filter(forecast => forecast.id !== undefined && selectedForecasts.includes(forecast.id));
    
    if (selectedData.length === 0) {
      toast.error("No forecasts selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-forecasts-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} forecasts`);
    } catch (error) {
      // Error handled
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
    clearModuleFilters('forecasts');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      "On Track": "bg-green-500/10 text-green-600 dark:text-green-400",
      "At Risk": "bg-red-500/10 text-red-600 dark:text-red-400",
      Planning: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      Achieved: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      Missed: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
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
        description: "New forecast",
        action: handleAddForecast,
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "period",
      label: "Period",
      sortable: true,
      render: (_value: unknown, row: ForecastDisplay) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/forecasts/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.period}</div>
            <div className="text-sm text-muted-foreground">{row.startDate} - {row.endDate}</div>
          </div>
        </div>
      ),
    },
    {
      key: "targetRevenue",
      label: "Target",
      sortable: true,
      render: (_value: unknown, row: ForecastDisplay) => (
        <div className="font-medium text-foreground">
          ${(row.targetRevenue / 1000000).toFixed(2)}M
        </div>
      ),
    },
    {
      key: "committedRevenue",
      label: "Committed",
      sortable: true,
      render: (_value: unknown, row: ForecastDisplay) => (
        <span className="text-sm text-foreground">
          ${(row.committedRevenue / 1000000).toFixed(2)}M
        </span>
      ),
    },
    {
      key: "actualRevenue",
      label: "Actual",
      sortable: true,
      render: (_value: unknown, row: ForecastDisplay) => (
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          ${(row.actualRevenue / 1000000).toFixed(2)}M
        </span>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      sortable: true,
      render: (_value: unknown, row: ForecastDisplay) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all rounded-full"
              style={{ width: `${Math.min(row.progress, 100)}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: "dealsCount",
      label: "Deals",
      sortable: true,
      render: (value: number) => (
        <span className="text-sm text-foreground">{value}</span>
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
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Sales Forecasts"
        icon={LineChart}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${forecasts.length} forecasts`}
        searchPlaceholder="Search forecasts by period or owner..."
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
            
            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter forecasts by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Forecasts"}
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
              title="Import forecasts from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredForecasts}
              columns={exportColumns}
              filename="forecasts-export"
              title="Forecasts Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new forecast"
              onClick={handleAddForecast}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Forecast
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
        {selectedForecasts.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedForecasts.length}
            totalCount={filteredForecasts.length}
            onSelectAll={handleSelectAllForecasts}
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
          data={paginatedForecasts}
          columns={columns}
          selectedIds={selectedForecasts}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No forecasts found"
          emptyDescription="Try adjusting your search or filters, or add a new forecast"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: LineChart,
                  onClick: () => router.push(`/sales/forecasts/${row.id}`),
                },
                {
                  label: "Edit Forecast",
                  icon: Edit,
                  onClick: () => handleEditForecast(row),
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
          {paginatedForecasts.map((forecast, index) => (
            <motion.div
              key={forecast.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/forecasts/${forecast.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {forecast.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {forecast.period}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {forecast.startDate} - {forecast.endDate}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: LineChart,
                          onClick: () => router.push(`/sales/forecasts/${forecast.id}`),
                        },
                        {
                          label: "Edit Forecast",
                          icon: Edit,
                          onClick: () => handleEditForecast(forecast),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(forecast),
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium text-foreground">
                      ${(forecast.targetRevenue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Actual:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ${(forecast.actualRevenue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress:</span>
                      <span className="text-muted-foreground">{forecast.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all rounded-full"
                        style={{ width: `${Math.min(forecast.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(forecast.status)}`}>
                    {forecast.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {forecast.dealsCount} deals
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
        totalItems={filteredForecasts.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedForecasts([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedForecasts([]);
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
        title="Delete Forecast"
        description="Are you sure you want to delete this forecast? This will permanently remove it from your CRM and cannot be undone."
        itemName={forecastToDelete?.period}
        itemType="Forecast"
        icon={LineChart}
        isDeleting={deleteForecast.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedForecasts.length}
        itemName="forecast"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedForecasts.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Planning', value: 'Planning' },
          { label: 'On Track', value: 'On Track' },
          { label: 'At Risk', value: 'At Risk' },
          { label: 'Achieved', value: 'Achieved' },
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

      {/* Forecast Form Drawer */}
      <ForecastFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingForecast(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingForecast}
        mode={formMode}
      />
    </div>
  );
}
