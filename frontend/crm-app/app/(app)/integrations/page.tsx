"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plug,
  Mail,
  MessageSquare,
  Share2,
  Zap,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  ChevronDown,
  Check,
  Trash2,
  Power,
  Upload,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle, { ViewMode } from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";
import Link from "next/link";

// Integration data
const integrations = [
  {
    id: 1,
    name: "Email Integration",
    description: "Connect and manage email communications with your CRM",
    icon: Mail,
    category: "Communication",
    status: "connected",
    url: "/integrations/email",
    connectedAccounts: 3,
    lastSync: "2 hours ago",
    colorFrom: "from-brand-teal",
    colorTo: "to-primary",
    features: ["Auto-sync", "Two-way sync", "Templates"],
  },
  {
    id: 2,
    name: "Social Media",
    description: "Track engagement across all social media platforms",
    icon: Share2,
    category: "Marketing",
    status: "connected",
    url: "/integrations/social",
    connectedAccounts: 5,
    lastSync: "1 hour ago",
    colorFrom: "from-brand-coral",
    colorTo: "to-brand-purple",
    features: ["Auto-post", "Analytics", "Scheduling"],
  },
  {
    id: 3,
    name: "Calendar Sync",
    description: "Sync meetings and appointments with your calendar",
    icon: Calendar,
    category: "Productivity",
    status: "connected",
    url: "/integrations/visits",
    connectedAccounts: 2,
    lastSync: "30 minutes ago",
    colorFrom: "from-brand-teal",
    colorTo: "to-brand-purple",
    features: ["Meeting sync", "Reminders", "Availability"],
  },
  {
    id: 4,
    name: "Messaging Platform",
    description: "Integrate with messaging apps for instant communication",
    icon: MessageSquare,
    category: "Communication",
    status: "available",
    url: "#",
    connectedAccounts: 0,
    lastSync: null,
    colorFrom: "from-indigo-500",
    colorTo: "to-blue-600",
    features: ["Real-time chat", "Notifications", "File sharing"],
  },
  {
    id: 5,
    name: "Marketing Automation",
    description: "Automate marketing campaigns and track performance",
    icon: Zap,
    category: "Marketing",
    status: "available",
    url: "#",
    connectedAccounts: 0,
    lastSync: null,
    colorFrom: "from-orange-500",
    colorTo: "to-red-600",
    features: ["Campaign automation", "Lead scoring", "Analytics"],
  },
  {
    id: 6,
    name: "Analytics Platform",
    description: "Advanced analytics and reporting for your business",
    icon: BarChart3,
    category: "Analytics",
    status: "available",
    url: "#",
    connectedAccounts: 0,
    lastSync: null,
    colorFrom: "from-teal-500",
    colorTo: "to-cyan-600",
    features: ["Custom reports", "Data visualization", "Insights"],
  },
];
export default function IntegrationsPage() {
  const [showStats, setShowStats] = useState(true);
  const [selectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [selectedIntegrations, setSelectedIntegrations] = useState<number[]>([]);
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

  // Stats calculations
  const stats = useMemo(() => {
    const connected = integrations.filter((i) => i.status === "connected").length;
    const totalAccounts = integrations.reduce((sum, i) => sum + i.connectedAccounts, 0);

    return [
      {
        label: "Connected Integrations",
        value: connected,
        icon: CheckCircle,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        description: `${integrations.length - connected} available`,
      },
      {
        label: "Connected Accounts",
        value: totalAccounts,
        icon: Users,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Active Categories",
        value: new Set(integrations.filter((i) => i.status === "connected").map((i) => i.category)).size,
        icon: Filter,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        label: "Sync Health",
        value: "98%",
        icon: TrendingUp,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 3, isPositive: true },
      },
    ];
  }, []);

  // Filter options for dropdown
  const filterOptions = useMemo(() => [
    {
      label: "All Status",
      value: "All Status",
      count: integrations.length,
    },
    {
      label: "Connected",
      value: "Connected",
      count: integrations.filter((i) => i.status === "connected").length,
    },
    {
      label: "Available",
      value: "Available",
      count: integrations.filter((i) => i.status === "available").length,
    },
  ], []);

  // Filter integrations
  const filteredIntegrations = useMemo(() => {
    let filtered = integrations;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((i) => i.category === selectedCategory);
    }

    if (selectedStatus !== "All Status") {
      const statusValue = selectedStatus.toLowerCase();
      filtered = filtered.filter((i) => i.status === statusValue);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
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
  }, [selectedCategory, selectedStatus, searchQuery, sortColumn, sortDirection]);

  // Pagination
  const paginatedIntegrations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredIntegrations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredIntegrations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredIntegrations.length / itemsPerPage);

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
    if (selectedIntegrations.length === paginatedIntegrations.length) {
      setSelectedIntegrations([]);
    } else {
      setSelectedIntegrations(paginatedIntegrations.map((i) => i.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedIntegrations.includes(numId)) {
      setSelectedIntegrations(selectedIntegrations.filter((iId) => iId !== numId));
    } else {
      setSelectedIntegrations([...selectedIntegrations, numId]);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "connected") {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
          <CheckCircle className="h-3 w-3" />
          Connected
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        Available
      </span>
    );
  };

  // Table columns for list view
  const columns = [
    {
      key: "name",
      label: "Integration",
      sortable: true,
      render: (_: any, row: typeof integrations[0]) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${row.colorFrom} ${row.colorTo} text-white flex items-center justify-center`}>
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
      key: "description",
      label: "Description",
      render: (value: string) => (
        <span className="text-sm text-foreground">{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "connectedAccounts",
      label: "Accounts",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground font-tabular">{value}</span>
        </div>
      ),
    },
    {
      key: "lastSync",
      label: "Last Sync",
      render: (value: string | null) => (
        <span className="text-sm text-muted-foreground">
          {value || "Never"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Integrations"
        icon={Plug}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle="Connect your favorite tools and platforms"
        searchPlaceholder="Search integrations..."
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
                {selectedStatus}
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
                        key={option.value}
                        onClick={() => {
                          setSelectedStatus(option.value);
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
                        {selectedStatus === option.value && (
                          <Check className="h-4 w-4 text-primary" />
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
              title="Import integrations"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              title="Export integrations"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              title="Add a custom integration"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <AnimatePresence>{showStats && <StatsCards stats={stats} columns={4} />}</AnimatePresence>

      {/* Integrations List View */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedIntegrations}
          columns={columns}
          selectedIds={selectedIntegrations}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No integrations found"
          emptyDescription="Try adjusting your search or filters"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: row.status === "connected" ? "View Details" : "Connect",
                  icon: row.status === "connected" ? Eye : Power,
                  onClick: () => console.log(row.status === "connected" ? "View" : "Connect", row.id),
                },
                {
                  label: "Settings",
                  icon: Settings,
                  onClick: () => console.log("Settings", row.id),
                  disabled: row.status !== "connected",
                },
                { divider: true, label: "", onClick: () => {} },
                {
                  label: "Disconnect",
                  icon: Trash2,
                  variant: "danger",
                  onClick: () => console.log("Disconnect", row.id),
                  disabled: row.status !== "connected",
                },
              ]}
            />
          )}
        />
      ) : (
        /* Integrations Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedIntegrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border border-border hover:shadow-lg transition-all group h-full flex flex-col">
              <div className="p-6 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${integration.colorFrom} ${integration.colorTo} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <integration.icon className="h-7 w-7" />
                  </div>
                  {getStatusBadge(integration.status)}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {integration.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {integration.description}
                </p>

                {/* Category & Accounts */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">
                      {integration.category}
                    </span>
                  </div>
                  {integration.connectedAccounts > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {integration.connectedAccounts} account
                        {integration.connectedAccounts !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {integration.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Last Sync */}
                {integration.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {integration.lastSync}
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                  {integration.status === "connected" ? (
                    <>
                      <Link href={integration.url} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Integration settings"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
        </div>
      )}

      {/* Empty State */}
      {paginatedIntegrations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No integrations found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or category filter
          </p>
        </motion.div>
      )}

      {/* Pagination */}
      {paginatedIntegrations.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredIntegrations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSelectedIntegrations([]);
          }}
          onItemsPerPageChange={(items) => {
            setItemsPerPage(items);
            setCurrentPage(1);
            setSelectedIntegrations([]);
          }}
          filterInfo={
            selectedCategory !== "All" || selectedStatus !== "All Status"
              ? `filtered by ${[
                  selectedCategory !== "All" ? selectedCategory : null,
                  selectedStatus !== "All Status" ? selectedStatus : null,
                ]
                  .filter(Boolean)
                  .join(" & ")}`
              : undefined
          }
        />
      )}
    </div>
  );
}
