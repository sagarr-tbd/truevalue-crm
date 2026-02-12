"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  BarChart3,
  LineChart,
  Zap,
  Award,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import {
  SalesTrendChart,
  PipelineChart,
  LeadSourceChart,
  ActivityChart,
  RevenueComparisonChart,
} from "@/components/Charts";

// Analytics metrics data
const metrics = {
  revenue: {
    current: 1245000,
    previous: 1089000,
    change: 14.3,
    trend: "up",
  },
  customers: {
    current: 2845,
    previous: 2634,
    change: 8.0,
    trend: "up",
  },
  conversion: {
    current: 32.5,
    previous: 29.8,
    change: 9.1,
    trend: "up",
  },
  avgDealSize: {
    current: 48500,
    previous: 52300,
    change: -7.3,
    trend: "down",
  },
};

const performanceData = [
  {
    metric: "Sales Velocity",
    value: "12.5 days",
    change: -15.2,
    status: "excellent",
    icon: Zap,
    description: "Average time to close",
  },
  {
    metric: "Win Rate",
    value: "68%",
    change: 5.3,
    status: "good",
    icon: Award,
    description: "Deals won vs total",
  },
  {
    metric: "Pipeline Value",
    value: "$2.4M",
    change: 22.8,
    status: "excellent",
    icon: TrendingUp,
    description: "Active opportunities",
  },
  {
    metric: "Avg Response Time",
    value: "2.3 hours",
    change: -18.5,
    status: "excellent",
    icon: Clock,
    description: "Time to first response",
  },
];

const topPerformers = [
  { name: "John Smith", deals: 45, revenue: 425000, rank: 1, avatar: "JS" },
  { name: "Jane Doe", deals: 38, revenue: 389000, rank: 2, avatar: "JD" },
  { name: "Mike Johnson", deals: 32, revenue: 312000, rank: 3, avatar: "MJ" },
  { name: "Sarah Brown", deals: 28, revenue: 289000, rank: 4, avatar: "SB" },
  { name: "David Wilson", deals: 25, revenue: 265000, rank: 5, avatar: "DW" },
];

const revenueByCategory = [
  { category: "Enterprise", value: 485000, percentage: 39, color: "from-brand-teal to-brand-purple" },
  { category: "Mid-Market", value: 372000, percentage: 30, color: "from-brand-purple to-brand-coral" },
  { category: "Small Business", value: 248000, percentage: 20, color: "from-brand-coral to-brand-teal" },
  { category: "Startup", value: 140000, percentage: 11, color: "from-primary to-secondary" },
];

export default function AnalyticsPage() {
  const [showStats, setShowStats] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");

  // Main stats
  const stats = useMemo(() => [
    {
      label: "Total Revenue",
      value: `$${(metrics.revenue.current / 1000).toFixed(0)}K`,
      icon: DollarSign,
      iconBgColor: "bg-primary/10",
      iconColor: "text-primary",
      trend: { value: metrics.revenue.change, isPositive: true },
      description: `vs $${(metrics.revenue.previous / 1000).toFixed(0)}K last period`,
    },
    {
      label: "Total Customers",
      value: metrics.customers.current.toLocaleString(),
      icon: Users,
      iconBgColor: "bg-secondary/10",
      iconColor: "text-secondary",
      trend: { value: metrics.customers.change, isPositive: true },
      description: `+${metrics.customers.current - metrics.customers.previous} new`,
    },
    {
      label: "Conversion Rate",
      value: `${metrics.conversion.current}%`,
      icon: Target,
      iconBgColor: "bg-primary/20",
      iconColor: "text-primary",
      trend: { value: metrics.conversion.change, isPositive: true },
    },
    {
      label: "Avg Deal Size",
      value: `$${(metrics.avgDealSize.current / 1000).toFixed(0)}K`,
      icon: BarChart3,
      iconBgColor: "bg-accent/10",
      iconColor: "text-accent",
      trend: { value: Math.abs(metrics.avgDealSize.change), isPositive: false },
    },
  ], []);

  const getStatusColor = (status: string) => {
    const colors = {
      excellent: "text-primary",
      good: "text-secondary",
      warning: "text-accent",
    };
    return colors[status as keyof typeof colors] || "text-muted-foreground";
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-brand-coral to-accent";
    if (rank === 2) return "bg-gradient-to-br from-muted to-muted-foreground";
    if (rank === 3) return "bg-gradient-to-br from-brand-coral to-brand-purple";
    return "bg-gradient-to-br from-brand-teal to-brand-purple";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Analytics"
        icon={PieChart}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle="Advanced insights and performance metrics"
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
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 border border-border rounded-lg p-1">
              {["7d", "30d", "90d", "1y"].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={
                    timeRange === range
                      ? "bg-gradient-to-r from-brand-teal to-brand-purple text-white"
                      : ""
                  }
                >
                  {range === "7d" && "7 Days"}
                  {range === "30d" && "30 Days"}
                  {range === "90d" && "90 Days"}
                  {range === "1y" && "1 Year"}
                </Button>
              ))}
            </div>
          </>
        }
      />

      {/* Main Stats Cards */}
      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceData.map((item, index) => (
          <motion.div
            key={item.metric}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${item.change > 0 ? 'text-primary' : 'text-destructive'}`}>
                  {item.change > 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(item.change)}%
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {item.metric}
                </h3>
                <p className={`text-2xl font-bold ${getStatusColor(item.status)}`}>
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Revenue by Category</h3>
                <p className="text-sm text-muted-foreground">Distribution across segments</p>
              </div>
              <PieChart className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-4">
              {revenueByCategory.map((item, index) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.category}</span>
                    <span className="font-semibold font-tabular text-foreground">
                      ${(item.value / 1000).toFixed(0)}K ({item.percentage}%)
                    </span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total Revenue</span>
                <span className="text-lg font-bold text-primary font-tabular">
                  $1.24M
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Top Performers</h3>
                <p className="text-sm text-muted-foreground">Leaderboard this month</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <motion.div
                  key={performer.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${getRankBadgeColor(performer.rank)} text-white flex items-center justify-center font-bold text-sm`}>
                    #{performer.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                    {performer.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{performer.name}</p>
                    <p className="text-sm text-muted-foreground">{performer.deals} deals</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground font-tabular">
                      ${(performer.revenue / 1000).toFixed(0)}K
                    </p>
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <TrendingUp className="h-3 w-3" />
                      <span>+12%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Activity Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Activity Overview</h3>
              <p className="text-sm text-muted-foreground">Recent activity trends</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Target className="h-8 w-8" />
              </div>
              <p className="text-2xl font-bold text-foreground font-tabular">245</p>
              <p className="text-sm text-muted-foreground">Active Leads</p>
              <div className="flex items-center justify-center gap-1 text-xs text-primary mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+18%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                <Calendar className="h-8 w-8" />
              </div>
              <p className="text-2xl font-bold text-foreground font-tabular">128</p>
              <p className="text-sm text-muted-foreground">Meetings</p>
              <div className="flex items-center justify-center gap-1 text-xs text-primary mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+24%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 text-accent flex items-center justify-center mb-3">
                <LineChart className="h-8 w-8" />
              </div>
              <p className="text-2xl font-bold text-foreground font-tabular">89</p>
              <p className="text-sm text-muted-foreground">Proposals</p>
              <div className="flex items-center justify-center gap-1 text-xs text-primary mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+32%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 text-primary flex items-center justify-center mb-3">
                <DollarSign className="h-8 w-8" />
              </div>
              <p className="text-2xl font-bold text-foreground font-tabular">45</p>
              <p className="text-sm text-muted-foreground">Closed Deals</p>
              <div className="flex items-center justify-center gap-1 text-xs text-primary mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+15%</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <SalesTrendChart timeRange={timeRange as "7d" | "30d" | "90d"} />
        <PipelineChart />
        <LeadSourceChart />
        <ActivityChart timeRange={timeRange as "7d" | "30d" | "90d"} />
      </motion.div>

      {/* Revenue Comparison - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <RevenueComparisonChart />
      </motion.div>
    </div>
  );
}
