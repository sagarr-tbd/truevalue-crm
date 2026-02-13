"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
  UserPlus,
  FileText,
  Handshake,
  Calendar,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Award,
  Zap,
  Filter,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/StatsCards";
import {
  SalesTrendChart,
  PipelineChart,
  LeadSourceChart,
  ActivityChart,
  RevenueComparisonChart,
} from "@/components/Charts";
import { useContacts } from "@/lib/queries/useContacts";
import { useLeads } from "@/lib/queries/useLeads";
import { useDeals, useDealForecast } from "@/lib/queries/useDeals";
import { useDefaultPipeline, usePipelineStats } from "@/lib/queries/usePipelines";

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export default function DashboardPage() {
  const [showStats, setShowStats] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data: contactsData, isLoading: contactsLoading } = useContacts({ page_size: 1 });
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ page_size: 1 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ page_size: 1 });
  const { data: defaultPipeline, isLoading: pipelineLoading } = useDefaultPipeline();
  const { data: pipelineStats, isLoading: statsLoading } = usePipelineStats(defaultPipeline?.id || "");
  const { data: forecast, isLoading: forecastLoading } = useDealForecast({ 
    days: timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90,
    pipeline_id: defaultPipeline?.id 
  });

  const isLoading = contactsLoading || leadsLoading || dealsLoading || pipelineLoading;

  const stats = useMemo(() => {
    const totalContacts = contactsData?.meta?.total || 0;
    const totalLeads = leadsData?.meta?.total || 0;
    const openDeals = pipelineStats?.openDeals || dealsData?.meta?.stats?.byStatus?.open || 0;
    const wonRevenue = pipelineStats?.wonValue || dealsData?.meta?.stats?.wonValue || 0;

    return [
      {
        label: "Total Contacts",
        value: isLoading ? "..." : formatNumber(totalContacts),
        icon: Users,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 12.5, isPositive: true },
        description: "All contacts",
      },
      {
        label: "Active Leads",
        value: isLoading ? "..." : formatNumber(totalLeads),
        icon: TrendingUp,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
        trend: { value: 8.2, isPositive: true },
        description: "Open leads",
      },
      {
        label: "Open Deals",
        value: isLoading ? "..." : formatNumber(openDeals),
        icon: Target,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 4.3, isPositive: true },
        description: "In pipeline",
      },
      {
        label: "Won Revenue",
        value: isLoading ? "..." : formatCurrency(wonRevenue),
        icon: DollarSign,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 15.8, isPositive: true },
        description: "Total closed won",
      },
    ];
  }, [contactsData, leadsData, dealsData, pipelineStats, isLoading]);

  const performanceMetrics = useMemo(() => {
    const winRate = pipelineStats?.winRate || 0;
    const pipelineValue = pipelineStats 
      ? (pipelineStats.totalValue - pipelineStats.wonValue) 
      : (dealsData?.meta?.stats?.openValue || 0);
    const avgDealValue = pipelineStats?.avgDealSize || dealsData?.meta?.stats?.avgDealSize || 0;
    const wonDeals = pipelineStats?.wonDeals || 0;
    const lostDeals = pipelineStats?.lostDeals || 0;
    const totalDeals = pipelineStats?.totalDeals || 0;

    return [
      {
        title: "Win Rate",
        value: statsLoading ? "..." : `${winRate.toFixed(1)}%`,
        change: 5.3,
        isPositive: winRate > 50,
        icon: Award,
        description: `${wonDeals} won / ${wonDeals + lostDeals} closed`,
        color: "text-secondary",
        bgColor: "bg-secondary/10",
      },
      {
        title: "Pipeline Value",
        value: statsLoading ? "..." : formatCurrency(pipelineValue),
        change: 22.8,
        isPositive: true,
        icon: TrendingUp,
        description: "Open opportunities",
        color: "text-accent",
        bgColor: "bg-accent/10",
      },
      {
        title: "Avg Deal Size",
        value: statsLoading ? "..." : formatCurrency(avgDealValue),
        change: 12.4,
        isPositive: true,
        icon: DollarSign,
        description: "Average deal value",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        title: "Total Deals",
        value: statsLoading ? "..." : formatNumber(totalDeals),
        change: 8.7,
        isPositive: true,
        icon: Target,
        description: "All time deals",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
    ];
  }, [pipelineStats, dealsData, statsLoading]);

  const pipelineChartData = useMemo(() => {
    if (!pipelineStats?.byStage || pipelineStats.byStage.length === 0) {
      return undefined;
    }
    return pipelineStats.byStage.map(stage => ({
      stage: stage.stageName,
      count: stage.dealCount,
      value: stage.dealValue,
    }));
  }, [pipelineStats]);

  const recentActivities = [
    {
      id: 1,
      type: "New Contact",
      name: "Sarah Johnson added to contacts",
      time: "2 minutes ago",
      icon: UserPlus,
      color: "text-primary",
    },
    {
      id: 2,
      type: "Deal Closed",
      name: "Acme Corp deal closed - $25,000",
      time: "1 hour ago",
      icon: Handshake,
      color: "text-secondary",
    },
    {
      id: 3,
      type: "Lead Qualified",
      name: "Tech Startup Inc moved to qualified",
      time: "3 hours ago",
      icon: Target,
      color: "text-accent",
    },
    {
      id: 4,
      type: "Meeting Scheduled",
      name: "Demo meeting with John Smith",
      time: "5 hours ago",
      icon: Calendar,
      color: "text-primary",
    },
    {
      id: 5,
      type: "Task Completed",
      name: "Follow-up call with Global Corp",
      time: "6 hours ago",
      icon: Activity,
      color: "text-muted-foreground",
    },
  ];

  const topPerformers = [
    { name: "John Smith", deals: 45, revenue: "$425K", avatar: "JS", rank: 1 },
    { name: "Jane Doe", deals: 38, revenue: "$389K", avatar: "JD", rank: 2 },
    { name: "Mike Johnson", deals: 32, revenue: "$312K", avatar: "MJ", rank: 3 },
    { name: "Sarah Brown", deals: 28, revenue: "$289K", avatar: "SB", rank: 4 },
    { name: "David Wilson", deals: 25, revenue: "$265K", avatar: "DW", rank: 5 },
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: "Follow-up call with Acme Corp",
      due: "Today, 2:00 PM",
      priority: "high",
    },
    {
      id: 2,
      title: "Send proposal to Tech Startup",
      due: "Today, 4:30 PM",
      priority: "high",
    },
    {
      id: 3,
      title: "Review Q1 sales report",
      due: "Tomorrow, 10:00 AM",
      priority: "medium",
    },
    {
      id: 4,
      title: "Team sync meeting",
      due: "Tomorrow, 2:00 PM",
      priority: "low",
    },
  ];

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-destructive/10 text-destructive",
      medium: "bg-accent/10 text-accent",
      low: "bg-muted text-muted-foreground",
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getRankBadge = (rank: number) => {
    const colors = {
      1: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      2: "bg-gray-400/10 text-gray-600 border-gray-400/20",
      3: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };
    return colors[rank as keyof typeof colors] || "bg-muted text-muted-foreground border-border";
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your CRM.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="gap-2"
          >
            {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showStats ? "Hide" : "Show"} Stats
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Time Range Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        {(["7d", "30d", "90d"] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "Last 90 Days"}
          </Button>
        ))}
      </motion.div>

      {/* Stats Grid */}
      <AnimatePresence mode="wait">
        {showStats && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatsCards stats={stats} columns={4} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Metrics */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {performanceMetrics.map((metric) => (
          <motion.div key={metric.title} variants={item}>
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {metric.isPositive ? (
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                    <span className={metric.isPositive ? "text-primary" : "text-destructive"}>
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {metric.title}
                </h3>
                <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Deal Summary - Won/Lost Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Won Deals Card */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Won Deals</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {statsLoading ? "..." : formatNumber(pipelineStats?.wonDeals || 0)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {statsLoading ? "..." : formatCurrency(pipelineStats?.wonValue || 0)} revenue
                </p>
              </div>
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lost Deals Card */}
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lost Deals</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {statsLoading ? "..." : formatNumber(pipelineStats?.lostDeals || 0)}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {statsLoading ? "..." : formatCurrency(dealsData?.meta?.stats?.lostValue || 0)} lost
                </p>
              </div>
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate Progress Card */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {statsLoading ? "..." : `${(pipelineStats?.winRate || 0).toFixed(1)}%`}
                </p>
              </div>
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pipelineStats?.winRate || 0, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {pipelineStats?.wonDeals || 0} won / {(pipelineStats?.wonDeals || 0) + (pipelineStats?.lostDeals || 0)} closed
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={item}>
          <SalesTrendChart timeRange={timeRange} />
        </motion.div>
        <motion.div variants={item}>
          <PipelineChart data={pipelineChartData} />
        </motion.div>
        <motion.div variants={item}>
          <LeadSourceChart />
        </motion.div>
        <motion.div variants={item}>
          <ActivityChart timeRange={timeRange} />
        </motion.div>
      </motion.div>

      {/* Revenue Comparison - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <RevenueComparisonChart />
      </motion.div>

      {/* Deal Forecast Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Deal Forecast
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Next {timeRange === "7d" ? "7 Days" : timeRange === "30d" ? "30 Days" : "90 Days"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecastLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : forecast ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Expected Deals</p>
                  <p className="text-3xl font-bold text-foreground">{forecast.total_deals}</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(forecast.total_value)}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Weighted Forecast</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(forecast.weighted_value)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No forecast data available</p>
              </div>
            )}
            
            {/* Forecast by Stage */}
            {forecast && forecast.by_stage && forecast.by_stage.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground mb-3">By Stage</h4>
                <div className="space-y-2">
                  {forecast.by_stage.map((stage) => (
                    <div key={stage.stage_id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{stage.stage_name}</span>
                        <span className="text-xs text-muted-foreground">{stage.count} deals</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{formatCurrency(stage.weighted_value)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatCurrency(stage.value)} total)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activities
              </CardTitle>
              <Link href="/analytics">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performers
              </CardTitle>
              <Link href="/analytics">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <motion.div
                    key={performer.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${getRankBadge(performer.rank)}`}
                    >
                      {performer.rank}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-sm font-semibold">
                      {performer.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {performer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {performer.deals} deals closed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{performer.revenue}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Tasks
              </CardTitle>
              <Link href="/activities/tasks">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 rounded border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{task.due}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Add Contact", icon: UserPlus, href: "/sales/contacts" },
                  { name: "Create Lead", icon: FileText, href: "/sales/leads" },
                  { name: "New Deal", icon: Handshake, href: "/sales/deals" },
                  { name: "Schedule Meeting", icon: Calendar, href: "/activities/meetings" },
                  { name: "View Reports", icon: BarChart3, href: "/reports" },
                  { name: "Analytics", icon: PieChart, href: "/analytics" },
                ].map((action, index) => (
                  <Link key={action.name} href={action.href}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                    >
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-xs font-medium text-foreground mt-2 text-center">
                        {action.name}
                      </span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
