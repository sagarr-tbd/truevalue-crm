"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Target,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Mail,
  Phone,
  FileText,
  UserPlus,
  Calendar,
  ChevronDown,
  Check,
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
import type { Lead, LeadStatus } from "@/lib/types";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { toSnakeCaseOperator, getStatusColor } from "@/lib/utils";
import { getLeadActionMenuItems } from "@/lib/utils/actionMenus";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { LeadConversionModal, type ConversionParams } from "@/components/LeadConversionModal";
import { toast } from "sonner";
import { 
  useLeads, 
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useConvertLead,
  useBulkDeleteLeads, 
  useBulkUpdateLeads,
  type LeadQueryParams,
  type LeadViewModel,
} from "@/lib/queries/useLeads";
import { leadsApi } from "@/lib/api/leads";
import { useUIStore } from "@/stores";
import { usePermission, LEADS_READ, LEADS_WRITE, LEADS_DELETE } from "@/lib/permissions";

// Lazy load heavy components that are only used conditionally
const LeadFormDrawer = dynamic(
  () => import("@/components/Forms/Sales").then(mod => ({ default: mod.LeadFormDrawer })),
  { ssr: false }
);

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

export default function LeadsPage() {
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
  
  // Initialize filters from store
  const leadsFilters = filters.leads || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(leadsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(leadsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Debounce search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Advanced Filter state
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { presets, addPreset, deletePreset } = useFilterPresets('leads');

  // Build query params for server-side pagination (including advanced filters)
  const queryParams: LeadQueryParams = useMemo(() => {
    const params: LeadQueryParams = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter || undefined,
    };
    
    // Add advanced filters if present
    if (filterGroup && filterGroup.conditions.length > 0) {
      params.filters = {
        logic: (filterGroup.logic?.toLowerCase() || 'and') as 'and' | 'or',
        conditions: filterGroup.conditions.map(c => ({
          field: c.field,
          operator: toSnakeCaseOperator(c.operator),
          value: c.value,
        })),
      };
    }
    
    return params;
  }, [currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, filterGroup]);
  
  // React Query (server data) - now with pagination
  const { data: leadsResponse, isLoading } = useLeads(queryParams);
  const leads = useMemo(() => leadsResponse?.data ?? [], [leadsResponse?.data]);
  const totalItems = leadsResponse?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Stats from API response (includes all leads, not just current page)
  const apiStats = leadsResponse?.meta?.stats;
  
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();
  const bulkDelete = useBulkDeleteLeads();
  const bulkUpdate = useBulkUpdateLeads();
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('leads', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<LeadViewModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form modal states - Unified Modal
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Filter dropdown ref for click outside
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Conversion modal state
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<LeadViewModel | null>(null);

  // Export columns configuration - fields from list API
  const exportColumns: ExportColumn<LeadViewModel>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'companyName', label: 'Company' },
    { key: 'status', label: 'Status', format: (value) => value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : '' },
    { key: 'source', label: 'Source', format: (value) => value ? String(value).replace(/_/g, ' ') : '' },
    { key: 'score', label: 'Score' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields configuration
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Unqualified', value: 'unqualified' },
        { label: 'Converted', value: 'converted' },
      ],
    },
    {
      key: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter first name...',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter last name...',
    },
    {
      key: 'companyName',
      label: 'Company',
      type: 'text',
      placeholder: 'Enter company...',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'Enter email...',
    },
    {
      key: 'source',
      label: 'Source',
      type: 'select',
      options: [
        { label: 'Website', value: 'website' },
        { label: 'Referral', value: 'referral' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Trade Show', value: 'trade_show' },
        { label: 'Cold Call', value: 'cold_call' },
        { label: 'Email Campaign', value: 'email_campaign' },
        { label: 'Social Media', value: 'social_media' },
      ],
    },
    {
      key: 'score',
      label: 'Score',
      type: 'number',
      placeholder: 'Enter score (0-100)...',
    },
  ], []);

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

  // Page-specific keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New lead",
        action: () => {
          if (!can(LEADS_WRITE)) return;
          setEditingLead(null);
          setFormMode("add");
          setDefaultView("quick");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  // Filter options (using API stats for counts)
  const filterOptions = useMemo(() => [
    {
      label: "All Leads",
      value: null,
      count: apiStats?.total ?? totalItems,
    },
    {
      label: "New",
      value: "new",
      count: apiStats?.byStatus?.['new'] ?? 0,
    },
    {
      label: "Contacted",
      value: "contacted",
      count: apiStats?.byStatus?.['contacted'] ?? 0,
    },
    {
      label: "Qualified",
      value: "qualified",
      count: apiStats?.byStatus?.['qualified'] ?? 0,
    },
    {
      label: "Unqualified",
      value: "unqualified",
      count: apiStats?.byStatus?.['unqualified'] ?? 0,
    },
    {
      label: "Converted",
      value: "converted",
      count: apiStats?.byStatus?.['converted'] ?? 0,
    },
  ], [apiStats, totalItems]);

  // Stats calculations using API stats (includes all leads, not just current page)
  const stats = useMemo(() => {
    const totalLeads = apiStats?.total ?? totalItems;
    const newLeads = apiStats?.byStatus?.['new'] ?? 0;
    const qualified = apiStats?.byStatus?.['qualified'] ?? 0;
    const contacted = apiStats?.byStatus?.['contacted'] ?? 0;

    return [
      {
        label: "Total Leads",
        value: totalLeads,
        icon: Target,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "New Leads",
        value: newLeads,
        icon: Target,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Contacted",
        value: contacted,
        icon: Phone,
        iconBgColor: "bg-blue-500/10",
        iconColor: "text-blue-500",
      },
      {
        label: "Qualified",
        value: qualified,
        icon: UserPlus,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
      },
    ];
  }, [apiStats, totalItems]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedLeads.includes(strId)) {
      setSelectedLeads(selectedLeads.filter((lId) => lId !== strId));
    } else {
      setSelectedLeads([...selectedLeads, strId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (lead: LeadViewModel) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete?.id) return;
    
    setIsDeleting(true);
    
    try {
      await deleteLead.mutateAsync(leadToDelete.id);
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error("Error deleting lead:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setLeadToDelete(null);
  };

  // Open conversion modal for a lead
  const handleConvertClick = (lead: LeadViewModel) => {
    setLeadToConvert(lead);
    setShowConversionModal(true);
  };

  // Handle conversion with modal params
  const handleConvertWithParams = async (params: ConversionParams) => {
    if (!leadToConvert) return;
    
    try {
      const result = await convertLead.mutateAsync({
        id: leadToConvert.id,
        params,
      });
      setShowConversionModal(false);
      setLeadToConvert(null);
      // Navigate to the new contact after successful conversion
      if (result.contact?.id) {
        router.push(`/sales/contacts/${result.contact.id}`);
      }
    } catch (error) {
      console.error("Failed to convert lead:", error);
    }
  };

  // Bulk operation handlers
  const handleSelectAllLeads = () => {
    setSelectedLeads(leads.map(l => l.id));
  };

  const handleDeselectAll = () => {
    setSelectedLeads([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedLeads);
      setSelectedLeads([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (newStatus: LeadStatus) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedLeads, data: { status: newStatus } });
      setSelectedLeads([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Bulk update error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = leads.filter(lead => selectedLeads.includes(lead.id));
    
    if (selectedData.length === 0) {
      toast.error("No leads selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-leads-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} leads`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export leads");
    }
  };

  // Helper to get display value for filter conditions
  const getFilterDisplayValue = (field: FilterField | undefined, value: string): string => {
    if (!field || !value) return value;
    
    // For select fields, look up the label from options
    if (field.type === 'select' && field.options) {
      const option = field.options.find(opt => opt.value === value);
      if (option) return option.label;
    }
    
    return value;
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
        const displayValue = getFilterDisplayValue(field, condition.value);
        chips.push({
          id: `advanced-filter-${index}`,
          label: field?.label || condition.field,
          value: `${condition.operator}: ${displayValue}`,
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
    clearModuleFilters('leads');
  };

  const handleEditLead = async (lead: LeadViewModel | Lead) => {
    setFormMode("edit");
    
    try {
      // Fetch full lead details to ensure all fields are available for editing
      const fullLead = await leadsApi.getById(lead.id as string);
      
      // Map LeadViewModel to form-compatible format
      setEditingLead({
        id: fullLead.id,
        firstName: fullLead.firstName,
        lastName: fullLead.lastName,
        email: fullLead.email,
        phone: fullLead.phone,
        mobile: fullLead.mobile,
        companyName: fullLead.companyName,
        title: fullLead.title,
        website: fullLead.website,
        source: fullLead.source,
        sourceDetail: fullLead.sourceDetail,
        status: fullLead.status as LeadStatus,
        score: fullLead.score,
        addressLine1: fullLead.addressLine1,
        city: fullLead.city,
        state: fullLead.state,
        postalCode: fullLead.postalCode,
        country: fullLead.country,
        description: fullLead.description,
        tagIds: fullLead.tagIds,
        ownerId: fullLead.ownerId,
      } as Lead);
    } catch (error) {
      console.error("Failed to fetch lead details:", error);
      toast.error("Failed to load lead details");
      // Fallback to minimal data from list
      setEditingLead({
        id: lead.id,
        firstName: (lead as LeadViewModel).firstName,
        lastName: (lead as LeadViewModel).lastName,
        email: (lead as LeadViewModel).email,
        companyName: (lead as LeadViewModel).companyName,
        status: (lead as LeadViewModel).status as LeadStatus,
        source: (lead as LeadViewModel).source,
        tagIds: (lead as LeadViewModel).tagIds,
      } as Lead);
    }
    setFormDrawerOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: Partial<Lead>) => {
    try {
      if (formMode === "edit" && editingLead?.id) {
        await updateLead.mutateAsync({ id: String(editingLead.id), data });
      } else {
        await createLead.mutateAsync(data);
      }
      
      setFormDrawerOpen(false);
      setEditingLead(null);
    } catch (error) {
      throw error;
    }
  };

  // Lead action menu handlers (must be after handleEditLead is defined)
  const leadActionHandlers = useMemo(() => ({
    onView: (id: string) => router.push(`/sales/leads/${id}`),
    onEdit: (lead: LeadViewModel) => {
      handleEditLead(lead);
      setDefaultView("detailed");
    },
    onSendEmail: (email: string) => { if (email) window.location.href = `mailto:${email}`; },
    onCall: (phone: string) => { if (phone) window.location.href = `tel:${phone}`; },
    onConvert: handleConvertClick,
    onDelete: handleDeleteClick,
  }), [router, handleConvertClick, handleDeleteClick]);

  // Get score color based on value
  const getScoreColor = (score: number | undefined) => {
    if (!score) return "bg-muted text-muted-foreground";
    if (score >= 80) return "bg-destructive/10 text-destructive";
    if (score >= 50) return "bg-accent/10 text-accent";
    return "bg-muted text-muted-foreground";
  };

  // Table columns - matching list API response fields
  const columns = useMemo(() => [
    {
      key: "firstName",
      label: "Name",
      render: (_: unknown, row: LeadViewModel) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/leads/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">
              {row.fullName || `${row.firstName} ${row.lastName}`}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {row.companyName || "No company"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (_: unknown, row: LeadViewModel) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {row.email}
          </div>
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
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(value, 'lead')}`}>
          {value}
        </span>
      ),
    },
    {
      key: "score",
      label: "Score",
      render: (value: number | undefined) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(value)}`}>
          {value ?? "N/A"}
        </span>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (value: string | undefined) => (
        <span className="text-sm text-foreground capitalize">{value?.replace(/_/g, ' ') || "N/A"}</span>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      render: (_: unknown, row: LeadViewModel) => {
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
      {/* Header */}
      <PageHeader
        title="Leads"
        icon={Target}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} leads in pipeline`}
        searchPlaceholder="Search leads by name, company, or email..."
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
                title="Filter leads by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Leads"}
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

            {/* Advanced Filter Button */}
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

            {can(LEADS_WRITE) && (
              <Button 
                variant="outline" 
                size="sm"
                title="Import leads from CSV or Excel"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {can(LEADS_READ) && (
              <ExportButton
                data={leads}
                columns={exportColumns}
                filename={`leads-${new Date().toISOString().split('T')[0]}`}
                title="Leads Export"
              />
            )}
            {can(LEADS_WRITE) && (
              <Button 
                onClick={() => {
                  setFormMode("add");
                  setEditingLead(null);
                  setDefaultView("quick");
                  setFormDrawerOpen(true);
                }}
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Add a new lead"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            )}
          </>
        }
      />

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <FilterChips
          chips={filterChips}
          onRemove={handleRemoveFilterChip}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Advanced Filter Drawer */}
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
        presets={presets}
        onSavePreset={addPreset}
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

      {/* Bulk Actions Toolbar */}
      {selectedLeads.length > 0 && (can(LEADS_WRITE) || can(LEADS_DELETE)) && (
        <BulkActionsToolbar
          selectedCount={selectedLeads.length}
          totalCount={totalItems}
          onSelectAll={handleSelectAllLeads}
          onDeselectAll={handleDeselectAll}
          onDelete={can(LEADS_DELETE) ? () => setShowBulkDelete(true) : undefined}
          onExport={handleBulkExport}
          onUpdateStatus={can(LEADS_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined}
          isProcessing={isBulkProcessing}
        />
      )}

      {/* Stats Cards */}
      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={leads}
          columns={columns}
          selectedIds={selectedLeads}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No leads found"
          emptyDescription="Try adjusting your search or filters, or add a new lead"
          renderActions={(row: LeadViewModel) => (
            <ActionMenu
              items={getLeadActionMenuItems(row, leadActionHandlers, { isConverting: convertLead.isPending }).filter(
                (item) => {
                  if (item.label === "Delete") return can(LEADS_DELETE);
                  if (["Edit", "Edit Lead"].includes(item.label || "")) return can(LEADS_WRITE);
                  return true;
                }
              )}
            />
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/leads/${lead.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {lead.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {lead.fullName || `${lead.firstName} ${lead.lastName}`}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {lead.companyName || "No company"}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={getLeadActionMenuItems(lead, leadActionHandlers, { isConverting: convertLead.isPending }).filter(
                        (item) => {
                          if (item.label === "Delete") return can(LEADS_DELETE);
                          if (["Edit", "Edit Lead"].includes(item.label || "")) return can(LEADS_WRITE);
                          return true;
                        }
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(lead.status, 'lead')}`}>
                      {lead.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(lead.score)}`}>
                      Score: {lead.score ?? "N/A"}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{lead.phone || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <span className="text-sm font-medium text-foreground capitalize">
                      {lead.source?.replace(/_/g, ' ') || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {lead.created}</span>
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
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedLeads([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedLeads([]);
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
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This will permanently remove it from your CRM and cannot be undone."
        itemName={leadToDelete ? `${leadToDelete.firstName} ${leadToDelete.lastName}` : undefined}
        itemType="Lead"
        icon={Target}
        isDeleting={isDeleting}
      />

      {/* Unified Form Drawer */}
        <LeadFormDrawer
          isOpen={formDrawerOpen}
          onClose={() => {
            setFormDrawerOpen(false);
            setEditingLead(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingLead}
          mode={formMode}
          defaultView={defaultView}
        />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedLeads.length}
        itemName="lead"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<LeadStatus>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedLeads.length}
        title="Update Lead Status"
        field="Status"
        options={[
          { label: 'New', value: 'new' as LeadStatus },
          { label: 'Contacted', value: 'contacted' as LeadStatus },
          { label: 'Qualified', value: 'qualified' as LeadStatus },
          { label: 'Unqualified', value: 'unqualified' as LeadStatus },
        ]}
      />

      {/* Lead Conversion Modal */}
      {leadToConvert && (
        <LeadConversionModal
          isOpen={showConversionModal}
          onClose={() => {
            setShowConversionModal(false);
            setLeadToConvert(null);
          }}
          onConvert={handleConvertWithParams}
          lead={{
            id: leadToConvert.id,
            firstName: leadToConvert.firstName,
            lastName: leadToConvert.lastName,
            email: leadToConvert.email,
            phone: leadToConvert.phone,
            companyName: leadToConvert.companyName,
          }}
          isConverting={convertLead.isPending}
        />
      )}
    </div>
  );
}
