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

export default function DashboardPage() {
  const [showStats, setShowStats] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const stats = useMemo(
    () => [
      {
        label: "Total Contacts",
        value: "2,543",
        icon: Users,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 12.5, isPositive: true },
        description: "vs last month",
      },
      {
        label: "Active Leads",
        value: "347",
        icon: TrendingUp,
        iconBgColor: "bg-accent/10",
        iconColor: "text-accent",
        trend: { value: 8.2, isPositive: true },
        description: "vs last month",
      },
      {
        label: "Open Deals",
        value: "89",
        icon: Target,
        iconBgColor: "bg-secondary/10",
        iconColor: "text-secondary",
        trend: { value: 4.3, isPositive: true },
        description: "vs last month",
      },
      {
        label: "Revenue",
        value: "$245K",
        icon: DollarSign,
        iconBgColor: "bg-primary/10",
        iconColor: "text-primary",
        trend: { value: 15.8, isPositive: true },
        description: "vs last month",
      },
    ],
    []
  );

  const performanceMetrics = [
    {
      title: "Sales Velocity",
      value: "12.5 days",
      change: -15.2,
      isPositive: true,
      icon: Zap,
      description: "Avg. time to close",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Win Rate",
      value: "68%",
      change: 5.3,
      isPositive: true,
      icon: Award,
      description: "Deals won vs total",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Pipeline Value",
      value: "$2.4M",
      change: 22.8,
      isPositive: true,
      icon: TrendingUp,
      description: "Active opportunities",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Response Time",
      value: "2.3 hrs",
      change: -18.5,
      isPositive: true,
      icon: Clock,
      description: "First response time",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

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
          <PipelineChart />
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
