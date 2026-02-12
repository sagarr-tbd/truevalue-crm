"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Filter,
  Eye,
  EyeOff,
  Settings,
  Check,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  ChevronDown,
  Trash2,
  MapPinned,
  Navigation,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle, { ViewMode } from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";

// Visits data
const visits = [
  {
    id: 1,
    customer: "Acme Corporation",
    contact: "John Smith",
    location: "123 Business St, New York, NY",
    date: "Jan 28, 2026",
    time: "10:00 AM",
    duration: "2 hours",
    status: "scheduled",
    assignedTo: "Jane Doe",
    visitType: "Sales Meeting",
    distance: "5.2 miles",
  },
  {
    id: 2,
    customer: "Tech Solutions Inc",
    contact: "Sarah Johnson",
    location: "456 Tech Plaza, San Francisco, CA",
    date: "Jan 28, 2026",
    time: "2:00 PM",
    duration: "1.5 hours",
    status: "in-progress",
    assignedTo: "Mike Wilson",
    visitType: "Demo",
    distance: "8.7 miles",
  },
  {
    id: 3,
    customer: "Global Industries",
    contact: "Robert Brown",
    location: "789 Corporate Ave, Chicago, IL",
    date: "Jan 27, 2026",
    time: "11:00 AM",
    duration: "3 hours",
    status: "completed",
    assignedTo: "Jane Doe",
    visitType: "Contract Signing",
    distance: "12.3 miles",
  },
  {
    id: 4,
    customer: "StartUp Labs",
    contact: "Emily Davis",
    location: "321 Innovation Dr, Austin, TX",
    date: "Jan 29, 2026",
    time: "9:00 AM",
    duration: "1 hour",
    status: "scheduled",
    assignedTo: "David Lee",
    visitType: "Follow-up",
    distance: "3.8 miles",
  },
  {
    id: 5,
    customer: "Enterprise Co",
    contact: "Michael Chen",
    location: "654 Business Park, Seattle, WA",
    date: "Jan 27, 2026",
    time: "3:00 PM",
    duration: "2 hours",
    status: "cancelled",
    assignedTo: "Sarah Miller",
    visitType: "Sales Meeting",
    distance: "15.1 miles",
  },
  {
    id: 6,
    customer: "Retail Plus",
    contact: "Lisa Anderson",
    location: "987 Shopping Center, Miami, FL",
    date: "Jan 30, 2026",
    time: "1:00 PM",
    duration: "1 hour",
    status: "scheduled",
    assignedTo: "Mike Wilson",
    visitType: "Product Demo",
    distance: "6.9 miles",
  },
];

export default function VisitsPage() {
  const [showStats, setShowStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedVisits, setSelectedVisits] = useState<number[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
      label: "All Visits",
      value: null,
      count: visits.length,
    },
    {
      label: "Scheduled",
      value: "scheduled",
      count: visits.filter((v) => v.status === "scheduled").length,
    },
    {
      label: "In Progress",
      value: "in-progress",
      count: visits.filter((v) => v.status === "in-progress").length,
    },
    {
      label: "Completed",
      value: "completed",
      count: visits.filter((v) => v.status === "completed").length,
    },
    {
      label: "Cancelled",
      value: "cancelled",
      count: visits.filter((v) => v.status === "cancelled").length,
    },
  ], []);

  // Stats calculations
  const stats = useMemo(() => {
    const scheduled = visits.filter((v) => v.status === "scheduled").length;
    const completed = visits.filter((v) => v.status === "completed").length;
    const inProgress = visits.filter((v) => v.status === "in-progress").length;
    const totalDistance = visits
      .filter((v) => v.status !== "cancelled")
      .reduce((sum, v) => sum + parseFloat(v.distance), 0);

    return [
      {
        label: "Scheduled Visits",
        value: scheduled,
        icon: Calendar,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "In Progress",
        value: inProgress,
        icon: Navigation,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Completed Today",
        value: completed,
        icon: CheckCircle,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Total Distance",
        value: `${totalDistance.toFixed(1)} mi`,
        icon: MapPinned,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
      },
    ];
  }, []);

  // Filter & sort logic
  const filteredVisits = useMemo(() => {
    let filtered = visits;

    if (searchQuery) {
      filtered = filtered.filter(
        (visit) =>
          visit.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((visit) => visit.status === statusFilter);
    }

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
  }, [searchQuery, statusFilter, sortColumn, sortDirection]);

  // Pagination
  const paginatedVisits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVisits.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVisits, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);

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
    if (selectedVisits.length === paginatedVisits.length) {
      setSelectedVisits([]);
    } else {
      setSelectedVisits(paginatedVisits.map((v) => v.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedVisits.includes(numId)) {
      setSelectedVisits(selectedVisits.filter((vId) => vId !== numId));
    } else {
      setSelectedVisits([...selectedVisits, numId]);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
          <Calendar className="h-3 w-3" />
          Scheduled
        </span>
      ),
      "in-progress": (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
          <Navigation className="h-3 w-3" />
          In Progress
        </span>
      ),
      completed: (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
          <CheckCircle className="h-3 w-3" />
          Completed
        </span>
      ),
      cancelled: (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
          <AlertCircle className="h-3 w-3" />
          Cancelled
        </span>
      ),
    };
    return badges[status as keyof typeof badges];
  };

  // Table columns
  const columns = [
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (_: any, row: typeof visits[0]) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.customer}</div>
            <div className="text-sm text-muted-foreground">{row.contact}</div>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date & Time",
      sortable: true,
      render: (_: any, row: typeof visits[0]) => (
        <div>
          <div className="font-medium text-foreground">{row.date}</div>
          <div className="text-sm text-muted-foreground">{row.time} • {row.duration}</div>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (value: string, row: typeof visits[0]) => (
        <div>
          <div className="text-sm text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{row.distance} away</div>
        </div>
      ),
    },
    {
      key: "visitType",
      label: "Type",
      render: (value: string) => (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-muted text-foreground">
          {value}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (value: string) => (
        <span className="text-sm text-foreground">{value}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Field Visits"
        icon={MapPin}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`Track customer visits and field activities • ${visits.length} visits`}
        searchPlaceholder="Search visits..."
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
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} showLabels={false} />
            
            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter by status"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter
                  ? filterOptions.find((f) => f.value === statusFilter)?.label
                  : "All Visits"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    {filterOptions.map((option) => (
                      <button
                        key={option.value || "all"}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setShowFilterDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-muted transition-colors"
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

            <Button
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Schedule a new visit"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Visit
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <AnimatePresence>{showStats && <StatsCards stats={stats} columns={4} />}</AnimatePresence>

      {/* List View */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedVisits}
          columns={columns}
          selectedIds={selectedVisits}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No visits found"
          emptyDescription="Schedule your first visit to get started"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: Eye,
                  onClick: () => console.log("View", row.id),
                },
                {
                  label: "Get Directions",
                  icon: Navigation,
                  onClick: () => console.log("Directions", row.id),
                  disabled: row.status === "cancelled",
                },
                {
                  label: "Reschedule",
                  icon: Calendar,
                  onClick: () => console.log("Reschedule", row.id),
                  disabled: row.status === "completed",
                },
                { divider: true, label: "", onClick: () => {} },
                {
                  label: "Cancel Visit",
                  icon: Trash2,
                  variant: "danger",
                  onClick: () => console.log("Cancel", row.id),
                  disabled: row.status === "completed" || row.status === "cancelled",
                },
              ]}
            />
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedVisits.map((visit, index) => (
            <motion.div
              key={visit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-gray-200 hover:shadow-lg transition-all group h-full flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="h-7 w-7" />
                    </div>
                    {getStatusBadge(visit.status)}
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {visit.customer}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{visit.contact}</p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-foreground">{visit.date}</div>
                        <div className="text-muted-foreground">{visit.time} • {visit.duration}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="text-foreground">{visit.location}</div>
                        <div className="text-muted-foreground">{visit.distance} away</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{visit.assignedTo}</span>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-muted text-foreground">
                        {visit.visitType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary"
                      disabled={visit.status === "cancelled"}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Directions
                    </Button>
                    <Button variant="ghost" size="sm" title="More options">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {paginatedVisits.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredVisits.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSelectedVisits([]);
          }}
          onItemsPerPageChange={(items) => {
            setItemsPerPage(items);
            setCurrentPage(1);
            setSelectedVisits([]);
          }}
          filterInfo={statusFilter ? `filtered by ${statusFilter}` : undefined}
        />
      )}
    </div>
  );
}
