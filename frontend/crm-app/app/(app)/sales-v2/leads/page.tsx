"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Mail,
  Phone,
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
import { LeadV2FormDrawer } from "@/components/Forms/Sales";
import { useLeadsV2, useCreateLeadV2, useUpdateLeadV2, useDeleteLeadV2 } from "@/lib/queries/useLeadsV2";
import type { CreateLeadV2Input, LeadV2 } from "@/lib/api/leadsV2";
import { toast } from "sonner";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import { getStatusColor } from "@/lib/utils";
import { getLeadActionMenuItems } from "@/lib/utils/actionMenus";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { useUIStore } from "@/stores";
import { usePermission, LEADS_READ, LEADS_WRITE, LEADS_DELETE } from "@/lib/permissions";
import { TokenManager } from "@/lib/api/client";

// Lazy load heavy components
const DeleteConfirmationModal = dynamic(
  () => import("@/components/DeleteConfirmationModal"),
  { ssr: false }
);

const BulkDeleteModal = dynamic(
  () => import("@/components/BulkDeleteModal").then(mod => ({ default: mod.BulkDeleteModal })),
  { ssr: false }
);

export default function LeadsV2Page() {
  const router = useRouter();
  
  // Zustand (UI state) - Reusing V1 store
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
  
  // Initialize filters from store (type assertion for dynamic key)
  const leadsV2Filters = (filters as Record<string, any>)['leads-v2'] || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(leadsV2Filters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(leadsV2Filters.status || null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Debounce search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Advanced Filter state
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { presets, addPreset, deletePreset } = useFilterPresets('leads-v2');

  // Filter dropdown ref for click outside
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // API queries
  const { data: leadsResponse, isLoading } = useLeadsV2({
    search: debouncedSearchQuery,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
    page: currentPage,
    page_size: itemsPerPage,
  });
  
  const createLead = useCreateLeadV2();
  const updateLead = useUpdateLeadV2();
  const deleteLead = useDeleteLeadV2();
  
  const leads = leadsResponse?.results || [];
  const totalItems = leadsResponse?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Save filters to store when they change (type assertion for dynamic key)
  useEffect(() => {
    (setModuleFilters as (module: string, filters: any) => void)('leads-v2', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, sourceFilter, filterGroup]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<{ id: string; firstName: string; lastName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form modal states
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadV2 | null>(null);
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
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  // Memoize leads to prevent re-renders
  const memoizedLeads = useMemo(() => leads, [leads]);

  // Transform V2 data to V1 format for DataTable component
  const transformedLeads = useMemo(() => 
    memoizedLeads.map(lead => ({
      id: lead.id,
      firstName: lead.entity_data.first_name || '',
      lastName: lead.entity_data.last_name || '',
      fullName: lead.display_name || `${lead.entity_data.first_name || ''} ${lead.entity_data.last_name || ''}`.trim() || lead.entity_data.email || 'No name',
      email: lead.entity_data.email || '',
      phone: lead.entity_data.phone || '',
      mobile: lead.entity_data.mobile || '',
      companyName: lead.entity_data.company_name || 'No company',
      title: lead.entity_data.title || '',
      website: lead.entity_data.website || '',
      status: lead.status,
      source: lead.source || '',
      score: lead.entity_data.lead_score || undefined,
      created: new Date(lead.created_at).toLocaleDateString(),
      initials: `${lead.entity_data.first_name?.[0] || ''}${lead.entity_data.last_name?.[0] || 'L'}`.toUpperCase(),
      tags: [], // V2 doesn't have tags yet, but structure is compatible
    })),
    [memoizedLeads]
  );

  // Filter options with counts
  const filterOptions = useMemo(() => [
    {
      label: "All Leads",
      value: null,
      count: totalItems,
    },
    {
      label: "New",
      value: "new",
      count: memoizedLeads.filter(l => l.status === 'new').length,
    },
    {
      label: "Contacted",
      value: "contacted",
      count: memoizedLeads.filter(l => l.status === 'contacted').length,
    },
    {
      label: "Qualified",
      value: "qualified",
      count: memoizedLeads.filter(l => l.status === 'qualified').length,
    },
    {
      label: "Unqualified",
      value: "unqualified",
      count: memoizedLeads.filter(l => l.status === 'unqualified').length,
    },
    {
      label: "Converted",
      value: "converted",
      count: memoizedLeads.filter(l => l.status === 'converted').length,
    },
  ], [memoizedLeads, totalItems]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalLeads = totalItems;
    const newLeads = memoizedLeads.filter(l => l.status === 'new').length;
    const qualified = memoizedLeads.filter(l => l.status === 'qualified').length;
    const contacted = memoizedLeads.filter(l => l.status === 'contacted').length;

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
  }, [memoizedLeads, totalItems]);

  // Export params
  const exportParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (debouncedSearchQuery) p.search = debouncedSearchQuery;
    if (statusFilter) p.status = statusFilter;
    if (sourceFilter) p.source = sourceFilter;
    return p;
  }, [debouncedSearchQuery, statusFilter, sourceFilter]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedLeads.length === transformedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(transformedLeads.map((l) => l.id));
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
  const handleDeleteClick = (lead: { id: string; firstName: string; lastName: string }) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete?.id) return;
    
    setIsDeleting(true);
    
    try {
      await deleteLead.mutateAsync(leadToDelete.id);
      toast.success("Lead deleted successfully");
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    } catch {
      // Error logged for debugging
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setLeadToDelete(null);
  };

  // Bulk operation handlers
  const handleSelectAllLeads = () => {
    setSelectedLeads(transformedLeads.map(l => l.id));
  };

  const handleDeselectAll = () => {
    setSelectedLeads([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      // Delete each lead individually (V2 API might not have bulk delete yet)
      await Promise.all(selectedLeads.map(id => deleteLead.mutateAsync(id)));
      toast.success(`${selectedLeads.length} leads deleted successfully`);
      setSelectedLeads([]);
      setShowBulkDelete(false);
    } catch {
      // Error logged for debugging
      toast.error("Failed to delete some leads");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedLeads.length === 0) {
      toast.error("No leads selected for export");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const params = new URLSearchParams({
        ids: selectedLeads.join(","),
      });
      const resp = await fetch(`${baseUrl}/crm/api/v2/leads/export?${params}`, {
        headers: {
          ...(TokenManager.getAccessToken() ? { Authorization: `Bearer ${TokenManager.getAccessToken()}` } : {}),
        },
      });

      if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selected-leads-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedLeads.length} leads`);
    } catch {
      // Error logged for debugging
      toast.error("Failed to export leads");
    }
  };

  const handleEditLead = useCallback((lead: { id: string }) => {
    setFormMode("edit");
    
    // Fetch full lead details - find in original leads array
    const fullLead = leads.find(l => l.id === lead.id);
    if (fullLead) {
      // Cast to LeadV2 type by ensuring status is the correct literal type
      setEditingLead({
        ...fullLead,
        status: fullLead.status as "new" | "contacted" | "qualified" | "unqualified" | "converted"
      });
      setFormDrawerOpen(true);
    }
  }, [leads]);

  // Handle form submission
  const handleFormSubmit = async (data: CreateLeadV2Input) => {
    try {
      if (formMode === "edit" && editingLead?.id) {
        await updateLead.mutateAsync({ id: editingLead.id, data });
        toast.success("Lead updated successfully");
      } else {
        await createLead.mutateAsync(data);
        toast.success("Lead created successfully");
      }
      
      setFormDrawerOpen(false);
      setEditingLead(null);
    } catch (error) {
      throw error;
    }
  };

  // Lead action menu handlers
  const leadActionHandlers = useMemo(() => ({
    onView: (id: string) => router.push(`/sales-v2/leads/${id}`),
    onEdit: (lead: { id: string }) => {
      handleEditLead(lead);
    },
    onSendEmail: (email: string) => { if (email) window.location.href = `mailto:${email}`; },
    onCall: (phone: string) => { if (phone) window.location.href = `tel:${phone}`; },
    onConvert: () => {
      toast.info("Lead conversion feature coming soon");
    },
    onDelete: handleDeleteClick,
  }), [router, handleEditLead]);

  // Get score color based on value
  const getScoreColor = (score: number | undefined) => {
    if (!score) return "bg-muted text-muted-foreground";
    if (score >= 80) return "bg-destructive/10 text-destructive";
    if (score >= 50) return "bg-accent/10 text-accent";
    return "bg-muted text-muted-foreground";
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
    
    if (sourceFilter) {
      chips.push({
        id: 'source-filter',
        label: 'Source',
        value: sourceFilter,
        color: 'secondary',
      });
    }
    
    return chips;
  }, [statusFilter, sourceFilter]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === 'status-filter') {
      setStatusFilter(null);
    } else if (chipId === 'source-filter') {
      setSourceFilter(null);
    }
  };

  const handleClearAllFilters = () => {
    setStatusFilter(null);
    setSourceFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    (clearModuleFilters as (module: string) => void)('leads-v2');
  };

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
        { label: 'Cold Call', value: 'cold_call' },
        { label: 'Social Media', value: 'social_media' },
        { label: 'Advertisement', value: 'advertisement' },
        { label: 'Other', value: 'other' },
      ],
    },
  ], []);

  // Table columns - Using V1 pattern
  const columns = useMemo(() => [
    {
      key: "firstName",
      label: "Name",
      render: (_: unknown, row: typeof transformedLeads[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales-v2/leads/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">
              {row.fullName}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {row.companyName}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (_: unknown, row: typeof transformedLeads[0]) => (
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
      {/* Header - Using V1 PageHeader with built-in search */}
      <PageHeader
        title="Leads (V2 Dynamic Forms)"
        icon={Target}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} leads in pipeline - Pure Dynamic System`}
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
                exportUrl="/crm/api/v2/leads/export"
                exportParams={exportParams}
                filename="leads-v2"
                totalRecords={totalItems}
              />
            )}
            {can(LEADS_WRITE) && (
              <Button 
                onClick={() => {
                  setFormMode("add");
                  setEditingLead(null);
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
          data={transformedLeads}
          columns={columns}
          selectedIds={selectedLeads}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={can(LEADS_DELETE) || can(LEADS_WRITE)}
          loading={isLoading}
          emptyMessage="No leads found"
          emptyDescription="Try adjusting your search or filters, or add a new lead"
          renderActions={(row: typeof transformedLeads[0]) => (
            <ActionMenu
              items={getLeadActionMenuItems(row, leadActionHandlers, {}).filter(
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
          {transformedLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales-v2/leads/${lead.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {lead.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {lead.fullName}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {lead.companyName}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={getLeadActionMenuItems(lead, leadActionHandlers, {}).filter(
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

      {/* Pagination - Using V1 DataPagination */}
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
      <LeadV2FormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingLead(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingLead}
        mode={formMode}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedLeads.length}
        itemName="lead"
      />
    </div>
  );
}
