"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Calendar,
  ChevronDown,
  Check,
  TrendingUp,
  Target,
  Trophy,
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
import { DealV2FormDrawer } from "@/components/Forms/Sales";
import {
  useDealsV2,
  useCreateDealV2,
  useUpdateDealV2,
  useDeleteDealV2,
  useDealsV2Stats,
  useBulkDeleteDealsV2,
  useBulkUpdateDealsV2,
} from "@/lib/queries/useDealsV2";
import type { CreateDealV2Input, DealV2, DealV2Stats } from "@/lib/api/dealsV2";
import { dealsV2Api } from "@/lib/api/dealsV2";
import { toast } from "sonner";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import { getStatusColor, toSnakeCaseOperator } from "@/lib/utils";
import { getDealActionMenuItems } from "@/lib/utils/actionMenus";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { useUIStore } from "@/stores";
import { usePermission, DEALS_READ, DEALS_WRITE, DEALS_DELETE } from "@/lib/permissions";
import { usePipelinesV2, useDefaultPipelineV2 } from "@/lib/queries/usePipelinesV2";
import { KanbanBoard, type KanbanColumn, type KanbanDeal } from "@/components/KanbanBoard";

const DeleteConfirmationModal = dynamic(
  () => import("@/components/DeleteConfirmationModal"),
  { ssr: false }
);

const BulkDeleteModal = dynamic(
  () => import("@/components/BulkDeleteModal").then(mod => ({ default: mod.BulkDeleteModal })),
  { ssr: false }
);

import { BulkUpdateModal } from "@/components/BulkUpdateModal";

const STAGE_LABELS: Record<string, string> = {
  prospecting: "Prospecting",
  qualification: "Qualification",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const STAGE_COLORS: Record<string, string> = {
  prospecting: "bg-blue-500/10 text-blue-600",
  qualification: "bg-gray-500/10 text-gray-600",
  discovery: "bg-blue-500/10 text-blue-600",
  proposal: "bg-purple-500/10 text-purple-600",
  negotiation: "bg-amber-500/10 text-amber-600",
  closed_won: "bg-green-500/10 text-green-600",
  closed_lost: "bg-red-500/10 text-red-600",
};

function formatCurrency(value: string | number, currency = "USD") {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return `${currency} 0.00`;
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DealsV2Page() {
  const router = useRouter();

  const {
    viewMode, showStats, setViewMode, toggleStats,
    filters, setModuleFilters, clearModuleFilters,
    defaultItemsPerPage: defaultPerPage,
  } = useUIStore();
  const { can } = usePermission();

  const dealsV2Filters = (filters as Record<string, any>)['deals-v2'] || {};

  const [searchQuery, setSearchQuery] = useState(dealsV2Filters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(dealsV2Filters.status || null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { presets, addPreset, deletePreset } = useFilterPresets('deals-v2');

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Kanban state
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const { data: defaultPipeline } = useDefaultPipelineV2();
  const { data: pipelinesData } = usePipelinesV2({ is_active: true });
  const pipelines = pipelinesData?.results || [];
  const activePipelineId = selectedPipelineId || defaultPipeline?.id || '';
  const activePipeline = pipelines.find(p => p.id === activePipelineId) || defaultPipeline;

  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter || undefined,
      stage: stageFilter || undefined,
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
  }, [currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, stageFilter, filterGroup]);

  const { data: dealsResponse, isLoading, isError } = useDealsV2(queryParams);
  const { data: statsData } = useDealsV2Stats() as { data: DealV2Stats | undefined };

  const { data: availableStages = [] } = useQuery({
    queryKey: ['dealsV2', 'sources'],
    queryFn: () => dealsV2Api.sources(),
    staleTime: 300000,
  });

  const createDeal = useCreateDealV2();
  const updateDeal = useUpdateDealV2();
  const deleteDeal = useDeleteDealV2();
  const bulkDeleteDeals = useBulkDeleteDealsV2();
  const bulkUpdateDeals = useBulkUpdateDealsV2();

  const deals = dealsResponse?.results || [];
  const totalItems = dealsResponse?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Kanban: fetch all deals for the active pipeline (when in kanban mode)
  const { data: kanbanDealsResponse, isLoading: isKanbanLoading } = useDealsV2(
    { pipeline_id: activePipelineId, page_size: 200, status: 'open' },
    { enabled: viewMode === 'kanban' && !!activePipelineId }
  );

  const kanbanColumns = useMemo<KanbanColumn[]>(() => {
    if (!activePipeline?.stages || !kanbanDealsResponse?.results) return [];
    const kanbanDeals = kanbanDealsResponse.results;

    return activePipeline.stages
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(stage => {
        const stageDeals: KanbanDeal[] = kanbanDeals
          .filter(d => d.stage === stage.id || d.stage === stage.name)
          .map(d => ({
            id: d.id,
            name: d.display_name || d.entity_data?.name || 'Untitled',
            value: parseFloat(String(d.value)) || 0,
            currency: d.currency || activePipeline.currency || 'USD',
            companyName: d.display_company,
            contactName: d.display_contact,
            expectedCloseDate: d.expected_close_date ?? undefined,
            stageId: stage.id,
          }));
        return {
          stage: {
            id: stage.id,
            name: stage.name,
            probability: stage.probability,
            order: stage.order,
            isWon: stage.is_won,
            isLost: stage.is_lost,
            color: stage.color,
          },
          deals: stageDeals,
          totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
        };
      });
  }, [activePipeline, kanbanDealsResponse]);

  const handleKanbanDealMove = async (dealId: string, newStageId: string) => {
    if (!can(DEALS_WRITE)) return;
    try {
      await updateDeal.mutateAsync({ id: dealId, data: { stage: newStageId } });
      toast.success("Deal moved");
    } catch {
      toast.error("Failed to move deal");
    }
  };

  const handleKanbanDealClick = (deal: KanbanDeal) => {
    router.push(`/sales-v2/deals/${deal.id}`);
  };

  useEffect(() => {
    (setModuleFilters as (module: string, filters: any) => void)('deals-v2', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, stageFilter, filterGroup]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealV2 | null>(null);
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
        description: "New deal",
        action: () => {
          if (!can(DEALS_WRITE)) return;
          setEditingDeal(null);
          setFormMode("add");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  const memoizedDeals = useMemo(() => deals, [deals]);

  const transformedDeals = useMemo(() =>
    memoizedDeals.map(deal => ({
      id: deal.id,
      name: deal.display_name || deal.entity_data.name || 'Unnamed Deal',
      value: deal.value,
      currency: deal.currency || 'USD',
      formattedValue: formatCurrency(deal.value, deal.currency || 'USD'),
      stage: deal.stage,
      stageLabel: STAGE_LABELS[deal.stage] || deal.stage,
      status: deal.status,
      probability: deal.probability,
      pipeline: deal.display_pipeline || '',
      contact: deal.display_contact || deal.entity_data.contact || '',
      company: deal.display_company || deal.entity_data.company || '',
      expectedClose: deal.expected_close_date
        ? new Date(deal.expected_close_date).toLocaleDateString()
        : '',
      created: new Date(deal.created_at).toLocaleDateString(),
      initials: (deal.entity_data.name || 'D')[0]?.toUpperCase() || 'D',
    })),
    [memoizedDeals]
  );

  const filterOptions = useMemo(() => {
    const byStatus = statsData?.by_status || {};
    const total = statsData?.total || totalItems;
    return [
      { label: "All Deals", value: null, count: total },
      { label: "Open", value: "open", count: byStatus.open || 0 },
      { label: "Won", value: "won", count: byStatus.won || 0 },
      { label: "Lost", value: "lost", count: byStatus.lost || 0 },
      { label: "Abandoned", value: "abandoned", count: byStatus.abandoned || 0 },
    ];
  }, [statsData, totalItems]);

  const stats = useMemo(() => {
    if (statsData) {
      return [
        { label: "Total Deals", value: statsData.total, icon: DollarSign, iconBgColor: "bg-primary/10", iconColor: "text-primary" },
        { label: "Pipeline Value", value: formatCurrency(statsData.pipeline_value || '0'), icon: TrendingUp, iconBgColor: "bg-green-500/10", iconColor: "text-green-500" },
        { label: "Won Value", value: formatCurrency(statsData.won_value || '0'), icon: Trophy, iconBgColor: "bg-purple-500/10", iconColor: "text-purple-500" },
        { label: "Open Deals", value: statsData.by_status?.open || 0, icon: Target, iconBgColor: "bg-blue-500/10", iconColor: "text-blue-500" },
      ];
    }

    return [
      { label: "Total Deals", value: totalItems, icon: DollarSign, iconBgColor: "bg-primary/10", iconColor: "text-primary" },
      { label: "Open", value: memoizedDeals.filter(d => d.status === 'open').length, icon: TrendingUp, iconBgColor: "bg-green-500/10", iconColor: "text-green-500" },
      { label: "Won", value: memoizedDeals.filter(d => d.status === 'won').length, icon: Trophy, iconBgColor: "bg-purple-500/10", iconColor: "text-purple-500" },
      { label: "Lost", value: memoizedDeals.filter(d => d.status === 'lost').length, icon: Target, iconBgColor: "bg-blue-500/10", iconColor: "text-blue-500" },
    ];
  }, [statsData, memoizedDeals, totalItems]);

  const exportParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (debouncedSearchQuery) p.search = debouncedSearchQuery;
    if (statusFilter) p.status = statusFilter;
    if (stageFilter) p.stage = stageFilter;
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
  }, [debouncedSearchQuery, statusFilter, stageFilter, filterGroup]);

  const handleSelectAll = () => {
    if (selectedDeals.length === transformedDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(transformedDeals.map((d) => d.id));
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

  const handleDeleteClick = (deal: { id: string; name: string }) => {
    setDealToDelete(deal);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dealToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteDeal.mutateAsync(dealToDelete.id);
      toast.success("Deal deleted successfully");
      setIsDeleteModalOpen(false);
      setDealToDelete(null);
    } catch {
      toast.error("Failed to delete deal");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDealToDelete(null);
  };

  const handleSelectAllDeals = () => {
    setSelectedDeals(transformedDeals.map(d => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedDeals([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDeleteDeals.mutateAsync(selectedDeals);
      setSelectedDeals([]);
      setShowBulkDelete(false);
    } catch {
      // Error handled by mutation
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
      await dealsV2Api.export({ ids: selectedDeals });
      toast.success(`Exported ${selectedDeals.length} deals`);
    } catch {
      toast.error("Failed to export deals");
    }
  };

  const handleBulkUpdateStatus = async (newStatus: "open" | "won" | "lost" | "abandoned") => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdateDeals.mutateAsync({ ids: selectedDeals, data: { status: newStatus } });
      setSelectedDeals([]);
      setShowBulkUpdateStatus(false);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleEditDeal = useCallback((deal: { id: string }) => {
    setFormMode("edit");
    const fullDeal = deals.find(d => d.id === deal.id);
    if (fullDeal) {
      setEditingDeal({
        ...fullDeal,
        status: fullDeal.status as DealV2['status'],
        stage: fullDeal.stage as DealV2['stage'],
      });
      setFormDrawerOpen(true);
    }
  }, [deals]);

  const handleFormSubmit = async (data: CreateDealV2Input) => {
    try {
      if (formMode === "add" && data.entity_data?.name) {
        try {
          const duplicateCheck = await dealsV2Api.checkDuplicate(data.entity_data.name);
          if (duplicateCheck.has_duplicates) {
            toast.warning(
              `Found ${duplicateCheck.count} existing deal(s) with this name. Creating anyway.`,
              { duration: 5000 }
            );
          }
        } catch {
          // Duplicate check fail - continue silently
        }
      }

      const submitData = {
        ...data,
        value: data.value !== undefined ? String(data.value) : undefined,
      };

      if (formMode === "edit" && editingDeal?.id) {
        await updateDeal.mutateAsync({ id: editingDeal.id, data: submitData as Partial<DealV2> });
      } else {
        await createDeal.mutateAsync(submitData as Partial<DealV2>);
      }

      setFormDrawerOpen(false);
      setEditingDeal(null);
    } catch (error) {
      throw error;
    }
  };

  const dealActionHandlers = useMemo(() => ({
    onView: (id: string) => router.push(`/sales-v2/deals/${id}`),
    onEdit: (deal: { id: string }) => {
      handleEditDeal(deal);
    },
    onSendEmail: (email: string) => { if (email) window.location.href = `mailto:${email}`; },
    onDelete: handleDeleteClick,
  }), [router, handleEditDeal]);

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (statusFilter) {
      chips.push({ id: 'status-filter', label: 'Status', value: statusFilter, color: 'primary' });
    }
    if (stageFilter) {
      chips.push({ id: 'stage-filter', label: 'Stage', value: STAGE_LABELS[stageFilter] || stageFilter, color: 'secondary' });
    }
    return chips;
  }, [statusFilter, stageFilter]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === 'status-filter') setStatusFilter(null);
    else if (chipId === 'stage-filter') setStageFilter(null);
  };

  const handleClearAllFilters = () => {
    setStatusFilter(null);
    setStageFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    (clearModuleFilters as (module: string) => void)('deals-v2');
  };

  const filterFields: FilterField[] = useMemo(() => [
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
      key: 'stage',
      label: 'Stage',
      type: 'select',
      options: Object.entries(STAGE_LABELS).map(([value, label]) => ({ label, value })),
    },
    { key: 'name', label: 'Deal Name', type: 'text', placeholder: 'Enter deal name...' },
    { key: 'value', label: 'Deal Value', type: 'text', placeholder: 'Enter value...' },
    { key: 'expected_close_date', label: 'Expected Close', type: 'text', placeholder: 'YYYY-MM-DD' },
  ], []);

  const columns = useMemo(() => [
    {
      key: "name",
      label: "Deal",
      render: (_: unknown, row: typeof transformedDeals[0]) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales-v2/deals/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.formattedValue}</div>
          </div>
        </div>
      ),
    },
    {
      key: "stageLabel",
      label: "Stage",
      render: (_: unknown, row: typeof transformedDeals[0]) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[row.stage] || 'bg-muted text-muted-foreground'}`}>
          {row.stageLabel}
        </span>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value || '-'}</span>
      ),
    },
    {
      key: "company",
      label: "Company",
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value || '-'}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(value, 'deal')}`}>
          {value}
        </span>
      ),
    },
    {
      key: "formattedValue",
      label: "Value",
      render: (value: string) => (
        <span className="text-sm font-semibold text-foreground">{value}</span>
      ),
    },
    {
      key: "probability",
      label: "Probability",
      render: (value: number | null | undefined) => (
        <span className="text-sm text-foreground">
          {value != null ? `${value}%` : "N/A"}
        </span>
      ),
    },
    {
      key: "expectedClose",
      label: "Expected Close",
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {value ? (
            <>
              <Calendar className="h-4 w-4" />
              {value}
            </>
          ) : (
            "N/A"
          )}
        </div>
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
        title="Deals"
        icon={DollarSign}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} deals in pipeline`}
        searchPlaceholder="Search deals by name..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toggleStats()} title={showStats ? "Hide Statistics" : "Show Statistics"}>
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} showKanban={true} />

            <div className="relative" ref={filterDropdownRef}>
              <Button variant="outline" size="sm" onClick={() => setShowFilterDropdown(!showFilterDropdown)} title="Filter deals by status">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All Deals"}
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

            {can(DEALS_WRITE) && (
              <Button variant="outline" size="sm" title="Import deals from CSV or Excel">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {can(DEALS_READ) && (
              <ExportButton
                exportUrl="/crm/api/v2/deals/export/"
                exportParams={exportParams}
                filename="deals"
                totalRecords={totalItems}
              />
            )}
            {can(DEALS_WRITE) && (
              <Button
                onClick={() => { setFormMode("add"); setEditingDeal(null); setFormDrawerOpen(true); }}
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Add a new deal"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
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

      {selectedDeals.length > 0 && (can(DEALS_WRITE) || can(DEALS_DELETE)) && (
        <BulkActionsToolbar
          selectedCount={selectedDeals.length}
          totalCount={totalItems}
          onSelectAll={handleSelectAllDeals}
          onDeselectAll={handleDeselectAll}
          onDelete={can(DEALS_DELETE) ? () => setShowBulkDelete(true) : undefined}
          onExport={handleBulkExport}
          onUpdateStatus={can(DEALS_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined}
          isProcessing={isBulkProcessing}
        />
      )}

      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {/* Pipeline Switcher - Only show in Kanban view */}
      {viewMode === "kanban" && pipelines.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Pipeline:</span>
          <div className="relative">
            <select
              value={activePipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-sm font-medium cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <span className="text-xs text-muted-foreground">
            {activePipeline?.stages?.length || 0} stages
          </span>
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Failed to load deals</p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">Please try again or contact support if the issue persists.</p>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <DataTable
          data={transformedDeals}
          columns={columns}
          selectedIds={selectedDeals}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={can(DEALS_DELETE) || can(DEALS_WRITE)}
          loading={isLoading}
          emptyMessage="No deals found"
          emptyDescription="Try adjusting your search or filters, or add a new deal"
          renderActions={(row: typeof transformedDeals[0]) => (
            <ActionMenu
              items={getDealActionMenuItems(row, dealActionHandlers).filter(
                (item) => {
                  if (item.label === "Delete") return can(DEALS_DELETE);
                  if (["Edit", "Edit Deal"].includes(item.label || "")) return can(DEALS_WRITE);
                  return true;
                }
              )}
            />
          )}
        />
      ) : viewMode === "kanban" ? (
        activePipeline && kanbanColumns.length > 0 ? (
          <KanbanBoard
            columns={kanbanColumns}
            onDealMove={handleKanbanDealMove}
            onDealClick={handleKanbanDealClick}
            isLoading={isKanbanLoading}
            currency={activePipeline.currency}
          />
        ) : isKanbanLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            No pipeline configured. Create a pipeline to use Kanban view.
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformedDeals.map((deal, index) => (
            <motion.div key={deal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales-v2/deals/${deal.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {deal.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{deal.name}</h3>
                      <p className="text-sm font-medium text-muted-foreground">{deal.formattedValue}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={getDealActionMenuItems(deal, dealActionHandlers).filter(
                        (item) => {
                          if (item.label === "Delete") return can(DEALS_DELETE);
                          if (["Edit", "Edit Deal"].includes(item.label || "")) return can(DEALS_WRITE);
                          return true;
                        }
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(deal.status, 'deal')}`}>
                      {deal.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage] || 'bg-muted text-muted-foreground'}`}>
                      {deal.stageLabel}
                    </span>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border">
                    {deal.probability != null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Probability</span>
                        <span className="font-medium">{deal.probability}%</span>
                      </div>
                    )}
                    {deal.expectedClose && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Close: {deal.expectedClose}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {deal.created}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode !== "kanban" && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => { setCurrentPage(page); setSelectedDeals([]); }}
          onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); setSelectedDeals([]); }}
          filterInfo={statusFilter ? `filtered by ${statusFilter}` : undefined}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Deal"
        description="Are you sure you want to delete this deal? This will permanently remove it from your CRM and cannot be undone."
        itemName={dealToDelete?.name}
        itemType="Deal"
        icon={DollarSign}
        isDeleting={isDeleting}
      />

      <DealV2FormDrawer
        isOpen={formDrawerOpen}
        onClose={() => { setFormDrawerOpen(false); setEditingDeal(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingDeal}
        mode={formMode}
      />

      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedDeals.length}
        itemName="deal"
      />

      <BulkUpdateModal<"open" | "won" | "lost" | "abandoned">
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedDeals.length}
        title="Update Deal Status"
        field="Status"
        options={[
          { label: 'Open', value: 'open' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' },
          { label: 'Abandoned', value: 'abandoned' },
        ]}
      />
    </div>
  );
}
