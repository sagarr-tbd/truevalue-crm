"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Store,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Package,
  Filter,
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
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
  useBulkDeleteVendors,
  useBulkUpdateVendors,
} from "@/lib/queries/useVendors";
import type { VendorDisplay } from "@/lib/api/mock/vendors";
import type { Vendor as VendorType } from "@/lib/types";

// Lazy load heavy components
const VendorFormDrawer = dynamic(
  () => import("@/components/Forms/Inventory").then((mod) => ({ default: mod.VendorFormDrawer })),
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

export default function VendorsPage() {
  const router = useRouter();

  // React Query hooks
  const { data: vendors = [], isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();
  const bulkDelete = useBulkDeleteVendors();
  const bulkUpdate = useBulkUpdateVendors();

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
  const vendorsFilters = filters.vendors || {};

  // State management
  const [searchQuery, setSearchQuery] = useState(vendorsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(vendorsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
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
  } = useFilterPresets("vendors");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('vendors', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<VendorDisplay | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Partial<VendorType> | null>(null);
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
  const exportColumns: ExportColumn<typeof vendors[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'vendorName', label: 'Vendor Name' },
    { key: 'contactName', label: 'Contact Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'rating', label: 'Rating' },
    { key: 'totalOrders', label: 'Total Orders' },
    { key: 'totalSpent', label: 'Total Spent' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'vendorName',
      label: 'Vendor Name',
      type: 'text',
    },
    {
      key: 'contactName',
      label: 'Contact Name',
      type: 'text',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'Hardware', value: 'Hardware' },
        { label: 'Software', value: 'Software' },
        { label: 'Services', value: 'Services' },
        { label: 'Supplies', value: 'Supplies' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
  ], []);

  // Filter options with counts
  const filterOptions = useMemo(
    () => [
      {
        id: "all",
        label: "All Vendors",
        icon: Store,
        value: null,
        count: vendors.length,
      },
      {
        id: "active",
        label: "Active",
        icon: CheckCircle,
        value: "Active",
        count: vendors.filter((v) => v.status === "Active").length,
      },
      {
        id: "inactive",
        label: "Inactive",
        icon: XCircle,
        value: "Inactive",
        count: vendors.filter((v) => v.status === "Inactive").length,
      },
    ],
    [vendors]
  );

  // Stats calculation
  const stats = useMemo(() => {
    const totalVendors = vendors.length;
    const activeVendors = vendors.filter((v) => v.status === "Active").length;
    const totalOrders = vendors.reduce((sum, v) => sum + v.totalOrders, 0);
    const totalSpent = vendors.reduce((sum, v) => sum + v.totalSpent, 0);

    return [
      {
        label: "Total Vendors",
        value: totalVendors,
        icon: Store,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Active Vendors",
        value: activeVendors,
        icon: CheckCircle,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Total Orders",
        value: totalOrders,
        icon: FileText,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Total Spent",
        value: `$${(totalSpent / 1000).toFixed(0)}K`,
        icon: Package,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
      },
    ];
  }, [vendors]);

  // Filter & sort logic (using debounced search query)
  const filteredVendors = useMemo(() => {
    let filtered = vendors;

    // Search filter (debounced)
    if (debouncedSearch) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.vendorName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          vendor.contactName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          vendor.email.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((vendor) => vendor.status === statusFilter);
    }

    // Advanced filter
    if (filterGroup) {
      filtered = filterData(filtered, filterGroup);
    }

    // Sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof VendorDisplay];
        const bValue = b[sortColumn as keyof VendorDisplay];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [vendors, debouncedSearch, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredVendors.slice(start, end);
  }, [filteredVendors, currentPage, itemsPerPage]);

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    const colors = {
      Active: "bg-accent/10 text-accent border-accent/20",
      Inactive: "bg-muted text-muted-foreground border-border",
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

  const handleSelectAllVendors = useCallback(() => {
    setSelectedVendors(paginatedVendors.map((v) => v.id));
  }, [paginatedVendors]);

  const handleDeselectAll = useCallback(() => {
    setSelectedVendors([]);
  }, []);

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedVendors.includes(numId)) {
      setSelectedVendors(selectedVendors.filter((vId) => vId !== numId));
    } else {
      setSelectedVendors([...selectedVendors, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (vendor: VendorDisplay) => {
    setVendorToDelete(vendor);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vendorToDelete) return;
    await deleteVendor.mutateAsync(vendorToDelete.id);
    setIsDeleteModalOpen(false);
    setVendorToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setVendorToDelete(null);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    setShowBulkDelete(false);
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedVendors);
      setSelectedVendors([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setShowBulkUpdateStatus(false);
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedVendors, data: { status } });
      setSelectedVendors([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = (format: "csv" | "xlsx" | "pdf") => {
    if (format === "csv") {
      exportToCSV(
        filteredVendors.filter((v) => selectedVendors.includes(v.id)),
        exportColumns,
        "vendors"
      );
    }
  };

  // Form handlers
  const handleAddVendor = () => {
    setEditingVendor(null);
    setFormMode("add");
    setFormDrawerOpen(true);
  };

  const handleEditVendor = (vendor: VendorDisplay) => {
    setEditingVendor({
      id: vendor.id,
      name: vendor.vendorName,        // Map vendorName -> name
      contact: vendor.contactName,     // Map contactName -> contact
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      status: vendor.status as "Active" | "Inactive" | "Pending",
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<VendorType>) => {
    // Map form data to VendorDisplay format
    const mappedData: Partial<VendorDisplay> = {
      vendorName: data.name,
      contactName: data.contact,
      email: data.email,
      phone: data.phone,
      website: data.website,
      status: data.status,
    };

    if (formMode === "add") {
      await createVendor.mutateAsync(mappedData);
    } else if (editingVendor?.id) {
      await updateVendor.mutateAsync({
        id: editingVendor.id as number,
        data: mappedData,
      });
    }
    setFormDrawerOpen(false);
    setEditingVendor(null);
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
      setModuleFilters('vendors', { search: searchQuery, status: null });
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
        action: handleAddVendor,
        description: "Create new vendor",
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "vendorName",
      label: "Vendor",
      sortable: true,
      render: (_value: unknown, row: VendorDisplay) => (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/inventory/vendors/${row.id}`)}
        >
          <div className="font-semibold text-foreground">{row.vendorName}</div>
          <div className="text-sm text-muted-foreground">{row.contactName}</div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      sortable: true,
      render: (_value: unknown, row: VendorDisplay) => (
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
      key: "category",
      label: "Category",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm text-foreground">{value as string}</span>
      ),
    },
    {
      key: "totalOrders",
      label: "Orders",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm font-medium text-foreground">{value as number}</span>
      ),
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm font-medium text-foreground">
          ${((value as number) / 1000).toFixed(1)}K
        </span>
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
        title="Vendors"
        icon={Store}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${vendors.length} vendors`}
        searchPlaceholder="Search vendors by name, contact, or email..."
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
                title="Filter vendors by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All Vendors"}
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

            <ExportButton data={filteredVendors} columns={exportColumns} filename="vendors" />

            <Button
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Create new vendor"
              onClick={handleAddVendor}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Vendor
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
        {selectedVendors.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedVendors.length}
            onDelete={() => setShowBulkDelete(true)}
            onUpdateStatus={() => setShowBulkUpdateStatus(true)}
            onExport={() => handleBulkExport("csv")}
            onSelectAll={handleSelectAllVendors}
            onDeselectAll={handleDeselectAll}
            totalCount={paginatedVendors.length}
            isProcessing={isBulkProcessing}
            statusLabel="Status"
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedVendors}
          columns={columns}
          selectedIds={selectedVendors}
          onSelectAll={handleSelectAllVendors}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No vendors found"
          emptyDescription="Try adjusting your search or filters, or create a new vendor"
          loading={isLoading}
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/inventory/vendors/${row.id}`),
                },
                {
                  label: "Edit Vendor",
                  icon: Edit,
                  onClick: () => handleEditVendor(row),
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
          {paginatedVendors.map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/inventory/vendors/${vendor.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {vendor.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {vendor.vendorName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{vendor.category}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/inventory/vendors/${vendor.id}`),
                        },
                        {
                          label: "Edit Vendor",
                          icon: Edit,
                          onClick: () => handleEditVendor(vendor),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(vendor),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{vendor.email}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Contact:</span> {vendor.contactName}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                    {vendor.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {vendor.totalOrders} orders
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {filteredVendors.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredVendors.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedVendors.length}
        itemName="vendors"
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedVendors.length}
        title="Update Vendor Status"
        field="status"
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Vendor"
        description="Are you sure you want to delete this vendor? This will permanently remove it from your records and cannot be undone."
        itemName={vendorToDelete?.vendorName}
        itemType="Vendor"
        icon={Store}
        isDeleting={deleteVendor.isPending}
      />

      {/* Vendor Form Drawer */}
      <VendorFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingVendor(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingVendor}
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
