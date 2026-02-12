"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Plus,
  Filter,
  Eye,
  EyeOff,
  Settings,
  Check,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  MessageCircle,
  ChevronDown,
  RefreshCw,
  Power,
  BarChart3,
  Calendar,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle, { ViewMode } from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";

// Social media accounts data
const socialAccounts = [
  {
    id: 1,
    name: "TrueValue CRM",
    platform: "Facebook",
    username: "@truevaluecrm",
    status: "connected",
    lastSync: "10 minutes ago",
    followers: 15420,
    engagement: 4.8,
    postsToday: 3,
    likesToday: 245,
    commentsToday: 68,
    autoPost: true,
  },
  {
    id: 2,
    name: "TrueValue CRM",
    platform: "Twitter",
    username: "@truevaluecrm",
    status: "connected",
    lastSync: "5 minutes ago",
    followers: 8750,
    engagement: 3.2,
    postsToday: 5,
    likesToday: 432,
    commentsToday: 89,
    autoPost: true,
  },
  {
    id: 3,
    name: "TrueValue CRM",
    platform: "LinkedIn",
    username: "truevalue-crm",
    status: "connected",
    lastSync: "1 hour ago",
    followers: 12340,
    engagement: 6.1,
    postsToday: 2,
    likesToday: 567,
    commentsToday: 124,
    autoPost: false,
  },
  {
    id: 4,
    name: "TrueValue CRM",
    platform: "Instagram",
    username: "@truevalue.crm",
    status: "connected",
    lastSync: "30 minutes ago",
    followers: 22100,
    engagement: 5.4,
    postsToday: 4,
    likesToday: 892,
    commentsToday: 156,
    autoPost: true,
  },
  {
    id: 5,
    name: "TrueValue Support",
    platform: "Twitter",
    username: "@truevaluesupport",
    status: "error",
    lastSync: "3 days ago",
    followers: 4200,
    engagement: 0,
    postsToday: 0,
    likesToday: 0,
    commentsToday: 0,
    autoPost: false,
  },
];

export default function SocialMediaPage() {
  const [showStats, setShowStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
      label: "All Accounts",
      value: null,
      count: socialAccounts.length,
    },
    {
      label: "Connected",
      value: "connected",
      count: socialAccounts.filter((a) => a.status === "connected").length,
    },
    {
      label: "Error",
      value: "error",
      count: socialAccounts.filter((a) => a.status === "error").length,
    },
  ], []);

  // Stats calculations
  const stats = useMemo(() => {
    const connected = socialAccounts.filter((a) => a.status === "connected").length;
    const totalFollowers = socialAccounts.reduce((sum, a) => sum + a.followers, 0);
    const totalPosts = socialAccounts.reduce((sum, a) => sum + a.postsToday, 0);
    const avgEngagement = (
      socialAccounts.filter((a) => a.status === "connected").reduce((sum, a) => sum + a.engagement, 0) /
      connected
    ).toFixed(1);

    return [
      {
        label: "Connected Accounts",
        value: connected,
        icon: CheckCircle,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        description: `${socialAccounts.length} total accounts`,
      },
      {
        label: "Total Followers",
        value: `${(totalFollowers / 1000).toFixed(1)}K`,
        icon: Users,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 15, isPositive: true },
      },
      {
        label: "Posts Today",
        value: totalPosts,
        icon: MessageCircle,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Avg Engagement",
        value: `${avgEngagement}%`,
        icon: TrendingUp,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 12, isPositive: true },
      },
    ];
  }, []);

  // Filter & sort logic
  const filteredAccounts = useMemo(() => {
    let filtered = socialAccounts;

    if (searchQuery) {
      filtered = filtered.filter(
        (account) =>
          account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((account) => account.status === statusFilter);
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
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

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
    if (selectedAccounts.length === paginatedAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(paginatedAccounts.map((a) => a.id));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const numId = typeof id === "string" ? parseInt(id) : id;
    if (selectedAccounts.includes(numId)) {
      setSelectedAccounts(selectedAccounts.filter((aId) => aId !== numId));
    } else {
      setSelectedAccounts([...selectedAccounts, numId]);
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
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
        <AlertCircle className="h-3 w-3" />
        Error
      </span>
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Facebook": return Facebook;
      case "Twitter": return Twitter;
      case "Instagram": return Instagram;
      case "LinkedIn": return Linkedin;
      default: return Share2;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "Facebook": return "from-brand-teal to-primary";
      case "Twitter": return "from-brand-teal to-brand-purple";
      case "Instagram": return "from-brand-coral via-brand-purple to-accent";
      case "LinkedIn": return "from-secondary to-brand-purple";
      default: return "from-muted to-muted-foreground";
    }
  };

  // Table columns
  const columns = [
    {
      key: "name",
      label: "Account",
      sortable: true,
      render: (_: any, row: typeof socialAccounts[0]) => {
        const Icon = getPlatformIcon(row.platform);
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getPlatformColor(row.platform)} text-white flex items-center justify-center`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{row.name}</div>
              <div className="text-sm text-muted-foreground">{row.username}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "platform",
      label: "Platform",
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-foreground">{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "followers",
      label: "Followers",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground font-tabular">
            {value.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: "engagement",
      label: "Engagement",
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-primary font-tabular">{value}%</span>
      ),
    },
    {
      key: "postsToday",
      label: "Posts Today",
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-foreground font-tabular">{value}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Social Media Integration"
        icon={Share2}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`Connect and manage social media accounts • ${socialAccounts.length} accounts`}
        searchPlaceholder="Search social accounts..."
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
                  : "All Accounts"}
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
              title="Connect a new social account"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <AnimatePresence>{showStats && <StatsCards stats={stats} columns={4} />}</AnimatePresence>

      {/* List View */}
      {viewMode === "list" ? (
        <DataTable
          data={paginatedAccounts}
          columns={columns}
          selectedIds={selectedAccounts}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          showSelection={true}
          getRowId={(row) => row.id}
          emptyMessage="No social accounts found"
          emptyDescription="Connect your first social media account to get started"
          renderActions={(row) => (
            <ActionMenu
              items={[
                {
                  label: "View Analytics",
                  icon: BarChart3,
                  onClick: () => console.log("Analytics", row.id),
                  disabled: row.status === "error",
                },
                {
                  label: "Sync Now",
                  icon: RefreshCw,
                  onClick: () => console.log("Sync", row.id),
                  disabled: row.status === "error",
                },
                {
                  label: "Settings",
                  icon: Settings,
                  onClick: () => console.log("Settings", row.id),
                },
                { divider: true, label: "", onClick: () => {} },
                {
                  label: "Disconnect",
                  icon: Power,
                  variant: "danger",
                  onClick: () => console.log("Disconnect", row.id),
                },
              ]}
            />
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedAccounts.map((account, index) => {
            const Icon = getPlatformIcon(account.platform);
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border border-gray-200 hover:shadow-lg transition-all group h-full flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getPlatformColor(account.platform)} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      {getStatusBadge(account.status)}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {account.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">{account.platform}</p>
                    <p className="text-sm text-muted-foreground mb-4">{account.username}</p>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Followers</p>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-secondary" />
                            <p className="text-lg font-bold text-foreground font-tabular">
                              {(account.followers / 1000).toFixed(1)}K
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                          <p className="text-lg font-bold text-primary font-tabular">
                            {account.engagement}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Posts</p>
                          <p className="text-sm font-bold text-foreground font-tabular">{account.postsToday}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Likes</p>
                          <p className="text-sm font-bold text-foreground font-tabular">{account.likesToday}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Comments</p>
                          <p className="text-sm font-bold text-foreground font-tabular">{account.commentsToday}</p>
                        </div>
                      </div>

                      {account.autoPost && (
                        <div className="pt-3 border-t border-gray-100">
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary flex items-center gap-1 w-fit">
                            <Calendar className="h-3 w-3" />
                            Auto-posting enabled
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary"
                        disabled={account.status === "error"}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                      <Button variant="ghost" size="sm" title="Settings">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {paginatedAccounts.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAccounts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSelectedAccounts([]);
          }}
          onItemsPerPageChange={(items) => {
            setItemsPerPage(items);
            setCurrentPage(1);
            setSelectedAccounts([]);
          }}
          filterInfo={statusFilter ? `filtered by ${statusFilter}` : undefined}
        />
      )}
    </div>
  );
}
