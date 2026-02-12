"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  CheckCircle,
  Send,
  XCircle,
  Filter,
  ChevronDown,
  Check,
  Calendar,
  AlertTriangle,
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
  useInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useBulkDeleteInvoices,
  useBulkUpdateInvoices,
} from "@/lib/queries/useInvoices";
import type { InvoiceDisplay } from "@/lib/api/mock/invoices";
import type { Invoice as InvoiceType } from "@/lib/types";

// Lazy load heavy components
const InvoiceFormDrawer = dynamic(
  () => import("@/components/Forms/Inventory").then((mod) => ({ default: mod.InvoiceFormDrawer })),
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

export default function InvoicesPage() {
  const router = useRouter();

  // React Query hooks
  const { data: invoices = [], isLoading } = useInvoices();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const bulkDelete = useBulkDeleteInvoices();
  const bulkUpdate = useBulkUpdateInvoices();

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
  const invoicesFilters = filters.invoices || {};

  // State management
  const [searchQuery, setSearchQuery] = useState(invoicesFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(invoicesFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
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
  } = useFilterPresets("invoices");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('invoices', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceDisplay | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<InvoiceType> | null>(null);
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
  const exportColumns: ExportColumn<typeof invoices[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'invoiceNumber', label: 'Invoice Number' },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'paidDate', label: 'Paid Date' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'invoiceNumber',
      label: 'Invoice Number',
      type: 'text',
    },
    {
      key: 'customer',
      label: 'Customer',
      type: 'text',
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'number',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'Draft' },
        { label: 'Sent', value: 'Sent' },
        { label: 'Paid', value: 'Paid' },
        { label: 'Overdue', value: 'Overdue' },
        { label: 'Cancelled', value: 'Cancelled' },
      ],
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      type: 'date',
    },
  ], []);

  // Filter options with counts
  const filterOptions = useMemo(
    () => [
      {
        id: "all",
        label: "All Invoices",
        icon: Receipt,
        value: null,
        count: invoices.length,
      },
      {
        id: "draft",
        label: "Draft",
        icon: FileText,
        value: "Draft",
        count: invoices.filter((i) => i.status === "Draft").length,
      },
      {
        id: "sent",
        label: "Sent",
        icon: Send,
        value: "Sent",
        count: invoices.filter((i) => i.status === "Sent").length,
      },
      {
        id: "paid",
        label: "Paid",
        icon: CheckCircle,
        value: "Paid",
        count: invoices.filter((i) => i.status === "Paid").length,
      },
      {
        id: "overdue",
        label: "Overdue",
        icon: AlertTriangle,
        value: "Overdue",
        count: invoices.filter((i) => i.status === "Overdue").length,
      },
      {
        id: "cancelled",
        label: "Cancelled",
        icon: XCircle,
        value: "Cancelled",
        count: invoices.filter((i) => i.status === "Cancelled").length,
      },
    ],
    [invoices]
  );

  // Stats calculation
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((i) => i.status === "Paid").length;
    const totalRevenue = invoices
      .filter((i) => i.status === "Paid")
      .reduce((sum, i) => sum + i.amount, 0);
    const overdueInvoices = invoices.filter((i) => i.status === "Overdue").length;

    return [
      {
        label: "Total Invoices",
        value: totalInvoices,
        icon: Receipt,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Paid",
        value: paidInvoices,
        icon: CheckCircle,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Revenue",
        value: `$${(totalRevenue / 1000).toFixed(1)}K`,
        icon: DollarSign,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Overdue",
        value: overdueInvoices,
        icon: AlertTriangle,
        iconBgColor: "bg-destructive/10",
        iconColor: "text-destructive",
      },
    ];
  }, [invoices]);

  // Filter & sort logic (using debounced search query)
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Search filter (debounced)
    if (debouncedSearch) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          invoice.customer.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Advanced filter
    if (filterGroup) {
      filtered = filterData(filtered, filterGroup);
    }

    // Sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof InvoiceDisplay];
        const bValue = b[sortColumn as keyof InvoiceDisplay];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [invoices, debouncedSearch, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredInvoices.slice(start, end);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    const colors = {
      Draft: "bg-muted text-muted-foreground border-border",
      Sent: "bg-secondary/10 text-secondary border-secondary/20",
      Paid: "bg-accent/10 text-accent border-accent/20",
      Overdue: "bg-destructive/10 text-destructive border-destructive/20",
      Cancelled: "bg-muted text-muted-foreground border-border",
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

  const handleSelectAllInvoices = useCallback(() => {
    setSelectedInvoices(paginatedInvoices.map((i) => i.id));
  }, [paginatedInvoices]);

  const handleDeselectAll = useCallback(() => {
    setSelectedInvoices([]);
  }, []);

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedInvoices.includes(numId)) {
      setSelectedInvoices(selectedInvoices.filter((iId) => iId !== numId));
    } else {
      setSelectedInvoices([...selectedInvoices, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (invoice: InvoiceDisplay) => {
    setInvoiceToDelete(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    await deleteInvoice.mutateAsync(invoiceToDelete.id);
    setIsDeleteModalOpen(false);
    setInvoiceToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setInvoiceToDelete(null);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    setShowBulkDelete(false);
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedInvoices);
      setSelectedInvoices([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setShowBulkUpdateStatus(false);
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedInvoices, data: { status } });
      setSelectedInvoices([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = (format: "csv" | "xlsx" | "pdf") => {
    if (format === "csv") {
      exportToCSV(
        filteredInvoices.filter((i) => selectedInvoices.includes(i.id)),
        exportColumns,
        "invoices"
      );
    }
  };

  // Form handlers
  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setFormMode("add");
    setFormDrawerOpen(true);
  };

  const handleEditInvoice = (invoice: InvoiceDisplay) => {
    setEditingInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      amount: invoice.amount,
      status: invoice.status as "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled",
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate || undefined,
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<InvoiceType>) => {
    const mappedData: Partial<InvoiceDisplay> = {
      invoiceNumber: data.invoiceNumber,
      customer: data.customer,
      amount: data.amount,
      status: data.status,
      dueDate: data.dueDate,
      paidDate: data.paidDate || null,
    };

    if (formMode === "add") {
      await createInvoice.mutateAsync(mappedData);
    } else if (editingInvoice?.id) {
      await updateInvoice.mutateAsync({
        id: editingInvoice.id as number,
        data: mappedData,
      });
    }
    setFormDrawerOpen(false);
    setEditingInvoice(null);
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
      setModuleFilters('invoices', { search: searchQuery, status: null });
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
        action: handleAddInvoice,
        description: "Create new invoice",
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "invoiceNumber",
      label: "Invoice",
      sortable: true,
      render: (_value: unknown, row: InvoiceDisplay) => (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/inventory/invoices/${row.id}`)}
        >
          <div className="font-semibold text-foreground">{row.invoiceNumber}</div>
          <div className="text-sm text-muted-foreground">{row.customer}</div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm font-medium text-foreground">
          ${(value as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{value as string}</span>
        </div>
      ),
    },
    {
      key: "paidDate",
      label: "Paid Date",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm text-muted-foreground">
          {value ? (value as string) : "-"}
        </span>
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
        title="Invoices"
        icon={Receipt}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${invoices.length} invoices`}
        searchPlaceholder="Search invoices by number or customer..."
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
                title="Filter invoices by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All Invoices"}
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

            <ExportButton data={filteredInvoices} columns={exportColumns} filename="invoices" />

            <Button
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Create new invoice"
              onClick={handleAddInvoice}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
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
        {selectedInvoices.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedInvoices.length}
            onDelete={() => setShowBulkDelete(true)}
            onUpdateStatus={() => setShowBulkUpdateStatus(true)}
            onExport={() => handleBulkExport("csv")}
            onSelectAll={handleSelectAllInvoices}
            onDeselectAll={handleDeselectAll}
            totalCount={paginatedInvoices.length}
            isProcessing={isBulkProcessing}
            statusLabel="Status"
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedInvoices}
          columns={columns}
          selectedIds={selectedInvoices}
          onSelectAll={handleSelectAllInvoices}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No invoices found"
          emptyDescription="Try adjusting your search or filters, or create a new invoice"
          loading={isLoading}
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/inventory/invoices/${row.id}`),
                },
                {
                  label: "Edit Invoice",
                  icon: Edit,
                  onClick: () => handleEditInvoice(row),
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
          {paginatedInvoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/inventory/invoices/${invoice.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {invoice.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {invoice.invoiceNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">{invoice.customer}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/inventory/invoices/${invoice.id}`),
                        },
                        {
                          label: "Edit Invoice",
                          icon: Edit,
                          onClick: () => handleEditInvoice(invoice),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(invoice),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="text-lg font-semibold text-foreground">${invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{invoice.created}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Due:</span>{" "}
                    <span className={invoice.status === "Overdue" ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {invoice.dueDate}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                  {invoice.paidDate && (
                    <span className="text-xs text-muted-foreground">
                      Paid: {invoice.paidDate}
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {filteredInvoices.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredInvoices.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedInvoices.length}
        itemName="invoices"
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedInvoices.length}
        title="Update Invoice Status"
        field="status"
        options={[
          { label: "Draft", value: "Draft" },
          { label: "Sent", value: "Sent" },
          { label: "Paid", value: "Paid" },
          { label: "Overdue", value: "Overdue" },
          { label: "Cancelled", value: "Cancelled" },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This will permanently remove it from your records and cannot be undone."
        itemName={invoiceToDelete?.invoiceNumber}
        itemType="Invoice"
        icon={Receipt}
        isDeleting={deleteInvoice.isPending}
      />

      {/* Invoice Form Drawer */}
      <InvoiceFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingInvoice(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingInvoice}
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
