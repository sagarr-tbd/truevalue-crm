"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Users,
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
  UserCheck,
  UserPlus,
  TrendingUp,
  DollarSign,
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
import { ContactFormDrawer, type Contact as ContactType } from "@/components/Forms/Sales";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useContacts, 
  useCreateContact,
  useUpdateContact,
  useDeleteContact, 
  useBulkDeleteContacts, 
  useBulkUpdateContacts,
  useCheckDuplicates,
  type ContactQueryParams,
  type ContactFormData,
  type DuplicateCheckResult,
} from "@/lib/queries/useContacts";
import { contactsApi, type ImportResult } from "@/lib/api/contacts";
import { useQueryClient } from "@tanstack/react-query";
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

const ImportModal = dynamic(
  () => import("@/components/ImportModal").then(mod => ({ default: mod.ImportModal })),
  { ssr: false }
);

const DuplicateWarningModal = dynamic(
  () => import("@/components/DuplicateWarningModal").then(mod => ({ default: mod.DuplicateWarningModal })),
  { ssr: false }
);


export default function ContactsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
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
  const contactsFilters = filters.contacts || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(contactsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(contactsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Bulk operations state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdateStatus, setShowBulkUpdateStatus] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Duplicate warning state
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingContactData, setPendingContactData] = useState<ContactFormData | null>(null);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResult | null>(null);
  
  // Advanced filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup | null>(null);
  
  // Debounced search for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Convert camelCase operator to snake_case for API
  const toSnakeCaseOperator = (op: string): string => {
    const operatorMap: Record<string, string> = {
      'equals': 'equals',
      'notEquals': 'not_equals',
      'contains': 'contains',
      'notContains': 'not_contains',
      'startsWith': 'starts_with',
      'endsWith': 'ends_with',
      'isEmpty': 'is_empty',
      'isNotEmpty': 'is_not_empty',
      'greaterThan': 'greater_than',
      'lessThan': 'less_than',
      'greaterThanOrEqual': 'greater_than_or_equal',
      'lessThanOrEqual': 'less_than_or_equal',
    };
    return operatorMap[op] || op;
  };
  
  // Build query params for server-side pagination (including advanced filters)
  const queryParams: ContactQueryParams = useMemo(() => {
    const params: ContactQueryParams = {
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
  
  // React Query (server/mock data) - now with pagination
  const { data: contactsResponse, isLoading } = useContacts(queryParams);
  const contacts = useMemo(() => contactsResponse?.data ?? [], [contactsResponse?.data]);
  const totalItems = contactsResponse?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const bulkDelete = useBulkDeleteContacts();
  const bulkUpdate = useBulkUpdateContacts();
  const checkDuplicates = useCheckDuplicates();
  
  // Filter presets
  const {
    presets: filterPresets,
    addPreset,
    deletePreset,
  } = useFilterPresets("contacts");
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('contacts', {
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
  const [contactToDelete, setContactToDelete] = useState<typeof contacts[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<(Partial<ContactType> & { id?: string }) | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration - fields available from list API
  const exportColumns: ExportColumn<typeof contacts[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'department', label: 'Department' },
    { key: 'company', label: 'Company' },
    { key: 'status', label: 'Status', format: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '' },
    { key: 'source', label: 'Source' },
    { key: 'dealCount', label: 'Deal Count' },
    { key: 'activityCount', label: 'Activity Count' },
    { key: 'lastActivityAt', label: 'Last Activity' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
    },
    {
      key: 'company',
      label: 'Company',
      type: 'text',
    },
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
    {
      key: 'jobTitle',
      label: 'Job Title',
      type: 'text',
    },
  ], []);

  // Sort logic (advanced filtering now handled server-side)
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Sorting (client-side, applies to current page)
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
  }, [contacts, sortColumn, sortDirection]);

  // Pagination is now server-side - use data directly
  const paginatedContacts = filteredContacts;

  // Stats from API response (includes all contacts, not just current page)
  const apiStats = contactsResponse?.meta?.stats;
  
  // Stats calculations using API stats (matching backend status values)
  const stats = useMemo(() => {
    const totalContacts = apiStats?.total ?? 0;
    const active = apiStats?.byStatus?.['active'] ?? 0;
    const inactive = apiStats?.byStatus?.['inactive'] ?? 0;
    const bounced = apiStats?.byStatus?.['bounced'] ?? 0;

    return [
      {
        label: "Total Contacts",
        value: totalContacts,
        icon: Users,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Active",
        value: active,
        icon: UserCheck,
        iconBgColor: "bg-green-500/10",
        iconColor: "text-green-500",
      },
      {
        label: "Inactive",
        value: inactive,
        icon: UserPlus,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Bounced",
        value: bounced,
        icon: TrendingUp,
        iconBgColor: "bg-red-500/10",
        iconColor: "text-red-500",
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

  // Filter options (matching backend status values)
  const filterOptions = useMemo(() => [
    {
      label: "All Contacts",
      value: null,
      count: apiStats?.total ?? 0,
    },
    {
      label: "Active",
      value: "active",
      count: apiStats?.byStatus?.['active'] ?? 0,
    },
    {
      label: "Inactive",
      value: "inactive",
      count: apiStats?.byStatus?.['inactive'] ?? 0,
    },
    {
      label: "Bounced",
      value: "bounced",
      count: apiStats?.byStatus?.['bounced'] ?? 0,
    },
    {
      label: "Unsubscribed",
      value: "unsubscribed",
      count: apiStats?.byStatus?.['unsubscribed'] ?? 0,
    },
    {
      label: "Archived",
      value: "archived",
      count: apiStats?.byStatus?.['archived'] ?? 0,
    },
  ], [apiStats]);

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
    if (selectedContacts.length === paginatedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(paginatedContacts.map((c) => c.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const stringId = String(id);
    if (selectedContacts.includes(stringId)) {
      setSelectedContacts(selectedContacts.filter((cId) => cId !== stringId));
    } else {
      setSelectedContacts([...selectedContacts, stringId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (contact: typeof contacts[0]) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;
    
    try {
      // Pass the contact ID directly (UUID string)
      await deleteContact.mutateAsync(contactToDelete.id);
    } catch (error) {
      console.error("Error deleting contact:", error);
    } finally {
      // Always close modal and clear state, whether success or error
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setContactToDelete(null);
  };

  // Form handlers
  const handleAddContact = () => {
    setFormMode("add");
    setEditingContact(null);
    setFormDrawerOpen(true);
  };

  const handleEditContact = async (contact: typeof contacts[0]) => {
    setFormMode("edit");
    
    try {
      // Fetch full contact details using the contact's ID (UUID string)
      const fullContact = await contactsApi.getById(contact.id);
      
      const nameParts = fullContact.name?.split(" ") || [];
      setEditingContact({
        // ID for update
        id: fullContact.id,
        // Name
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        // Contact info
        email: fullContact.email,
        secondaryEmail: fullContact.secondaryEmail,
        phone: fullContact.phone !== "-" ? fullContact.phone : undefined,
        mobile: fullContact.mobile !== "-" ? fullContact.mobile : undefined,
        // Job info
        title: fullContact.jobTitle,
        department: fullContact.department,
        primaryCompanyId: fullContact.primaryCompanyId,
        ownerId: fullContact.ownerId,
        // Address
        addressLine1: fullContact.addressLine1,
        addressLine2: fullContact.addressLine2,
        city: fullContact.city,
        state: fullContact.state,
        postalCode: fullContact.postalCode,
        country: fullContact.country,
        // Profile
        description: fullContact.description,
        avatarUrl: fullContact.avatarUrl,
        // Social
        linkedinUrl: fullContact.linkedinUrl,
        twitterUrl: fullContact.twitterUrl,
        // Status & Source
        status: fullContact.status,
        source: fullContact.source,
        sourceDetail: fullContact.sourceDetail,
        // Communication preferences
        doNotCall: fullContact.doNotCall,
        doNotEmail: fullContact.doNotEmail,
        // Tags
        tagIds: fullContact.tagIds,
      });
    } catch (error) {
      console.error("Failed to fetch contact details:", error);
      toast.error("Failed to load contact details");
      // Fallback to minimal data from list
      setEditingContact({
        id: contact.id,
        firstName: contact.name.split(" ")[0] || "",
        lastName: contact.name.split(" ").slice(1).join(" ") || "",
        email: contact.email,
        phone: contact.phone !== "-" ? contact.phone : undefined,
        mobile: contact.mobile !== "-" ? contact.mobile : undefined,
        title: contact.jobTitle,
        status: contact.status,
      });
    }
    setFormDrawerOpen(true);
  };

  // Build contact data from form
  const buildContactData = (data: Partial<ContactType>): ContactFormData => ({
    // Name fields
    firstName: data.firstName,
    lastName: data.lastName,
    // Contact info
    email: data.email,
    secondaryEmail: data.secondaryEmail,
    phone: data.phone,
    mobile: data.mobile,
    // Job info
    title: data.title,
    department: data.department,
    primaryCompanyId: data.primaryCompanyId,
    ownerId: data.ownerId,
    // Address
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country,
    // Profile
    description: data.description,
    avatarUrl: data.avatarUrl,
    // Social
    linkedinUrl: data.linkedinUrl,
    twitterUrl: data.twitterUrl,
    // Status & Source
    status: data.status || "active",
    source: data.source,
    sourceDetail: data.sourceDetail,
    // Communication preferences
    doNotCall: data.doNotCall,
    doNotEmail: data.doNotEmail,
    // Tags
    tagIds: data.tagIds,
  });

  // Proceed with actual contact creation (after duplicate check)
  const proceedWithCreate = async (contactData: ContactFormData, skipDuplicateCheck = false) => {
    await createContact.mutateAsync({ data: contactData, skipDuplicateCheck });
    setFormDrawerOpen(false);
    setEditingContact(null);
    setShowDuplicateWarning(false);
    setPendingContactData(null);
    setDuplicateCheckResult(null);
  };

  // Handle proceed from duplicate warning modal (user explicitly wants to create despite duplicate)
  const handleProceedWithDuplicate = async () => {
    if (!pendingContactData) return;
    try {
      // Pass skipDuplicateCheck=true since user confirmed they want to create anyway
      await proceedWithCreate(pendingContactData, true);
    } catch (error) {
      console.error("Error creating contact:", error);
    }
  };

  // Handle view duplicate contact
  const handleViewDuplicate = (id: string) => {
    router.push(`/sales/contacts/${id}`);
    setShowDuplicateWarning(false);
    setPendingContactData(null);
    setFormDrawerOpen(false);
  };

  const handleFormSubmit = async (data: Partial<ContactType>) => {
    try {
      const contactData = buildContactData(data);

      if (formMode === "add") {
        // Check for duplicates before creating
        if (contactData.email || contactData.phone) {
          const result = await checkDuplicates.mutateAsync({
            email: contactData.email,
            phone: contactData.phone,
          });

          if (result.has_duplicates) {
            // Show duplicate warning modal
            setDuplicateCheckResult(result);
            setPendingContactData(contactData);
            setShowDuplicateWarning(true);
            return; // Don't close the form, wait for user decision
          }
        }

        // No duplicates found, proceed with creation
        await proceedWithCreate(contactData);
      } else if (editingContact?.id) {
        // Update doesn't need duplicate check
        await updateContact.mutateAsync({ 
          id: editingContact.id,
          data: contactData,
        });
        setFormDrawerOpen(false);
        setEditingContact(null);
      }
    } catch (error) {
      console.error("Error submitting contact:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllContacts = () => {
    setSelectedContacts(filteredContacts.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      // Pass string IDs directly
      await bulkDelete.mutateAsync(selectedContacts);
      setSelectedContacts([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting contacts:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      // Pass string IDs directly with data
      await bulkUpdate.mutateAsync({ ids: selectedContacts, data: { status } });
      setSelectedContacts([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Error bulk updating contacts:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredContacts.filter(contact => selectedContacts.includes(contact.id));
    
    if (selectedData.length === 0) {
      toast.error("No contacts selected for export");
      return;
    }

    try {
      // Use the same export columns as the main ExportButton
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-contacts-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} contacts`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export contacts");
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
    clearModuleFilters('contacts');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-600",
      bounced: "bg-red-100 text-red-700",
      unsubscribed: "bg-yellow-100 text-yellow-700",
      archived: "bg-purple-100 text-purple-700",
    };
    return colors[normalizedStatus] || "bg-muted text-muted-foreground";
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New contact",
        action: () => {
          setEditingContact(null);
          setFormMode("add");
          setDefaultView("quick");
          setFormDrawerOpen(true);
        },
      },
    ],
  });

  // Import field options for CSV mapping
  const importFieldOptions = useMemo(() => [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'secondaryEmail', label: 'Secondary Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'title', label: 'Job Title' },
    { value: 'department', label: 'Department' },
    { value: 'status', label: 'Status' },
    { value: 'source', label: 'Source' },
    { value: 'sourceDetail', label: 'Source Detail' },
    { value: 'addressLine1', label: 'Address Line 1' },
    { value: 'addressLine2', label: 'Address Line 2' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'postalCode', label: 'Postal Code' },
    { value: 'country', label: 'Country' },
    { value: 'description', label: 'Description' },
    { value: 'linkedinUrl', label: 'LinkedIn URL' },
    { value: 'twitterUrl', label: 'Twitter URL' },
    { value: 'doNotCall', label: 'Do Not Call' },
    { value: 'doNotEmail', label: 'Do Not Email' },
  ], []);

  // Handle CSV import
  const handleImportContacts = async (
    data: Record<string, unknown>[],
    options: { skipDuplicates: boolean; updateExisting: boolean; duplicateCheckField: 'email' | 'phone' }
  ): Promise<ImportResult> => {
    try {
      const result = await contactsApi.import(data, options);
      
      // Show success toast
      toast.success(`Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);
      
      // Invalidate contacts queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      // Reset to first page
      setCurrentPage(1);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Table columns
  const columns = [
    {
      key: "name",
      label: "Contact",
      sortable: true,
      render: (_value: unknown, row: typeof contacts[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/contacts/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            {row.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.jobTitle}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {value}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          {value}
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-foreground">{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : ''}
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
        title="Contacts"
        icon={Users}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${totalItems} contacts`}
        searchPlaceholder="Search contacts by name, email, or company..."
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
                title="Filter contacts by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Contacts"}
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
              title="Import contacts from CSV or Excel"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredContacts}
              columns={exportColumns}
              filename="contacts-export"
              title="Contacts Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new contact"
              onClick={handleAddContact}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
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
        {selectedContacts.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedContacts.length}
            totalCount={totalItems}
            onSelectAll={handleSelectAllContacts}
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
          data={paginatedContacts}
          columns={columns}
          selectedIds={selectedContacts}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No contacts found"
          emptyDescription="Try adjusting your search or filters, or add a new contact"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/sales/contacts/${row.id}`),
                },
                {
                  label: "Edit Contact",
                  icon: Edit,
                  onClick: () => handleEditContact(row),
                },
                {
                  label: "Send Email",
                  icon: Mail,
                  onClick: () => window.location.href = `mailto:${row.email}`,
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
          {paginatedContacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/contacts/${contact.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                      {contact.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {contact.jobTitle}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/sales/contacts/${contact.id}`),
                        },
                        {
                          label: "Edit Contact",
                          icon: Edit,
                          onClick: () => handleEditContact(contact),
                        },
                        {
                          label: "Send Email",
                          icon: Mail,
                          onClick: () => window.location.href = `mailto:${contact.email}`,
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(contact),
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{contact.company}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                    {contact.status ? contact.status.charAt(0).toUpperCase() + contact.status.slice(1) : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {contact.created}
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
          setSelectedContacts([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedContacts([]);
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
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This will permanently remove it from your CRM and cannot be undone."
        itemName={contactToDelete?.name}
        itemType="Contact"
        icon={Users}
        isDeleting={deleteContact.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedContacts.length}
        itemName="contact"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedContacts.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Bounced', value: 'bounced' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
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

      {/* Contact Form Drawer */}
      <ContactFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingContact(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingContact}
        mode={formMode}
        defaultView={defaultView}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportContacts}
        entityName="Contacts"
        requiredFields={['firstName', 'lastName', 'email']}
        fieldOptions={importFieldOptions}
        sampleData={{
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1 555-0100',
          mobile: '+1 555-0101',
          title: 'Sales Manager',
          department: 'Sales',
          status: 'active',
          source: 'Website',
          sourceDetail: 'Q1 Campaign',
          addressLine1: '123 Main Street',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
          description: 'Key decision maker for enterprise deals',
          linkedinUrl: 'https://linkedin.com/in/johndoe',
          doNotCall: 'false',
          doNotEmail: 'false',
        }}
      />

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={showDuplicateWarning}
        onClose={() => {
          setShowDuplicateWarning(false);
          setPendingContactData(null);
          setDuplicateCheckResult(null);
        }}
        onProceed={handleProceedWithDuplicate}
        onViewDuplicate={handleViewDuplicate}
        duplicates={duplicateCheckResult?.duplicates ?? []}
        matchField={duplicateCheckResult?.match_field ?? 'email'}
        matchValue={
          duplicateCheckResult?.match_field === 'phone' 
            ? pendingContactData?.phone ?? '' 
            : pendingContactData?.email ?? ''
        }
        isLoading={createContact.isPending}
        showMergeOption={false}
      />

    </div>
  );
}
