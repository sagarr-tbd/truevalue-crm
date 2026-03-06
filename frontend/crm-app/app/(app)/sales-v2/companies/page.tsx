"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Globe,
  Phone,
  Calendar,
  ChevronDown,
  Check,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { CompanyV2FormDrawer } from "@/components/Forms/Sales";
import {
  useCompaniesV2,
  useCreateCompanyV2,
  useUpdateCompanyV2,
  useDeleteCompanyV2,
  useCompaniesV2Stats,
  useBulkDeleteCompaniesV2,
  useBulkUpdateCompaniesV2,
} from "@/lib/queries/useCompaniesV2";
import type { CreateCompanyV2Input, CompanyV2 } from "@/lib/api/companiesV2";
import { companiesV2Api } from "@/lib/api/companiesV2";
import { toast } from "sonner";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import { getStatusColor, toSnakeCaseOperator } from "@/lib/utils";
import { getCompanyActionMenuItems } from "@/lib/utils/actionMenus";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { useUIStore } from "@/stores";
import { usePermission, COMPANIES_READ, COMPANIES_WRITE, COMPANIES_DELETE } from "@/lib/permissions";

const DeleteConfirmationModal = dynamic(
  () => import("@/components/DeleteConfirmationModal"),
  { ssr: false }
);

const BulkDeleteModal = dynamic(
  () => import("@/components/BulkDeleteModal").then(mod => ({ default: mod.BulkDeleteModal })),
  { ssr: false }
);

import { BulkUpdateModal } from "@/components/BulkUpdateModal";

export default function CompaniesV2Page() {
  const router = useRouter();

  const {
    viewMode, showStats, setViewMode, toggleStats,
    filters, setModuleFilters, clearModuleFilters,
    defaultItemsPerPage: defaultPerPage,
  } = useUIStore();
  const { can } = usePermission();

  const companiesV2Filters = (filters as Record<string, any>)['companies-v2'] || {};

  const [searchQuery, setSearchQuery] = useState(companiesV2Filters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(companiesV2Filters.status || null);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { presets, addPreset, deletePreset } = useFilterPresets('companies-v2');

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter || undefined,
      industry: industryFilter || undefined,
    };

    if (filterGroup && filterGroup.conditions.length > 0) {
      params.filters = JSON.stringify({
        operator: (filterGroup.logic?.toUpperCase() || 'AND'),
        conditions: filterGroup.conditions.map(c => ({
          field: c.field,
          operator: toSnakeCaseOperator(c.operator),
          value: c.value,
        })),
      });
    }

    return params;
  }, [currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, industryFilter, filterGroup]);

  const { data: companiesResponse, isLoading } = useCompaniesV2(queryParams);
  const { data: statsData } = useCompaniesV2Stats();

  const { data: availableIndustries = [] } = useQuery({
    queryKey: ['companiesV2', 'sources'],
    queryFn: () => companiesV2Api.sources(),
    staleTime: 300000,
  });

  const createCompany = useCreateCompanyV2();
  const updateCompany = useUpdateCompanyV2();
  const deleteCompany = useDeleteCompanyV2();
  const bulkDeleteCompanies = useBulkDeleteCompaniesV2();
  const bulkUpdateCompanies = useBulkUpdateCompaniesV2();

  const companies = companiesResponse?.results || [];
  const totalItems = companiesResponse?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    (setModuleFilters as (module: string, filters: any) => void)('companies-v2', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, industryFilter, filterGroup]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyV2 | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

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

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New company",
        action: () => {
          if (!can(COMPANIES_WRITE)) return;
          setEditingCompany(null);
          setFormMode("add");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  const memoizedCompanies = useMemo(() => companies, [companies]);

  const transformedCompanies = useMemo(() =>
    memoizedCompanies.map(company => ({
      id: company.id,
      name: company.display_name || company.entity_data.name || 'Unnamed Company',
      email: company.display_email || company.entity_data.email || '',
      phone: company.display_phone || company.entity_data.phone || '',
      website: company.display_website || company.entity_data.website || '',
      industry: company.display_industry || company.industry || company.entity_data.industry || '',
      size: company.size || company.entity_data.size || '',
      status: company.status,
      location: [company.entity_data?.city, company.entity_data?.state, company.entity_data?.country].filter(Boolean).join(', '),
      revenue: company.entity_data?.annual_revenue || '',
      created: new Date(company.created_at).toLocaleDateString(),
      initials: (company.entity_data.name || 'C')[0]?.toUpperCase() || 'C',
    })),
    [memoizedCompanies]
  );

  const filterOptions = useMemo(() => {
    const byStatus = statsData?.by_status || {};
    const total = statsData?.total || totalItems;
    return [
      { label: "All Companies", value: null, count: total },
      { label: "Active", value: "active", count: byStatus.active || 0 },
      { label: "Inactive", value: "inactive", count: byStatus.inactive || 0 },
      { label: "Prospect", value: "prospect", count: byStatus.prospect || 0 },
      { label: "Customer", value: "customer", count: byStatus.customer || 0 },
      { label: "Partner", value: "partner", count: byStatus.partner || 0 },
      { label: "Archived", value: "archived", count: byStatus.archived || 0 },
    ];
  }, [statsData, totalItems]);

  const stats = useMemo(() => {
    if (statsData) {
      return [
        { label: "Total Companies", value: statsData.total, icon: Building2, iconBgColor: "bg-primary/10", iconColor: "text-primary" },
        { label: "Active", value: statsData.by_status?.active || 0, icon: Building2, iconBgColor: "bg-green-500/10", iconColor: "text-green-500" },
        { label: "Customers", value: statsData.by_status?.customer || 0, icon: Building2, iconBgColor: "bg-purple-500/10", iconColor: "text-purple-500" },
        { label: "Prospects", value: statsData.by_status?.prospect || 0, icon: Building2, iconBgColor: "bg-blue-500/10", iconColor: "text-blue-500" },
      ];
    }

    return [
      { label: "Total Companies", value: totalItems, icon: Building2, iconBgColor: "bg-primary/10", iconColor: "text-primary" },
      { label: "Active", value: memoizedCompanies.filter(c => c.status === 'active').length, icon: Building2, iconBgColor: "bg-green-500/10", iconColor: "text-green-500" },
      { label: "Customers", value: memoizedCompanies.filter(c => c.status === 'customer').length, icon: Building2, iconBgColor: "bg-purple-500/10", iconColor: "text-purple-500" },
      { label: "Prospects", value: memoizedCompanies.filter(c => c.status === 'prospect').length, icon: Building2, iconBgColor: "bg-blue-500/10", iconColor: "text-blue-500" },
    ];
  }, [statsData, memoizedCompanies, totalItems]);

  const exportParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (debouncedSearchQuery) p.search = debouncedSearchQuery;
    if (statusFilter) p.status = statusFilter;
    if (industryFilter) p.industry = industryFilter;
    if (filterGroup && filterGroup.conditions.length > 0) {
      p.filters = JSON.stringify({
        operator: (filterGroup.logic?.toUpperCase() || 'AND'),
        conditions: filterGroup.conditions.map(c => ({
          field: c.field,
          operator: toSnakeCaseOperator(c.operator),
          value: c.value,
        })),
      });
    }
    return p;
  }, [debouncedSearchQuery, statusFilter, industryFilter, filterGroup]);

  const handleSelectAll = () => {
    if (selectedCompanies.length === transformedCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(transformedCompanies.map((c) => c.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedCompanies.includes(strId)) {
      setSelectedCompanies(selectedCompanies.filter((cId) => cId !== strId));
    } else {
      setSelectedCompanies([...selectedCompanies, strId]);
    }
  };

  const handleDeleteClick = (company: { id: string; name: string }) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteCompany.mutateAsync(companyToDelete.id);
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
    } catch {
      toast.error("Failed to delete company");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
  };

  const handleSelectAllCompanies = () => {
    setSelectedCompanies(transformedCompanies.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCompanies([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDeleteCompanies.mutateAsync(selectedCompanies);
      setSelectedCompanies([]);
      setShowBulkDelete(false);
    } catch {
      // Error handled by mutation
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedCompanies.length === 0) {
      toast.error("No companies selected for export");
      return;
    }
    try {
      await companiesV2Api.export({ ids: selectedCompanies });
      toast.success(`Exported ${selectedCompanies.length} companies`);
    } catch {
      toast.error("Failed to export companies");
    }
  };

  const handleBulkUpdateStatus = async (newStatus: "active" | "inactive" | "prospect" | "customer" | "partner" | "archived") => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdateCompanies.mutateAsync({ ids: selectedCompanies, data: { status: newStatus } });
      setSelectedCompanies([]);
      setShowBulkUpdateStatus(false);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleEditCompany = useCallback((company: { id: string }) => {
    setFormMode("edit");
    const fullCompany = companies.find(c => c.id === company.id);
    if (fullCompany) {
      setEditingCompany({
        ...fullCompany,
        status: fullCompany.status as CompanyV2['status']
      });
      setFormDrawerOpen(true);
    }
  }, [companies]);

  const handleFormSubmit = async (data: CreateCompanyV2Input) => {
    try {
      if (formMode === "add" && data.entity_data?.name) {
        try {
          const duplicateCheck = await companiesV2Api.checkDuplicate({ name: data.entity_data.name });
          if (duplicateCheck.has_duplicates) {
            toast.warning(
              `Found ${duplicateCheck.count} existing company(ies) with this name. Creating anyway.`,
              { duration: 5000 }
            );
          }
        } catch {
          // If duplicate check fails, continue silently
        }
      }

      if (formMode === "edit" && editingCompany?.id) {
        await updateCompany.mutateAsync({ id: editingCompany.id, data });
      } else {
        await createCompany.mutateAsync(data);
      }

      setFormDrawerOpen(false);
      setEditingCompany(null);
    } catch (error) {
      throw error;
    }
  };

  const companyActionHandlers = useMemo(() => ({
    onView: (id: string) => router.push(`/sales-v2/companies/${id}`),
    onEdit: (company: { id: string }) => {
      handleEditCompany(company);
    },
    onSendEmail: (email: string) => { if (email) window.location.href = `mailto:${email}`; },
    onDelete: handleDeleteClick,
  }), [router, handleEditCompany]);

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (statusFilter) {
      chips.push({ id: 'status-filter', label: 'Status', value: statusFilter, color: 'primary' });
    }
    if (industryFilter) {
      chips.push({ id: 'industry-filter', label: 'Industry', value: industryFilter, color: 'secondary' });
    }
    return chips;
  }, [statusFilter, industryFilter]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === 'status-filter') setStatusFilter(null);
    else if (chipId === 'industry-filter') setIndustryFilter(null);
  };

  const handleClearAllFilters = () => {
    setStatusFilter(null);
    setIndustryFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    (clearModuleFilters as (module: string) => void)('companies-v2');
  };

  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Prospect', value: 'prospect' },
        { label: 'Customer', value: 'customer' },
        { label: 'Partner', value: 'partner' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { key: 'name', label: 'Company Name', type: 'text', placeholder: 'Enter company name...' },
    { key: 'email', label: 'Email', type: 'text', placeholder: 'Enter email...' },
    {
      key: 'industry',
      label: 'Industry',
      type: 'select',
      options: (availableIndustries as string[]).map(s => ({
        label: s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: s
      })),
    },
    { key: 'city', label: 'City', type: 'text', placeholder: 'Enter city...' },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'Enter website...' },
  ], [availableIndustries]);

  const columns = useMemo(() => [
    {
      key: "name",
      label: "Company",
      render: (_: unknown, row: typeof transformedCompanies[0]) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales-v2/companies/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            {row.industry && (
              <div className="text-sm text-muted-foreground capitalize">{row.industry.replace(/_/g, ' ')}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact Info",
      render: (_: unknown, row: typeof transformedCompanies[0]) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {row.email}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {row.phone || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(value, 'company')}`}>
          {value}
        </span>
      ),
    },
    {
      key: "website",
      label: "Website",
      render: (value: string | undefined) => value ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <Globe className="h-4 w-4" />
          {value.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">N/A</span>
      ),
    },
    {
      key: "industry",
      label: "Industry",
      render: (value: string | undefined) => (
        <span className="text-sm text-foreground capitalize">{value?.replace(/_/g, ' ') || "N/A"}</span>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (value: string | undefined) => (
        <span className="text-sm text-muted-foreground">{value || "N/A"}</span>
      ),
    },
    {
      key: "size",
      label: "Size",
      render: (value: string | undefined) => (
        <span className="text-sm text-foreground">{value || "N/A"}</span>
      ),
    },
    {
      key: "created",
      label: "Created",
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {value}
        </div>
      ),
    },
  ], [router]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Companies"
        icon={Building2}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} companies`}
        searchPlaceholder="Search companies by name, email, or phone..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toggleStats()} title={showStats ? "Hide Statistics" : "Show Statistics"}>
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} />

            <div className="relative" ref={filterDropdownRef}>
              <Button variant="outline" size="sm" onClick={() => setShowFilterDropdown(!showFilterDropdown)} title="Filter companies by status">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All Companies"}
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
                        onClick={() => { setStatusFilter(option.value); setShowFilterDropdown(false); setCurrentPage(1); }}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span>{option.label}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{option.count}</span>
                        </div>
                        {statusFilter === option.value && <Check className="h-4 w-4 text-brand-teal" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} title="Open advanced filters">
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Advanced Filters</span>
              <span className="md:hidden">Advanced</span>
              {filterGroup && filterGroup.conditions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">{filterGroup.conditions.length}</span>
              )}
            </Button>

            {can(COMPANIES_WRITE) && (
              <Button variant="outline" size="sm" title="Import companies from CSV or Excel">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {can(COMPANIES_READ) && (
              <ExportButton
                exportUrl="/crm/api/v2/companies/export/"
                exportParams={exportParams}
                filename="companies"
                totalRecords={totalItems}
              />
            )}
            {can(COMPANIES_WRITE) && (
              <Button
                onClick={() => { setFormMode("add"); setEditingCompany(null); setFormDrawerOpen(true); }}
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Add a new company"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            )}
          </>
        }
      />

      {filterChips.length > 0 && (
        <FilterChips chips={filterChips} onRemove={handleRemoveFilterChip} onClearAll={handleClearAllFilters} />
      )}

      <AdvancedFilter
        fields={filterFields}
        onApply={(group) => { setFilterGroup(group); setCurrentPage(1); }}
        onClear={() => { setFilterGroup(null); setCurrentPage(1); }}
        initialGroup={filterGroup || undefined}
        presets={presets}
        onSavePreset={addPreset}
        onLoadPreset={(preset) => { setFilterGroup(preset.group); setCurrentPage(1); }}
        onDeletePreset={deletePreset}
        isDrawer={true}
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        drawerPosition="right"
      />

      {selectedCompanies.length > 0 && (can(COMPANIES_WRITE) || can(COMPANIES_DELETE)) && (
        <BulkActionsToolbar
          selectedCount={selectedCompanies.length}
          totalCount={totalItems}
          onSelectAll={handleSelectAllCompanies}
          onDeselectAll={handleDeselectAll}
          onDelete={can(COMPANIES_DELETE) ? () => setShowBulkDelete(true) : undefined}
          onExport={handleBulkExport}
          onUpdateStatus={can(COMPANIES_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined}
          isProcessing={isBulkProcessing}
        />
      )}

      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {viewMode === "list" ? (
        <DataTable
          data={transformedCompanies}
          columns={columns}
          selectedIds={selectedCompanies}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={can(COMPANIES_DELETE) || can(COMPANIES_WRITE)}
          loading={isLoading}
          emptyMessage="No companies found"
          emptyDescription="Try adjusting your search or filters, or add a new company"
          renderActions={(row: typeof transformedCompanies[0]) => (
            <ActionMenu
              items={getCompanyActionMenuItems(row, companyActionHandlers).filter(
                (item) => {
                  if (item.label === "Delete") return can(COMPANIES_DELETE);
                  if (["Edit", "Edit Company"].includes(item.label || "")) return can(COMPANIES_WRITE);
                  return true;
                }
              )}
            />
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformedCompanies.map((company, index) => (
            <motion.div key={company.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales-v2/companies/${company.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {company.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{company.name}</h3>
                      {company.industry && (
                        <p className="text-sm text-muted-foreground capitalize">{company.industry.replace(/_/g, ' ')}</p>
                      )}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={getCompanyActionMenuItems(company, companyActionHandlers).filter(
                        (item) => {
                          if (item.label === "Delete") return can(COMPANIES_DELETE);
                          if (["Edit", "Edit Company"].includes(item.label || "")) return can(COMPANIES_WRITE);
                          return true;
                        }
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(company.status, 'company')}`}>
                      {company.status}
                    </span>
                    {company.size && <span className="text-xs text-muted-foreground">{company.size} employees</span>}
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border">
                    {company.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{company.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{company.phone || "N/A"}</span>
                    </div>
                    {company.website && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {company.created}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => { setCurrentPage(page); setSelectedCompanies([]); }}
        onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); setSelectedCompanies([]); }}
        filterInfo={statusFilter ? `filtered by ${statusFilter}` : undefined}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Company"
        description="Are you sure you want to delete this company? This will permanently remove it from your CRM and cannot be undone."
        itemName={companyToDelete?.name}
        itemType="Company"
        icon={Building2}
        isDeleting={isDeleting}
      />

      <CompanyV2FormDrawer
        isOpen={formDrawerOpen}
        onClose={() => { setFormDrawerOpen(false); setEditingCompany(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingCompany}
        mode={formMode}
      />

      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedCompanies.length}
        itemName="company"
      />

      <BulkUpdateModal<"active" | "inactive" | "prospect" | "customer" | "partner" | "archived">
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedCompanies.length}
        title="Update Company Status"
        field="Status"
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Prospect', value: 'prospect' },
          { label: 'Customer', value: 'customer' },
          { label: 'Partner', value: 'partner' },
          { label: 'Archived', value: 'archived' },
        ]}
      />
    </div>
  );
}
