"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Clock,
  Send,
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
  useQuotes,
  useCreateQuote,
  useUpdateQuote,
  useDeleteQuote,
  useBulkDeleteQuotes,
  useBulkUpdateQuotes,
} from "@/lib/queries/useQuotes";
import type { QuoteDisplay } from "@/lib/api/mock/quotes";
import type { Quote as QuoteType } from "@/lib/types";

// Lazy load heavy components
const QuoteFormDrawer = dynamic(
  () => import("@/components/Forms/Inventory").then((mod) => ({ default: mod.QuoteFormDrawer })),
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

export default function QuotesPage() {
  const router = useRouter();

  // React Query hooks
  const { data: quotes = [], isLoading } = useQuotes();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const bulkDelete = useBulkDeleteQuotes();
  const bulkUpdate = useBulkUpdateQuotes();

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
  const quotesFilters = filters.quotes || {};

  // State management
  const [searchQuery, setSearchQuery] = useState(quotesFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(quotesFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([]);
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
  } = useFilterPresets("quotes");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('quotes', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteDisplay | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Partial<QuoteType> | null>(null);
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
  const exportColumns: ExportColumn<typeof quotes[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'quoteNumber', label: 'Quote Number' },
    { key: 'customer', label: 'Customer' },
    { key: 'items', label: 'Items' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'validUntil', label: 'Valid Until' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'quoteNumber',
      label: 'Quote Number',
      type: 'text',
    },
    {
      key: 'customer',
      label: 'Customer',
      type: 'text',
    },
    {
      key: 'total',
      label: 'Total Amount',
      type: 'number',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'Draft' },
        { label: 'Sent', value: 'Sent' },
        { label: 'Accepted', value: 'Accepted' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Expired', value: 'Expired' },
      ],
    },
    {
      key: 'created',
      label: 'Created Date',
      type: 'date',
    },
  ], []);

  // Filter options with counts
  const filterOptions = useMemo(
    () => [
      {
        id: "all",
        label: "All Quotes",
        icon: FileText,
        value: null,
        count: quotes.length,
      },
      {
        id: "draft",
        label: "Draft",
        icon: Clock,
        value: "Draft",
        count: quotes.filter((q) => q.status === "Draft").length,
      },
      {
        id: "sent",
        label: "Sent",
        icon: Send,
        value: "Sent",
        count: quotes.filter((q) => q.status === "Sent").length,
      },
      {
        id: "accepted",
        label: "Accepted",
        icon: CheckCircle,
        value: "Accepted",
        count: quotes.filter((q) => q.status === "Accepted").length,
      },
      {
        id: "rejected",
        label: "Rejected",
        icon: XCircle,
        value: "Rejected",
        count: quotes.filter((q) => q.status === "Rejected").length,
      },
      {
        id: "expired",
        label: "Expired",
        icon: Clock,
        value: "Expired",
        count: quotes.filter((q) => q.status === "Expired").length,
      },
    ],
    [quotes]
  );

  // Stats calculation
  const stats = useMemo(() => {
    const totalQuotes = quotes.length;
    const sentQuotes = quotes.filter((q) => q.status === "Sent").length;
    const totalValue = quotes.reduce((sum, q) => sum + q.total, 0);
    const acceptedQuotes = quotes.filter((q) => q.status === "Accepted").length;

    return [
      {
        label: "Total Quotes",
        value: totalQuotes,
        icon: FileText,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Sent",
        value: sentQuotes,
        icon: Send,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Total Value",
        value: `$${(totalValue / 1000).toFixed(1)}K`,
        icon: DollarSign,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Accepted",
        value: acceptedQuotes,
        icon: TrendingUp,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
    ];
  }, [quotes]);

  // Filter & sort logic (using debounced search query)
  const filteredQuotes = useMemo(() => {
    let filtered = quotes;

    // Search filter (debounced)
    if (debouncedSearch) {
      filtered = filtered.filter(
        (quote) =>
          quote.quoteNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          quote.customer.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((quote) => quote.status === statusFilter);
    }

    // Advanced filter
    if (filterGroup) {
      filtered = filterData(filtered, filterGroup);
    }

    // Sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof QuoteDisplay];
        const bValue = b[sortColumn as keyof QuoteDisplay];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [quotes, debouncedSearch, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const paginatedQuotes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredQuotes.slice(start, end);
  }, [filteredQuotes, currentPage, itemsPerPage]);

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    const colors = {
      Draft: "bg-muted text-muted-foreground border-border",
      Sent: "bg-secondary/10 text-secondary border-secondary/20",
      Accepted: "bg-accent/10 text-accent border-accent/20",
      Rejected: "bg-destructive/10 text-destructive border-destructive/20",
      Expired: "bg-muted text-muted-foreground border-border",
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

  const handleSelectAllQuotes = useCallback(() => {
    setSelectedQuotes(paginatedQuotes.map((q) => q.id));
  }, [paginatedQuotes]);

  const handleDeselectAll = useCallback(() => {
    setSelectedQuotes([]);
  }, []);

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedQuotes.includes(numId)) {
      setSelectedQuotes(selectedQuotes.filter((qId) => qId !== numId));
    } else {
      setSelectedQuotes([...selectedQuotes, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (quote: QuoteDisplay) => {
    setQuoteToDelete(quote);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quoteToDelete) return;
    await deleteQuote.mutateAsync(quoteToDelete.id);
    setIsDeleteModalOpen(false);
    setQuoteToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setQuoteToDelete(null);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    setShowBulkDelete(false);
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedQuotes);
      setSelectedQuotes([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setShowBulkUpdateStatus(false);
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedQuotes, data: { status } });
      setSelectedQuotes([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = (format: "csv" | "xlsx" | "pdf") => {
    if (format === "csv") {
      exportToCSV(
        filteredQuotes.filter((q) => selectedQuotes.includes(q.id)),
        exportColumns,
        "quotes"
      );
    }
  };

  // Form handlers
  const handleAddQuote = () => {
    setEditingQuote(null);
    setFormMode("add");
    setFormDrawerOpen(true);
  };

  const handleEditQuote = (quote: QuoteDisplay) => {
    setEditingQuote({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      customer: quote.customer,
      total: quote.total,
      status: quote.status as "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired",
      validUntil: quote.validUntil,
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<QuoteType>) => {
    const mappedData: Partial<QuoteDisplay> = {
      quoteNumber: data.quoteNumber,
      customer: data.customer,
      total: data.total,
      status: data.status,
      validUntil: data.validUntil,
    };

    if (formMode === "add") {
      await createQuote.mutateAsync(mappedData);
    } else if (editingQuote?.id) {
      await updateQuote.mutateAsync({
        id: editingQuote.id as number,
        data: mappedData,
      });
    }
    setFormDrawerOpen(false);
    setEditingQuote(null);
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
      setModuleFilters('quotes', { search: searchQuery, status: null });
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
        action: handleAddQuote,
        description: "Create new quote",
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "quoteNumber",
      label: "Quote Number",
      sortable: true,
      render: (_value: unknown, row: QuoteDisplay) => (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/inventory/quotes/${row.id}`)}
        >
          <div className="font-semibold text-foreground">{row.quoteNumber}</div>
          <div className="text-sm text-muted-foreground">{row.customer}</div>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm font-medium text-foreground">{value as number}</span>
      ),
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm font-medium text-foreground">
          ${(value as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "validUntil",
      label: "Valid Until",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{value as string}</span>
        </div>
      ),
    },
    {
      key: "created",
      label: "Created",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm text-muted-foreground">{value as string}</span>
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
        title="Quotes"
        icon={FileText}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${quotes.length} quotes`}
        searchPlaceholder="Search quotes by number or customer..."
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
                title="Filter quotes by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All Quotes"}
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

            <ExportButton data={filteredQuotes} columns={exportColumns} filename="quotes" />

            <Button
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Create new quote"
              onClick={handleAddQuote}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Quote
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
        {selectedQuotes.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedQuotes.length}
            onDelete={() => setShowBulkDelete(true)}
            onUpdateStatus={() => setShowBulkUpdateStatus(true)}
            onExport={() => handleBulkExport("csv")}
            onSelectAll={handleSelectAllQuotes}
            onDeselectAll={handleDeselectAll}
            totalCount={paginatedQuotes.length}
            isProcessing={isBulkProcessing}
            statusLabel="Status"
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedQuotes}
          columns={columns}
          selectedIds={selectedQuotes}
          onSelectAll={handleSelectAllQuotes}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No quotes found"
          emptyDescription="Try adjusting your search or filters, or create a new quote"
          loading={isLoading}
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/inventory/quotes/${row.id}`),
                },
                {
                  label: "Edit Quote",
                  icon: Edit,
                  onClick: () => handleEditQuote(row),
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
          {paginatedQuotes.map((quote, index) => (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/inventory/quotes/${quote.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {quote.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {quote.quoteNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">{quote.customer}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/inventory/quotes/${quote.id}`),
                        },
                        {
                          label: "Edit Quote",
                          icon: Edit,
                          onClick: () => handleEditQuote(quote),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(quote),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="text-lg font-semibold text-foreground">${quote.total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{quote.created}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Valid Until:</span> {quote.validUntil}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {quote.items} items
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {filteredQuotes.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredQuotes.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedQuotes.length}
        itemName="quotes"
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedQuotes.length}
        title="Update Quote Status"
        field="status"
        options={[
          { label: "Draft", value: "Draft" },
          { label: "Sent", value: "Sent" },
          { label: "Accepted", value: "Accepted" },
          { label: "Rejected", value: "Rejected" },
          { label: "Expired", value: "Expired" },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Quote"
        description="Are you sure you want to delete this quote? This will permanently remove it from your records and cannot be undone."
        itemName={quoteToDelete?.quoteNumber}
        itemType="Quote"
        icon={FileText}
        isDeleting={deleteQuote.isPending}
      />

      {/* Quote Form Drawer */}
      <QuoteFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingQuote(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingQuote}
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
