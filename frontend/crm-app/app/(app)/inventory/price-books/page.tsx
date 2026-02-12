"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  Check,
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
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { FilterChips } from "@/components/FilterChips";
import type { FilterChip } from "@/components/FilterChips";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData, FilterPreset } from "@/components/AdvancedFilter";
import { useUIStore } from "@/stores/useUIStore";
import {
  usePriceBooks,
  useCreatePriceBook,
  useUpdatePriceBook,
  useDeletePriceBook,
  useBulkDeletePriceBooks,
  useBulkUpdatePriceBooks,
} from "@/lib/queries/usePriceBooks";
import type { PriceBookDisplay } from "@/lib/api/mock/priceBooks";
import type { PriceBook as PriceBookType } from "@/lib/types";

// Lazy load heavy components
const PriceBookFormDrawer = dynamic(
  () => import("@/components/Forms/Inventory").then((mod) => ({ default: mod.PriceBookFormDrawer })),
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

export default function PriceBooksPage() {
  const router = useRouter();

  // React Query hooks
  const { data: priceBooks = [], isLoading } = usePriceBooks();
  const createPriceBook = useCreatePriceBook();
  const updatePriceBook = useUpdatePriceBook();
  const deletePriceBook = useDeletePriceBook();
  const bulkDelete = useBulkDeletePriceBooks();
  const bulkUpdate = useBulkUpdatePriceBooks();

  // Zustand UI state (persisted)
  const { 
    viewMode, 
    showStats, 
    setViewMode, 
    toggleStats,
    filters,
    setModuleFilters,
    defaultItemsPerPage: defaultPerPage,
  } = useUIStore();
  
  // Initialize filters from store
  const priceBooksFilters = filters.priceBooks || {};

  // State management
  const [searchQuery, setSearchQuery] = useState(priceBooksFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(priceBooksFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedPriceBooks, setSelectedPriceBooks] = useState<number[]>([]);
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
  } = useFilterPresets("priceBooks");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('priceBooks', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [priceBookToDelete, setPriceBookToDelete] = useState<PriceBookDisplay | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingPriceBook, setEditingPriceBook] = useState<Partial<PriceBookType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView] = useState<"quick" | "detailed">("quick");

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

  // Export columns configuration
  const exportColumns: ExportColumn<typeof priceBooks[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'products', label: 'Products' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'validFrom', label: 'Valid From' },
    { key: 'validTo', label: 'Valid To' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
    },
    {
      key: 'currency',
      label: 'Currency',
      type: 'select',
      options: [
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
        { label: 'GBP', value: 'GBP' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Draft', value: 'Draft' },
      ],
    },
    {
      key: 'products',
      label: 'Number of Products',
      type: 'number',
    },
  ], []);

  // Filter options with counts
  const filterOptions = useMemo(
    () => [
      {
        id: "all",
        label: "All Price Books",
        icon: BookOpen,
        value: null,
        count: priceBooks.length,
      },
      {
        id: "active",
        label: "Active",
        icon: CheckCircle,
        value: "Active",
        count: priceBooks.filter((pb) => pb.status === "Active").length,
      },
      {
        id: "inactive",
        label: "Inactive",
        icon: XCircle,
        value: "Inactive",
        count: priceBooks.filter((pb) => pb.status === "Inactive").length,
      },
      {
        id: "draft",
        label: "Draft",
        icon: FileText,
        value: "Draft",
        count: priceBooks.filter((pb) => pb.status === "Draft").length,
      },
    ],
    [priceBooks]
  );

  // Stats calculation
  const stats = useMemo(() => {
    const totalPriceBooks = priceBooks.length;
    const activePriceBooks = priceBooks.filter((pb) => pb.status === "Active").length;
    const totalProducts = priceBooks.reduce((sum, pb) => sum + pb.products, 0);
    const draftPriceBooks = priceBooks.filter((pb) => pb.status === "Draft").length;

    return [
      {
        label: "Total Price Books",
        value: totalPriceBooks,
        icon: BookOpen,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Active",
        value: activePriceBooks,
        icon: CheckCircle,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Total Products",
        value: totalProducts,
        icon: Package,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Draft",
        value: draftPriceBooks,
        icon: FileText,
        iconBgColor: "bg-muted",
        iconColor: "text-muted-foreground",
      },
    ];
  }, [priceBooks]);

  // Filter & sort logic (using debounced search query)
  const filteredPriceBooks = useMemo(() => {
    let filtered = priceBooks;

    // Search filter (debounced)
    if (debouncedSearch) {
      filtered = filtered.filter(
        (pb) =>
          pb.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          pb.description.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((pb) => pb.status === statusFilter);
    }

    // Advanced filter
    if (filterGroup) {
      filtered = filterData(filtered, filterGroup);
    }

    // Sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof PriceBookDisplay];
        const bValue = b[sortColumn as keyof PriceBookDisplay];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [priceBooks, debouncedSearch, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredPriceBooks.length / itemsPerPage);
  const paginatedPriceBooks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPriceBooks.slice(start, end);
  }, [filteredPriceBooks, currentPage, itemsPerPage]);

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    const colors = {
      Active: "bg-accent/10 text-accent border-accent/20",
      Inactive: "bg-muted text-muted-foreground border-border",
      Draft: "bg-secondary/10 text-secondary border-secondary/20",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground border-border";
  };

  // Handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSelectAllPriceBooks = useCallback(() => {
    setSelectedPriceBooks(paginatedPriceBooks.map((pb) => pb.id));
  }, [paginatedPriceBooks]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPriceBooks([]);
  }, []);

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedPriceBooks.includes(numId)) {
      setSelectedPriceBooks(selectedPriceBooks.filter((pbId) => pbId !== numId));
    } else {
      setSelectedPriceBooks([...selectedPriceBooks, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (priceBook: PriceBookDisplay) => {
    setPriceBookToDelete(priceBook);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!priceBookToDelete) return;
    await deletePriceBook.mutateAsync(priceBookToDelete.id);
    setIsDeleteModalOpen(false);
    setPriceBookToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setPriceBookToDelete(null);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    setShowBulkDelete(false);
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedPriceBooks);
      setSelectedPriceBooks([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setShowBulkUpdateStatus(false);
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedPriceBooks, data: { status } });
      setSelectedPriceBooks([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = (format: "csv" | "xlsx" | "pdf") => {
    if (format === "csv") {
      exportToCSV(
        filteredPriceBooks.filter((pb) => selectedPriceBooks.includes(pb.id)),
        exportColumns,
        "price-books"
      );
    }
  };

  // Form handlers
  const handleAddPriceBook = () => {
    setEditingPriceBook(null);
    setFormMode("add");
    setFormDrawerOpen(true);
  };

  const handleEditPriceBook = (priceBook: PriceBookDisplay) => {
    setEditingPriceBook({
      id: priceBook.id,
      name: priceBook.name,
      description: priceBook.description,
      currency: priceBook.currency as "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD",
      status: priceBook.status as "Active" | "Inactive" | "Draft",
      validFrom: priceBook.validFrom,
      validTo: priceBook.validTo,
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<PriceBookType>) => {
    const mappedData: Partial<PriceBookDisplay> = {
      name: data.name,
      description: data.description,
      currency: data.currency,
      status: data.status,
      validFrom: data.validFrom,
      validTo: data.validTo,
    };

    if (formMode === "add") {
      await createPriceBook.mutateAsync(mappedData);
    } else if (editingPriceBook?.id) {
      await updatePriceBook.mutateAsync({
        id: editingPriceBook.id as number,
        data: mappedData,
      });
    }
    setFormDrawerOpen(false);
    setEditingPriceBook(null);
  };

  // Filter chips
  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    
    if (statusFilter) {
      chips.push({
        id: "status",
        label: `Status: ${statusFilter}`,
        value: statusFilter,
      });
    }
    
    if (filterGroup && filterGroup.conditions.length > 0) {
      filterGroup.conditions.forEach((condition, index) => {
        const field = filterFields.find((f) => f.key === condition.field);
        chips.push({
          id: `advanced-${index}`,
          label: `${field?.label || condition.field} ${condition.operator} ${condition.value}`,
          value: condition.value,
        });
      });
    }
    
    return chips;
  }, [statusFilter, filterGroup, filterFields]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === "status") {
      setStatusFilter(null);
      setModuleFilters('priceBooks', { search: searchQuery, status: null });
    } else if (chipId.startsWith("advanced-")) {
      const conditionIndex = parseInt(chipId.split("-")[1]);
      handleRemoveFilterCondition(conditionIndex);
    }
  };
  
  const handleRemoveFilterCondition = (conditionIndex: number) => {
    if (!filterGroup) return;
    const newConditions = filterGroup.conditions.filter((_, idx) => idx !== conditionIndex);
    setFilterGroup({ ...filterGroup, conditions: newConditions });
  };
  
  const handleSaveFilterPreset = (preset: Omit<FilterPreset, "id" | "createdAt">) => {
    if (!filterGroup) return;
    addPreset({
      ...preset,
      group: filterGroup,
    });
  };
  
  const handleLoadFilterPreset = (preset: FilterPreset) => {
    if (preset?.group) {
      setFilterGroup(preset.group);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        action: handleAddPriceBook,
        description: "Create new price book",
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "name",
      label: "Price Book",
      sortable: true,
      render: (_value: unknown, row: PriceBookDisplay) => (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/inventory/price-books/${row.id}`)}
        >
          <div className="font-semibold text-foreground">{row.name}</div>
          <div className="text-sm text-muted-foreground">{row.description}</div>
        </div>
      ),
    },
    {
      key: "products",
      label: "Products",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{value as number}</span>
        </div>
      ),
    },
    {
      key: "currency",
      label: "Currency",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{value as string}</span>
        </div>
      ),
    },
    {
      key: "validFrom",
      label: "Valid From",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{value as string}</span>
        </div>
      ),
    },
    {
      key: "validTo",
      label: "Valid To",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm text-foreground">{value as string}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: unknown) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(value as string)}`}
        >
          {value as string}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Price Books"
        icon={BookOpen}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${priceBooks.length} price books`}
        searchPlaceholder="Search price books by name or description..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleStats}
              title={showStats ? "Hide Statistics" : "Show Statistics"}
            >
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} />

            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter price books by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All Price Books"}
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
                        {statusFilter === option.value && <Check className="h-4 w-4 text-brand-teal" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilter(true)}
              title="Advanced filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>

            <ExportButton data={filteredPriceBooks} columns={exportColumns} filename="price-books" />

            <Button
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Create new price book"
              onClick={handleAddPriceBook}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Price Book
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {filterChips.length > 0 && (
        <FilterChips chips={filterChips} onRemove={handleRemoveFilterChip} />
      )}

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedPriceBooks.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedPriceBooks.length}
            onDelete={() => setShowBulkDelete(true)}
            onUpdateStatus={() => setShowBulkUpdateStatus(true)}
            onExport={() => handleBulkExport("csv")}
            onSelectAll={handleSelectAllPriceBooks}
            onDeselectAll={handleDeselectAll}
            totalCount={paginatedPriceBooks.length}
            isProcessing={isBulkProcessing}
            statusLabel="Status"
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedPriceBooks}
          columns={columns}
          selectedIds={selectedPriceBooks}
          onSelectAll={handleSelectAllPriceBooks}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No price books found"
          emptyDescription="Try adjusting your search or filters, or create a new price book"
          loading={isLoading}
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/inventory/price-books/${row.id}`),
                },
                {
                  label: "Edit Price Book",
                  icon: Edit,
                  onClick: () => handleEditPriceBook(row),
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
          {paginatedPriceBooks.map((priceBook, index) => (
            <motion.div
              key={priceBook.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/inventory/price-books/${priceBook.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {priceBook.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {priceBook.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{priceBook.description}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/inventory/price-books/${priceBook.id}`),
                        },
                        {
                          label: "Edit Price Book",
                          icon: Edit,
                          onClick: () => handleEditPriceBook(priceBook),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(priceBook),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Products:</span>
                    <span className="font-medium text-foreground">{priceBook.products}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="font-medium text-foreground">{priceBook.currency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{priceBook.validFrom} - {priceBook.validTo}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(priceBook.status)}`}>
                    {priceBook.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {priceBook.created}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {filteredPriceBooks.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredPriceBooks.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedPriceBooks.length}
        itemName="price books"
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedPriceBooks.length}
        title="Update Price Book Status"
        field="status"
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
          { label: "Draft", value: "Draft" },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Price Book"
        description="Are you sure you want to delete this price book? This will permanently remove it from your records and cannot be undone."
        itemName={priceBookToDelete?.name}
        itemType="Price Book"
        icon={BookOpen}
        isDeleting={deletePriceBook.isPending}
      />

      {/* Price Book Form Drawer */}
      <PriceBookFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingPriceBook(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingPriceBook}
        mode={formMode}
        defaultView={defaultView}
      />

      {/* Advanced Filter Drawer */}
      <AdvancedFilter
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApply={(group) => {
          setFilterGroup(group);
          setShowAdvancedFilter(false);
        }}
        onClear={() => setFilterGroup(null)}
        fields={filterFields}
        initialGroup={filterGroup || undefined}
        isDrawer={true}
        drawerPosition="right"
        presets={filterPresets}
        onSavePreset={handleSaveFilterPreset}
        onLoadPreset={handleLoadFilterPreset}
        onDeletePreset={deletePreset}
      />
    </div>
  );
}
