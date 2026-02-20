"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DollarSign,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  TrendingUp,
  Target,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { DealFormDrawer, type Deal as DealType } from "@/components/Forms/Sales";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { getDealActionMenuItems } from "@/lib/utils/actionMenus";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useDeals, 
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal, 
  useBulkDeleteDeals,
  useMoveStage,
  DealViewModel,
  DealQueryParams,
} from "@/lib/queries/useDeals";
import { dealsApi } from "@/lib/api/deals";
import { usePipelines, usePipelineKanban, useDefaultPipeline } from "@/lib/queries/usePipelines";
import { useUIStore } from "@/stores";
import { usePermission, DEALS_WRITE, DEALS_DELETE } from "@/lib/permissions";
import { TokenManager } from "@/lib/api/client";
import { KanbanBoard, type KanbanDeal } from "@/components/KanbanBoard";

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

export default function DealsPage() {
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
  const dealsFilters = (filters.deals || {}) as { search?: string; stage?: string; status?: string };
  
  // State management
  const [searchQuery, setSearchQuery] = useState(dealsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(dealsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStage, setShowBulkUpdateStage] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Advanced filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  
  // Filter presets
  const {
    presets: filterPresets,
    addPreset,
    deletePreset,
  } = useFilterPresets("deals");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Build query params for API
  const queryParams: DealQueryParams = useMemo(() => ({
    page: currentPage,
    page_size: itemsPerPage,
    search: debouncedSearchQuery || undefined,
    status: statusFilter || undefined,
    filters: filterGroup && filterGroup.conditions.length > 0 ? {
      logic: filterGroup.logic.toLowerCase() as 'and' | 'or',
      conditions: filterGroup.conditions.map(c => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
    } : undefined,
  }), [currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, filterGroup]);

  const exportParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (debouncedSearchQuery) p.search = debouncedSearchQuery;
    if (statusFilter) p.status = statusFilter;
    if (filterGroup && filterGroup.conditions.length > 0) {
      p.filters = JSON.stringify({
        logic: filterGroup.logic.toLowerCase(),
        conditions: filterGroup.conditions.map(c => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
        })),
      });
    }
    return p;
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  // React Query - Server-side data
  const { data: dealsResponse, isLoading, isError, error } = useDeals(queryParams);
  const deals = dealsResponse?.data || [];
  const totalDeals = dealsResponse?.meta?.total || 0;
  const totalPages = Math.ceil(totalDeals / itemsPerPage);
  
  // Pipeline data
  const { data: pipelines, isLoading: isPipelinesLoading } = usePipelines();
  const { data: defaultPipeline } = useDefaultPipeline();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  
  // Set default pipeline when loaded
  useEffect(() => {
    if (defaultPipeline?.id && !selectedPipelineId) {
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [defaultPipeline?.id, selectedPipelineId]);
  
  const pipelineId = selectedPipelineId || defaultPipeline?.id || '';
  const { data: kanbanData, isLoading: isKanbanLoading } = usePipelineKanban(pipelineId);
  
  // Mutations
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const bulkDelete = useBulkDeleteDeals();
  const moveStage = useMoveStage();
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('deals', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, filterGroup]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<DealViewModel | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealViewModel | null>(null);
  const [editingDealForm, setEditingDealForm] = useState<Partial<DealType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Get stages from pipeline for filter options
  const pipelineStages = defaultPipeline?.stages || [];

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'name',
      label: 'Deal Name',
      type: 'text',
    },
    {
      key: 'companyName',
      label: 'Company',
      type: 'text',
    },
    {
      key: 'stage_id',
      label: 'Stage',
      type: 'select',
      options: pipelineStages.map(s => ({ label: s.name, value: s.id })),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Abandoned', value: 'abandoned' },
      ],
    },
    {
      key: 'contactName',
      label: 'Contact',
      type: 'text',
    },
    {
      key: 'value',
      label: 'Deal Value',
      type: 'number',
    },
    {
      key: 'probability',
      label: 'Probability',
      type: 'number',
    },
    {
      key: 'expectedCloseDate',
      label: 'Expected Close Date',
      type: 'date',
    },
  ], [pipelineStages]);

  // Stats from API response (includes all deals, not just current page)
  const apiStats = dealsResponse?.meta?.stats;
  
  // Stats calculations using API stats
  const stats = useMemo(() => {
    const openValue = apiStats?.openValue ?? 0;
    const wonValue = apiStats?.wonValue ?? 0;
    const avgDealSize = apiStats?.avgDealSize ?? 0;
    const totalCount = apiStats?.total ?? totalDeals;
    const openCount = apiStats?.byStatus?.['open'] ?? 0;
    const wonCount = apiStats?.byStatus?.['won'] ?? 0;

    return [
      {
        label: "Total Pipeline",
        value: `$${(openValue / 1000).toFixed(0)}K`,
        icon: TrendingUp,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 15, isPositive: true },
        description: `${openCount} active deals`,
      },
      {
        label: "Won Revenue",
        value: `$${(wonValue / 1000).toFixed(0)}K`,
        icon: CheckCircle2,
        iconBgColor: "bg-green-500/10",
        iconColor: "text-green-500",
        trend: { value: 12, isPositive: true },
        description: `${wonCount} deals closed`,
      },
      {
        label: "Avg Deal Size",
        value: `$${(avgDealSize / 1000).toFixed(0)}K`,
        icon: Target,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Total Deals",
        value: totalCount,
        icon: DollarSign,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
    ];
  }, [apiStats, totalDeals]);

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

  // Status filter options with counts from API
  const statusFilterOptions = useMemo(() => [
    { label: "All Status", value: null, count: apiStats?.total ?? 0 },
    { label: "Open", value: "open", count: apiStats?.byStatus?.['open'] ?? 0 },
    { label: "Won", value: "won", count: apiStats?.byStatus?.['won'] ?? 0 },
    { label: "Lost", value: "lost", count: apiStats?.byStatus?.['lost'] ?? 0 },
    { label: "Abandoned", value: "abandoned", count: apiStats?.byStatus?.['abandoned'] ?? 0 },
  ], [apiStats]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedDeals.length === deals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(deals.map((d) => d.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedDeals.includes(strId)) {
      setSelectedDeals(selectedDeals.filter((dId) => dId !== strId));
    } else {
      setSelectedDeals([...selectedDeals, strId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (deal: DealViewModel) => {
    setDealToDelete(deal);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dealToDelete?.id) return;
    
    try {
      await deleteDeal.mutateAsync(dealToDelete.id);
      setIsDeleteModalOpen(false);
      setDealToDelete(null);
    } catch (error) {
      console.error("Error deleting deal:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDealToDelete(null);
  };

  // Form handlers
  const handleAddDeal = () => {
    setFormMode("add");
    setEditingDeal(null);
    setEditingDealForm(null);
    setFormDrawerOpen(true);
  };

  const handleEditDeal = useCallback(async (deal: DealViewModel) => {
    setFormMode("edit");
    
    try {
      // Fetch full deal details to ensure all fields including custom_fields are available
      const fullDeal = await dealsApi.getById(deal.id);
      
      // Store original deal for accessing IDs during submit
      setEditingDeal(fullDeal);
      
      // Convert DealViewModel to form data format for the form
      const formData: Partial<DealType> = {
        name: fullDeal.name,
        pipelineId: fullDeal.pipelineId || pipelineId,
        stageId: fullDeal.stageId,
        value: fullDeal.value,
        currency: fullDeal.currency,
        probability: fullDeal.probability,
        expectedCloseDate: fullDeal.expectedCloseDate,
        contactId: fullDeal.contactId,
        companyId: fullDeal.companyId,
        ownerId: fullDeal.ownerId,
        description: fullDeal.description,
        tagIds: fullDeal.tagIds || [],
        // Custom fields - IMPORTANT for edit!
        customFields: fullDeal.customFields || {},
      };
      setEditingDealForm(formData);
    } catch (error) {
      console.error("Failed to fetch deal details:", error);
      // Fallback to minimal data from list
      setEditingDeal(deal);
      const formData: Partial<DealType> = {
        name: deal.name,
        pipelineId: deal.pipelineId || pipelineId,
        stageId: deal.stageId,
        value: deal.value,
        currency: deal.currency,
        tagIds: deal.tagIds || [],
      };
      setEditingDealForm(formData);
    }
    
    setFormDrawerOpen(true);
  }, [pipelineId]);

  const handleFormSubmit = async (data: Partial<DealType>) => {
    try {
      if (formMode === "add") {
        // Ensure required fields have defaults
        const dealData = {
          ...data,
          name: data.name || "",
          pipelineId: data.pipelineId || pipelineId,
          stageId: data.stageId || pipelineStages[0]?.id || "",
          value: data.value || 0,
          currency: data.currency || "INR",
        };
        await createDeal.mutateAsync(dealData);
      } else if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, data });
      }

      setFormDrawerOpen(false);
      setEditingDeal(null);
    } catch (error) {
      console.error("Error submitting deal:", error);
      throw error;
    }
  };

  // Deal action menu handlers
  const dealActionHandlers = useMemo(() => ({
    onView: (id: string) => router.push(`/sales/deals/${id}`),
    onEdit: handleEditDeal,
    onSendEmail: (email: string) => { if (email) window.location.href = `mailto:${email}`; },
    onDelete: handleDeleteClick,
  }), [router, handleEditDeal, handleDeleteClick]);

  const handleKanbanDealMove = async (dealId: string, newStageId: string) => {
    if (!can(DEALS_WRITE)) return;
    try {
      await moveStage.mutateAsync({ id: dealId, stageId: newStageId });
    } catch (error) {
      console.error("Error moving deal:", error);
    }
  };

  // Kanban deal click handler
  const handleKanbanDealClick = (deal: KanbanDeal) => {
    router.push(`/sales/deals/${deal.id}`);
  };

  // Bulk operation handlers
  const handleSelectAllDeals = () => {
    setSelectedDeals(deals.map(d => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedDeals([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedDeals);
      setSelectedDeals([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting deals:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStage = async (stageId: string) => {
    setIsBulkProcessing(true);
    try {
      // Move each deal to the new stage
      await Promise.all(
        selectedDeals.map(id => moveStage.mutateAsync({ id, stageId }))
      );
      setSelectedDeals([]);
      setShowBulkUpdateStage(false);
      toast.success(`${selectedDeals.length} deals moved successfully`);
    } catch (error) {
      console.error("Error bulk updating deals:", error);
      toast.error("Failed to update deals");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedDeals.length === 0) {
      toast.error("No deals selected for export");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const params = new URLSearchParams({
        ids: selectedDeals.join(","),
      });
      const resp = await fetch(`${baseUrl}/crm/api/v1/deals/export?${params}`, {
        headers: {
          ...(TokenManager.getAccessToken() ? { Authorization: `Bearer ${TokenManager.getAccessToken()}` } : {}),
        },
      });

      if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selected-deals-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedDeals.length} deals`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export deals");
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
        value: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
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
          color: 'warning',
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
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setStatusFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    setCurrentPage(1);
    clearModuleFilters('deals');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New deal",
        action: () => {
          setEditingDeal(null);
          setEditingDealForm(null);
          setFormMode("add");
          setDefaultView("quick");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  // Table columns - memoized to prevent unnecessary re-renders
  const columns = useMemo(() => [
    {
      key: "name",
      label: "Deal",
      render: (_value: unknown, row: DealViewModel) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/deals/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.companyName || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      key: "value",
      label: "Value",
      render: (value: number, row: DealViewModel) => (
        <div className="text-right">
          <div className="font-semibold text-foreground">
            {row.currency === 'USD' ? '$' : row.currency}{(value || 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            Weighted: {row.currency === 'USD' ? '$' : row.currency}{(row.weightedValue || 0).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: "stageName",
      label: "Stage",
      render: (value: string, row: DealViewModel) => (
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: row.stage?.color ? `${row.stage.color}20` : undefined,
            color: row.stage?.color || undefined,
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
          open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
          won: { bg: 'bg-green-100', text: 'text-green-700', label: 'Won' },
          lost: { bg: 'bg-red-100', text: 'text-red-700', label: 'Lost' },
          abandoned: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Abandoned' },
        };
        const config = statusConfig[value] || statusConfig.open;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: "contactName",
      label: "Contact",
      sortable: false,
      render: (value: string, row: DealViewModel) => (
        <div>
          <div className="text-sm text-foreground">{value || '-'}</div>
          {row.contactEmail && (
            <div className="text-xs text-muted-foreground max-w-[200px]">
              {row.contactEmail}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "probability",
      label: "Probability",
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden min-w-[60px]">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${value || 0}%` }}
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground w-10 text-right">
            {value || 0}%
          </span>
        </div>
      ),
    },
    {
      key: "expectedCloseDate",
      label: "Close Date",
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
        </span>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      render: (_value: unknown, row: DealViewModel) => {
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
      key: "createdAt",
      label: "Created",
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
        </span>
      ),
    },
  ], [router]); // Memoize columns with router dependency

  // Handle error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground">Error Loading Deals</h2>
        <p className="text-muted-foreground">
          {(error as Error)?.message || 'Failed to load deals. Please try again.'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Deals"
        icon={DollarSign}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalDeals} deals in pipeline`}
        searchPlaceholder="Search deals by name, company, or contact..."
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
            <ViewToggle 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              showLabels={false} 
              showKanban={true}
            />
            
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
                title="Filter deals by stage or status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? statusFilterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Deals"}
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
                    {statusFilterOptions.map((option) => (
                      <button
                        key={option.value || "all-status"}
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

            {can(DEALS_WRITE) && (
              <Button 
                variant="outline" 
                size="sm"
                title="Import deals from CSV or Excel"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {can(DEALS_WRITE) && (
              <ExportButton
                exportUrl="/crm/api/v1/deals/export"
                exportParams={exportParams}
                filename="deals"
                totalRecords={totalDeals}
              />
            )}
            {can(DEALS_WRITE) && (
              <Button 
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Add a new deal"
                onClick={handleAddDeal}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            )}
          </>
        }
      />

      {/* Pipeline Switcher - Only show in Kanban view */}
      {viewMode === "kanban" && pipelines && pipelines.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Pipeline:</span>
          <div className="relative">
            <select
              value={pipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-sm font-medium cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              disabled={isPipelinesLoading}
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <span className="text-xs text-muted-foreground">
            {kanbanData?.columns?.length || 0} stages
          </span>
        </div>
      )}

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
        {selectedDeals.length > 0 && (can(DEALS_WRITE) || can(DEALS_DELETE)) && (
          <BulkActionsToolbar
            selectedCount={selectedDeals.length}
            totalCount={totalDeals}
            onSelectAll={handleSelectAllDeals}
            onDeselectAll={handleDeselectAll}
            onDelete={can(DEALS_DELETE) ? () => setShowBulkDelete(true) : undefined}
            onExport={handleBulkExport}
            onUpdateStatus={can(DEALS_WRITE) ? () => setShowBulkUpdateStage(true) : undefined}
            statusLabel="Stage"
            isProcessing={isBulkProcessing}
          />
        )}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={deals}
          columns={columns}
          selectedIds={selectedDeals}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No deals found"
          emptyDescription="Try adjusting your search or filters, or add a new deal"
          renderActions={(row) => (
            <ActionMenu
              items={getDealActionMenuItems(row, dealActionHandlers).filter((item) => {
                if (item.label === "Delete") return can(DEALS_DELETE);
                if (["Edit", "Edit Deal"].includes(item.label || "")) return can(DEALS_WRITE);
                return true;
              })}
            />
          )}
        />
      ) : viewMode === "kanban" ? (
        /* Kanban View */
        kanbanData ? (
          <KanbanBoard
            columns={kanbanData.columns}
            onDealMove={handleKanbanDealMove}
            onDealClick={handleKanbanDealClick}
            isLoading={isKanbanLoading}
            currency={kanbanData.pipeline.currency}
          />
        ) : isKanbanLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            No pipeline configured. Create a pipeline to use Kanban view.
          </div>
        )
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/deals/${deal.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {deal.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {deal.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {deal.companyName || '-'}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={getDealActionMenuItems(deal, dealActionHandlers).filter((item) => {
                        if (item.label === "Delete") return can(DEALS_DELETE);
                        if (["Edit", "Edit Deal"].includes(item.label || "")) return can(DEALS_WRITE);
                        return true;
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-foreground">
                        {deal.currency === 'USD' ? '$' : deal.currency}{((deal.value || 0) / 1000).toFixed(0)}K
                      </span>
                      <div className="text-xs text-muted-foreground">
                        Weighted: {deal.currency === 'USD' ? '$' : deal.currency}{((deal.weightedValue || 0) / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: deal.stage?.color ? `${deal.stage.color}20` : 'var(--muted)',
                          color: deal.stage?.color || 'var(--muted-foreground)',
                        }}
                      >
                        {deal.stageName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        deal.status === 'won' ? 'bg-green-100 text-green-700' :
                        deal.status === 'lost' ? 'bg-red-100 text-red-700' :
                        deal.status === 'abandoned' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Probability</span>
                      <span className="font-semibold text-foreground">{deal.probability || 0}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${deal.probability || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="h-4 w-4" />
                    <span>Close: {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
                  </div>

                  {deal.contactName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{deal.contactName}</span>
                      {deal.contactEmail && (
                        <span className="text-xs text-muted-foreground truncate">({deal.contactEmail})</span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination (hidden in Kanban view) */}
      {viewMode !== "kanban" && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalDeals}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedDeals([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedDeals([]);
        }}
        filterInfo={
          statusFilter ? `filtered by ${statusFilter}` : undefined
        }
      />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Deal"
        description="Are you sure you want to delete this deal? This will permanently remove it from your CRM and cannot be undone."
        itemName={dealToDelete?.name}
        itemType="Deal"
        icon={DollarSign}
        isDeleting={deleteDeal.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedDeals.length}
        itemName="deal"
      />

      {/* Bulk Update Stage Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStage}
        onClose={() => setShowBulkUpdateStage(false)}
        onConfirm={handleBulkUpdateStage}
        itemCount={selectedDeals.length}
        title="Update Stage"
        field="stage"
        options={pipelineStages.map(stage => ({
          label: stage.name,
          value: stage.id,
        }))}
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

      {/* Deal Form Drawer */}
      <DealFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingDeal(null);
          setEditingDealForm(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDealForm}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
