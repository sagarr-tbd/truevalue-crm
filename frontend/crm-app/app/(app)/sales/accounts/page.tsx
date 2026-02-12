"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Building2,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Mail,
  FileText,
  Globe,
  Users,
  DollarSign,
  ChevronDown,
  Check,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { AccountFormDrawer, type Account as AccountType } from "@/components/Forms/Sales";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useAccounts, 
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount, 
  useBulkDeleteAccounts, 
  useBulkUpdateAccounts 
} from "@/lib/queries/useAccounts";
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

export default function AccountsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: accounts = [], isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const bulkDelete = useBulkDeleteAccounts();
  const bulkUpdate = useBulkUpdateAccounts();
  
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
  const accountsFilters = filters.accounts || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(accountsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(accountsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
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
  } = useFilterPresets("accounts");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('accounts', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<typeof accounts[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<AccountType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof accounts[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'accountName', label: 'Account Name' },
    { key: 'industry', label: 'Industry' },
    { key: 'type', label: 'Type' },
    { key: 'website', label: 'Website' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'employees', label: 'Employees' },
    { key: 'annualRevenue', label: 'Annual Revenue' },
    { key: 'status', label: 'Status' },
    { key: 'owner', label: 'Owner' },
    { key: 'created', label: 'Created Date' },
    { key: 'lastActivity', label: 'Last Activity' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'accountName',
      label: 'Account Name',
      type: 'text',
    },
    {
      key: 'industry',
      label: 'Industry',
      type: 'text',
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'Enterprise', value: 'Enterprise' },
        { label: 'Mid-Market', value: 'Mid-Market' },
        { label: 'SMB', value: 'SMB' },
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
    {
      key: 'city',
      label: 'City',
      type: 'text',
    },
    {
      key: 'state',
      label: 'State',
      type: 'text',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (account) =>
          account.accountName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          account.industry?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          account.city?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((account) => account.status === statusFilter);
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
  }, [accounts, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter((a) => a.status === "Active").length;
    const totalRevenue = accounts.reduce((sum, account) => sum + account.annualRevenue, 0);
    const totalEmployees = accounts.reduce((sum, account) => sum + account.employees, 0);

    return [
      {
        label: "Total Accounts",
        value: totalAccounts,
        icon: Building2,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Active Accounts",
        value: activeAccounts,
        icon: TrendingUp,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Total Revenue",
        value: `$${(totalRevenue / 1000000).toFixed(1)}M`,
        icon: DollarSign,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
        trend: { value: 15, isPositive: true },
      },
      {
        label: "Total Employees",
        value: totalEmployees.toLocaleString(),
        icon: Users,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
      },
    ];
  }, [accounts]);

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
      label: "All Accounts",
      value: null,
      count: accounts.length,
    },
    {
      label: "Active",
      value: "Active",
      count: accounts.filter((a) => a.status === "Active").length,
    },
    {
      label: "Inactive",
      value: "Inactive",
      count: accounts.filter((a) => a.status === "Inactive").length,
    },
  ], [accounts]);

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
    if (selectedAccounts.length === paginatedAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(paginatedAccounts.map((a) => a.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedAccounts.includes(numId)) {
      setSelectedAccounts(selectedAccounts.filter((aId) => aId !== numId));
    } else {
      setSelectedAccounts([...selectedAccounts, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (account: typeof accounts[0]) => {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete?.id) return;
    
    try {
      await deleteAccount.mutateAsync(accountToDelete.id);
      setIsDeleteModalOpen(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setAccountToDelete(null);
  };

  // Form handlers
  const handleAddAccount = () => {
    setFormMode("add");
    setEditingAccount(null);
    setFormDrawerOpen(true);
  };

  const handleEditAccount = (account: typeof accounts[0]) => {
    setFormMode("edit");
    setEditingAccount({
      accountName: account.accountName,
      website: account.website,
      phone: account.phone,
      email: account.email,
      industry: account.industry,
      type: account.type as "Customer" | "Partner" | "Prospect" | "Vendor" | "Other",
      employees: account.employees.toString(),
      annualRevenue: account.annualRevenue,
      assignedTo: account.owner,
      city: account.city,
      state: account.state,
      country: account.country,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<AccountType>) => {
    try {
      if (formMode === "add") {
      const newAccount = {
        accountName: data.accountName || "",
        industry: data.industry || "",
        type: data.type || "",
        website: data.website || "",
        phone: data.phone || "",
        email: data.email || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        employees: parseInt(data.employees || "0"),
        annualRevenue: data.annualRevenue || 0,
        owner: data.assignedTo || "Unassigned",
        status: "Active",
      };
        await createAccount.mutateAsync(newAccount);
      } else if (editingAccount) {
        // Find the account ID from the accounts list
        const accountToUpdate = accounts.find(a => 
          a.accountName === editingAccount.accountName ||
          a.email === editingAccount.email
        );
        
        if (accountToUpdate?.id) {
          const updatedAccount = {
            accountName: data.accountName || "",
            industry: data.industry || "",
            type: data.type || "",
            website: data.website || "",
            phone: data.phone || "",
            email: data.email || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            employees: parseInt(data.employees || "0"),
            annualRevenue: data.annualRevenue || 0,
            owner: data.assignedTo || "Unassigned",
          };
          await updateAccount.mutateAsync({ id: accountToUpdate.id, data: updatedAccount });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingAccount(null);
    } catch (error) {
      console.error("Error submitting account:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllAccounts = () => {
    setSelectedAccounts(filteredAccounts.map(a => a.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedAccounts([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedAccounts);
      setSelectedAccounts([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting accounts:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedAccounts, data: { status } });
      setSelectedAccounts([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Error bulk updating accounts:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredAccounts.filter(account => account.id !== undefined && selectedAccounts.includes(account.id));
    
    if (selectedData.length === 0) {
      toast.error("No accounts selected for export");
      return;
    }

    try {
      // Use the same export columns as the main ExportButton
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-accounts-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} accounts`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export accounts");
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
    clearModuleFilters('accounts');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Active: "bg-primary/10 text-primary",
      Inactive: "bg-muted text-muted-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Get type color helper
  const getTypeColor = (type: string) => {
    const colors = {
      Enterprise: "bg-primary/10 text-primary",
      "Mid-Market": "bg-secondary/10 text-secondary",
      SMB: "bg-accent/10 text-accent",
    };
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New account",
        action: () => {
          setEditingAccount(null);
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
      key: "accountName",
      label: "Account",
      sortable: true,
      render: (_value: unknown, row: typeof accounts[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/accounts/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.accountName}</div>
            <div className="text-sm text-muted-foreground">{row.industry}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(value)}`}>
          {value}
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
      key: "city",
      label: "Location",
      render: (_value: unknown, row: typeof accounts[0]) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {row.city}, {row.state}
        </div>
      ),
    },
    {
      key: "annualRevenue",
      label: "Revenue",
      sortable: true,
      render: (value: number) => (
        <span className="text-sm text-foreground font-medium">
          ${(value / 1000000).toFixed(1)}M
        </span>
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
        title="Accounts"
        icon={Building2}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${accounts.length} accounts`}
        searchPlaceholder="Search accounts by name, industry, or location..."
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
                title="Filter accounts by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Accounts"}
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
              title="Import accounts from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredAccounts}
              columns={exportColumns}
              filename="accounts-export"
              title="Accounts Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new account"
              onClick={handleAddAccount}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
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
        {selectedAccounts.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedAccounts.length}
            totalCount={filteredAccounts.length}
            onSelectAll={handleSelectAllAccounts}
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
          data={paginatedAccounts}
          columns={columns}
          selectedIds={selectedAccounts}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No accounts found"
          emptyDescription="Try adjusting your search or filters, or add a new account"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/sales/accounts/${row.id}`),
                },
                {
                  label: "Edit Account",
                  icon: Edit,
                  onClick: () => handleEditAccount(row),
                },
                {
                  label: "Send Email",
                  icon: Mail,
                  onClick: () => window.location.href = `mailto:${row.email}`,
                },
                {
                  label: "View Website",
                  icon: Globe,
                  onClick: () => window.open(`https://${row.website}`, '_blank'),
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
          {paginatedAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/accounts/${account.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {account.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {account.accountName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {account.industry}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/sales/accounts/${account.id}`),
                        },
                        {
                          label: "Edit Account",
                          icon: Edit,
                          onClick: () => handleEditAccount(account),
                        },
                        {
                          label: "Send Email",
                          icon: Mail,
                          onClick: () => window.location.href = `mailto:${account.email}`,
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(account),
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(account.type)}`}>
                      {account.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                      {account.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{account.city}, {account.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{account.website}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold text-primary">${(account.annualRevenue / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Employees</p>
                      <p className="text-lg font-bold text-foreground">{account.employees.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Owner: {account.owner}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {account.created}
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
        totalItems={filteredAccounts.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedAccounts([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedAccounts([]);
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
        title="Delete Account"
        description="Are you sure you want to delete this account? This will permanently remove it from your CRM and cannot be undone."
        itemName={accountToDelete?.accountName}
        itemType="Account"
        icon={Building2}
        isDeleting={deleteAccount.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedAccounts.length}
        itemName="account"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedAccounts.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
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

      {/* Account Form Drawer */}
      <AccountFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingAccount}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
