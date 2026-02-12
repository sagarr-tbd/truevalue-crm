"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Wrench,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Users,
  DollarSign,
  Star,
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
import { ServiceFormDrawer } from "@/components/Forms/Services";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useServices, 
  useCreateService,
  useUpdateService,
  useDeleteService, 
  useBulkDeleteServices, 
  useBulkUpdateServices 
} from "@/lib/queries/useServices";
import { useUIStore } from "@/stores";
import type { Service } from "@/lib/types";

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

export default function ServicesPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: services = [], isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const bulkDelete = useBulkDeleteServices();
  const bulkUpdate = useBulkUpdateServices();
  
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
  const servicesFilters = filters.services || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(servicesFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(servicesFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
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
  } = useFilterPresets("services");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('services', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<typeof services[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof services[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'serviceCode', label: 'Service Code' },
    { key: 'serviceName', label: 'Service Name' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'price', label: 'Price' },
    { key: 'status', label: 'Status' },
    { key: 'customersUsing', label: 'Customers' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'rating', label: 'Rating' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'serviceName',
      label: 'Service Name',
      type: 'text',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'text',
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'Professional Services', value: 'Professional Services' },
        { label: 'Subscription', value: 'Subscription' },
        { label: 'One-Time', value: 'One-Time' },
        { label: 'Managed Services', value: 'Managed Services' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Coming Soon', value: 'Coming Soon' },
        { label: 'Discontinued', value: 'Discontinued' },
      ],
    },
    {
      key: 'customersUsing',
      label: 'Customers Using',
      type: 'number',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (service) =>
          service.serviceName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          service.category?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          service.serviceCode?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          service.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((service) => service.status === statusFilter);
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
  }, [services, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalServices = services.length;
    const active = services.filter((s) => s.status === "Active").length;
    const totalCustomers = services.reduce((sum, s) => sum + (s.customersUsing || 0), 0);
    const totalRevenue = services.reduce((sum, s) => {
      const revenue = s.revenue?.replace(/[^0-9.-]+/g, "") || "0";
      return sum + parseFloat(revenue);
    }, 0);

    return [
      {
        label: "Total Services",
        value: totalServices,
        icon: Wrench,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Active Services",
        value: active,
        icon: TrendingUp,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Total Customers",
        value: totalCustomers,
        icon: Users,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Total Revenue",
        value: `$${(totalRevenue / 1000).toFixed(0)}K`,
        icon: DollarSign,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 18, isPositive: true },
      },
    ];
  }, [services]);

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
      label: "All Services",
      value: null,
      count: services.length,
    },
    {
      label: "Active",
      value: "Active",
      count: services.filter((s) => s.status === "Active").length,
    },
    {
      label: "Inactive",
      value: "Inactive",
      count: services.filter((s) => s.status === "Inactive").length,
    },
    {
      label: "Coming Soon",
      value: "Coming Soon",
      count: services.filter((s) => s.status === "Coming Soon").length,
    },
    {
      label: "Discontinued",
      value: "Discontinued",
      count: services.filter((s) => s.status === "Discontinued").length,
    },
  ], [services]);

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
    if (selectedServices.length === paginatedServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(paginatedServices.map((s) => s.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedServices.includes(numId)) {
      setSelectedServices(selectedServices.filter((sId) => sId !== numId));
    } else {
      setSelectedServices([...selectedServices, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (service: typeof services[0]) => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete?.id) return;
    
    try {
      await deleteService.mutateAsync(serviceToDelete.id);
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setServiceToDelete(null);
  };

  // Form handlers
  const handleAddService = () => {
    setFormMode("add");
    setEditingService(null);
    setFormDrawerOpen(true);
  };

  const handleEditService = (service: typeof services[0]) => {
    setFormMode("edit");
    setEditingService(service);
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Service>) => {
    try {
      if (formMode === "add") {
        const newService = {
          serviceName: data.serviceName || "",
          description: data.description,
          category: data.category || "",
          type: data.type || "Professional Services",
          pricing: data.pricing || "Fixed Price",
          price: data.price,
          duration: data.duration,
          status: data.status || "Active",
          assignedTeam: data.assignedTeam,
          tags: data.tags || [],
        };
        await createService.mutateAsync(newService);
      } else if (editingService) {
        // Find the service ID from the services list
        const serviceToUpdate = services.find(s => 
          s.id === editingService.id ||
          s.serviceCode === editingService.serviceCode
        );
        
        if (serviceToUpdate?.id) {
          const updatedService = {
            serviceName: data.serviceName,
            description: data.description,
            category: data.category,
            type: data.type,
            pricing: data.pricing,
            price: data.price,
            duration: data.duration,
            status: data.status,
            assignedTeam: data.assignedTeam,
            tags: data.tags,
          };
          await updateService.mutateAsync({ id: serviceToUpdate.id, data: updatedService });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingService(null);
    } catch (error) {
      console.error("Error submitting service:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllServices = () => {
    setSelectedServices(filteredServices.map(s => s.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedServices([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedServices);
      setSelectedServices([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting services:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ 
        ids: selectedServices, 
        data: { status: status as "Active" | "Inactive" | "Coming Soon" | "Discontinued" } 
      });
      setSelectedServices([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Error bulk updating services:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredServices.filter(service => service.id !== undefined && selectedServices.includes(service.id));
    
    if (selectedData.length === 0) {
      toast.error("No services selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-services-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} services`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export services");
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
    clearModuleFilters('services');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Active: "bg-secondary/10 text-secondary",
      Inactive: "bg-muted text-muted-foreground",
      "Coming Soon": "bg-primary/10 text-primary",
      Discontinued: "bg-accent/10 text-accent",
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
        description: "New service",
        action: () => {
          setEditingService(null);
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
      key: "serviceCode",
      label: "Service",
      sortable: true,
      render: (_value: unknown, row: typeof services[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/services/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.serviceCode}</div>
            <div className="text-sm text-muted-foreground truncate max-w-xs">{row.serviceName}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (value: string, row: typeof services[0]) => (
        <div>
          <span className="text-sm text-foreground">{value}</span>
          <div className="text-xs text-muted-foreground">{row.type}</div>
        </div>
      ),
    },
    {
      key: "pricing",
      label: "Pricing",
      sortable: true,
      render: (value: string, row: typeof services[0]) => (
        <div>
          <span className="text-sm text-foreground">{value}</span>
          {row.price && (
            <div className="text-xs text-muted-foreground">{row.price}</div>
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
      key: "customersUsing",
      label: "Customers",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1 text-sm text-foreground">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{value?.toLocaleString() || 0}</span>
        </div>
      ),
    },
    {
      key: "revenue",
      label: "Revenue",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-sm text-foreground">
          <DollarSign className="h-4 w-4 text-secondary" />
          <span>{value || "$0"}</span>
        </div>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1 text-sm text-foreground">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span>{value?.toFixed(1) || "0.0"}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Services"
        icon={Wrench}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${services.length} services`}
        searchPlaceholder="Search services by name, category, or code..."
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
                title="Filter services by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Services"}
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
              title="Import services from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredServices}
              columns={exportColumns}
              filename="services-export"
              title="Services Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new service"
              onClick={handleAddService}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
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
        {selectedServices.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedServices.length}
            totalCount={filteredServices.length}
            onSelectAll={handleSelectAllServices}
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
          data={paginatedServices}
          columns={columns}
          selectedIds={selectedServices}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No services found"
          emptyDescription="Try adjusting your search or filters, or add a new service"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/services/${row.id}`),
                },
                {
                  label: "Edit Service",
                  icon: Edit,
                  onClick: () => handleEditService(row),
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
          {paginatedServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/services/${service.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {service.serviceCode}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {service.category}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/services/${service.id}`),
                        },
                        {
                          label: "Edit Service",
                          icon: Edit,
                          onClick: () => handleEditService(service),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(service),
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {service.serviceName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{service.type}</span>
                    <span>•</span>
                    <span>{service.pricing}</span>
                  </div>
                  {service.price && (
                    <div className="text-sm font-semibold text-secondary">
                      {service.price}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{service.customersUsing?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{service.revenue || "$0"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span>{service.rating?.toFixed(1) || "0.0"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {service.created}
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
        totalItems={filteredServices.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedServices([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedServices([]);
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
        title="Delete Service"
        description="Are you sure you want to delete this service? This will permanently remove it from your catalog and cannot be undone."
        itemName={serviceToDelete?.serviceName}
        itemType="Service"
        icon={Wrench}
        isDeleting={deleteService.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedServices.length}
        itemName="service"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedServices.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
          { label: 'Coming Soon', value: 'Coming Soon' },
          { label: 'Discontinued', value: 'Discontinued' },
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

      {/* Service Form Drawer */}
      <ServiceFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingService(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingService}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
