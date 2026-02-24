"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  ArrowUpRight,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Award,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PipelineChart,
  LeadSourceChart,
  ActivityChart,
  SalesTrendChart,
} from "@/components/Charts";
import { useContacts } from "@/lib/queries/useContacts";
import { useLeads } from "@/lib/queries/useLeads";
import { useDeals, useDealForecast, useDealAnalysis } from "@/lib/queries/useDeals";
import { useDefaultPipeline, usePipelineStats } from "@/lib/queries/usePipelines";
import { useActivities, useUpcomingActivities, useActivityTrend, useCompleteActivity } from "@/lib/queries/useActivities";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number): string => value.toLocaleString();

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatDueDate = (dateStr?: string) => {
  if (!dateStr) return "No due date";
  const due = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const timeStr = due.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (due.toDateString() === today.toDateString()) return `Today, ${timeStr}`;
  if (due.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${timeStr}`;
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + `, ${timeStr}`;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-accent/10 text-accent",
    low: "bg-muted text-muted-foreground",
  };
  return colors[priority] || colors.low;
};

const ACTIVITY_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  task: { icon: CheckCircle, color: "text-primary" },
  call: { icon: Activity, color: "text-secondary" },
  email: { icon: FileText, color: "text-accent" },
  meeting: { icon: Calendar, color: "text-primary" },
  note: { icon: FileText, color: "text-muted-foreground" },
};

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function MetricSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-7 w-24 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function DealCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
          <div className="h-16 w-16 rounded-full bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function ListItemSkeleton() {
  return (
    <div className="animate-pulse flex items-start gap-3 p-3">
      <div className="h-8 w-8 rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/4 rounded bg-muted" />
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD PAGE
// ============================================================================

const ACTIVITY_TYPE_PATH: Record<string, string> = {
  task: '/activities/tasks',
  call: '/activities/calls',
  meeting: '/activities/meetings',
  note: '/activities/notes',
  email: '/activities/tasks',
};

export default function DashboardPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const completeActivity = useCompleteActivity();

  // Data hooks
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ page_size: 1 });
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ page_size: 1 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ page_size: 1 });
  const { data: defaultPipeline } = useDefaultPipeline();
  const { data: pipelineStats, isLoading: statsLoading } = usePipelineStats(defaultPipeline?.id || "");
  const trendDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const { data: forecast, isLoading: forecastLoading } = useDealForecast({
    days: trendDays,
    pipeline_id: defaultPipeline?.id,
  });
  const { data: activityTrend } = useActivityTrend(trendDays);
  const { data: dealAnalysis } = useDealAnalysis({ days: trendDays, pipeline_id: defaultPipeline?.id });
  const { data: recentActivitiesData, isLoading: activitiesLoading } = useActivities({ page_size: 5 });
  const { data: upcomingTasksData, isLoading: tasksLoading } = useUpcomingActivities();

  const metricsLoading = contactsLoading || leadsLoading || dealsLoading || statsLoading;

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  const metrics = useMemo(() => {
    const totalContacts = contactsData?.meta?.total || 0;
    const totalLeads = leadsData?.meta?.total || 0;
    const openDeals = pipelineStats?.openDeals || dealsData?.meta?.stats?.byStatus?.open || 0;
    const wonRevenue = pipelineStats?.wonValue || dealsData?.meta?.stats?.wonValue || 0;
    const pipelineValue = pipelineStats
      ? pipelineStats.totalValue - pipelineStats.wonValue
      : dealsData?.meta?.stats?.openValue || 0;
    const totalDeals = pipelineStats?.totalDeals || 0;

    return [
      { label: "Contacts", value: formatNumber(totalContacts), icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
      { label: "Active Leads", value: formatNumber(totalLeads), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
      { label: "Open Deals", value: formatNumber(openDeals), icon: Target, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
      { label: "Pipeline Value", value: formatCurrency(pipelineValue), icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
      { label: "Won Revenue", value: formatCurrency(wonRevenue), icon: DollarSign, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
      { label: "Total Deals", value: formatNumber(totalDeals), icon: Handshake, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-900/20" },
    ];
  }, [contactsData, leadsData, dealsData, pipelineStats]);

  const pipelineChartData = useMemo(() => {
    if (!pipelineStats?.byStage || pipelineStats.byStage.length === 0) return undefined;
    return pipelineStats.byStage.map((s) => ({ stage: s.stageName, count: s.dealCount, value: s.dealValue }));
  }, [pipelineStats]);

  const leadSourceChartData = useMemo(() => {
    const bySource = leadsData?.meta?.stats?.bySource;
    if (!bySource || Object.keys(bySource).length === 0) return undefined;
    return Object.entries(bySource).map(([name, value]) => ({ name, value }));
  }, [leadsData]);

  const activityChartData = useMemo(() => {
    if (!activityTrend || activityTrend.length === 0) return undefined;
    return activityTrend.map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      calls: d.calls,
      meetings: d.meetings,
      emails: d.emails,
    }));
  }, [activityTrend]);

  const salesTrendData = useMemo(() => {
    const trend = dealAnalysis?.trend;
    if (!trend || trend.length === 0) return undefined;
    return trend.map((t) => ({
      month: new Date(t.period + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      sales: t.won,
      revenue: t.won_value,
    }));
  }, [dealAnalysis]);

  const recentActivities = useMemo(() => {
    return (recentActivitiesData?.data || []).slice(0, 5).map((a) => {
      const mapping = ACTIVITY_ICONS[a.type] || { icon: Activity, color: "text-muted-foreground" };
      return {
        id: a.id,
        rawType: a.type,
        type: a.type.charAt(0).toUpperCase() + a.type.slice(1),
        name: a.subject,
        time: a.createdAt ? formatTimeAgo(a.createdAt) : "",
        icon: mapping.icon,
        color: mapping.color,
      };
    });
  }, [recentActivitiesData]);

  const upcomingTasks = useMemo(() => {
    return (upcomingTasksData || []).slice(0, 5).map((t) => ({
      id: t.id,
      title: t.subject,
      due: formatDueDate(t.dueDate),
      priority: t.priority || "medium",
    }));
  }, [upcomingTasksData]);

  // ============================================================================
  // ANIMATION VARIANTS
  // ============================================================================

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your CRM performance
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="text-xs h-8"
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ─── Key Metrics ─── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricsLoading
          ? Array.from({ length: 6 }).map((_, i) => <MetricSkeleton key={i} />)
          : metrics.map((m) => (
              <motion.div key={m.label} variants={fadeUp}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className={`inline-flex p-2 rounded-lg ${m.bg} mb-3`}>
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{m.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </motion.div>

      {/* ─── Deal Summary (Won / Lost / Win Rate) ─── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {statsLoading ? (
          <>
            <DealCardSkeleton />
            <DealCardSkeleton />
            <DealCardSkeleton />
          </>
        ) : (
          <>
            <motion.div variants={fadeUp}>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Won Deals</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {formatNumber(pipelineStats?.wonDeals || 0)}
                      </p>
                      <p className="text-sm text-green-600 mt-0.5">
                        {formatCurrency(pipelineStats?.wonValue || 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Lost Deals</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {formatNumber(pipelineStats?.lostDeals || 0)}
                      </p>
                      <p className="text-sm text-red-600 mt-0.5">
                        {formatCurrency(dealsData?.meta?.stats?.lostValue || 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {(pipelineStats?.winRate || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Award className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pipelineStats?.winRate || 0, 100)}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {pipelineStats?.wonDeals || 0} won / {(pipelineStats?.wonDeals || 0) + (pipelineStats?.lostDeals || 0)} closed
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* ─── Charts Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <PipelineChart data={pipelineChartData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ActivityChart data={activityChartData} timeRange={timeRange} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <LeadSourceChart data={leadSourceChartData} />
        </motion.div>

        {/* Deal Forecast (compact, in chart grid) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                Deal Forecast
                <span className="text-xs font-normal text-muted-foreground">
                  ({timeRange === "7d" ? "7 Days" : timeRange === "30d" ? "30 Days" : "90 Days"})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-muted" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 rounded bg-muted" />
                    ))}
                  </div>
                </div>
              ) : forecast ? (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Deals</p>
                      <p className="text-xl font-bold">{forecast.total_deals}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="text-xl font-bold">{formatCurrency(forecast.total_value)}</p>
                    </div>
                    <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground">Weighted</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(forecast.weighted_value)}</p>
                    </div>
                  </div>
                  {forecast.by_stage && forecast.by_stage.length > 0 && (
                    <div className="space-y-1.5">
                      {forecast.by_stage.map((stage) => (
                        <div key={stage.stage_id} className="flex items-center justify-between p-2 bg-muted/20 rounded-md text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{stage.stage_name}</span>
                            <span className="text-xs text-muted-foreground">{stage.count}</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(stage.weighted_value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No forecast data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Sales Trend (full width) ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <SalesTrendChart data={salesTrendData} timeRange={timeRange} />
      </motion.div>

      {/* ─── Activity Feed + Upcoming Tasks ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activities
              </CardTitle>
              <Link href="/analytics">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  View All <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5].map((i) => <ListItemSkeleton key={i} />)}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-0.5">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.04 }}
                      whileHover={{ x: 3 }}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
                      onClick={() => {
                        const basePath = ACTIVITY_TYPE_PATH[activity.rawType] || '/activities/tasks';
                        router.push(`${basePath}/${activity.id}`);
                      }}
                    >
                      <div className="p-1.5 rounded-md bg-muted">
                        <activity.icon className={`h-3.5 w-3.5 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No recent activities</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Tasks
              </CardTitle>
              <Link href="/activities/tasks">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  View All <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => <ListItemSkeleton key={i} />)}
                </div>
              ) : upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                  {upcomingTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + index * 0.04 }}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer"
                      onClick={() => router.push(`/activities/tasks/${task.id}`)}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded border-border"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeActivity.mutate(task.id, {
                            onSuccess: () => toast.success("Task completed"),
                            onError: () => toast.error("Failed to complete task"),
                          });
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{task.due}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Clock className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No upcoming tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Quick Actions ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { name: "Add Contact", icon: UserPlus, href: "/sales/contacts" },
                { name: "Create Lead", icon: FileText, href: "/sales/leads" },
                { name: "New Deal", icon: Handshake, href: "/sales/deals" },
                { name: "Schedule Meeting", icon: Calendar, href: "/activities/meetings" },
                { name: "View Reports", icon: BarChart3, href: "/reports" },
                { name: "Analytics", icon: PieChart, href: "/analytics" },
              ].map((action) => (
                <Link key={action.name} href={action.href}>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-foreground mt-1.5 text-center">
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
  );
}
