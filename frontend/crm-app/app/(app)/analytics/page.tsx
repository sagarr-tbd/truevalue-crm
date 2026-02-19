"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  TrendingUp,
  TrendingDown,
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
  Zap,
  Award,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import StatsCards from "@/components/StatsCards";
import {
  PipelineChart,
  LeadSourceChart,
  ActivityChart,
} from "@/components/Charts";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { useContacts } from "@/lib/queries/useContacts";
import { useLeads } from "@/lib/queries/useLeads";
import { useDeals, useDealAnalysis } from "@/lib/queries/useDeals";
import { useDefaultPipeline, usePipelineStats } from "@/lib/queries/usePipelines";
import { useActivityStats, useActivityTrend } from "@/lib/queries/useActivities";

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number): string => value.toLocaleString();

// ============================================================================
// SKELETON
// ============================================================================

function MetricCardSkeleton() {
  return (
    <Card className="border border-border p-6">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-muted" />
          <div className="h-4 w-12 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-7 w-20 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      </div>
    </Card>
  );
}

function ActivityCircleSkeleton() {
  return (
    <div className="text-center animate-pulse">
      <div className="w-16 h-16 mx-auto rounded-full bg-muted mb-3" />
      <div className="h-7 w-12 mx-auto rounded bg-muted mb-1" />
      <div className="h-4 w-20 mx-auto rounded bg-muted" />
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function AnalyticsPage() {
  const [showStats, setShowStats] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  // ── Data hooks ──
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ page_size: 1 });
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ page_size: 1 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ page_size: 1 });
  const { data: defaultPipeline } = useDefaultPipeline();
  const { data: pipelineStats, isLoading: pipelineLoading } = usePipelineStats(defaultPipeline?.id || "");
  const { data: activityStats, isLoading: activityStatsLoading } = useActivityStats();
  const trendDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const { data: activityTrend } = useActivityTrend(trendDays);
  const { data: dealAnalysis } = useDealAnalysis({ days: trendDays, pipeline_id: defaultPipeline?.id });

  const isLoading = contactsLoading || leadsLoading || dealsLoading || pipelineLoading;

  // ── Top Stats (StatsCards) ──
  const stats = useMemo(() => {
    const wonRevenue = pipelineStats?.wonValue || dealsData?.meta?.stats?.wonValue || 0;
    const totalContacts = contactsData?.meta?.total || 0;
    const winRate = pipelineStats?.winRate || 0;
    const avgDealSize = pipelineStats?.avgDealSize || dealsData?.meta?.stats?.avgDealSize || 0;

    return [
      {
        label: "Won Revenue",
        value: formatCurrency(wonRevenue),
        icon: DollarSign,
        iconBgColor: "bg-green-100 dark:bg-green-900/20",
        iconColor: "text-green-600",
        description: `${pipelineStats?.wonDeals || 0} deals won`,
      },
      {
        label: "Total Contacts",
        value: formatNumber(totalContacts),
        icon: Users,
        iconBgColor: "bg-blue-100 dark:bg-blue-900/20",
        iconColor: "text-blue-600",
      },
      {
        label: "Win Rate",
        value: `${winRate.toFixed(1)}%`,
        icon: Target,
        iconBgColor: "bg-violet-100 dark:bg-violet-900/20",
        iconColor: "text-violet-600",
        description: `${pipelineStats?.wonDeals || 0} won / ${(pipelineStats?.wonDeals || 0) + (pipelineStats?.lostDeals || 0)} closed`,
      },
      {
        label: "Avg Deal Size",
        value: formatCurrency(avgDealSize),
        icon: BarChart3,
        iconBgColor: "bg-amber-100 dark:bg-amber-900/20",
        iconColor: "text-amber-600",
        description: `${pipelineStats?.totalDeals || 0} total deals`,
      },
    ];
  }, [contactsData, dealsData, pipelineStats]);

  // ── Performance metrics ──
  const performanceData = useMemo(() => {
    const winRate = pipelineStats?.winRate || 0;
    const pipelineValue = pipelineStats ? pipelineStats.totalValue - pipelineStats.wonValue : 0;
    const avgDealSize = pipelineStats?.avgDealSize || 0;
    const overdue = activityStats?.overdue || 0;
    const dueToday = activityStats?.due_today || 0;

    return [
      {
        metric: "Win Rate",
        value: `${winRate.toFixed(1)}%`,
        icon: Award,
        description: "Deals won vs total closed",
        color: "text-primary",
      },
      {
        metric: "Pipeline Value",
        value: formatCurrency(pipelineValue),
        icon: TrendingUp,
        description: "Active open opportunities",
        color: "text-primary",
      },
      {
        metric: "Avg Deal Size",
        value: formatCurrency(avgDealSize),
        icon: DollarSign,
        description: "Average deal value",
        color: "text-primary",
      },
      {
        metric: "Tasks Due",
        value: `${dueToday} today`,
        icon: Clock,
        description: `${overdue} overdue`,
        color: overdue > 0 ? "text-destructive" : "text-primary",
      },
    ];
  }, [pipelineStats, activityStats]);

  // ── Activity overview circles ──
  const activityOverview = useMemo(() => {
    const totalLeads = leadsData?.meta?.total || 0;
    const byType = activityStats?.by_type ?? ({} as Record<string, number>);
    const wonDeals = pipelineStats?.wonDeals || 0;

    return [
      {
        label: "Active Leads",
        value: totalLeads,
        icon: Target,
        bgColor: "bg-primary/10",
        textColor: "text-primary",
      },
      {
        label: "Calls",
        value: byType.call || 0,
        icon: Phone,
        bgColor: "bg-green-100 dark:bg-green-900/20",
        textColor: "text-green-600",
      },
      {
        label: "Emails",
        value: byType.email || 0,
        icon: Mail,
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
        textColor: "text-blue-600",
      },
      {
        label: "Meetings",
        value: byType.meeting || 0,
        icon: Calendar,
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
        textColor: "text-purple-600",
      },
      {
        label: "Tasks",
        value: byType.task || 0,
        icon: CheckCircle,
        bgColor: "bg-amber-100 dark:bg-amber-900/20",
        textColor: "text-amber-600",
      },
      {
        label: "Won Deals",
        value: wonDeals,
        icon: DollarSign,
        bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
        textColor: "text-emerald-600",
      },
    ];
  }, [leadsData, activityStats, pipelineStats]);

  // ── Chart data ──
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

  // ── Won/Lost analysis data ──
  const LOSS_COLORS = [
    "hsl(0, 72%, 51%)",
    "hsl(20, 90%, 48%)",
    "hsl(38, 92%, 50%)",
    "hsl(45, 93%, 47%)",
    "hsl(280, 65%, 60%)",
    "hsl(200, 65%, 55%)",
    "hsl(160, 60%, 45%)",
    "hsl(340, 75%, 55%)",
  ];

  const wonLostTrendData = useMemo(() => {
    const trend = dealAnalysis?.trend;
    if (!trend || trend.length === 0) return [];
    return trend.map((t) => ({
      period: new Date(t.period + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      won: t.won,
      lost: t.lost,
      wonValue: t.won_value,
      lostValue: t.lost_value,
    }));
  }, [dealAnalysis]);

  const lossReasonData = useMemo(() => {
    const reasons = dealAnalysis?.loss_reasons || [];
    return reasons.map((lr, i) => ({
      name: lr.reason,
      count: lr.count,
      value: lr.value,
      fill: LOSS_COLORS[i % LOSS_COLORS.length],
    }));
  }, [dealAnalysis]);

  const totalLostCount = lossReasonData.reduce((sum, lr) => sum + lr.count, 0);

  // ============================================================================
  // RENDER
  // ============================================================================

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
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

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
          </>
        }
      />

      {/* Main Stats Cards (togglable) */}
      <AnimatePresence>
        {showStats && <StatsCards stats={stats} columns={4} />}
      </AnimatePresence>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || activityStatsLoading
          ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          : performanceData.map((item, index) => (
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
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {item.metric}
                    </h3>
                    <p className={`text-2xl font-bold ${item.color}`}>
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

      {/* Activity Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Activity Overview</h3>
              <p className="text-sm text-muted-foreground">All-time activity counts</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {activityStatsLoading || isLoading
              ? Array.from({ length: 6 }).map((_, i) => <ActivityCircleSkeleton key={i} />)
              : activityOverview.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className="text-center"
                  >
                    <div className={`w-16 h-16 mx-auto rounded-full ${item.bgColor} ${item.textColor} flex items-center justify-center mb-3`}>
                      <item.icon className="h-8 w-8" />
                    </div>
                    <p className="text-2xl font-bold text-foreground font-tabular">
                      {formatNumber(item.value)}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </motion.div>
                ))}
          </div>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <PipelineChart data={pipelineChartData} />
        <ActivityChart data={activityChartData} timeRange={timeRange} />
        <LeadSourceChart data={leadSourceChartData} />

        {/* Deal Breakdown Card */}
        <Card className="border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Deal Breakdown</h3>
              <p className="text-sm text-muted-foreground">Current pipeline status</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>

          {pipelineLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-4 w-16 rounded bg-muted" />
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : pipelineStats ? (
            <div className="space-y-5">
              {/* Summary numbers */}
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{pipelineStats.totalDeals}</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Won</p>
                  <p className="text-xl font-bold text-green-600">{pipelineStats.wonDeals}</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Lost</p>
                  <p className="text-xl font-bold text-red-600">{pipelineStats.lostDeals}</p>
                </div>
              </div>

              {/* Stage breakdown bars */}
              {pipelineStats.byStage.map((stage, index) => {
                const maxValue = Math.max(...pipelineStats.byStage.map((s) => s.dealValue), 1);
                const percentage = (stage.dealValue / maxValue) * 100;
                return (
                  <div key={stage.stageId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{stage.stageName}</span>
                      <span className="font-semibold font-tabular text-foreground">
                        {formatCurrency(stage.dealValue)} ({stage.dealCount})
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.4 + index * 0.08, duration: 0.5 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-teal to-brand-purple rounded-full"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total Pipeline Value</span>
                  <span className="text-lg font-bold text-primary font-tabular">
                    {formatCurrency(pipelineStats.totalValue)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No pipeline data</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Won/Lost Analysis Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Won/Lost Analysis</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Deal outcome trends and loss insights</p>
          </div>
        </div>

        {/* Won/Lost Summary Cards */}
        {dealAnalysis?.summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Won Deals</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{dealAnalysis.summary.total_won}</p>
                    <p className="text-sm text-green-600 mt-0.5">{formatCurrency(dealAnalysis.summary.won_value)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Lost Deals</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{dealAnalysis.summary.total_lost}</p>
                    <p className="text-sm text-red-600 mt-0.5">{formatCurrency(dealAnalysis.summary.lost_value)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{dealAnalysis.summary.win_rate}%</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {dealAnalysis.summary.total_won} won / {dealAnalysis.summary.total_won + dealAnalysis.summary.total_lost} closed
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Avg Time to Close</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{dealAnalysis.summary.avg_time_to_close_days}d</p>
                    <p className="text-sm text-amber-600 mt-0.5">Avg won: {formatCurrency(dealAnalysis.summary.avg_won_value)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-900/20">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Won/Lost Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Won vs Lost Trend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                Won vs Lost Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wonLostTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={wonLostTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="won" name="Won" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lost" name="Lost" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No closed deals in this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-primary" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wonLostTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={wonLostTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatCurrency(v)} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "wonValue" ? "Won Revenue" : "Lost Revenue",
                      ]}
                    />
                    <Legend formatter={(value) => (value === "wonValue" ? "Won Revenue" : "Lost Revenue")} />
                    <Line type="monotone" dataKey="wonValue" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="lostValue" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <DollarSign className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No revenue data in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loss Reasons Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Loss Reasons Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lossReasonData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={lossReasonData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                    >
                      {lossReasonData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [`${value} deals`, name]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Breakdown list */}
                <div className="space-y-3 flex flex-col justify-center">
                  {lossReasonData.map((item, index) => {
                    const pct = totalLostCount > 0 ? ((item.count / totalLostCount) * 100).toFixed(1) : "0";
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                            <span className="text-sm font-semibold text-foreground ml-2">
                              {item.count} ({pct}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <div className="w-full bg-muted rounded-full h-1.5 mr-3">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${parseFloat(pct)}%`,
                                  backgroundColor: item.fill,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(item.value)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <TrendingDown className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">No loss reasons recorded</p>
                <p className="text-xs mt-1">Loss reasons are captured when deals are marked as lost</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
