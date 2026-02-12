"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  BarChart3,
  FileText,
  MessageSquare,
  Plus,
  Download,
  RefreshCw,
  Share2,
  Target,
  Activity,
  AlertCircle,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { ForecastFormDrawer, type Forecast as ForecastType } from "@/components/Forms/Sales";

// Forecast data structure
type Forecast = {
  id: number;
  period: string;
  quarter: string;
  year: number;
  startDate: string;
  endDate: string;
  targetRevenue: number;
  committedRevenue: number;
  weightedValue: number;
  bestCase: number;
  worstCase: number;
  actualRevenue: number;
  progress: number;
  owner: string;
  dealsCount: number;
  status: string;
  confidenceScore: number;
  initials: string;
};

// Mock forecasts data
const forecasts: Forecast[] = [
  {
    id: 1,
    period: "Q1 2026",
    quarter: "Q1",
    year: 2026,
    startDate: "Jan 1, 2026",
    endDate: "Mar 31, 2026",
    targetRevenue: 2500000,
    committedRevenue: 1850000,
    weightedValue: 1680000,
    bestCase: 2200000,
    worstCase: 1650000,
    actualRevenue: 850000,
    progress: 34,
    owner: "John Smith",
    dealsCount: 45,
    status: "On Track",
    confidenceScore: 78,
    initials: "Q1",
  },
  {
    id: 2,
    period: "Q2 2026",
    quarter: "Q2",
    year: 2026,
    startDate: "Apr 1, 2026",
    endDate: "Jun 30, 2026",
    targetRevenue: 2800000,
    committedRevenue: 1200000,
    weightedValue: 980000,
    bestCase: 2400000,
    worstCase: 1050000,
    actualRevenue: 0,
    progress: 0,
    owner: "Jane Doe",
    dealsCount: 38,
    status: "Planning",
    confidenceScore: 65,
    initials: "Q2",
  },
  {
    id: 3,
    period: "Q3 2026",
    quarter: "Q3",
    year: 2026,
    startDate: "Jul 1, 2026",
    endDate: "Sep 30, 2026",
    targetRevenue: 3200000,
    committedRevenue: 850000,
    weightedValue: 720000,
    bestCase: 2600000,
    worstCase: 780000,
    actualRevenue: 0,
    progress: 0,
    owner: "John Smith",
    dealsCount: 42,
    status: "Planning",
    confidenceScore: 58,
    initials: "Q3",
  },
  {
    id: 4,
    period: "Q4 2025",
    quarter: "Q4",
    year: 2025,
    startDate: "Oct 1, 2025",
    endDate: "Dec 31, 2025",
    targetRevenue: 2400000,
    committedRevenue: 2400000,
    weightedValue: 2350000,
    bestCase: 2650000,
    worstCase: 2280000,
    actualRevenue: 2520000,
    progress: 105,
    owner: "Jane Doe",
    dealsCount: 52,
    status: "Achieved",
    confidenceScore: 92,
    initials: "Q4",
  },
];

// Mock deals breakdown
const mockDealsBreakdown = [
  {
    id: 1,
    name: "Enterprise Partnership - Acme Corp",
    value: 450000,
    probability: 85,
    stage: "Negotiation",
    closeDate: "Feb 15, 2026",
    owner: "John Smith",
  },
  {
    id: 2,
    name: "Annual License Renewal - TechVision",
    value: 320000,
    probability: 90,
    stage: "Proposal",
    closeDate: "Feb 28, 2026",
    owner: "Jane Doe",
  },
  {
    id: 3,
    name: "Cloud Migration Project",
    value: 280000,
    probability: 75,
    stage: "Qualification",
    closeDate: "Mar 10, 2026",
    owner: "Mike Johnson",
  },
  {
    id: 4,
    name: "SaaS Platform Expansion",
    value: 195000,
    probability: 70,
    stage: "Discovery",
    closeDate: "Mar 20, 2026",
    owner: "Sarah Brown",
  },
  {
    id: 5,
    name: "Support Contract Renewal",
    value: 125000,
    probability: 95,
    stage: "Closed Won",
    closeDate: "Jan 30, 2026",
    owner: "John Smith",
  },
  {
    id: 6,
    name: "Custom Integration Project",
    value: 180000,
    probability: 60,
    stage: "Qualification",
    closeDate: "Mar 25, 2026",
    owner: "Jane Doe",
  },
];

// Mock trend analysis data
const mockTrendData = [
  { month: "Oct 2025", committed: 1800000, actual: 1850000 },
  { month: "Nov 2025", committed: 2100000, actual: 2050000 },
  { month: "Dec 2025", committed: 2400000, actual: 2520000 },
  { month: "Jan 2026", committed: 850000, actual: 850000 },
  { month: "Feb 2026", committed: 1200000, actual: 0 },
  { month: "Mar 2026", committed: 1850000, actual: 0 },
];

// Mock notes
const mockNotes = [
  {
    id: 1,
    content: "Q1 forecast is tracking well. Several large deals in pipeline expected to close by end of quarter.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Acme Corp deal progressing smoothly. Legal review scheduled for next week. High confidence in closing.",
    author: "Jane Doe",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
  {
    id: 3,
    content: "Need to accelerate pipeline development for Q2. Current committed revenue is below target.",
    author: "Mike Johnson",
    date: "Jan 22, 2026",
    time: "4:45 PM",
  },
];

type TabType = "details" | "breakdown" | "trend" | "notes";

export default function ForecastDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingForecast, setEditingForecast] = useState<Partial<ForecastType> | null>(null);

  // Find forecast by ID
  const forecast = useMemo(() => {
    const forecastId = parseInt(id);
    return forecasts.find((f) => f.id === forecastId);
  }, [id]);

  // Calculate pipeline value (sum of all deal values)
  const pipelineValue = useMemo(() => {
    return mockDealsBreakdown.reduce((sum, deal) => sum + deal.value, 0);
  }, []);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!forecast) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted forecast:", forecast.period);
      router.push("/sales/forecasts");
    } catch (error) {
      console.error("Error deleting forecast:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  // Form handlers
  const handleEditForecast = () => {
    if (!forecast) return;
    
    setEditingForecast({
      period: forecast.period,
      startDate: forecast.startDate,
      endDate: forecast.endDate,
      targetRevenue: forecast.targetRevenue,
      committedRevenue: forecast.committedRevenue,
      bestCase: forecast.bestCase,
      worstCase: forecast.worstCase,
      status: forecast.status as any,
      assignedTo: forecast.owner,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<ForecastType>) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Updating forecast:", data);
      // Toast is shown by FormDrawer component

      setFormDrawerOpen(false);
      setEditingForecast(null);
    } catch (error) {
      console.error("Error updating forecast:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      "On Track": "bg-primary/10 text-primary",
      Planning: "bg-secondary/10 text-secondary",
      Achieved: "bg-primary/20 text-primary",
      "At Risk": "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // If forecast not found
  if (!forecast) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Forecast Not Found</h2>
        <p className="text-gray-600">The forecast you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/sales/forecasts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forecasts
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "breakdown" as TabType, label: "Breakdown", icon: BarChart3 },
    { id: "trend" as TabType, label: "Trend Analysis", icon: LineChart },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen">
      <div>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/sales/forecasts")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Forecasts
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {forecast.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{forecast.period}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{forecast.quarter} {forecast.year}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    forecast.status
                  )}`}>
                    {forecast.status}
                  </span>
                  <span className="text-lg font-semibold text-primary font-tabular">
                    ${(forecast.committedRevenue / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {forecast.startDate} - {forecast.endDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditForecast}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  ${(pipelineValue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground">{forecast.dealsCount} deals</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Weighted Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-primary font-tabular">
                  ${(forecast.weightedValue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground">
                  {((forecast.weightedValue / forecast.targetRevenue) * 100).toFixed(0)}% of target
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                Best Case
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-primary font-tabular">
                  ${(forecast.bestCase / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground">
                  +${((forecast.bestCase - forecast.targetRevenue) / 1000).toFixed(0)}K vs target
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                Worst Case
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-muted-foreground font-tabular">
                  ${(forecast.worstCase / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground">
                  ${((forecast.worstCase - forecast.targetRevenue) / 1000).toFixed(0)}K vs target
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === "details" && (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Forecast Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Period</p>
                                <p className="text-base font-medium">{forecast.period}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Quarter & Year</p>
                                <p className="text-base font-medium">{forecast.quarter} {forecast.year}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Date Range</p>
                                <p className="text-base font-medium">
                                  {forecast.startDate} - {forecast.endDate}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                    forecast.status
                                  )}`}
                                >
                                  {forecast.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Revenue Targets</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Target Revenue</p>
                                <p className="text-base font-medium font-tabular">
                                  ${(forecast.targetRevenue / 1000000).toFixed(1)}M
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Committed Revenue</p>
                                <p className="text-base font-medium text-primary font-tabular">
                                  ${(forecast.committedRevenue / 1000000).toFixed(1)}M
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Actual Revenue</p>
                                <p className="text-base font-medium font-tabular">
                                  ${(forecast.actualRevenue / 1000000).toFixed(1)}M
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Progress</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        forecast.progress >= 100 ? "bg-primary" : forecast.progress >= 70 ? "bg-primary" : forecast.progress >= 40 ? "bg-accent" : "bg-secondary"
                                      }`}
                                      style={{ width: `${Math.min(forecast.progress, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-foreground font-tabular">
                                    {forecast.progress}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "breakdown" && (
                      <motion.div
                        key="breakdown"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockDealsBreakdown.length > 0 ? (
                          mockDealsBreakdown.map((deal) => (
                            <Card key={deal.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                      {deal.name}
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Value</p>
                                        <p className="text-sm font-semibold text-foreground font-tabular">
                                          ${(deal.value / 1000).toFixed(0)}K
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Probability</p>
                                        <p className="text-sm font-semibold text-foreground">
                                          {deal.probability}%
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Stage</p>
                                        <p className="text-sm font-medium text-foreground">{deal.stage}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Close Date</p>
                                        <p className="text-sm font-medium text-foreground">{deal.closeDate}</p>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-border">
                                      <p className="text-xs text-muted-foreground">Owner: {deal.owner}</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mx-auto mb-3" />
                            <p>No deals found in this forecast</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "trend" && (
                      <motion.div
                        key="trend"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Historical Trend</h3>
                          <div className="space-y-4">
                            {mockTrendData.map((data, index) => (
                              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">{data.month}</p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Committed</p>
                                      <p className="text-sm font-semibold text-primary font-tabular">
                                        ${(data.committed / 1000000).toFixed(1)}M
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Actual</p>
                                      <p className="text-sm font-semibold text-foreground font-tabular">
                                        ${(data.actual / 1000000).toFixed(1)}M
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Variance</p>
                                      <p className={`text-sm font-semibold font-tabular ${
                                        data.actual >= data.committed ? "text-primary" : "text-destructive"
                                      }`}>
                                        {data.actual >= data.committed ? "+" : ""}
                                        ${((data.actual - data.committed) / 1000).toFixed(0)}K
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "notes" && (
                      <motion.div
                        key="notes"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Add Note Form */}
                        <div className="border border-border rounded-lg p-4 bg-gray-50">
                          <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note about this forecast..."
                            className="min-h-[100px] resize-none"
                          />
                          <div className="flex justify-end mt-3">
                            <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim()}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          </div>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-4">
                          {mockNotes.map((note) => (
                            <Card key={note.id} className="border border-border">
                              <CardContent className="p-4">
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                  {note.content}
                                </p>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                  <span className="text-xs text-gray-500">{note.author}</span>
                                  <span className="text-xs text-gray-400">
                                    {note.date} at {note.time}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Export")}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Refresh")}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Share")}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </CardContent>
            </Card>

            {/* Confidence Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Confidence Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-full h-8 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${forecast.confidenceScore}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-brand-teal to-brand-purple"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {forecast.confidenceScore}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Based on deal probability and historical accuracy
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Deals</p>
                  <p className="text-lg font-semibold text-foreground">{forecast.dealsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="text-sm font-medium text-foreground">{forecast.owner}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target vs Committed</p>
                  <p className="text-sm font-semibold text-foreground font-tabular">
                    {((forecast.committedRevenue / forecast.targetRevenue) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Variance</p>
                  <p className={`text-sm font-semibold font-tabular ${
                    forecast.committedRevenue >= forecast.targetRevenue ? "text-primary" : "text-destructive"
                  }`}>
                    {forecast.committedRevenue >= forecast.targetRevenue ? "+" : ""}
                    ${((forecast.committedRevenue - forecast.targetRevenue) / 1000).toFixed(0)}K
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Forecast"
        description="Are you sure you want to delete this forecast? This will permanently remove it from your CRM and cannot be undone."
        itemName={forecast.period}
        itemType="Forecast"
        icon={LineChart}
        isDeleting={isDeleting}
      />

      {/* Forecast Form Drawer */}
      <ForecastFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingForecast(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingForecast}
        mode="edit"
        defaultView="detailed"
      />
    </div>
  );
}
