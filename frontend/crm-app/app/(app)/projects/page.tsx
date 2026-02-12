"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FolderKanban,
  Plus,
  Filter,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
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
import { ProjectFormDrawer } from "@/components/Forms/Projects";
import { useKeyboardShortcuts, useFilterPresets, useDebounce } from "@/hooks";
import { ExportButton } from "@/components/ExportButton";
import type { ExportColumn } from "@/lib/export";
import { exportToCSV } from "@/lib/export";
import { AdvancedFilter, FilterField, FilterGroup, filterData } from "@/components/AdvancedFilter";
import { FilterChips, FilterChip } from "@/components/FilterChips";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { toast } from "sonner";
import { 
  useProjects, 
  useCreateProject,
  useUpdateProject,
  useDeleteProject, 
  useBulkDeleteProjects, 
  useBulkUpdateProjects 
} from "@/lib/queries/useProjects";
import { useUIStore } from "@/stores";
import type { Project } from "@/lib/types";

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

export default function ProjectsPage() {
  const router = useRouter();
  
  // React Query (server/mock data)
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const bulkDelete = useBulkDeleteProjects();
  const bulkUpdate = useBulkUpdateProjects();
  
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
  const projectsFilters = filters.projects || {};
  
  // State management
  const [searchQuery, setSearchQuery] = useState(projectsFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(projectsFilters.status || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
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
  } = useFilterPresets("projects");
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Save filters to store when they change
  useEffect(() => {
    setModuleFilters('projects', {
      search: searchQuery,
      status: statusFilter,
    });
  }, [searchQuery, statusFilter, setModuleFilters]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<typeof projects[0] | null>(null);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [defaultView, setDefaultView] = useState<"quick" | "detailed">("quick");

  // Export columns configuration
  const exportColumns: ExportColumn<typeof projects[0]>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'projectCode', label: 'Project Code' },
    { key: 'projectName', label: 'Project Name' },
    { key: 'client', label: 'Client' },
    { key: 'projectManager', label: 'Project Manager' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'type', label: 'Type' },
    { key: 'progress', label: 'Progress %' },
    { key: 'budget', label: 'Budget' },
    { key: 'spent', label: 'Spent' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'created', label: 'Created Date' },
  ], []);

  // Advanced filter fields
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: 'projectName',
      label: 'Project Name',
      type: 'text',
    },
    {
      key: 'client',
      label: 'Client',
      type: 'text',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Planning', value: 'Planning' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'On Hold', value: 'On Hold' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Cancelled', value: 'Cancelled' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' },
        { label: 'Critical', value: 'Critical' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'Implementation', value: 'Implementation' },
        { label: 'Development', value: 'Development' },
        { label: 'Migration', value: 'Migration' },
        { label: 'Consulting', value: 'Consulting' },
        { label: 'Support', value: 'Support' },
        { label: 'Training', value: 'Training' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      key: 'progress',
      label: 'Progress',
      type: 'number',
    },
  ], []);

  // Filter & sort logic (using debounced search query)
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Search filter (debounced)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.projectName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          project.client?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          project.projectCode?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((project) => project.status === statusFilter);
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
  }, [projects, debouncedSearchQuery, statusFilter, filterGroup, sortColumn, sortDirection]);

  // Pagination
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const active = projects.filter((p) => p.status === "In Progress").length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    const totalBudget = projects.reduce((sum, p) => {
      const budget = p.budget?.replace(/[^0-9.-]+/g, "") || "0";
      return sum + parseFloat(budget);
    }, 0);

    return [
      {
        label: "Total Projects",
        value: totalProjects,
        icon: FolderKanban,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Active Projects",
        value: active,
        icon: TrendingUp,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
      },
      {
        label: "Completed",
        value: completed,
        icon: Check,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Total Budget",
        value: `$${(totalBudget / 1000).toFixed(0)}K`,
        icon: DollarSign,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 15, isPositive: true },
      },
    ];
  }, [projects]);

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
      label: "All Projects",
      value: null,
      count: projects.length,
    },
    {
      label: "Planning",
      value: "Planning",
      count: projects.filter((p) => p.status === "Planning").length,
    },
    {
      label: "In Progress",
      value: "In Progress",
      count: projects.filter((p) => p.status === "In Progress").length,
    },
    {
      label: "On Hold",
      value: "On Hold",
      count: projects.filter((p) => p.status === "On Hold").length,
    },
    {
      label: "Completed",
      value: "Completed",
      count: projects.filter((p) => p.status === "Completed").length,
    },
    {
      label: "Cancelled",
      value: "Cancelled",
      count: projects.filter((p) => p.status === "Cancelled").length,
    },
  ], [projects]);

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
    if (selectedProjects.length === paginatedProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(paginatedProjects.map((p) => p.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedProjects.includes(numId)) {
      setSelectedProjects(selectedProjects.filter((pId) => pId !== numId));
    } else {
      setSelectedProjects([...selectedProjects, numId]);
    }
  };

  // Delete handlers
  const handleDeleteClick = (project: typeof projects[0]) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete?.id) return;
    
    try {
      await deleteProject.mutateAsync(projectToDelete.id);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  // Form handlers
  const handleAddProject = () => {
    setFormMode("add");
    setEditingProject(null);
    setFormDrawerOpen(true);
  };

  const handleEditProject = (project: typeof projects[0]) => {
    setFormMode("edit");
    setEditingProject(project);
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Project>) => {
    try {
      if (formMode === "add") {
        const newProject = {
          projectName: data.projectName || "",
          description: data.description,
          client: data.client || "",
          projectManager: data.projectManager,
          status: data.status || "Planning",
          priority: data.priority || "Medium",
          type: data.type || "Implementation",
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          teamSize: data.teamSize,
          tags: data.tags || [],
        };
        await createProject.mutateAsync(newProject);
      } else if (editingProject) {
        // Find the project ID from the projects list
        const projectToUpdate = projects.find(p => 
          p.id === editingProject.id ||
          p.projectCode === editingProject.projectCode
        );
        
        if (projectToUpdate?.id) {
          const updatedProject = {
            projectName: data.projectName,
            description: data.description,
            client: data.client,
            projectManager: data.projectManager,
            status: data.status,
            priority: data.priority,
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            budget: data.budget,
            teamSize: data.teamSize,
            tags: data.tags,
          };
          await updateProject.mutateAsync({ id: projectToUpdate.id, data: updatedProject });
        }
      }
      
      setFormDrawerOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Error submitting project:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Bulk operation handlers
  const handleSelectAllProjects = () => {
    setSelectedProjects(filteredProjects.map(p => p.id).filter((id): id is number => id !== undefined));
  };

  const handleDeselectAll = () => {
    setSelectedProjects([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await bulkDelete.mutateAsync(selectedProjects);
      setSelectedProjects([]);
      setShowBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting projects:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsBulkProcessing(true);
    try {
      await bulkUpdate.mutateAsync({ 
        ids: selectedProjects, 
        data: { status: status as "Planning" | "In Progress" | "On Hold" | "Completed" | "Cancelled" } 
      });
      setSelectedProjects([]);
      setShowBulkUpdateStatus(false);
    } catch (error) {
      console.error("Error bulk updating projects:", error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredProjects.filter(project => project.id !== undefined && selectedProjects.includes(project.id));
    
    if (selectedData.length === 0) {
      toast.error("No projects selected for export");
      return;
    }

    try {
      exportToCSV(
        selectedData, 
        exportColumns, 
        `selected-projects-${new Date().toISOString().split('T')[0]}.csv`
      );
      
      toast.success(`Successfully exported ${selectedData.length} projects`);
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to export projects");
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
    clearModuleFilters('projects');
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const colors = {
      Planning: "bg-muted text-muted-foreground",
      "In Progress": "bg-secondary/10 text-secondary",
      "On Hold": "bg-accent/10 text-accent",
      Completed: "bg-primary/10 text-primary",
      Cancelled: "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Get priority color helper
  const getPriorityColor = (priority: string) => {
    const colors = {
      Low: "bg-muted text-muted-foreground",
      Medium: "bg-primary/10 text-primary",
      High: "bg-accent/10 text-accent",
      Critical: "bg-destructive/10 text-destructive",
    };
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "n",
        meta: true,
        ctrl: true,
        description: "New project",
        action: () => {
          setEditingProject(null);
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
      key: "projectCode",
      label: "Project",
      sortable: true,
      render: (_value: unknown, row: typeof projects[0]) => (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/projects/${row.id}`)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
            {row.initials || "PR"}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.projectCode}</div>
            <div className="text-sm text-muted-foreground truncate max-w-xs">{row.projectName}</div>
          </div>
        </div>
      ),
    },
    {
      key: "client",
      label: "Client",
      sortable: true,
      render: (value: string, row: typeof projects[0]) => (
        <div>
          <span className="text-sm text-foreground">{value}</span>
          {row.projectManager && (
            <div className="text-xs text-muted-foreground">PM: {row.projectManager}</div>
          )}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
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
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-teal to-brand-purple"
              style={{ width: `${value || 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{value || 0}%</span>
        </div>
      ),
    },
    {
      key: "budget",
      label: "Budget",
      sortable: true,
      render: (value: string, row: typeof projects[0]) => (
        <div>
          <span className="text-sm text-foreground">{value || "$0"}</span>
          {row.spent && (
            <div className="text-xs text-muted-foreground">Spent: {row.spent}</div>
          )}
        </div>
      ),
    },
    {
      key: "endDate",
      label: "Due Date",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{value || "Not set"}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Projects"
        icon={FolderKanban}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${projects.length} projects`}
        searchPlaceholder="Search projects by name, client, or code..."
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
                title="Filter projects by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Projects"}
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
              title="Import projects from CSV or Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ExportButton
              data={filteredProjects}
              columns={exportColumns}
              filename="projects-export"
              title="Projects Export"
            />
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a new project"
              onClick={handleAddProject}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
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
        {selectedProjects.length > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedProjects.length}
            totalCount={filteredProjects.length}
            onSelectAll={handleSelectAllProjects}
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
          data={paginatedProjects}
          columns={columns}
          selectedIds={selectedProjects}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          loading={isLoading}
          emptyMessage="No projects found"
          emptyDescription="Try adjusting your search or filters, or add a new project"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/projects/${row.id}`),
                },
                {
                  label: "Edit Project",
                  icon: Edit,
                  onClick: () => handleEditProject(row),
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
          {paginatedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-lg font-bold">
                      {project.initials || "PR"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {project.projectCode}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {project.client}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/projects/${project.id}`),
                        },
                        {
                          label: "Edit Project",
                          icon: Edit,
                          onClick: () => handleEditProject(project),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteClick(project),
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {project.projectName}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-teal to-brand-purple"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{project.teamSize || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{project.budget || "$0"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{project.endDate || "No due date"}</span>
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
        totalItems={filteredProjects.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedProjects([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedProjects([]);
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
        title="Delete Project"
        description="Are you sure you want to delete this project? This will permanently remove it and all associated data. This action cannot be undone."
        itemName={projectToDelete?.projectName}
        itemType="Project"
        icon={FolderKanban}
        isDeleting={deleteProject.isPending}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        itemCount={selectedProjects.length}
        itemName="project"
      />

      {/* Bulk Update Status Modal */}
      <BulkUpdateModal<string>
        isOpen={showBulkUpdateStatus}
        onClose={() => setShowBulkUpdateStatus(false)}
        onConfirm={handleBulkUpdateStatus}
        itemCount={selectedProjects.length}
        title="Update Status"
        field="status"
        options={[
          { label: 'Planning', value: 'Planning' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'On Hold', value: 'On Hold' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Cancelled', value: 'Cancelled' },
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

      {/* Project Form Drawer */}
      <ProjectFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingProject}
        mode={formMode}
        defaultView={defaultView}
      />
    </div>
  );
}
