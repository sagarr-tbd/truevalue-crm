"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Package,
  Plus,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Tag,
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
import { ProductFormDrawer } from "@/components/Forms/Inventory";
import type { Product as ProductType } from "@/lib/types";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useProducts, 
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct, 
  useBulkDeleteProducts, 
  useBulkUpdateProducts 
} from "@/lib/queries/useProducts";
import { useUIStore } from "@/stores";

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

export default function ProductsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const bulkDelete = useBulkDeleteProducts();
  const bulkUpdate = useBulkUpdateProducts();
  
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
  const productsFilters = filters.products || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(productsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(productsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
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
  } = useFilterPresets("products");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('products', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<typeof products[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof products[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'cost', label: 'Cost' },
    { key: 'quantity', label: 'Stock' },
    { key: 'status', label: 'Status' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'name',
      label: 'Product Name',
      type: 'text',
    },
    {
      key: 'sku',
      label: 'SKU',
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
        { label: 'Active', value: 'Active' },
        { label: 'Out of Stock', value: 'Out of Stock' },
        { label: 'Discontinued', value: 'Discontinued' },
      ],
    },
    {
      key: 'vendor',
      label: 'Vendor',
      type: 'text',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          product.sku?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          product.category?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((product) => product.status === statusFilter);
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
  }, [products, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const activeProducts = products.filter((p) => p.status === "Active").length;
    const outOfStock = products.filter((p) => p.status === "Out of Stock").length;
    const totalCost = products.reduce((sum, p) => sum + (p.cost * p.quantity), 0);

    return [
      {
        label: "Total Products",
        value: products.length,
        icon: Package,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Active Products",
        value: activeProducts,
        icon: TrendingUp,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Inventory Value",
        value: `$${totalValue.toLocaleString()}`,
        icon: DollarSign,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Out of Stock",
        value: outOfStock,
        icon: ShoppingCart,
        iconBgColor: "bg-destructive/10",
        iconColor: "text-destructive",
      },
    ];
  }, [products]);

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
      label: "All Products",
      value: null,
      count: products.length,
    },
    {
      label: "Active",
      value: "Active",
      count: products.filter((p) => p.status === "Active").length,
    },
    {
      label: "Out of Stock",
      value: "Out of Stock",
      count: products.filter((p) => p.status === "Out of Stock").length,
    },
    {
      label: "Discontinued",
      value: "Discontinued",
      count: products.filter((p) => p.status === "Discontinued").length,
    },
  ], [products]);

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
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map((p) => p.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedProducts.includes(numId)) {
      setSelectedProducts(selectedProducts.filter((pId) => pId !== numId));
    } else {
      setSelectedProducts([...selectedProducts, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (product: typeof products[0]) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete?.id) return;
    
    try {
      await deleteProduct.mutateAsync(productToDelete.id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  // Form handlers
  const handleAddProduct = () => {
    setFormMode("add");
    setEditingProduct(null);
    setFormDrawerOpen(true);
  };

  const handleEditProduct = (product: typeof products[0]) => {
    setFormMode("edit");
    setEditingProduct({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      cost: product.cost,
      quantity: product.quantity,
      status: product.status as "Active" | "Inactive" | "Out of Stock" | "Discontinued",
      vendor: product.vendor,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<ProductType>) => {
    try {
      if (formMode === "add") {
      const newProduct = {
        name: data.name || "",
        sku: data.sku || "",
        category: data.category || "Other",
        price: data.price || 0,
        cost: data.cost || 0,
        quantity: data.quantity || 0,
        status: data.status || "Active",
        vendor: data.vendor || "Internal",
      };
        await createProduct.mutateAsync(newProduct);
      } else if (editingProduct) {
        // Find the product ID from the products list
        const productToUpdate = products.find(p => 
          p.sku === editingProduct.sku
        );
        
        if (productToUpdate?.id) {
          const updatedProduct = {
            name: data.name || "",
            sku: data.sku || "",
            category: data.category || "Other",
            price: data.price || 0,
            cost: data.cost || 0,
            quantity: data.quantity || 0,
            status: data.status || "Active",
            vendor: data.vendor || "Internal",
          };
          await updateProduct.mutateAsync({ id: productToUpdate.id, data: updatedProduct });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error submitting product:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllProducts = () => {
    setSelectedProducts(filteredProducts.map(p => p.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedProducts([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedProducts);
      setSelectedProducts([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting products:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedProducts, data: { status } });
      setSelectedProducts([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Error bulk updating products:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredProducts.filter(product => product.id !== undefined && selectedProducts.includes(product.id));
    
    if (selectedData.length === 0) {
      toast.error("No products selected for export");
      return;
    }

    try {
      // Use the same export columns as the main ExportButton
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-products-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} products`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export products");
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
    clearModuleFilters('products');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Active: "bg-primary/20 text-primary",
      "Out of Stock": "bg-destructive/10 text-destructive",
      Discontinued: "bg-muted text-muted-foreground",
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
        description: "New product",
        action: () => {
          setEditingProduct(null);
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
      key: "name",
      label: "Product",
      sortable: true,
      render: (_value: unknown, row: typeof products[0]) => (
        <div 
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/inventory/products/${row.id}`)}
        >
          <div className="font-semibold text-foreground">{row.name}</div>
          <div className="text-sm text-muted-foreground">SKU: {row.sku}</div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {value}
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-foreground">${value.toFixed(2)}</span>
      ),
    },
    {
      key: "quantity",
      label: "Stock",
      sortable: true,
      render: (value: number) => (
        <span className={`font-medium ${value === 0 ? 'text-destructive' : value < 50 ? 'text-accent' : 'text-primary'}`}>
          {value} units
        </span>
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
      key: "vendor",
      label: "Vendor",
      render: (value: string) => (
        <span className="text-sm text-foreground">{value}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Products"
        icon={Package}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${products.length} products`}
        searchPlaceholder="Search products by name, SKU, or category..."
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
                title="Filter products by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Products"}
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
              title="Import products from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredProducts}
              columns={exportColumns}
              filename="products-export"
              title="Products Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new product"
              onClick={handleAddProduct}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Product
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
        {selectedProducts.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedProducts.length}
            totalCount={filteredProducts.length}
            onSelectAll={handleSelectAllProducts}
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
          data={paginatedProducts}
          columns={columns}
          selectedIds={selectedProducts}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No products found"
          emptyDescription="Try adjusting your search or filters, or add a new product"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/inventory/products/${row.id}`),
                },
                {
                  label: "Edit Product",
                  icon: Edit,
                  onClick: () => handleEditProduct(row),
                },
                {
                  label: "View Analytics",
                  icon: BarChart3,
                  onClick: () => console.log("Analytics", row.id),
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
          {paginatedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/inventory/products/${product.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/inventory/products/${product.id}`),
                        },
                        {
                          label: "Edit Product",
                          icon: Edit,
                          onClick: () => handleEditProduct(product),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(product),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{product.category}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="text-lg font-semibold text-foreground">${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <span className={`font-medium ${product.quantity === 0 ? 'text-destructive' : product.quantity < 50 ? 'text-accent' : 'text-primary'}`}>
                        {product.quantity} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Vendor:</span>
                      <span className="text-sm text-foreground">{product.vendor}</span>
                    </div>
                  </div>
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
        totalItems={filteredProducts.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedProducts([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedProducts([]);
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
        title="Delete Product"
        description="Are you sure you want to delete this product? This will permanently remove it from your inventory and cannot be undone."
        itemName={productToDelete?.name}
        itemType="Product"
        icon={Package}
        isDeleting={deleteProduct.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedProducts.length}
        itemName="product"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedProducts.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Active', value: 'Active' },
          { label: 'Out of Stock', value: 'Out of Stock' },
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

      {/* Product Form Drawer */}
      <ProductFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingProduct}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
