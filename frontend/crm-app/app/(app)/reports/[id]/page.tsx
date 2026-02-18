"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  FileText,
  Activity,
  Plus,
  X,
  Clock,
  Eye,
  Share2,
  Download,
  Copy,
  Users,
  DollarSign,
  BarChart3,
  LineChart,
  Play,
  RefreshCw,
  Settings,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { showSuccessToast } from "@/lib/toast";
import { ReportFormDrawer, type Report } from "@/components/Forms/Reports";
import { usePermission, REPORTS_WRITE, REPORTS_EXPORT } from "@/lib/permissions";

// Mock reports data (from reports page)
const reportsData = [
  {
    id: 1,
    name: "Monthly Sales Summary",
    type: "Sales",
    category: "Performance",
    createdBy: "John Smith",
    lastRun: "Jan 27, 2026",
    frequency: "Monthly",
    status: "Active",
    views: 145,
    created: "Dec 1, 2025",
    description: "Comprehensive monthly sales performance analysis including revenue, deals closed, and team performance metrics.",
    icon: DollarSign,
    chartData: [
      { month: "Jan", revenue: 125000, deals: 45 },
      { month: "Feb", revenue: 145000, deals: 52 },
      { month: "Mar", revenue: 165000, deals: 58 },
      { month: "Apr", revenue: 142000, deals: 48 },
      { month: "May", revenue: 178000, deals: 65 },
      { month: "Jun", revenue: 195000, deals: 72 },
    ],
    metrics: {
      totalRevenue: 950000,
      totalDeals: 340,
      avgDealSize: 2794,
      conversionRate: 32.5,
    },
    schedule: {
      enabled: true,
      frequency: "Monthly",
      nextRun: "Feb 28, 2026",
      recipients: ["john@company.com", "jane@company.com"],
    },
  },
  {
    id: 2,
    name: "Lead Conversion Report",
    type: "Sales",
    category: "Conversion",
    createdBy: "Jane Doe",
    lastRun: "Jan 28, 2026",
    frequency: "Weekly",
    status: "Active",
    views: 89,
    created: "Dec 5, 2025",
    description: "Weekly analysis of lead conversion rates, pipeline velocity, and conversion funnel performance.",
    icon: TrendingUp,
    chartData: [
      { week: "Week 1", leads: 120, converted: 38 },
      { week: "Week 2", leads: 145, converted: 45 },
      { week: "Week 3", leads: 132, converted: 42 },
      { week: "Week 4", leads: 158, converted: 52 },
    ],
    metrics: {
      totalLeads: 555,
      converted: 177,
      conversionRate: 31.9,
      avgTime: 12.5,
    },
    schedule: {
      enabled: true,
      frequency: "Weekly",
      nextRun: "Feb 3, 2026",
      recipients: ["jane@company.com", "sales@company.com"],
    },
  },
  {
    id: 3,
    name: "Customer Activity Analysis",
    type: "Customer",
    category: "Engagement",
    createdBy: "Mike Johnson",
    lastRun: "Jan 26, 2026",
    frequency: "Daily",
    status: "Active",
    views: 234,
    created: "Nov 20, 2025",
    description: "Daily customer engagement metrics including activity trends, interaction patterns, and engagement scores.",
    icon: Users,
    chartData: [
      { date: "Jan 20", active: 245, interactions: 1250 },
      { date: "Jan 21", active: 268, interactions: 1340 },
      { date: "Jan 22", active: 252, interactions: 1280 },
      { date: "Jan 23", active: 289, interactions: 1450 },
      { date: "Jan 24", active: 276, interactions: 1380 },
      { date: "Jan 25", active: 295, interactions: 1520 },
      { date: "Jan 26", active: 312, interactions: 1680 },
    ],
    metrics: {
      activeCustomers: 312,
      totalInteractions: 1680,
      avgEngagement: 85,
      growthRate: 12.5,
    },
    schedule: {
      enabled: true,
      frequency: "Daily",
      nextRun: "Jan 29, 2026",
      recipients: ["mike@company.com", "support@company.com"],
    },
  },
];

// Activities mock data
const activities = [
  {
    id: 1,
    type: "run",
    description: "Report executed successfully",
    user: "System",
    timestamp: "2 hours ago",
    icon: Play,
    color: "text-primary",
  },
  {
    id: 2,
    type: "share",
    description: "Shared with 3 team members",
    user: "John Smith",
    timestamp: "5 hours ago",
    icon: Share2,
    color: "text-secondary",
  },
  {
    id: 3,
    type: "edit",
    description: "Report parameters updated",
    user: "Jane Doe",
    timestamp: "1 day ago",
    icon: Edit,
    color: "text-accent",
  },
  {
    id: 4,
    type: "export",
    description: "Exported to PDF",
    user: "John Smith",
    timestamp: "2 days ago",
    icon: Download,
    color: "text-muted-foreground",
  },
];

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = parseInt(params.id as string);

  const { can } = usePermission();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Find the report
  const report = useMemo(
    () => reportsData.find((r) => r.id === reportId) || reportsData[0],
    [reportId]
  );

  const handleDelete = async () => {
    showSuccessToast("Report deleted successfully");
    router.push("/reports");
  };

  const handleRunReport = async () => {
    setIsRunning(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRunning(false);
    showSuccessToast("Report executed successfully");
  };

  const handleExport = (format: string) => {
    showSuccessToast(`Report exported as ${format.toUpperCase()}`);
  };

  const handleShare = () => {
    showSuccessToast("Share link copied to clipboard");
  };

  const handleDuplicate = () => {
    showSuccessToast("Report duplicated successfully");
    router.push("/reports");
  };

  const handleFormSubmit = async (data: Partial<Report>) => {
    showSuccessToast(`Report "${data.name}" updated successfully`);
    setIsFormOpen(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Active: "bg-primary/20 text-primary",
      Scheduled: "bg-accent/10 text-accent",
      Inactive: "bg-muted text-muted-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const ReportIcon = report.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/reports")}
            className="mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center shadow-lg">
              <ReportIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {report.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Created by {report.createdBy}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{report.created}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{report.views} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          {can(REPORTS_WRITE) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          )}
          {can(REPORTS_WRITE) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {can(REPORTS_WRITE) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
            </Button>
          )}
          <Button
            className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
            onClick={handleRunReport}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Report Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-foreground mt-1">{report.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                      {report.type}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-foreground mt-1">{report.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Run</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{report.lastRun}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(report.metrics).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1 font-tabular">
                      {typeof value === 'number' && value > 1000
                        ? `${(value / 1000).toFixed(1)}K`
                        : typeof value === 'number' && key.includes('Rate')
                        ? `${value}%`
                        : value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart Data Preview */}
          <Card className="border border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Data Visualization
                </CardTitle>
                {can(REPORTS_EXPORT) && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.chartData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {Object.values(item)[0]}
                      </span>
                      <span className="font-semibold text-foreground font-tabular">
                        {Object.values(item)[1]}
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(Number(Object.values(item)[1]) / Math.max(...report.chartData.map(d => Number(Object.values(d)[1])))) * 100}%` 
                        }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-teal to-brand-purple rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule Settings */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{report.schedule.frequency}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Next Run</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{report.schedule.nextRun}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {report.schedule.enabled ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-primary">Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Disabled</span>
                    </>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.schedule.recipients.map((email, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-foreground">{email}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.user} • {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Report"
        description={`Are you sure you want to delete "${report.name}"? This action cannot be undone.`}
      />

      {/* Edit Report Form Drawer */}
      <ReportFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={{
          name: report.name,
          type: report.type,
          category: report.category,
          description: report.description,
          frequency: report.schedule.frequency,
          status: report.status as "Active" | "Scheduled" | "Inactive",
          recipients: report.schedule.recipients.join(", "),
          scheduleEnabled: report.schedule.enabled,
          nextRunDate: report.schedule.nextRun,
        }}
        mode="edit"
      />
    </div>
  );
}
