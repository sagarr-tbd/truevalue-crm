"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Plus,
  Filter,
  Download,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  ChevronDown,
  Check,
  Clock,
  Share2,
  Copy,
  BarChart2,
  PieChart,
  LineChart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle, { ViewMode } from "@/components/ViewToggle";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import ActionMenu from "@/components/ActionMenu";
import { ReportFormDrawer, type Report } from "@/components/Forms/Reports";
import { showSuccessToast } from "@/lib/toast";

// Reports data
const reports = [
  {
    id: 1,
    name: "Monthly Sales Summary",
    type: "Sales",
    category: "Performance",
    createdBy: "John Smith",
    lastRun: "Jan 27, 2026",
    frequency: "Monthly",
    status: "Active" as const,
    views: 145,
    created: "Dec 1, 2025",
    icon: DollarSign,
  },
  {
    id: 2,
    name: "Lead Conversion Report",
    type: "Sales",
    category: "Conversion",
    createdBy: "Jane Doe",
    lastRun: "Jan 28, 2026",
    frequency: "Weekly",
    status: "Active" as const,
    views: 89,
    created: "Dec 5, 2025",
    icon: TrendingUp,
  },
  {
    id: 3,
    name: "Customer Activity Analysis",
    type: "Customer",
    category: "Engagement",
    createdBy: "Mike Johnson",
    lastRun: "Jan 26, 2026",
    frequency: "Daily",
    status: "Active" as const,
    views: 234,
    created: "Nov 20, 2025",
    icon: Users,
  },
  {
    id: 4,
    name: "Revenue Forecast Q1 2026",
    type: "Financial",
    category: "Forecasting",
    createdBy: "Sarah Brown",
    lastRun: "Jan 25, 2026",
    frequency: "Quarterly",
    status: "Active" as const,
    views: 67,
    created: "Jan 1, 2026",
    icon: LineChart,
  },
  {
    id: 5,
    name: "Pipeline Health Check",
    type: "Sales",
    category: "Performance",
    createdBy: "John Smith",
    lastRun: "Jan 28, 2026",
    frequency: "Daily",
    status: "Active" as const,
    views: 198,
    created: "Dec 10, 2025",
    icon: BarChart2,
  },
  {
    id: 6,
    name: "Marketing Campaign ROI",
    type: "Marketing",
    category: "ROI",
    createdBy: "Jane Doe",
    lastRun: "Jan 20, 2026",
    frequency: "Monthly",
    status: "Scheduled" as const,
    views: 112,
    created: "Nov 15, 2025",
    icon: PieChart,
  },
  {
    id: 7,
    name: "Customer Retention Analysis",
    type: "Customer",
    category: "Retention",
    createdBy: "Mike Johnson",
    lastRun: "Jan 22, 2026",
    frequency: "Monthly",
    status: "Active" as const,
    views: 156,
    created: "Oct 28, 2025",
    icon: Users,
  },
  {
    id: 8,
    name: "Product Performance Report",
    type: "Product",
    category: "Performance",
    createdBy: "Sarah Brown",
    lastRun: "Jan 15, 2026",
    frequency: "Weekly",
    status: "Inactive" as const,
    views: 45,
    created: "Dec 18, 2025",
    icon: BarChart3,
  },
  {
    id: 9,
    name: "Sales Team Leaderboard",
    type: "Sales",
    category: "Performance",
    createdBy: "John Smith",
    lastRun: "Jan 28, 2026",
    frequency: "Daily",
    status: "Active" as const,
    views: 312,
    created: "Nov 1, 2025",
    icon: TrendingUp,
  },
  {
    id: 10,
    name: "Quarterly Business Review",
    type: "Executive",
    category: "Overview",
    createdBy: "Jane Doe",
    lastRun: "Jan 1, 2026",
    frequency: "Quarterly",
    status: "Scheduled" as const,
    views: 89,
    created: "Oct 1, 2025",
    icon: BarChart3,
  },
];

export default function ReportsPage() {
  const router = useRouter();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<typeof reports[0] | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<typeof reports[0] | null>(null);

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
      label: "All Reports",
      value: null,
      count: reports.length,
    },
    {
      label: "Sales",
      value: "Sales",
      count: reports.filter((r) => r.type === "Sales").length,
    },
    {
      label: "Customer",
      value: "Customer",
      count: reports.filter((r) => r.type === "Customer").length,
    },
    {
      label: "Financial",
      value: "Financial",
      count: reports.filter((r) => r.type === "Financial").length,
    },
    {
      label: "Marketing",
      value: "Marketing",
      count: reports.filter((r) => r.type === "Marketing").length,
    },
    {
      label: "Product",
      value: "Product",
      count: reports.filter((r) => r.type === "Product").length,
    },
    {
      label: "Executive",
      value: "Executive",
      count: reports.filter((r) => r.type === "Executive").length,
    },
  ], []);

  // Filter & sort logic
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (report) =>
          report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter((report) => report.type === typeFilter);
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
  }, [searchQuery, typeFilter, sortColumn, sortDirection]);

  // Pagination
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const activeReports = reports.filter((r) => r.status === "Active");
    const totalViews = reports.reduce((sum, report) => sum + report.views, 0);
    const scheduledReports = reports.filter((r) => r.status === "Scheduled");

    return [
      {
        label: "Total Reports",
        value: reports.length,
        icon: FileText,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        description: `${activeReports.length} active`,
      },
      {
        label: "Total Views",
        value: totalViews.toLocaleString(),
        icon: Eye,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 23, isPositive: true },
      },
      {
        label: "Active Reports",
        value: activeReports.length,
        icon: TrendingUp,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
      },
      {
        label: "Scheduled",
        value: scheduledReports.length,
        icon: Clock,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
    ];
  }, []);

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
    if (selectedReports.length === paginatedReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(paginatedReports.map((r) => r.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedReports.includes(numId)) {
      setSelectedReports(selectedReports.filter((rId) => rId !== numId));
    } else {
      setSelectedReports([...selectedReports, numId]);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      Active: "bg-primary/20 text-primary",
      Scheduled: "bg-accent/10 text-accent",
      Inactive: "bg-muted text-muted-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Form handlers
  const handleAddReport = () => {
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleEditReport = (report: typeof reports[0]) => {
    setEditingReport(report);
    setIsFormOpen(true);
  };

  const handleDeleteReport = (report: typeof reports[0]) => {
    setReportToDelete(report);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Report>) => {
    if (editingReport) {
      showSuccessToast(`Report "${data.name}" updated successfully`);
    } else {
      showSuccessToast(`Report "${data.name}" created successfully`);
    }
    setIsFormOpen(false);
    setEditingReport(null);
  };

  const confirmDelete = () => {
    if (reportToDelete) {
      showSuccessToast(`Report "${reportToDelete.name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setReportToDelete(null);
    }
  };

  // Table columns
  const columns = [
    {
      key: "name",
      label: "Report Name",
      sortable: true,
      render: (_: any, row: typeof reports[0]) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center">
            <row.icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (value: string) => (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
          {value}
        </span>
      ),
    },
    {
      key: "frequency",
      label: "Frequency",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {value}
        </div>
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
      key: "views",
      label: "Views",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="font-tabular font-semibold text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "lastRun",
      label: "Last Run",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {value}
        </div>
      ),
    },
    {
      key: "createdBy",
      label: "Created By",
      render: (value: string) => (
        <span className="text-sm text-foreground">{value}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Reports"
        icon={BarChart3}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`${reports.length} reports available`}
        searchPlaceholder="Search reports by name, type, or category..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
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
                title="Filter reports by type"
              >
                <Filter className="h-4 w-4 mr-2" />
                {typeFilter
                  ? filterOptions.find((f) => f.value === typeFilter)?.label
                  : "All Reports"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-56 bg-background rounded-lg shadow-lg border border-border py-2 z-50"
                  >
                    {filterOptions.map((option) => (
                      <button
                        key={option.value || "all"}
                        onClick={() => {
                          setTypeFilter(option.value);
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
                        {typeFilter === option.value && (
                          <Check className="h-4 w-4 text-brand-teal" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              title="Export reports"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Create a new report"
              onClick={handleAddReport}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {/* Data Table (List View) */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedReports}
          columns={columns}
          selectedIds={selectedReports}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          emptyMessage="No reports found"
          emptyDescription="Try adjusting your search or filters, or create a new report"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "Run Report",
                  icon: TrendingUp,
                  onClick: () => console.log("Run", row.id),
                },
                {
                  label: "View Details",
                  icon: FileText,
                  onClick: () => router.push(`/reports/${row.id}`),
                },
                {
                  label: "Edit Report",
                  icon: Edit,
                  onClick: () => handleEditReport(row),
                },
                {
                  label: "Duplicate",
                  icon: Copy,
                  onClick: () => console.log("Copy", row.id),
                },
                {
                  label: "Share",
                  icon: Share2,
                  onClick: () => console.log("Share", row.id),
                },
                { divider: true, label: "", onClick: () => {} },
                {
                  label: "Delete",
                  icon: Trash2,
                  variant: "danger",
                  onClick: () => handleDeleteReport(row),
                },
              ]}
            />
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-border hover:shadow-lg transition-shadow p-6 cursor-pointer hover:border-primary/50" onClick={() => router.push(`/reports/${report.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center">
                      <report.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {report.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{report.category}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "Run Report",
                          icon: TrendingUp,
                          onClick: () => console.log("Run", report.id),
                        },
                        {
                          label: "View Details",
                          icon: FileText,
                          onClick: () => router.push(`/reports/${report.id}`),
                        },
                        {
                          label: "Edit Report",
                          icon: Edit,
                          onClick: () => handleEditReport(report),
                        },
                        { divider: true, label: "", onClick: () => {} },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => handleDeleteReport(report),
                        },
                    ]}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                      {report.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <Clock className="h-4 w-4" />
                    <span>{report.frequency}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{report.lastRun}</span>
                    </div>
                    <div className="flex items-center gap-1 text-foreground">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold font-tabular">{report.views}</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground pt-2 border-t border-border">
                    By {report.createdBy}
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
        totalItems={filteredReports.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSelectedReports([]);
        }}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items);
          setCurrentPage(1);
          setSelectedReports([]);
        }}
        filterInfo={
          typeFilter ? `filtered by ${typeFilter}` : undefined
        }
      />

      {/* Report Form Drawer */}
      <ReportFormDrawer
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReport(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingReport}
        mode={editingReport ? "edit" : "add"}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setReportToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Report"
        description={
          reportToDelete
            ? `Are you sure you want to delete "${reportToDelete.name}"? This action cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
