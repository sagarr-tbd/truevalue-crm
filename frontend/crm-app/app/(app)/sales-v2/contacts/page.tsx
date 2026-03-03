"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Mail,
  Phone,
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
import { ContactV2FormDrawer } from "@/components/Forms/Sales";
import {
  useContactsV2,
  useCreateContactV2,
  useUpdateContactV2,
  useDeleteContactV2,
  useContactsV2Stats,
  useBulkDeleteContactsV2,
  useBulkUpdateContactsV2,
} from "@/lib/queries/useContactsV2";
import type { CreateContactV2Input, ContactV2 } from "@/lib/api/contactsV2";
import { contactsV2Api, contactsV2ExtApi } from "@/lib/api/contactsV2";
import { toast } from "sonner";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import { getStatusColor, toSnakeCaseOperator } from "@/lib/utils";
import { getContactActionMenuItems } from "@/lib/utils/actionMenus";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { useUIStore } from "@/stores";
import { usePermission, CONTACTS_READ, CONTACTS_WRITE, CONTACTS_DELETE } from "@/lib/permissions";

const DeleteConfirmationModal = dynamic(
  () => import("@/components/DeleteConfirmationModal"),
  { ssr: false }
);

const BulkDeleteModal = dynamic(
  () => import("@/components/BulkDeleteModal").then(mod => ({ default: mod.BulkDeleteModal })),
  { ssr: false }
);

import { BulkUpdateModal } from "@/components/BulkUpdateModal";

const ImportModal = dynamic(
  () => import("@/components/ImportModal").then(mod => ({ default: mod.ImportModal })),
  { ssr: false }
);

export default function ContactsV2Page() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    viewMode, showStats, setViewMode, toggleStats,
    filters, setModuleFilters, clearModuleFilters,
    defaultItemsPerPage: defaultPerPage,
  } = useUIStore();
  const { can } = usePermission();

  const contactsV2Filters = (filters as Record<string, any>)['contacts-v2'] || {};

  const [searchQuery, setSearchQuery] = useState(contactsV2Filters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(contactsV2Filters.status || null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { presets, addPreset, deletePreset } = useFilterPresets('contacts-v2');

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);

  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      page_size: itemsPerPage,
      search: debouncedSearchQuery || undefined,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
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
  }, [currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, sourceFilter, filterGroup]);

  const { data: contactsResponse, isLoading } = useContactsV2(queryParams);
  const { data: statsData } = useContactsV2Stats();

  const { data: availableSources = [] } = useQuery({
    queryKey: ['contactsV2', 'sources'],
    queryFn: () => contactsV2Api.sources(),
    staleTime: 300000,
  });

  const createContact = useCreateContactV2();
  const updateContact = useUpdateContactV2();
  const deleteContact = useDeleteContactV2();
  const bulkDeleteContacts = useBulkDeleteContactsV2();
  const bulkUpdateContacts = useBulkUpdateContactsV2();

  const contacts = contactsResponse?.results || [];
  const totalItems = contactsResponse?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    (setModuleFilters as (module: string, filters: any) => void)('contacts-v2', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, sourceFilter, filterGroup]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{ id: string; firstName: string; lastName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactV2 | null>(null);
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
        description: "New contact",
        action: () => {
          if (!can(CONTACTS_WRITE)) return;
          setEditingContact(null);
          setFormMode("add");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  const memoizedContacts = useMemo(() => contacts, [contacts]);

  const transformedContacts = useMemo(() =>
    memoizedContacts.map(contact => ({
      id: contact.id,
      firstName: contact.entity_data.first_name || '',
      lastName: contact.entity_data.last_name || '',
      fullName: contact.display_name || `${contact.entity_data.first_name || ''} ${contact.entity_data.last_name || ''}`.trim() || contact.entity_data.email || 'No name',
      email: contact.entity_data.email || '',
      phone: contact.entity_data.phone || '',
      mobile: contact.entity_data.mobile || '',
      companyName: contact.display_company || 'No company',
      title: contact.entity_data.title || '',
      status: contact.status,
      source: contact.source || '',
      created: new Date(contact.created_at).toLocaleDateString(),
      initials: `${contact.entity_data.first_name?.[0] || ''}${contact.entity_data.last_name?.[0] || 'C'}`.toUpperCase(),
    })),
    [memoizedContacts]
  );

  const filterOptions = useMemo(() => {
    const byStatus = statsData?.by_status || {};
    const total = statsData?.total || totalItems;
    return [
      { label: "All Contacts", value: null, count: total },
      { label: "Active", value: "active", count: byStatus.active || 0 },
      { label: "Inactive", value: "inactive", count: byStatus.inactive || 0 },
      { label: "Bounced", value: "bounced", count: byStatus.bounced || 0 },
      { label: "Unsubscribed", value: "unsubscribed", count: byStatus.unsubscribed || 0 },
      { label: "Archived", value: "archived", count: byStatus.archived || 0 },
    ];
  }, [statsData, totalItems]);

  const stats = useMemo(() => {
    if (statsData) {
      return [
        { label: "Total Contacts", value: statsData.total, icon: Users, iconBgColor: "bg-primary/10", iconColor: "text-primary" },
        { label: "Active", value: statsData.by_status?.active || 0, icon: Users, iconBgColor: "bg-green-500/10", iconColor: "text-green-500" },
        { label: "Inactive", value: statsData.by_status?.inactive || 0, icon: Users, iconBgColor: "bg-gray-500/10", iconColor: "text-gray-500" },
        { label: "Bounced", value: statsData.by_status?.bounced || 0, icon: Mail, iconBgColor: "bg-red-500/10", iconColor: "text-red-500" },
      ];
    }

    return [
      { label: "Total Contacts", value: totalItems, icon: Users, iconBgColor: "bg-primary/10", iconColor: "text-primary" },
      { label: "Active", value: memoizedContacts.filter(c => c.status === 'active').length, icon: Users, iconBgColor: "bg-green-500/10", iconColor: "text-green-500" },
      { label: "Inactive", value: memoizedContacts.filter(c => c.status === 'inactive').length, icon: Users, iconBgColor: "bg-gray-500/10", iconColor: "text-gray-500" },
      { label: "Bounced", value: memoizedContacts.filter(c => c.status === 'bounced').length, icon: Mail, iconBgColor: "bg-red-500/10", iconColor: "text-red-500" },
    ];
  }, [statsData, memoizedContacts, totalItems]);

  const exportParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (debouncedSearchQuery) p.search = debouncedSearchQuery;
    if (statusFilter) p.status = statusFilter;
    if (sourceFilter) p.source = sourceFilter;
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
  }, [debouncedSearchQuery, statusFilter, sourceFilter, filterGroup]);

  const handleSelectAll = () => {
    if (selectedContacts.length === transformedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(transformedContacts.map((c) => c.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const strId = String(id);
    if (selectedContacts.includes(strId)) {
      setSelectedContacts(selectedContacts.filter((cId) => cId !== strId));
    } else {
      setSelectedContacts([...selectedContacts, strId]);
    }
  };

  const handleDeleteClick = (contact: { id: string; firstName: string; lastName: string }) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteContact.mutateAsync(contactToDelete.id);
      toast.success("Contact deleted successfully");
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    } catch {
      toast.error("Failed to delete contact");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setContactToDelete(null);
  };

  const handleSelectAllContacts = () => {
    setSelectedContacts(transformedContacts.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDeleteContacts.mutateAsync(selectedContacts);
      setSelectedContacts([]);
      setShowBulkDelete(false);
    } catch {
      // Error handled by mutation
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedContacts.length === 0) {
      toast.error("No contacts selected for export");
      return;
    }
    try {
      await contactsV2Api.export({ ids: selectedContacts });
      toast.success(`Exported ${selectedContacts.length} contacts`);
    } catch {
      toast.error("Failed to export contacts");
    }
  };

  const handleBulkUpdateStatus = async (newStatus: "active" | "inactive" | "bounced" | "unsubscribed" | "archived") => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdateContacts.mutateAsync({ ids: selectedContacts, data: { status: newStatus } });
      setSelectedContacts([]);
      setShowBulkUpdateStatus(false);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const importFieldOptions = useMemo(() => [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'secondary_email', label: 'Secondary Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'title', label: 'Job Title' },
    { value: 'department', label: 'Department' },
    { value: 'status', label: 'Status' },
    { value: 'source', label: 'Source' },
    { value: 'source_detail', label: 'Source Detail' },
    { value: 'address_line1', label: 'Address Line 1' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'postal_code', label: 'Postal Code' },
    { value: 'country', label: 'Country' },
    { value: 'description', label: 'Description' },
    { value: 'linkedin_url', label: 'LinkedIn URL' },
    { value: 'twitter_url', label: 'Twitter URL' },
  ], []);

  const handleImportContacts = async (
    data: Record<string, unknown>[],
    options: { skipDuplicates: boolean; updateExisting: boolean; duplicateCheckField: 'email' | 'phone' }
  ) => {
    const duplicateHandling = options.skipDuplicates ? 'skip' : options.updateExisting ? 'update' : 'create';
    const result = await contactsV2ExtApi.importContacts(data, duplicateHandling);
    toast.success(`Import complete: ${result.created} created, ${result.skipped} skipped`);
    await queryClient.invalidateQueries({ queryKey: ['contactsV2'] });
    setCurrentPage(1);
    return { total: result.created + result.skipped + result.errors, created: result.created, updated: 0, skipped: result.skipped, errors: [] };
  };

  const handleEditContact = useCallback((contact: { id: string }) => {
    setFormMode("edit");
    const fullContact = contacts.find(c => c.id === contact.id);
    if (fullContact) {
      setEditingContact({
        ...fullContact,
        status: fullContact.status as ContactV2['status']
      });
      setFormDrawerOpen(true);
    }
  }, [contacts]);

  const handleFormSubmit = async (data: CreateContactV2Input) => {
    try {
      if (formMode === "add" && data.entity_data?.email) {
        try {
          const duplicateCheck = await contactsV2Api.checkDuplicate(data.entity_data.email);
          if (duplicateCheck.has_duplicates) {
            toast.warning(
              `Found ${duplicateCheck.count} existing contact(s) with this email. Creating anyway.`,
              { duration: 5000 }
            );
          }
        } catch {
          // If duplicate check fails, continue silently
        }
      }

      if (formMode === "edit" && editingContact?.id) {
        await updateContact.mutateAsync({ id: editingContact.id, data });
      } else {
        await createContact.mutateAsync(data);
      }

      setFormDrawerOpen(false);
      setEditingContact(null);
    } catch (error) {
      throw error;
    }
  };

  const contactActionHandlers = useMemo(() => ({
    onView: (id: string) => router.push(`/sales-v2/contacts/${id}`),
    onEdit: (contact: { id: string }) => {
      handleEditContact(contact);
    },
    onSendEmail: (email: string) => { if (email) window.location.href = `mailto:${email}`; },
    onDelete: handleDeleteClick,
  }), [router, handleEditContact]);

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (statusFilter) {
      chips.push({ id: 'status-filter', label: 'Status', value: statusFilter, color: 'primary' });
    }
    if (sourceFilter) {
      chips.push({ id: 'source-filter', label: 'Source', value: sourceFilter, color: 'secondary' });
    }
    return chips;
  }, [statusFilter, sourceFilter]);

  const handleRemoveFilterChip = (chipId: string) => {
    if (chipId === 'status-filter') setStatusFilter(null);
    else if (chipId === 'source-filter') setSourceFilter(null);
  };

  const handleClearAllFilters = () => {
    setStatusFilter(null);
    setSourceFilter(null);
    setSearchQuery('');
    setFilterGroup(null);
    (clearModuleFilters as (module: string) => void)('contacts-v2');
  };

  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Bounced', value: 'bounced' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { key: 'first_name', label: 'First Name', type: 'text', placeholder: 'Enter first name...' },
    { key: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Enter last name...' },
    { key: 'company_name', label: 'Company', type: 'text', placeholder: 'Enter company...' },
    { key: 'email', label: 'Email', type: 'text', placeholder: 'Enter email...' },
    {
      key: 'source',
      label: 'Source',
      type: 'select',
      options: availableSources.map(s => ({
        label: s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: s
      })),
    },
  ], [availableSources]);

  const columns = useMemo(() => [
    {
      key: "firstName",
      label: "Name",
      render: (_: unknown, row: typeof transformedContacts[0]) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales-v2/contacts/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.fullName}</div>
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
      render: (_: unknown, row: typeof transformedContacts[0]) => (
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
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(value, 'contact')}`}>
          {value}
        </span>
      ),
    },
    {
      key: "title",
      label: "Job Title",
      render: (value: string | undefined) => (
        <span className="text-sm text-foreground">{value || "N/A"}</span>
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
      <PageHeader
        title="Contacts"
        icon={Users}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} contacts`}
        searchPlaceholder="Search contacts by name, company, or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toggleStats()} title={showStats ? "Hide Statistics" : "Show Statistics"}>
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} />

            <div className="relative" ref={filterDropdownRef}>
              <Button variant="outline" size="sm" onClick={() => setShowFilterDropdown(!showFilterDropdown)} title="Filter contacts by status">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? filterOptions.find((f) => f.value === statusFilter)?.label : "All Contacts"}
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

            {can(CONTACTS_WRITE) && (
              <Button variant="outline" size="sm" title="Import contacts from CSV or Excel" onClick={() => setShowImportModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {can(CONTACTS_READ) && (
              <ExportButton
                exportUrl="/crm/api/v2/contacts/export/"
                exportParams={exportParams}
                filename="contacts"
                totalRecords={totalItems}
              />
            )}
            {can(CONTACTS_WRITE) && (
              <Button
                onClick={() => { setFormMode("add"); setEditingContact(null); setFormDrawerOpen(true); }}
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                title="Add a new contact"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
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

      {selectedContacts.length > 0 && (can(CONTACTS_WRITE) || can(CONTACTS_DELETE)) && (
        <BulkActionsToolbar
          selectedCount={selectedContacts.length}
          totalCount={totalItems}
          onSelectAll={handleSelectAllContacts}
          onDeselectAll={handleDeselectAll}
          onDelete={can(CONTACTS_DELETE) ? () => setShowBulkDelete(true) : undefined}
          onExport={handleBulkExport}
          onUpdateStatus={can(CONTACTS_WRITE) ? () => setShowBulkUpdateStatus(true) : undefined}
          isProcessing={isBulkProcessing}
        />
      )}

      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {viewMode === "list" ? (
        <DataTable
          data={transformedContacts}
          columns={columns}
          selectedIds={selectedContacts}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          showSelection={can(CONTACTS_DELETE) || can(CONTACTS_WRITE)}
          loading={isLoading}
          emptyMessage="No contacts found"
          emptyDescription="Try adjusting your search or filters, or add a new contact"
          renderActions={(row: typeof transformedContacts[0]) => (
            <ActionMenu
              items={getContactActionMenuItems(row, contactActionHandlers).filter(
                (item) => {
                  if (item.label === "Delete") return can(CONTACTS_DELETE);
                  if (["Edit", "Edit Contact"].includes(item.label || "")) return can(CONTACTS_WRITE);
                  return true;
                }
              )}
            />
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformedContacts.map((contact, index) => (
            <motion.div key={contact.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales-v2/contacts/${contact.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {contact.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{contact.fullName}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {contact.companyName}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={getContactActionMenuItems(contact, contactActionHandlers).filter(
                        (item) => {
                          if (item.label === "Delete") return can(CONTACTS_DELETE);
                          if (["Edit", "Edit Contact"].includes(item.label || "")) return can(CONTACTS_WRITE);
                          return true;
                        }
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(contact.status, 'contact')}`}>
                      {contact.status}
                    </span>
                    {contact.title && <span className="text-xs text-muted-foreground">{contact.title}</span>}
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{contact.phone || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {contact.created}</span>
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
        onPageChange={(page) => { setCurrentPage(page); setSelectedContacts([]); }}
        onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); setSelectedContacts([]); }}
        filterInfo={statusFilter ? `filtered by ${statusFilter}` : undefined}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This will permanently remove it from your CRM and cannot be undone."
        itemName={contactToDelete ? `${contactToDelete.firstName} ${contactToDelete.lastName}` : undefined}
        itemType="Contact"
        icon={Users}
        isDeleting={isDeleting}
      />

      <ContactV2FormDrawer
        isOpen={formDrawerOpen}
        onClose={() => { setFormDrawerOpen(false); setEditingContact(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingContact}
        mode={formMode}
      />

      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedContacts.length}
        itemName="contact"
      />

      <BulkUpdateModal<"active" | "inactive" | "bounced" | "unsubscribed" | "archived">
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedContacts.length}
        title="Update Contact Status"
        field="Status"
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Bounced', value: 'bounced' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Archived', value: 'archived' },
        ]}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportContacts}
        entityName="Contacts"
        requiredFields={['first_name', 'last_name', 'email']}
        fieldOptions={importFieldOptions}
        sampleData={{
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1 555-0100',
          mobile: '+1 555-0101',
          title: 'Sales Manager',
          department: 'Sales',
          status: 'active',
          source: 'Website',
          source_detail: 'Q1 Campaign',
          address_line1: '123 Main Street',
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
          country: 'USA',
          description: 'Key decision maker',
          linkedin_url: 'https://linkedin.com/in/johndoe',
        }}
      />
    </div>
  );
}
