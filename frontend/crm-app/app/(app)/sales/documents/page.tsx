"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FileText,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
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
import { DocumentFormDrawer, type Document as DocumentType } from "@/components/Forms/Sales";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useDocuments, 
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument, 
  useBulkDeleteDocuments, 
  useBulkUpdateDocuments 
} from "@/lib/queries/useDocuments";
import { useUIStore } from "@/stores";
import type { DocumentDisplay } from "@/lib/api/mock/documents";

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

export default function DocumentsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: documents = [], isLoading } = useDocuments();
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const bulkDelete = useBulkDeleteDocuments();
  const bulkUpdate = useBulkUpdateDocuments();
  
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
  const documentsFilters = filters.documents || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(documentsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(documentsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
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
  } = useFilterPresets("documents");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('documents', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentDisplay | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Partial<DocumentType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  // Export columns configuration
  const exportColumns: ExportColumn<DocumentDisplay>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Document Name' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'size', label: 'Size' },
    { key: 'owner', label: 'Owner' },
    { key: 'relatedTo', label: 'Related To' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created Date' },
    { key: 'modified', label: 'Modified Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'name',
      label: 'Document Name',
      type: 'text',
    },
    {
      key: 'type',
      label: 'Type',
      type: 'text',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'Draft' },
        { label: 'Review', value: 'Review' },
        { label: 'Final', value: 'Final' },
        { label: 'Archived', value: 'Archived' },
      ],
    },
    {
      key: 'owner',
      label: 'Owner',
      type: 'text',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          doc.owner?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          doc.category?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
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
  }, [documents, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDocuments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const total = documents.length;
    const draft = documents.filter((d) => d.status === "Draft").length;
    const review = documents.filter((d) => d.status === "Review").length;
    const final = documents.filter((d) => d.status === "Final").length;

    return [
      {
        label: "Total Documents",
        value: total,
        icon: FileText,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Draft",
        value: draft,
        icon: FileText,
        iconBgColor: "bg-yellow-500/10",
        iconColor: "text-yellow-600",
      },
      {
        label: "In Review",
        value: review,
        icon: FileText,
        iconBgColor: "bg-blue-500/10",
        iconColor: "text-blue-600",
      },
      {
        label: "Final",
        value: final,
        icon: FileText,
        iconBgColor: "bg-green-500/10",
        iconColor: "text-green-600",
        trend: { value: 15, isPositive: true },
      },
    ];
  }, [documents]);

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
      label: "All Documents",
      value: null,
      count: documents.length,
    },
    {
      label: "Draft",
      value: "Draft",
      count: documents.filter((d) => d.status === "Draft").length,
    },
    {
      label: "Review",
      value: "Review",
      count: documents.filter((d) => d.status === "Review").length,
    },
    {
      label: "Final",
      value: "Final",
      count: documents.filter((d) => d.status === "Final").length,
    },
    {
      label: "Archived",
      value: "Archived",
      count: documents.filter((d) => d.status === "Archived").length,
    },
  ], [documents]);

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
    if (selectedDocuments.length === paginatedDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(paginatedDocuments.map((d) => d.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedDocuments.includes(numId)) {
      setSelectedDocuments(selectedDocuments.filter((dId) => dId !== numId));
    } else {
      setSelectedDocuments([...selectedDocuments, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (document: DocumentDisplay) => {
    setDocumentToDelete(document);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete?.id) return;
    
    try {
      await deleteDocument.mutateAsync(documentToDelete.id);
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    } catch {
      // Error handled by React Query
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDocumentToDelete(null);
  };

  // Form handlers
  const handleAddDocument = () => {
    setFormMode("add");
    setEditingDocument(null);
    setFormDrawerOpen(true);
  };

  const handleEditDocument = (document: DocumentDisplay) => {
    setFormMode("edit");
    setEditingDocument({
      id: document.id,
      name: document.name,
      type: document.type as DocumentType["type"],
      category: document.category as DocumentType["category"],
      status: document.status as DocumentType["status"],
      relatedTo: document.relatedTo,
      assignedTo: document.owner,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<DocumentType>) => {
    try {
      if (formMode === "edit" && editingDocument?.id) {
        await updateDocument.mutateAsync({ 
          id: editingDocument.id, 
          data: {
            name: data.name,
            type: data.type,
            category: data.category,
            status: data.status,
            relatedTo: data.relatedTo,
            owner: data.assignedTo,
          }
        });
      } else {
        await createDocument.mutateAsync({
          name: data.name || "",
          type: data.type,
          category: data.category,
          status: data.status || "Draft",
          relatedTo: data.relatedTo,
          owner: data.assignedTo || "Unknown",
          size: "0 KB",
        });
      }
      
      setFormDrawerOpen(false);
      setEditingDocument(null);
    } catch {
      // Error handled by React Query
    }
  };

  // Bulk operation handlers
  const handleSelectAllDocuments = () => {
    setSelectedDocuments(filteredDocuments.map(d => d.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedDocuments([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedDocuments);
      setSelectedDocuments([]);
      setShowBulkDelete(false);
    } catch {
      // Error handled by React Query
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ ids: selectedDocuments, data: { status } });
      setSelectedDocuments([]);
      setShowBulkUpdateStatus(false);
    } catch {
      // Error handled by React Query
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredDocuments.filter(doc => doc.id !== undefined && selectedDocuments.includes(doc.id));
    
    if (selectedData.length === 0) {
      toast.error("No documents selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-documents-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} documents`);
    } catch {
      // Error handled
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
    clearModuleFilters('documents');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Draft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      Review: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      Final: "bg-green-500/10 text-green-600 dark:text-green-400",
      Archived: "bg-muted text-muted-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New document",
        action: handleAddDocument,
      },
    ],
  });

  // Table columns
  const columns = [
    {
      key: "name",
      label: "Document",
      sortable: true,
      render: (_value: unknown, row: DocumentDisplay) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/sales/documents/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.type}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-foreground">{value}</span>
      ),
    },
    {
      key: "size",
      label: "Size",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value}</span>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      sortable: true,
      render: (_value: unknown, row: DocumentDisplay) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {row.initials}
          </div>
          <span className="text-sm text-foreground">{row.owner}</span>
        </div>
      ),
    },
    {
      key: "relatedTo",
      label: "Related To",
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
          {value}
        </span>
      ),
    },
    {
      key: "modified",
      label: "Modified",
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
        title="Documents"
        icon={FileText}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${documents.length} documents`}
        searchPlaceholder="Search documents by name, owner, or category..."
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
                title="Filter documents by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Documents"}
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

            <Button 
              variant="outline" 
              size="sm"
              title="Import documents from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredDocuments}
              columns={exportColumns}
              filename="documents-export"
              title="Documents Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new document"
              onClick={handleAddDocument}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Document
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
        {selectedDocuments.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedDocuments.length}
            totalCount={filteredDocuments.length}
            onSelectAll={handleSelectAllDocuments}
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
          data={paginatedDocuments}
          columns={columns}
          selectedIds={selectedDocuments}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No documents found"
          emptyDescription="Try adjusting your search or filters, or add a new document"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/sales/documents/${row.id}`),
                },
                {
                  label: "Edit Document",
                  icon: Edit,
                  onClick: () => handleEditDocument(row),
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
          {paginatedDocuments.map((document, index) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/sales/documents/${document.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {document.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {document.type}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/sales/documents/${document.id}`),
                        },
                        {
                          label: "Edit Document",
                          icon: Edit,
                          onClick: () => handleEditDocument(document),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(document),
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Category:</span> {document.category}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Size:</span> {document.size}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Owner:</span> {document.owner}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {document.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {document.modified}
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
        totalItems={filteredDocuments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedDocuments([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedDocuments([]);
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
        title="Delete Document"
        description="Are you sure you want to delete this document? This will permanently remove it from your CRM and cannot be undone."
        itemName={documentToDelete?.name}
        itemType="Document"
        icon={FileText}
        isDeleting={deleteDocument.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedDocuments.length}
        itemName="document"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedDocuments.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Draft', value: 'Draft' },
          { label: 'Review', value: 'Review' },
          { label: 'Final', value: 'Final' },
          { label: 'Archived', value: 'Archived' },
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

      {/* Document Form Drawer */}
      <DocumentFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingDocument(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDocument}
        mode={formMode}
      />
    </div>
  );
}
