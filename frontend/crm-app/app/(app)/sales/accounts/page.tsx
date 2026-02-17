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
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useAccounts, 
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount, 
  useBulkDeleteAccounts, 
  useBulkUpdateAccounts,
  AccountQueryParams,
} from "@/lib/queries/useAccounts";
import { getSizeDisplayLabel, companiesApi } from "@/lib/api/companies";
import { useUIStore } from "@/stores";
import { usePermission, COMPANIES_WRITE, COMPANIES_DELETE } from "@/lib/permissions";

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
  
  const { can } = usePermission();
  
  // Initialize filters from store (casting to allow flexible field access)
  const accountsFilters = (filters.accounts || {}) as Record<string, string | null | undefined>;
  
  // State management
  const [searchQuery, setSearchQuery] = useState(accountsFilters.search || "");
  const [industryFilter, setIndustryFilter] = useState<string | null>(accountsFilters.industry || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
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
  
  // Debounce search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Build query params for server-side pagination (including advanced filters)
  const queryParams: AccountQueryParams = useMemo(() => {
    const params: AccountQueryParams = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      industry: industryFilter || undefined,
    };
    
    // Add sorting
    if (sortColumn) {
      const fieldMap: Record<string, string> = {
        accountName: 'name',
        industry: 'industry',
        type: 'size',
        annualRevenue: 'annual_revenue',
        created: 'created_at',
      };
      const backendField = fieldMap[sortColumn] || sortColumn;
      params.order_by = sortDirection === 'desc' ? `-${backendField}` : backendField;
    }
    
    // Add advanced filters if present
    if (filterGroup && filterGroup.conditions.length > 0) {
      params.filters = filterGroup;
    }
    
    return params;
  }, [currentPage, itemsPerPage, debouncedSearchQuery, industryFilter, sortColumn, sortDirection, filterGroup]);
  
  // React Query - fetch accounts with server-side pagination
  const { data: accountsResponse, isLoading } = useAccounts(queryParams);
  const accounts = useMemo(() => accountsResponse?.data ?? [], [accountsResponse?.data]);
  const totalItems = accountsResponse?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const bulkDelete = useBulkDeleteAccounts();
  const bulkUpdate = useBulkUpdateAccounts();
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('accounts', {
      search: searchQuery,
      industry: industryFilter,
    });
  }, [searchQuery, industryFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<typeof accounts[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<AccountType> | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
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

  // Advanced filter fields (match backend fields)
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
      label: 'Company Size',
      type: 'select',
      options: [
        { label: '1 (Solo)', value: '1' },
        { label: '2-10 (Micro)', value: '2-10' },
        { label: '11-50 (Small)', value: '11-50' },
        { label: '51-200 (Medium)', value: '51-200' },
        { label: '201-500 (Large)', value: '201-500' },
        { label: '501-1000 (Enterprise)', value: '501-1000' },
        { label: '1000+ (Corporate)', value: '1000+' },
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
    {
      key: 'country',
      label: 'Country',
      type: 'text',
    },
  ], []);

  // Stats from API response (includes all accounts, not just current page)
  const apiStats = accountsResponse?.meta?.stats;
  
  // Stats calculations using API stats
  const stats = useMemo(() => {
    const totalAccounts = apiStats?.total ?? 0;
    const totalRevenue = apiStats?.totalRevenue ?? 0;
    const totalEmployees = apiStats?.totalEmployees ?? 0;
    
    // Count by size categories
    const bySize = apiStats?.bySize ?? {};
    const enterpriseCount = (bySize['501-1000'] ?? 0) + (bySize['1000+'] ?? 0);
    const midMarketCount = (bySize['51-200'] ?? 0) + (bySize['201-500'] ?? 0);
    const smbCount = (bySize['1'] ?? 0) + (bySize['2-10'] ?? 0) + (bySize['11-50'] ?? 0);

    return [
      {
        label: "Total Accounts",
        value: totalAccounts,
        icon: Building2,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "Enterprise",
        value: enterpriseCount,
        icon: TrendingUp,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        subtitle: "500+ employees",
      },
      {
        label: "Mid-Market",
        value: midMarketCount,
        icon: DollarSign,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
        subtitle: "51-500 employees",
      },
      {
        label: "SMB",
        value: smbCount,
        icon: Users,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        subtitle: "1-50 employees",
      },
    ];
  }, [apiStats]);

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

  // Industry filter options from API stats
  const filterOptions = useMemo(() => {
    const byIndustry = apiStats?.byIndustry ?? {};
    const options: Array<{ label: string; value: string | null; count: number }> = [
      {
        label: "All Industries",
        value: null,
        count: apiStats?.total ?? 0,
      },
    ];
    
    // Add industry options sorted by count
    const industries = Object.entries(byIndustry)
      .filter(([industry]) => industry && industry !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 industries
    
    for (const [industry, count] of industries) {
      options.push({
        label: industry,
        value: industry,
        count: count,
      });
    }
    
    return options;
  }, [apiStats]);

  // Handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accounts.map((a) => a.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedAccounts.includes(strId)) {
      setSelectedAccounts(selectedAccounts.filter((aId) => aId !== strId));
    } else {
      setSelectedAccounts([...selectedAccounts, strId]);
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
    setEditingAccountId(null);
    setFormDrawerOpen(true);
  };

  const handleEditAccount = async (account: typeof accounts[0]) => {
    try {
      // Fetch full account details to get all fields (list API doesn't return all fields)
      const fullAccount = await companiesApi.getById(account.id);
      
      setFormMode("edit");
      setEditingAccountId(account.id); // Store the ID for update
      setEditingAccount({
        accountName: fullAccount.accountName,
        website: fullAccount.website,
        phone: fullAccount.phone,
        email: fullAccount.email,
        industry: fullAccount.industry,
        type: fullAccount.type as "1" | "2-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+",
        employees: fullAccount.employees,
        annualRevenue: fullAccount.annualRevenue,
        // Address fields
        addressLine1: fullAccount.addressLine1 || '',
        addressLine2: fullAccount.addressLine2 || '',
        city: fullAccount.city,
        state: fullAccount.state,
        postalCode: fullAccount.postalCode || '',
        country: fullAccount.country,
        // Business info
        description: fullAccount.description || '',
        // Social URLs
        linkedinUrl: fullAccount.linkedinUrl || '',
        twitterUrl: fullAccount.twitterUrl || '',
        facebookUrl: fullAccount.facebookUrl || '',
        // Tags (as UUIDs)
        tagIds: fullAccount.tagIds || [],
      });
      setFormDrawerOpen(true);
    } catch (error) {
      console.error("Error fetching account details:", error);
      toast.error("Failed to load account details");
    }
  };

  const handleFormSubmit = async (data: Partial<AccountType>) => {
    try {
      const accountData = {
        accountName: data.accountName || "",
        industry: data.industry || "",
        type: data.type || "", // Size value like "51-200"
        website: data.website || "",
        phone: data.phone || "",
        email: data.email || "",
        // Address fields
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        city: data.city || "",
        state: data.state || "",
        postalCode: data.postalCode || "",
        country: data.country || "",
        // Business fields
        employees: typeof data.employees === 'number' ? data.employees : parseInt(String(data.employees) || "0"),
        annualRevenue: data.annualRevenue || 0,
        description: data.description || "",
        // Social URLs
        linkedinUrl: data.linkedinUrl || "",
        twitterUrl: data.twitterUrl || "",
        facebookUrl: data.facebookUrl || "",
        // Tags (UUIDs from form)
        tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
      };

      if (formMode === "add") {
        await createAccount.mutateAsync(accountData);
      } else if (editingAccountId) {
        await updateAccount.mutateAsync({ id: editingAccountId, data: accountData });
      }
      
      setFormDrawerOpen(false);
      setEditingAccount(null);
      setEditingAccountId(null);
    } catch (error) {
      console.error("Error submitting account:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllAccounts = () => {
    // Select all accounts on current page
    setSelectedAccounts(accounts.map(a => a.id));
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
    const selectedData = accounts.filter(account => account.id !== undefined && selectedAccounts.includes(account.id));
    
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
    
    if (industryFilter) {
      chips.push({
        id: 'industry-filter',
        label: 'Industry',
        value: industryFilter,
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
  }, [industryFilter, filterGroup, filterFields]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === 'industry-filter') {
      setIndustryFilter(null);
      setCurrentPage(1);
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
        setCurrentPage(1);
      }
    }
  };

  const handleClearAllFilters = () => {
    setIndustryFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    setCurrentPage(1);
    clearModuleFilters('accounts');
  };

  // Get type/size color helper (based on company size)
  const getTypeColor = (size: string) => {
    // Map size values to color classes
    const sizeColorMap: Record<string, string> = {
      // Small companies
      '1': 'bg-muted text-muted-foreground',
      '2-10': 'bg-muted text-muted-foreground',
      '11-50': 'bg-accent/10 text-accent',
      // Medium companies
      '51-200': 'bg-secondary/10 text-secondary',
      '201-500': 'bg-secondary/10 text-secondary',
      // Large/Enterprise companies
      '501-1000': 'bg-primary/10 text-primary',
      '1000+': 'bg-primary/10 text-primary',
    };
    return sizeColorMap[size] || 'bg-muted text-muted-foreground';
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
          setEditingAccountId(null);
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
          </div>
        </div>
      ),
    },
    {
      key: "industry",
      label: "Industry",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-foreground">{value || '-'}</span>
      ),
    },
    {
      key: "type",
      label: "Size",
      sortable: true,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(value)}`}>
          {getSizeDisplayLabel(value) || value || '-'}
        </span>
      ),
    },
    {
      key: "city",
      label: "Location",
      render: (_value: unknown, row: typeof accounts[0]) => {
        const parts = [row.city, row.state, row.country].filter(Boolean);
        const location = parts.length > 0 ? parts.slice(0, 2).join(', ') : '-';
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {location}
          </div>
        );
      },
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
      key: "tags",
      label: "Tags",
      render: (_value: unknown, row: typeof accounts[0]) => {
        const tags = row.tags;
        if (!tags || tags.length === 0) return <span className="text-muted-foreground/50">—</span>;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : 'hsl(var(--primary) / 0.1)',
                  color: tag.color || 'hsl(var(--primary))',
                }}
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
            )}
          </div>
        );
      },
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
            
            {/* Industry Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter accounts by industry"
              >
                <Filter className="h-4 w-4 mr-2" />
                {industryFilter
                  ? filterOptions.find((f) => f.value === industryFilter)?.label
                  : "All Industries"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-border py-2 z-50 max-h-80 overflow-y-auto"
                  >
                    {filterOptions.map((option) => (
                      <button
                        key={option.value || "all"}
                        onClick={() => {
                          setIndustryFilter(option.value);
                          setShowFilterDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="truncate">{option.label}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground flex-shrink-0">
                            {option.count}
                          </span>
                        </div>
                        {industryFilter === option.value && (
                          <Check className="h-4 w-4 text-brand-teal flex-shrink-0" />
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
            {can(COMPANIES_WRITE) && (
              <ExportButton
                data={accounts}
                columns={exportColumns}
                filename="accounts-export"
                title="Accounts Export"
              />
            )}
            {can(COMPANIES_WRITE) && (
              <Button 
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Add a new account"
                onClick={handleAddAccount}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            )}
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
        {selectedAccounts.length > 0 && can(COMPANIES_WRITE) && (
          <BulkActionsToolbar
            selectedCount={selectedAccounts.length}
            totalCount={totalItems}
            onSelectAll={handleSelectAllAccounts}
            onDeselectAll={handleDeselectAll}
            onDelete={() => setShowBulkDelete(true)}
            onExport={handleBulkExport}
            onUpdateStatus={() => setShowBulkUpdateStatus(true)}
            statusLabel="Size"
            isProcessing={isBulkProcessing}
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={accounts}
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
                ...(row.email ? [{
                  label: "Send Email",
                  icon: Mail,
                  onClick: () => window.location.href = `mailto:${row.email}`,
                }] : []),
                ...(row.website ? [{
                  label: "View Website",
                  icon: Globe,
                  onClick: () => {
                    const url = row.website?.startsWith('http') ? row.website : `https://${row.website}`;
                    window.open(url, '_blank');
                  },
                }] : []),
                { divider: true, label: "", onClick: () => {} },
                {
                  label: "Delete",
                  icon: Trash2,
                  variant: "danger" as const,
                  onClick: () => handleDeleteClick(row),
                },
              ].filter(item => {
                if (item.label === 'Delete') return can(COMPANIES_DELETE);
                if (['Edit', 'Edit Account'].includes(item.label || '')) return can(COMPANIES_WRITE);
                return true;
              })}
            />
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, index) => (
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
                        ...(account.email ? [{
                          label: "Send Email",
                          icon: Mail,
                          onClick: () => window.location.href = `mailto:${account.email}`,
                        }] : []),
                        ...(account.website ? [{
                          label: "View Website",
                          icon: Globe,
                          onClick: () => {
                            const url = account.website?.startsWith('http') ? account.website : `https://${account.website}`;
                            window.open(url, '_blank');
                          },
                        }] : []),
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger" as const,
                          onClick: () => handleDeleteClick(account),
                        },
                      ].filter(item => {
                        if (item.label === 'Delete') return can(COMPANIES_DELETE);
                        if (['Edit', 'Edit Account'].includes(item.label || '')) return can(COMPANIES_WRITE);
                        return true;
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(account.type)}`}>
                      {getSizeDisplayLabel(account.type) || account.type || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{[account.city, account.country].filter(Boolean).join(', ') || '-'}</span>
                  </div>
                  {account.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span className="truncate">{account.website}</span>
                    </div>
                  )}
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
        totalItems={totalItems}
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
          industryFilter ? `filtered by ${industryFilter}` : undefined
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
          setEditingAccountId(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingAccount}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
