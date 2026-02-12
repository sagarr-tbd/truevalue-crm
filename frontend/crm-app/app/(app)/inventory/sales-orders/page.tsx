"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  Truck,
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
  useSalesOrders,
  useCreateSalesOrder,
  useUpdateSalesOrder,
  useDeleteSalesOrder,
  useBulkDeleteSalesOrders,
  useBulkUpdateSalesOrders,
} from "@/lib/queries/useSalesOrders";
import type { SalesOrderDisplay } from "@/lib/api/mock/salesOrders";
import type { SalesOrder as SalesOrderType } from "@/lib/types";

// Lazy load heavy components
const SalesOrderFormDrawer = dynamic(
  () => import("@/components/Forms/Inventory").then((mod) => ({ default: mod.SalesOrderFormDrawer })),
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

export default function SalesOrdersPage() {
  const router = useRouter();

  // React Query hooks
  const { data: salesOrders = [], isLoading } = useSalesOrders();
  const createSalesOrder = useCreateSalesOrder();
  const updateSalesOrder = useUpdateSalesOrder();
  const deleteSalesOrder = useDeleteSalesOrder();
  const bulkDelete = useBulkDeleteSalesOrders();
  const bulkUpdate = useBulkUpdateSalesOrders();

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
  const salesOrdersFilters = filters.salesOrders || {};

  // State management
  const [searchQuery, setSearchQuery] = useState(salesOrdersFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(salesOrdersFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedSalesOrders, setSelectedSalesOrders] = useState<number[]>([]);
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
  } = useFilterPresets("salesOrders");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('salesOrders', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [salesOrderToDelete, setSalesOrderToDelete] = useState<SalesOrderDisplay | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingSalesOrder, setEditingSalesOrder] = useState<Partial<SalesOrderType> | null>(null);
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
  const exportColumns: ExportColumn<typeof salesOrders[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'customer', label: 'Customer' },
    { key: 'items', label: 'Items' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'orderDate', label: 'Order Date' },
    { key: 'deliveryDate', label: 'Delivery Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'orderNumber',
      label: 'Order Number',
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
        { label: 'Pending', value: 'Pending' },
        { label: 'Processing', value: 'Processing' },
        { label: 'Shipped', value: 'Shipped' },
        { label: 'Delivered', value: 'Delivered' },
        { label: 'Cancelled', value: 'Cancelled' },
      ],
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      type: 'date',
    },
  ], []);

  // Filter options with counts
  const filterOptions = useMemo(
    () => [
      {
        id: "all",
        label: "All Orders",
        icon: ShoppingCart,
        value: null,
        count: salesOrders.length,
      },
      {
        id: "pending",
        label: "Pending",
        icon: Clock,
        value: "Pending",
        count: salesOrders.filter((o) => o.status === "Pending").length,
      },
      {
        id: "processing",
        label: "Processing",
        icon: Package,
        value: "Processing",
        count: salesOrders.filter((o) => o.status === "Processing").length,
      },
      {
        id: "shipped",
        label: "Shipped",
        icon: Truck,
        value: "Shipped",
        count: salesOrders.filter((o) => o.status === "Shipped").length,
      },
      {
        id: "delivered",
        label: "Delivered",
        icon: CheckCircle,
        value: "Delivered",
        count: salesOrders.filter((o) => o.status === "Delivered").length,
      },
      {
        id: "cancelled",
        label: "Cancelled",
        icon: XCircle,
        value: "Cancelled",
        count: salesOrders.filter((o) => o.status === "Cancelled").length,
      },
    ],
    [salesOrders]
  );

  // Stats calculation
  const stats = useMemo(() => {
    const totalOrders = salesOrders.length;
    const processingOrders = salesOrders.filter((o) => o.status === "Processing").length;
    const totalRevenue = salesOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    const deliveredOrders = salesOrders.filter((o) => o.status === "Delivered").length;

    return [
      {
        label: "Total Orders",
        value: totalOrders,
        icon: ShoppingCart,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Processing",
        value: processingOrders,
        icon: Package,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Total Revenue",
        value: `$${(totalRevenue / 1000).toFixed(1)}K`,
        icon: DollarSign,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Delivered",
        value: deliveredOrders,
        icon: TrendingUp,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
    ];
  }, [salesOrders]);

  // Filter & sort logic (using debounced search query)
  const filteredSalesOrders = useMemo(() => {
    let filtered = salesOrders;

    // Search filter (debounced)
    if (debouncedSearch) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          order.customer.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Advanced filter
    if (filterGroup) {
      filtered = filterData(filtered, filterGroup);
    }

    // Sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof SalesOrderDisplay];
        const bValue = b[sortColumn as keyof SalesOrderDisplay];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [salesOrders, debouncedSearch, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredSalesOrders.length / itemsPerPage);
  const paginatedSalesOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredSalesOrders.slice(start, end);
  }, [filteredSalesOrders, currentPage, itemsPerPage]);

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    const colors = {
      Pending: "bg-muted text-muted-foreground border-border",
      Processing: "bg-secondary/10 text-secondary border-secondary/20",
      Shipped: "bg-primary/10 text-primary border-primary/20",
      Delivered: "bg-accent/10 text-accent border-accent/20",
      Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
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

  const handleSelectAllSalesOrders = useCallback(() => {
    setSelectedSalesOrders(paginatedSalesOrders.map((o) => o.id));
  }, [paginatedSalesOrders]);

  const handleDeselectAll = useCallback(() => {
    setSelectedSalesOrders([]);
  }, []);

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedSalesOrders.includes(numId)) {
      setSelectedSalesOrders(selectedSalesOrders.filter((oId) => oId !== numId));
    } else {
      setSelectedSalesOrders([...selectedSalesOrders, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (salesOrder: SalesOrderDisplay) => {
    setSalesOrderToDelete(salesOrder);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!salesOrderToDelete) return;
    await deleteSalesOrder.mutateAsync(salesOrderToDelete.id);
    setIsDeleteModalOpen(false);
    setSalesOrderToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSalesOrderToDelete(null);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    setShowBulkDelete(false);
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedSalesOrders);
      setSelectedSalesOrders([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setShowBulkUpdateStatus(false);
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedSalesOrders, data: { status } });
      setSelectedSalesOrders([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = (format: "csv" | "xlsx" | "pdf") => {
    if (format === "csv") {
      exportToCSV(
        filteredSalesOrders.filter((o) => selectedSalesOrders.includes(o.id)),
        exportColumns,
        "sales-orders"
      );
    }
  };

  // Form handlers
  const handleAddSalesOrder = () => {
    setEditingSalesOrder(null);
    setFormMode("add");
    setFormDrawerOpen(true);
  };

  const handleEditSalesOrder = (salesOrder: SalesOrderDisplay) => {
    // Map display fields to schema fields
    setEditingSalesOrder({
      id: salesOrder.id,
      orderNumber: salesOrder.orderNumber,
      customer: salesOrder.customer,
      total: salesOrder.total,
      status: salesOrder.status as "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled",
      orderDate: salesOrder.orderDate,
      deliveryDate: salesOrder.deliveryDate,
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<SalesOrderType>) => {
    // Map schema fields to display fields (if needed)
    const mappedData: Partial<SalesOrderDisplay> = {
      orderNumber: data.orderNumber,
      customer: data.customer,
      total: data.total,
      status: data.status,
      orderDate: data.orderDate,
      deliveryDate: data.deliveryDate,
    };

    if (formMode === "add") {
      await createSalesOrder.mutateAsync(mappedData);
    } else if (editingSalesOrder?.id) {
      await updateSalesOrder.mutateAsync({
        id: editingSalesOrder.id as number,
        data: mappedData,
      });
    }
    setFormDrawerOpen(false);
    setEditingSalesOrder(null);
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
      setModuleFilters('salesOrders', { search: searchQuery, status: null });
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
        action: handleAddSalesOrder,
        description: "Create new sales order",
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "orderNumber",
      label: "Order Number",
      sortable: true,
      render: (_value: unknown, row: SalesOrderDisplay) => (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/inventory/sales-orders/${row.id}`)}
        >
          <div className="font-semibold text-foreground">{row.orderNumber}</div>
          <div className="text-sm text-muted-foreground">{row.customer}</div>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{value as number}</span>
        </div>
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
      key: "orderDate",
      label: "Order Date",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{value as string}</span>
        </div>
      ),
    },
    {
      key: "deliveryDate",
      label: "Delivery Date",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{value as string}</span>
        </div>
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
        title="Sales Orders"
        icon={ShoppingCart}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${salesOrders.length} sales orders`}
        searchPlaceholder="Search sales orders by number or customer..."
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
                title="Filter sales orders by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All Orders"}
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

            <ExportButton data={filteredSalesOrders} columns={exportColumns} filename="sales-orders" />

            <Button
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Create new sales order"
              onClick={handleAddSalesOrder}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Sales Order
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
        {selectedSalesOrders.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedSalesOrders.length}
            onDelete={() => setShowBulkDelete(true)}
            onUpdateStatus={() => setShowBulkUpdateStatus(true)}
            onExport={() => handleBulkExport("csv")}
            onSelectAll={handleSelectAllSalesOrders}
            onDeselectAll={handleDeselectAll}
            totalCount={paginatedSalesOrders.length}
            isProcessing={isBulkProcessing}
            statusLabel="Status"
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedSalesOrders}
          columns={columns}
          selectedIds={selectedSalesOrders}
          onSelectAll={handleSelectAllSalesOrders}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No sales orders found"
          emptyDescription="Try adjusting your search or filters, or create a new sales order"
          loading={isLoading}
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/inventory/sales-orders/${row.id}`),
                },
                {
                  label: "Edit Sales Order",
                  icon: Edit,
                  onClick: () => handleEditSalesOrder(row),
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
          {paginatedSalesOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/inventory/sales-orders/${order.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {order.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {order.orderNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/inventory/sales-orders/${order.id}`),
                        },
                        {
                          label: "Edit Sales Order",
                          icon: Edit,
                          onClick: () => handleEditSalesOrder(order),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(order),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="text-lg font-semibold text-foreground">${order.total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{order.orderDate}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Delivery:</span> {order.deliveryDate}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.items} items
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {filteredSalesOrders.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredSalesOrders.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedSalesOrders.length}
        itemName="sales orders"
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedSalesOrders.length}
        title="Update Sales Order Status"
        field="status"
        options={[
          { label: "Pending", value: "Pending" },
          { label: "Processing", value: "Processing" },
          { label: "Shipped", value: "Shipped" },
          { label: "Delivered", value: "Delivered" },
          { label: "Cancelled", value: "Cancelled" },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Sales Order"
        description="Are you sure you want to delete this sales order? This will permanently remove it from your records and cannot be undone."
        itemName={salesOrderToDelete?.orderNumber}
        itemType="Sales Order"
        icon={ShoppingCart}
        isDeleting={deleteSalesOrder.isPending}
      />

      {/* Sales Order Form Drawer */}
      <SalesOrderFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingSalesOrder(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingSalesOrder}
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
