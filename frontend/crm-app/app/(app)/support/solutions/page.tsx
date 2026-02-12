"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Lightbulb,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  BookOpen,
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
import { SolutionFormDrawer } from "@/components/Forms/Support";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useSolutions, 
  useCreateSolution,
  useUpdateSolution,
  useDeleteSolution, 
  useBulkDeleteSolutions, 
  useBulkUpdateSolutions 
} from "@/lib/queries/useSolutions";
import { useUIStore } from "@/stores";
import type { Solution } from "@/lib/types";

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

export default function SolutionsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: solutions = [], isLoading } = useSolutions();
  const createSolution = useCreateSolution();
  const updateSolution = useUpdateSolution();
  const deleteSolution = useDeleteSolution();
  const bulkDelete = useBulkDeleteSolutions();
  const bulkUpdate = useBulkUpdateSolutions();
  
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
  const solutionsFilters = filters.solutions || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(solutionsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(solutionsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedSolutions, setSelectedSolutions] = useState<number[]>([]);
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
  } = useFilterPresets("solutions");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('solutions', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [solutionToDelete, setSolutionToDelete] = useState<typeof solutions[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<Partial<Solution> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof solutions[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'solutionNumber', label: 'Solution Number' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'subcategory', label: 'Subcategory' },
    { key: 'author', label: 'Author' },
    { key: 'status', label: 'Status' },
    { key: 'views', label: 'Views' },
    { key: 'helpful', label: 'Helpful %' },
    { key: 'rating', label: 'Rating' },
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
      key: 'category',
      label: 'Category',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'Draft' },
        { label: 'Published', value: 'Published' },
        { label: 'Archived', value: 'Archived' },
      ],
    },
    {
      key: 'author',
      label: 'Author',
      type: 'text',
    },
    {
      key: 'views',
      label: 'Views',
      type: 'number',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredSolutions = useMemo(() => {
    let filtered = solutions;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (solution) =>
          solution.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          solution.category?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          solution.solutionNumber?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          solution.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((solution) => solution.status === statusFilter);
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
  }, [solutions, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedSolutions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSolutions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSolutions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSolutions.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalSolutions = solutions.length;
    const published = solutions.filter((s) => s.status === "Published").length;
    const draft = solutions.filter((s) => s.status === "Draft").length;
    const totalViews = solutions.reduce((sum, s) => sum + (s.views || 0), 0);

    return [
      {
        label: "Total Solutions",
        value: totalSolutions,
        icon: Lightbulb,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 15, isPositive: true },
      },
      {
        label: "Published",
        value: published,
        icon: BookOpen,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Draft",
        value: draft,
        icon: FileText,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Total Views",
        value: totalViews,
        icon: TrendingUp,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 23, isPositive: true },
      },
    ];
  }, [solutions]);

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
      label: "All Solutions",
      value: null,
      count: solutions.length,
    },
    {
      label: "Published",
      value: "Published",
      count: solutions.filter((s) => s.status === "Published").length,
    },
    {
      label: "Draft",
      value: "Draft",
      count: solutions.filter((s) => s.status === "Draft").length,
    },
    {
      label: "Archived",
      value: "Archived",
      count: solutions.filter((s) => s.status === "Archived").length,
    },
  ], [solutions]);

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
    if (selectedSolutions.length === paginatedSolutions.length) {
      setSelectedSolutions([]);
    } else {
      setSelectedSolutions(paginatedSolutions.map((s) => s.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedSolutions.includes(numId)) {
      setSelectedSolutions(selectedSolutions.filter((sId) => sId !== numId));
    } else {
      setSelectedSolutions([...selectedSolutions, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (solution: typeof solutions[0]) => {
    setSolutionToDelete(solution);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!solutionToDelete?.id) return;
    
    try {
      await deleteSolution.mutateAsync(solutionToDelete.id);
      setIsDeleteModalOpen(false);
      setSolutionToDelete(null);
    } catch (error) {
      console.error("Error deleting solution:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSolutionToDelete(null);
  };

  // Form handlers
  const handleAddSolution = () => {
    setFormMode("add");
    setEditingSolution(null);
    setFormDrawerOpen(true);
  };

  const handleEditSolution = (solution: typeof solutions[0]) => {
    setFormMode("edit");
    setEditingSolution(solution);
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Solution>) => {
    try {
      if (formMode === "add") {
        const newSolution = {
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          subcategory: data.subcategory,
          author: data.author || "System",
          status: data.status || "Draft",
          tags: data.tags || [],
        };
        await createSolution.mutateAsync(newSolution);
      } else if (editingSolution) {
        // Find the solution ID from the solutions list
        const solutionToUpdate = solutions.find(s => 
          s.id === editingSolution.id ||
          s.solutionNumber === editingSolution.solutionNumber
        );
        
        if (solutionToUpdate?.id) {
          const updatedSolution = {
            title: data.title,
            description: data.description,
            category: data.category,
            subcategory: data.subcategory,
            author: data.author,
            status: data.status,
            tags: data.tags,
          };
          await updateSolution.mutateAsync({ id: solutionToUpdate.id, data: updatedSolution });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingSolution(null);
    } catch (error) {
      console.error("Error submitting solution:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllSolutions = () => {
    setSelectedSolutions(filteredSolutions.map(s => s.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedSolutions([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedSolutions);
      setSelectedSolutions([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting solutions:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ 
        ids: selectedSolutions, 
        data: { status: status as "Draft" | "Published" | "Archived" } 
      });
      setSelectedSolutions([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Error bulk updating solutions:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredSolutions.filter(solution => solution.id !== undefined && selectedSolutions.includes(solution.id));
    
    if (selectedData.length === 0) {
      toast.error("No solutions selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-solutions-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} solutions`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export solutions");
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
    clearModuleFilters('solutions');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Draft: "bg-muted text-muted-foreground",
      Published: "bg-secondary/10 text-secondary",
      Archived: "bg-accent/10 text-accent",
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
        description: "New solution",
        action: () => {
          setEditingSolution(null);
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
      key: "solutionNumber",
      label: "Solution",
      sortable: true,
      render: (_value: unknown, row: typeof solutions[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/support/solutions/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.solutionNumber}</div>
            <div className="text-sm text-muted-foreground truncate max-w-xs">{row.title}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (value: string, row: typeof solutions[0]) => (
        <div>
          <span className="text-sm text-foreground">{value}</span>
          {row.subcategory && (
            <div className="text-xs text-muted-foreground">{row.subcategory}</div>
          )}
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
      key: "views",
      label: "Views",
      sortable: true,
      render: (value: number) => (
        <span className="text-sm text-muted-foreground">{value?.toLocaleString() || 0}</span>
      ),
    },
    {
      key: "helpful",
      label: "Helpful",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1 text-sm text-foreground">
          <ThumbsUp className="h-4 w-4 text-secondary" />
          <span>{value || 0}%</span>
        </div>
      ),
    },
    {
      key: "author",
      label: "Author",
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
        title="Solutions"
        icon={Lightbulb}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${solutions.length} solutions`}
        searchPlaceholder="Search solutions by title, category, or number..."
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
                title="Filter solutions by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Solutions"}
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
              title="Import solutions from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredSolutions}
              columns={exportColumns}
              filename="solutions-export"
              title="Solutions Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new solution"
              onClick={handleAddSolution}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Solution
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
        {selectedSolutions.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedSolutions.length}
            totalCount={filteredSolutions.length}
            onSelectAll={handleSelectAllSolutions}
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
          data={paginatedSolutions}
          columns={columns}
          selectedIds={selectedSolutions}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No solutions found"
          emptyDescription="Try adjusting your search or filters, or add a new solution"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/support/solutions/${row.id}`),
                },
                {
                  label: "Edit Solution",
                  icon: Edit,
                  onClick: () => handleEditSolution(row),
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
          {paginatedSolutions.map((solution, index) => (
            <motion.div
              key={solution.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/support/solutions/${solution.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center">
                      <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {solution.solutionNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {solution.author}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/support/solutions/${solution.id}`),
                        },
                        {
                          label: "Edit Solution",
                          icon: Edit,
                          onClick: () => handleEditSolution(solution),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(solution),
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {solution.title}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{solution.category}</span>
                    {solution.subcategory && (
                      <>
                        <span>•</span>
                        <span>{solution.subcategory}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{solution.views?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{solution.helpful || 0}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{solution.comments || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(solution.status)}`}>
                    {solution.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {solution.created}
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
        totalItems={filteredSolutions.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedSolutions([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedSolutions([]);
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
        title="Delete Solution"
        description="Are you sure you want to delete this solution? This will permanently remove it from your knowledge base and cannot be undone."
        itemName={solutionToDelete?.title}
        itemType="Solution"
        icon={Lightbulb}
        isDeleting={deleteSolution.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedSolutions.length}
        itemName="solution"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedSolutions.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Draft', value: 'Draft' },
          { label: 'Published', value: 'Published' },
          { label: 'Archived', value: 'Archived' },
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

      {/* Solution Form Drawer */}
      <SolutionFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingSolution(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingSolution}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
