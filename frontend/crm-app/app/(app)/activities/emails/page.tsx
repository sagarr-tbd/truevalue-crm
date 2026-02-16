"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Mail,
  Plus,
  Filter,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Clock,
  Flag,
  ChevronDown,
  Check,
  AlertCircle,
  Calendar,
  Send,
  Inbox,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import { EmailFormDrawer } from "@/components/Forms/Activities";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { toSnakeCaseOperator } from "@/lib/utils";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import {
  useEmails,
  useCreateEmail,
  useUpdateEmail,
  useDeleteEmail,
  useCompleteEmail,
  useBulkDeleteEmails,
  useBulkUpdateEmails,
  type EmailQueryParams,
  type EmailViewModel,
  type EmailFormData,
} from "@/lib/queries/useEmails";
import { emailsApi } from "@/lib/api/emails";
import { useContactOptions } from "@/lib/queries/useContacts";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useDealOptions } from "@/lib/queries/useDeals";
import { useLeadOptions } from "@/lib/queries/useLeads";
import { useUIStore } from "@/stores";
import type { Email } from "@/lib/types";

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

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DIRECTION_DISPLAY: Record<string, string> = {
  sent: "Sent",
  received: "Received",
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    completed: "bg-primary/10 text-primary",
    in_progress: "bg-accent/10 text-accent",
    pending: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};

const getDirectionIcon = (direction?: string) => {
  return direction === "received" ? Inbox : Send;
};

function formatDate(isoDate?: string): string {
  if (!isoDate) return "—";
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().split("T")[0];
  } catch {
    return iso.split("T")[0] || "";
  }
}

function toDateTimeLocalValue(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso.slice(0, 16) || "";
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function EmailsPage() {
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

  const emailsFilters = filters.emails || {};

  // State management
  const [searchQuery, setSearchQuery] = useState(emailsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(emailsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Debounce search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Advanced Filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const { presets, addPreset, deletePreset } = useFilterPresets("emails");

  // Entity options for advanced filters
  const { data: contactOptions = [] } = useContactOptions();
  const { data: companyOptions = [] } = useCompanyOptions();
  const { data: dealOptions = [] } = useDealOptions();
  const { data: leadOptions = [] } = useLeadOptions();

  // Build query params for server-side pagination
  const queryParams: EmailQueryParams = useMemo(() => {
    const params: EmailQueryParams = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter as EmailQueryParams['status'] || undefined,
    };

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

  // React Query (server data) - with pagination
  const { data: emailsResponse, isLoading } = useEmails(queryParams);
  const emails = useMemo(() => emailsResponse?.data ?? [], [emailsResponse?.data]);
  const totalItems = emailsResponse?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Stats from API response
  const apiStats = emailsResponse?.meta?.stats;

  const createEmail = useCreateEmail();
  const updateEmail = useUpdateEmail();
  const deleteEmail = useDeleteEmail();
  const completeEmail = useCompleteEmail();
  const bulkDelete = useBulkDeleteEmails();
  const bulkUpdate = useBulkUpdateEmails();

  // Save filters to store
  useEffect(() => {
    setModuleFilters('emails', {
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
  const [emailToDelete, setEmailToDelete] = useState<EmailViewModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<Partial<Email> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Filter dropdown ref
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Export columns
  const exportColumns: ExportColumn<EmailViewModel>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'description', label: 'Description' },
    { key: 'emailDirection', label: 'Direction', format: (v) => v ? DIRECTION_DISPLAY[String(v)] || String(v) : '' },
    { key: 'status', label: 'Status', format: (v) => v ? STATUS_DISPLAY[String(v)] || String(v) : '' },
    { key: 'dueDate', label: 'Date', format: (v) => v ? formatDate(String(v)) : '' },
    { key: 'relatedTo', label: 'Related To' },
    { key: 'createdAt', label: 'Created Date', format: (v) => v ? formatDate(String(v)) : '' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      key: 'subject',
      label: 'Subject',
      type: 'text',
      placeholder: 'Enter email subject...',
    },
    {
      key: 'email_direction',
      label: 'Direction',
      type: 'select',
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Received', value: 'received' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Urgent', value: 'urgent' },
        { label: 'High', value: 'high' },
        { label: 'Normal', value: 'normal' },
        { label: 'Low', value: 'low' },
      ],
    },
    {
      key: 'contactId',
      label: 'Contact',
      type: 'select',
      options: contactOptions,
    },
    {
      key: 'companyId',
      label: 'Company',
      type: 'select',
      options: companyOptions,
    },
    {
      key: 'dealId',
      label: 'Deal',
      type: 'select',
      options: dealOptions,
    },
    {
      key: 'leadId',
      label: 'Lead',
      type: 'select',
      options: leadOptions,
    },
  ], [contactOptions, companyOptions, dealOptions, leadOptions]);

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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New email",
        action: () => {
          setEditingEmail(null);
          setFormMode("add");
          setDefaultView("quick");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  // Filter options for quick dropdown
  const filterOptions = useMemo(() => [
    {
      label: "All Emails",
      value: null,
      count: apiStats?.total ?? totalItems,
    },
    {
      label: "Pending",
      value: "pending",
      count: apiStats?.byStatus?.['pending'] ?? 0,
    },
    {
      label: "In Progress",
      value: "in_progress",
      count: apiStats?.byStatus?.['in_progress'] ?? 0,
    },
    {
      label: "Completed",
      value: "completed",
      count: apiStats?.byStatus?.['completed'] ?? 0,
    },
    {
      label: "Cancelled",
      value: "cancelled",
      count: apiStats?.byStatus?.['cancelled'] ?? 0,
    },
  ], [apiStats, totalItems]);

  // Stats cards
  const stats = useMemo(() => {
    const totalEmails = apiStats?.total ?? totalItems;
    const inProgress = apiStats?.byStatus?.['in_progress'] ?? 0;
    const completed = apiStats?.byStatus?.['completed'] ?? 0;
    const overdue = apiStats?.overdue ?? 0;

    return [
      {
        label: "Total Emails",
        value: totalEmails,
        icon: Mail,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        label: "In Progress",
        value: inProgress,
        icon: Clock,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Completed",
        value: completed,
        icon: Check,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
      },
      {
        label: "Overdue",
        value: overdue,
        icon: AlertCircle,
        iconBgColor: "bg-destructive/10",
        iconColor: "text-destructive",
      },
    ];
  }, [apiStats, totalItems]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map((e) => e.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedEmails.includes(strId)) {
      setSelectedEmails(selectedEmails.filter((eId) => eId !== strId));
    } else {
      setSelectedEmails([...selectedEmails, strId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (email: EmailViewModel) => {
    setEmailToDelete(email);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!emailToDelete?.id) return;

    setIsDeleting(true);

    try {
      await deleteEmail.mutateAsync(emailToDelete.id);
      setIsDeleteModalOpen(false);
      setEmailToDelete(null);
    } catch (error) {
      console.error("Error deleting email:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setEmailToDelete(null);
  };

  // Bulk operation handlers
  const handleSelectAllEmails = () => {
    setSelectedEmails(emails.map(e => e.id));
  };

  const handleDeselectAll = () => {
    setSelectedEmails([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedEmails);
      setSelectedEmails([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({
        ids: selectedEmails,
        data: { status: status as EmailFormData['status'] }
      });
      setSelectedEmails([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Bulk update error:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = emails.filter(email => selectedEmails.includes(email.id));

    if (selectedData.length === 0) {
      toast.error("No emails selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData,
        exportColumns,
        `selected-emails-${new Date().toISOString().split('T')[0]}.csv`
      );
      toast.success(`Successfully exported ${selectedData.length} emails`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export emails");
    }
  };

  // Filter chips
  const getFilterDisplayValue = (field: FilterField | undefined, value: string): string => {
    if (!field || !value) return value;
    if (field.type === 'select' && field.options) {
      const option = field.options.find(opt => opt.value === value);
      if (option) return option.label;
    }
    return value;
  };

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];

    if (statusFilter) {
      chips.push({
        id: 'status-filter',
        label: 'Status',
        value: STATUS_DISPLAY[statusFilter] || statusFilter,
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
    clearModuleFilters('emails');
  };

  // Edit handler — fetches full email details from API
  const handleEditEmail = async (email: EmailViewModel) => {
    setFormMode("edit");

    try {
      const fullEmail = await emailsApi.getById(email.id);

      setEditingEmail({
        id: fullEmail.id,
        subject: fullEmail.subject,
        description: fullEmail.description,
        emailDirection: fullEmail.emailDirection as Email["emailDirection"],
        status: fullEmail.status,
        priority: fullEmail.priority,
        dueDate: toDateInputValue(fullEmail.dueDate),
        contactId: fullEmail.contact?.id,
        companyId: fullEmail.company?.id,
        dealId: fullEmail.deal?.id,
        leadId: fullEmail.lead?.id,
        assignedTo: fullEmail.assignedTo,
        reminderAt: toDateTimeLocalValue(fullEmail.reminderAt),
      });
    } catch (error) {
      console.error("Failed to fetch email details:", error);
      toast.error("Failed to load email details");
      setEditingEmail({
        id: email.id,
        subject: email.subject,
        description: email.description,
        emailDirection: email.emailDirection as Email["emailDirection"],
        status: email.status,
        priority: email.priority,
        dueDate: toDateInputValue(email.dueDate),
        assignedTo: email.assignedTo,
      });
    }
    setFormDrawerOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: Partial<Email>) => {
    try {
      const emailData: EmailFormData = {
        subject: data.subject || "",
        description: data.description,
        emailDirection: data.emailDirection,
        status: data.status as EmailFormData['status'],
        priority: data.priority as EmailFormData['priority'],
        dueDate: data.dueDate,
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        leadId: data.leadId,
        assignedTo: data.assignedTo,
        reminderAt: data.reminderAt,
      };

      if (formMode === "edit" && editingEmail?.id) {
        await updateEmail.mutateAsync({ id: editingEmail.id, data: emailData });
      } else {
        await createEmail.mutateAsync(emailData);
      }

      setFormDrawerOpen(false);
      setEditingEmail(null);
    } catch (error) {
      throw error;
    }
  };

  // Table columns
  const columns = useMemo(() => [
    {
      key: "subject",
      label: "Email",
      render: (_value: unknown, row: EmailViewModel) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleEditEmail(row)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.subject}</div>
            {row.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">{row.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "emailDirection",
      label: "Direction",
      render: (value: string) => {
        const DirectionIcon = getDirectionIcon(value);
        return (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <DirectionIcon className="h-4 w-4 text-muted-foreground" />
            {DIRECTION_DISPLAY[value] || value || "—"}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {STATUS_DISPLAY[value] || value}
        </span>
      ),
    },
    {
      key: "dueDate",
      label: "Date",
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: "relatedTo",
      label: "Related To",
      render: (_value: unknown, row: EmailViewModel) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {row.relatedTo ? (
            <>
              <Flag className="h-4 w-4" />
              <span>{row.relatedTo}</span>
              {row.relatedToType && (
                <span className="text-xs text-muted-foreground/60">({row.relatedToType})</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{formatDate(value)}</span>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Emails"
        icon={Mail}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} emails`}
        searchPlaceholder="Search emails by subject or description..."
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
                title="Filter emails by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Emails"}
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

            <ExportButton
              data={emails}
              columns={exportColumns}
              filename={`emails-${new Date().toISOString().split('T')[0]}`}
              title="Emails Export"
            />
            <Button
              onClick={() => {
                setFormMode("add");
                setEditingEmail(null);
                setDefaultView("quick");
                setFormDrawerOpen(true);
              }}
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Log a new email"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Email
            </Button>
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
      {selectedEmails.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedEmails.length}
          totalCount={totalItems}
          onSelectAll={handleSelectAllEmails}
          onDeselectAll={handleDeselectAll}
          onDelete={() => setShowBulkDelete(true)}
          onExport={handleBulkExport}
          onUpdateStatus={() => setShowBulkUpdateStatus(true)}
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
          data={emails}
          columns={columns}
          selectedIds={selectedEmails}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No emails found"
          emptyDescription="Try adjusting your search or filters, or log a new email"
          renderActions={(row: EmailViewModel) => (
            <ActionMenu
              items={[
                {
                  label: "Edit Email",
                  icon: Edit,
                  onClick: () => handleEditEmail(row),
                },
                {
                  label: "Mark Complete",
                  icon: Check,
                  onClick: () => completeEmail.mutateAsync(row.id),
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
          {emails.map((email, index) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => handleEditEmail(email)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {email.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{email.subject}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {email.emailDirection === "received" ? <Inbox className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                        {DIRECTION_DISPLAY[email.emailDirection || ''] || email.emailDirection || '—'}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "Edit Email",
                          icon: Edit,
                          onClick: () => handleEditEmail(email),
                        },
                        {
                          label: "Mark Complete",
                          icon: Check,
                          onClick: () => completeEmail.mutateAsync(email.id),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(email),
                        },
                      ]}
                    />
                  </div>
                </div>
                {email.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{email.description}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Date: {formatDate(email.dueDate)}</span>
                  </div>
                  {email.relatedTo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flag className="h-4 w-4" />
                      <span>{email.relatedTo}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                    {STATUS_DISPLAY[email.status] || email.status}
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
          setSelectedEmails([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedEmails([]);
        }}
        filterInfo={
          statusFilter ? `filtered by ${STATUS_DISPLAY[statusFilter] || statusFilter}` : undefined
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Email"
        description="Are you sure you want to delete this email log? This will permanently remove it from your CRM and cannot be undone."
        itemName={emailToDelete?.subject}
        itemType="Email"
        icon={Mail}
        isDeleting={isDeleting}
      />

      {/* Email Form Drawer */}
      <EmailFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingEmail(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingEmail}
        mode={formMode}
        defaultView={defaultView}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedEmails.length}
        itemName="email"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedEmails.length}
        title="Update Email Status"
        field="Status"
        options={[
          { label: 'Pending', value: 'pending' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ]}
      />
    </div>
  );
}
