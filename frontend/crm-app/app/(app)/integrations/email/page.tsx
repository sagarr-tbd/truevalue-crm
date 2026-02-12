"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Plus,
  Filter,
  Eye,
  EyeOff,
  Settings,
  Check,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Send,
  Inbox,
  ChevronDown,
  RefreshCw,
  Power,
  Zap,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import DataPagination from "@/components/DataPagination";
import ViewToggle, { ViewMode } from "@/components/ViewToggle";
import ActionMenu from "@/components/ActionMenu";

// Email accounts data
const emailAccounts = [
  {
    id: 1,
    email: "sales@truevaluecrm.com",
    provider: "Gmail",
    status: "connected",
    lastSync: "5 minutes ago",
    sentToday: 42,
    receivedToday: 128,
    syncStatus: "active",
    autoSync: true,
    twoWaySync: true,
  },
  {
    id: 2,
    email: "support@truevaluecrm.com",
    provider: "Outlook",
    status: "connected",
    lastSync: "10 minutes ago",
    sentToday: 18,
    receivedToday: 89,
    syncStatus: "active",
    autoSync: true,
    twoWaySync: true,
  },
  {
    id: 3,
    email: "info@truevaluecrm.com",
    provider: "Gmail",
    status: "connected",
    lastSync: "1 hour ago",
    sentToday: 7,
    receivedToday: 34,
    syncStatus: "active",
    autoSync: false,
    twoWaySync: false,
  },
  {
    id: 4,
    email: "marketing@truevaluecrm.com",
    provider: "Outlook",
    status: "error",
    lastSync: "2 days ago",
    sentToday: 0,
    receivedToday: 0,
    syncStatus: "error",
    autoSync: true,
    twoWaySync: true,
  },
];

export default function EmailIntegrationPage() {
  const [showStats, setShowStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
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
      label: "All Accounts",
      value: null,
      count: emailAccounts.length,
    },
    {
      label: "Connected",
      value: "connected",
      count: emailAccounts.filter((a) => a.status === "connected").length,
    },
    {
      label: "Error",
      value: "error",
      count: emailAccounts.filter((a) => a.status === "error").length,
    },
  ], []);

  // Stats calculations
  const stats = useMemo(() => {
    const connected = emailAccounts.filter((a) => a.status === "connected").length;
    const totalSent = emailAccounts.reduce((sum, a) => sum + a.sentToday, 0);
    const totalReceived = emailAccounts.reduce((sum, a) => sum + a.receivedToday, 0);

    return [
      {
        label: "Connected Accounts",
        value: connected,
        icon: CheckCircle,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        description: `${emailAccounts.length} total accounts`,
      },
      {
        label: "Emails Sent Today",
        value: totalSent,
        icon: Send,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Emails Received Today",
        value: totalReceived,
        icon: Inbox,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Sync Health",
        value: "98%",
        icon: TrendingUp,
        iconBgColor: "bg-primary/20",
        iconColor: "text-primary",
        trend: { value: 2, isPositive: true },
      },
    ];
  }, []);

  // Filter & sort logic
  const filteredAccounts = useMemo(() => {
    let filtered = emailAccounts;

    if (searchQuery) {
      filtered = filtered.filter(
        (account) =>
          account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.provider.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getProviderColor = (provider: string) => {
    if (provider === "Gmail") return "from-brand-coral to-accent";
    if (provider === "Outlook") return "from-brand-teal to-primary";
    return "from-muted to-muted-foreground";
  };

  // Table columns
  const columns = [
    {
      key: "email",
      label: "Email Account",
      sortable: true,
      render: (_: any, row: typeof emailAccounts[0]) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getProviderColor(row.provider)} text-white flex items-center justify-center`}>
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.email}</div>
            <div className="text-sm text-muted-foreground">{row.provider}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "lastSync",
      label: "Last Sync",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "sentToday",
      label: "Sent Today",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-secondary" />
          <span className="font-semibold text-foreground font-tabular">{value}</span>
        </div>
      ),
    },
    {
      key: "receivedToday",
      label: "Received Today",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-accent" />
          <span className="font-semibold text-foreground font-tabular">{value}</span>
        </div>
      ),
    },
    {
      key: "autoSync",
      label: "Features",
      render: (_: any, row: typeof emailAccounts[0]) => (
        <div className="flex flex-wrap gap-2">
          {row.autoSync && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
              Auto-sync
            </span>
          )}
          {row.twoWaySync && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-secondary/10 text-secondary">
              Two-way
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Email Integration"
        icon={Mail}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle={`Connect and manage email communications • ${emailAccounts.length} accounts`}
        searchPlaceholder="Search email accounts..."
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
              title="Connect a new email account"
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
          emptyMessage="No email accounts found"
          emptyDescription="Connect your first email account to get started"
          renderActions={(row) => (
            <ActionMenu
              items={[
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
          {paginatedAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-gray-200 hover:shadow-lg transition-all group h-full flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getProviderColor(account.provider)} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Mail className="h-7 w-7" />
                    </div>
                    {getStatusBadge(account.status)}
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {account.email}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{account.provider}</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last synced</span>
                      <span className="text-sm font-medium text-foreground">{account.lastSync}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sent Today</p>
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-secondary" />
                          <p className="text-lg font-bold text-foreground font-tabular">{account.sentToday}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Received</p>
                        <div className="flex items-center gap-2">
                          <Inbox className="h-4 w-4 text-accent" />
                          <p className="text-lg font-bold text-foreground font-tabular">{account.receivedToday}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {account.autoSync && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Auto-sync
                        </span>
                      )}
                      {account.twoWaySync && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-secondary/10 text-secondary flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Two-way
                        </span>
                      )}
                    </div>
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
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now
                    </Button>
                    <Button variant="ghost" size="sm" title="Settings">
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
