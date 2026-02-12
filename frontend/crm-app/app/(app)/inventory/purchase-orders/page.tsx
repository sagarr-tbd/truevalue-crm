"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Package,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  Check,
  Calendar,
  Building2,
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
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  useBulkDeletePurchaseOrders,
  useBulkUpdatePurchaseOrders,
} from "@/lib/queries/usePurchaseOrders";
import type { PurchaseOrderDisplay } from "@/lib/api/mock/purchaseOrders";
import type { PurchaseOrder as PurchaseOrderType } from "@/lib/types";

// Lazy load heavy components
const PurchaseOrderFormDrawer = dynamic(
  () => import("@/components/Forms/Inventory").then((mod) => ({ default: mod.PurchaseOrderFormDrawer })),
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

export default function PurchaseOrdersPage() {
  const router = useRouter();

  // React Query hooks
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const updatePurchaseOrder = useUpdatePurchaseOrder();
  const deletePurchaseOrder = useDeletePurchaseOrder();
  const bulkDelete = useBulkDeletePurchaseOrders();
  const bulkUpdate = useBulkUpdatePurchaseOrders();

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
  const purchaseOrdersFilters = filters.purchaseOrders || {};

  // State management
  const [searchQuery, setSearchQuery] = useState(purchaseOrdersFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(purchaseOrdersFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedPurchaseOrders, setSelectedPurchaseOrders] = useState<number[]>([]);
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
  } = useFilterPresets("purchaseOrders");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('purchaseOrders', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState<PurchaseOrderDisplay | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<Partial<PurchaseOrderType> | null>(null);
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
  const exportColumns: ExportColumn<typeof purchaseOrders[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'poNumber', label: 'PO Number' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'items', label: 'Items' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'orderDate', label: 'Order Date' },
    { key: 'expectedDate', label: 'Expected Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'poNumber',
      label: 'PO Number',
      type: 'text',
    },
    {
      key: 'vendor',
      label: 'Vendor',
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
        { label: 'Ordered', value: 'Ordered' },
        { label: 'Received', value: 'Received' },
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
        label: "All POs",
        icon: ClipboardList,
        value: null,
        count: purchaseOrders.length,
      },
      {
        id: "draft",
        label: "Draft",
        icon: FileText,
        value: "Draft",
        count: purchaseOrders.filter((po) => po.status === "Draft").length,
      },
      {
        id: "ordered",
        label: "Ordered",
        icon: Package,
        value: "Ordered",
        count: purchaseOrders.filter((po) => po.status === "Ordered").length,
      },
      {
        id: "received",
        label: "Received",
        icon: CheckCircle,
        value: "Received",
        count: purchaseOrders.filter((po) => po.status === "Received").length,
      },
      {
        id: "cancelled",
        label: "Cancelled",
        icon: XCircle,
        value: "Cancelled",
        count: purchaseOrders.filter((po) => po.status === "Cancelled").length,
      },
    ],
    [purchaseOrders]
  );

  // Stats calculation
  const stats = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const orderedPOs = purchaseOrders.filter((po) => po.status === "Ordered").length;
    const totalSpent = purchaseOrders
      .filter((po) => po.status !== "Cancelled")
      .reduce((sum, po) => sum + po.total, 0);
    const receivedPOs = purchaseOrders.filter((po) => po.status === "Received").length;

    return [
      {
        label: "Total POs",
        value: totalPOs,
        icon: ClipboardList,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Ordered",
        value: orderedPOs,
        icon: Package,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Total Spent",
        value: `$${(totalSpent / 1000).toFixed(1)}K`,
        icon: DollarSign,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Received",
        value: receivedPOs,
        icon: CheckCircle,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
    ];
  }, [purchaseOrders]);

  // Filter & sort logic (using debounced search query)
  const filteredPurchaseOrders = useMemo(() => {
    let filtered = purchaseOrders;

    // Search filter (debounced)
    if (debouncedSearch) {
      filtered = filtered.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          po.vendor.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((po) => po.status === statusFilter);
    }

    // Advanced filter
    if (filterGroup) {
      filtered = filterData(filtered, filterGroup);
    }

    // Sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof PurchaseOrderDisplay];
        const bValue = b[sortColumn as keyof PurchaseOrderDisplay];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [purchaseOrders, debouncedSearch, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredPurchaseOrders.length / itemsPerPage);
  const paginatedPurchaseOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPurchaseOrders.slice(start, end);
  }, [filteredPurchaseOrders, currentPage, itemsPerPage]);

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    const colors = {
      Draft: "bg-muted text-muted-foreground border-border",
      Ordered: "bg-secondary/10 text-secondary border-secondary/20",
      Received: "bg-accent/10 text-accent border-accent/20",
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

  const handleSelectAllPurchaseOrders = useCallback(() => {
    setSelectedPurchaseOrders(paginatedPurchaseOrders.map((po) => po.id));
  }, [paginatedPurchaseOrders]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPurchaseOrders([]);
  }, []);

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedPurchaseOrders.includes(numId)) {
      setSelectedPurchaseOrders(selectedPurchaseOrders.filter((poId) => poId !== numId));
    } else {
      setSelectedPurchaseOrders([...selectedPurchaseOrders, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (purchaseOrder: PurchaseOrderDisplay) => {
    setPurchaseOrderToDelete(purchaseOrder);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!purchaseOrderToDelete) return;
    await deletePurchaseOrder.mutateAsync(purchaseOrderToDelete.id);
    setIsDeleteModalOpen(false);
    setPurchaseOrderToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setPurchaseOrderToDelete(null);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    setShowBulkDelete(false);
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedPurchaseOrders);
      setSelectedPurchaseOrders([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setShowBulkUpdateStatus(false);
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedPurchaseOrders, data: { status } });
      setSelectedPurchaseOrders([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = (format: "csv" | "xlsx" | "pdf") => {
    if (format === "csv") {
      exportToCSV(
        filteredPurchaseOrders.filter((po) => selectedPurchaseOrders.includes(po.id)),
        exportColumns,
        "purchase-orders"
      );
    }
  };

  // Form handlers
  const handleAddPurchaseOrder = () => {
    setEditingPurchaseOrder(null);
    setFormMode("add");
    setFormDrawerOpen(true);
  };

  const handleEditPurchaseOrder = (purchaseOrder: PurchaseOrderDisplay) => {
    setEditingPurchaseOrder({
      id: purchaseOrder.id,
      poNumber: purchaseOrder.poNumber,
      vendor: purchaseOrder.vendor,
      total: purchaseOrder.total,
      status: purchaseOrder.status as "Draft" | "Ordered" | "Received" | "Cancelled",
      orderDate: purchaseOrder.orderDate,
      expectedDate: purchaseOrder.expectedDate,
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<PurchaseOrderType>) => {
    const mappedData: Partial<PurchaseOrderDisplay> = {
      poNumber: data.poNumber,
      vendor: data.vendor,
      total: data.total,
      status: data.status,
      orderDate: data.orderDate,
      expectedDate: data.expectedDate,
    };

    if (formMode === "add") {
      await createPurchaseOrder.mutateAsync(mappedData);
    } else if (editingPurchaseOrder?.id) {
      await updatePurchaseOrder.mutateAsync({
        id: editingPurchaseOrder.id as number,
        data: mappedData,
      });
    }
    setFormDrawerOpen(false);
    setEditingPurchaseOrder(null);
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
      setModuleFilters('purchaseOrders', { search: searchQuery, status: null });
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
        action: handleAddPurchaseOrder,
        description: "Create new purchase order",
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "poNumber",
      label: "PO Number",
      sortable: true,
      render: (_value: unknown, row: PurchaseOrderDisplay) => (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/inventory/purchase-orders/${row.id}`)}
        >
          <div className="font-semibold text-foreground">{row.poNumber}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {row.vendor}
          </div>
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
      key: "expectedDate",
      label: "Expected Date",
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
        title="Purchase Orders"
        icon={ClipboardList}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${purchaseOrders.length} purchase orders`}
        searchPlaceholder="Search purchase orders by PO number or vendor..."
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
                title="Filter purchase orders by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All POs"}
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

            <ExportButton data={filteredPurchaseOrders} columns={exportColumns} filename="purchase-orders" />

            <Button
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Create new purchase order"
              onClick={handleAddPurchaseOrder}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
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
        {selectedPurchaseOrders.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedPurchaseOrders.length}
            onDelete={() => setShowBulkDelete(true)}
            onUpdateStatus={() => setShowBulkUpdateStatus(true)}
            onExport={() => handleBulkExport("csv")}
            onSelectAll={handleSelectAllPurchaseOrders}
            onDeselectAll={handleDeselectAll}
            totalCount={paginatedPurchaseOrders.length}
            isProcessing={isBulkProcessing}
            statusLabel="Status"
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedPurchaseOrders}
          columns={columns}
          selectedIds={selectedPurchaseOrders}
          onSelectAll={handleSelectAllPurchaseOrders}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No purchase orders found"
          emptyDescription="Try adjusting your search or filters, or create a new purchase order"
          loading={isLoading}
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/inventory/purchase-orders/${row.id}`),
                },
                {
                  label: "Edit Purchase Order",
                  icon: Edit,
                  onClick: () => handleEditPurchaseOrder(row),
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
          {paginatedPurchaseOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/inventory/purchase-orders/${order.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {order.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {order.poNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">{order.vendor}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/inventory/purchase-orders/${order.id}`),
                        },
                        {
                          label: "Edit Purchase Order",
                          icon: Edit,
                          onClick: () => handleEditPurchaseOrder(order),
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
                    <span className="font-medium">Expected:</span> {order.expectedDate}
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
      
      {filteredPurchaseOrders.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredPurchaseOrders.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedPurchaseOrders.length}
        itemName="purchase orders"
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedPurchaseOrders.length}
        title="Update Purchase Order Status"
        field="status"
        options={[
          { label: "Draft", value: "Draft" },
          { label: "Ordered", value: "Ordered" },
          { label: "Received", value: "Received" },
          { label: "Cancelled", value: "Cancelled" },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Order"
        description="Are you sure you want to delete this purchase order? This will permanently remove it from your records and cannot be undone."
        itemName={purchaseOrderToDelete?.poNumber}
        itemType="Purchase Order"
        icon={ClipboardList}
        isDeleting={deletePurchaseOrder.isPending}
      />

      {/* Purchase Order Form Drawer */}
      <PurchaseOrderFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingPurchaseOrder(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingPurchaseOrder}
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
