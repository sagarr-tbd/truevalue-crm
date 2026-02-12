"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Megaphone,
  Target,
  BarChart3,
  Users,
  DollarSign,
  MessageSquare,
  Plus,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  Share2,
  Download,
  CheckCircle2,
  Clock,
  MousePointer,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { CampaignFormDrawer, type Campaign as CampaignType } from "@/components/Forms/Sales";

// Campaign data structure (extended from campaigns list page)
type Campaign = {
  id: number;
  name: string;
  type: string;
  status: "Active" | "Planned" | "Completed";
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  revenue: number;
  owner: string;
  created: string;
  initials: string;
  description?: string;
  targetAudience?: string;
  channels?: string[];
};

// Mock campaigns data (extended with additional details)
const campaigns: Campaign[] = [
  {
    id: 1,
    name: "Q1 2026 Product Launch",
    type: "Email",
    status: "Active",
    startDate: "Jan 15, 2026",
    endDate: "Mar 31, 2026",
    budget: 50000,
    spent: 32000,
    leads: 245,
    conversions: 68,
    revenue: 485000,
    owner: "John Smith",
    created: "Jan 10, 2026",
    initials: "PL",
    description: "Comprehensive email campaign to launch our new product line for Q1 2026. Targeting enterprise customers with personalized messaging.",
    targetAudience: "Enterprise B2B Customers",
    channels: ["Email", "LinkedIn", "Website"],
  },
  {
    id: 2,
    name: "Winter Promotion Campaign",
    type: "Social Media",
    status: "Active",
    startDate: "Jan 1, 2026",
    endDate: "Feb 28, 2026",
    budget: 35000,
    spent: 28500,
    leads: 189,
    conversions: 42,
    revenue: 325000,
    owner: "Jane Doe",
    created: "Dec 20, 2025",
    initials: "WP",
    description: "Social media campaign promoting winter specials and discounts across multiple platforms.",
    targetAudience: "B2C Consumers",
    channels: ["Facebook", "Instagram", "Twitter"],
  },
  {
    id: 3,
    name: "Enterprise Outreach 2026",
    type: "LinkedIn",
    status: "Active",
    startDate: "Jan 20, 2026",
    endDate: "Jun 30, 2026",
    budget: 75000,
    spent: 18000,
    leads: 98,
    conversions: 24,
    revenue: 580000,
    owner: "Mike Johnson",
    created: "Jan 15, 2026",
    initials: "EO",
    description: "Targeted LinkedIn campaign focused on enterprise decision-makers and C-level executives.",
    targetAudience: "Enterprise Decision Makers",
    channels: ["LinkedIn", "Email"],
  },
  {
    id: 4,
    name: "Webinar Series - Cloud Tech",
    type: "Webinar",
    status: "Completed",
    startDate: "Dec 1, 2025",
    endDate: "Dec 31, 2025",
    budget: 25000,
    spent: 24800,
    leads: 312,
    conversions: 89,
    revenue: 680000,
    owner: "Sarah Brown",
    created: "Nov 15, 2025",
    initials: "WS",
    description: "Educational webinar series covering cloud technology trends and best practices.",
    targetAudience: "IT Professionals",
    channels: ["Webinar Platform", "Email", "LinkedIn"],
  },
  {
    id: 5,
    name: "Trade Show - Tech Summit",
    type: "Event",
    status: "Planned",
    startDate: "Mar 15, 2026",
    endDate: "Mar 18, 2026",
    budget: 120000,
    spent: 45000,
    leads: 0,
    conversions: 0,
    revenue: 0,
    owner: "John Smith",
    created: "Jan 5, 2026",
    initials: "TS",
    description: "Major trade show presence at Tech Summit 2026 with booth, demos, and networking events.",
    targetAudience: "Tech Industry Professionals",
    channels: ["Event", "Email", "Social Media"],
  },
  {
    id: 6,
    name: "Customer Referral Program",
    type: "Referral",
    status: "Active",
    startDate: "Jan 1, 2026",
    endDate: "Dec 31, 2026",
    budget: 60000,
    spent: 12000,
    leads: 156,
    conversions: 52,
    revenue: 425000,
    owner: "Jane Doe",
    created: "Dec 15, 2025",
    initials: "CR",
    description: "Incentivized referral program encouraging existing customers to refer new clients.",
    targetAudience: "Existing Customers",
    channels: ["Email", "In-App", "Website"],
  },
  {
    id: 7,
    name: "Content Marketing Q1",
    type: "Content",
    status: "Active",
    startDate: "Jan 1, 2026",
    endDate: "Mar 31, 2026",
    budget: 40000,
    spent: 26000,
    leads: 278,
    conversions: 71,
    revenue: 380000,
    owner: "Mike Johnson",
    created: "Dec 28, 2025",
    initials: "CM",
    description: "Content marketing campaign featuring blog posts, whitepapers, and case studies.",
    targetAudience: "B2B Professionals",
    channels: ["Blog", "Email", "Social Media"],
  },
  {
    id: 8,
    name: "Holiday Sales Blast",
    type: "Email",
    status: "Completed",
    startDate: "Dec 10, 2025",
    endDate: "Dec 25, 2025",
    budget: 15000,
    spent: 14200,
    leads: 425,
    conversions: 124,
    revenue: 720000,
    owner: "Sarah Brown",
    created: "Nov 25, 2025",
    initials: "HS",
    description: "Holiday season email campaign with special promotions and limited-time offers.",
    targetAudience: "All Customers",
    channels: ["Email", "SMS"],
  },
];

// Mock leads generated from campaign
const mockLeads = [
  {
    id: 1,
    name: "Alex Thompson",
    email: "alex.thompson@example.com",
    company: "TechCorp Inc",
    status: "New",
    source: "Email Campaign",
    date: "Jan 28, 2026",
  },
  {
    id: 2,
    name: "Maria Rodriguez",
    email: "maria.rodriguez@example.com",
    company: "Digital Solutions",
    status: "Contacted",
    source: "LinkedIn Ad",
    date: "Jan 27, 2026",
  },
  {
    id: 3,
    name: "David Kim",
    email: "david.kim@example.com",
    company: "Cloud Systems",
    status: "Qualified",
    source: "Email Campaign",
    date: "Jan 26, 2026",
  },
  {
    id: 4,
    name: "Emily Chen",
    email: "emily.chen@example.com",
    company: "Innovate Labs",
    status: "New",
    source: "Social Media",
    date: "Jan 25, 2026",
  },
  {
    id: 5,
    name: "James Wilson",
    email: "james.wilson@example.com",
    company: "Global Tech",
    status: "Contacted",
    source: "Email Campaign",
    date: "Jan 24, 2026",
  },
];

// Mock performance metrics
const mockPerformanceMetrics = [
  {
    label: "Open Rate",
    value: "24.5%",
    change: "+3.2%",
    isPositive: true,
    icon: Mail,
  },
  {
    label: "Click-Through Rate",
    value: "8.7%",
    change: "+1.5%",
    isPositive: true,
    icon: MousePointer,
  },
  {
    label: "Conversion Rate",
    value: "27.8%",
    change: "+2.1%",
    isPositive: true,
    icon: Target,
  },
  {
    label: "Cost Per Lead",
    value: "$130.61",
    change: "-$15.20",
    isPositive: true,
    icon: DollarSign,
  },
];

// Mock milestones/timeline
const mockMilestones = [
  {
    id: 1,
    title: "Campaign Launched",
    date: "Jan 15, 2026",
    status: "completed",
    icon: CheckCircle2,
  },
  {
    id: 2,
    title: "First 100 Leads",
    date: "Jan 22, 2026",
    status: "completed",
    icon: CheckCircle2,
  },
  {
    id: 3,
    title: "Mid-Campaign Review",
    date: "Feb 15, 2026",
    status: "upcoming",
    icon: Clock,
  },
  {
    id: 4,
    title: "Campaign Completion",
    date: "Mar 31, 2026",
    status: "upcoming",
    icon: Calendar,
  },
];

const mockNotes = [
  {
    id: 1,
    content: "Campaign is performing above expectations. Open rates are 3% higher than projected.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Adjusted targeting parameters based on initial performance data. Focus shifted to enterprise segment.",
    author: "Jane Doe",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
];

type TabType = "details" | "performance" | "leads" | "notes";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<CampaignType> | null>(null);

  // Find campaign by ID
  const campaign = useMemo(() => {
    const campaignId = parseInt(id);
    return campaigns.find((c) => c.id === campaignId);
  }, [id]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!campaign) return null;
    
    const conversionRate = campaign.leads > 0 
      ? ((campaign.conversions / campaign.leads) * 100).toFixed(1)
      : "0.0";
    
    const roi = campaign.spent > 0
      ? (((campaign.revenue - campaign.spent) / campaign.spent) * 100).toFixed(1)
      : "0.0";

    return {
      totalBudget: campaign.budget,
      leadsGenerated: campaign.leads,
      conversionRate: parseFloat(conversionRate),
      roi: parseFloat(roi),
    };
  }, [campaign]);

  // Campaign health score (calculated based on performance)
  const campaignHealthScore = useMemo(() => {
    if (!campaign || !metrics) return 0;
    
    // Simple scoring algorithm based on various factors
    let score = 50; // Base score
    
    // Budget utilization (good if between 40-80%)
    const budgetUtilization = (campaign.spent / campaign.budget) * 100;
    if (budgetUtilization >= 40 && budgetUtilization <= 80) score += 15;
    else if (budgetUtilization > 80) score += 10;
    
    // Conversion rate (good if > 20%)
    if (metrics.conversionRate > 20) score += 20;
    else if (metrics.conversionRate > 10) score += 10;
    
    // ROI (good if > 100%)
    if (metrics.roi > 100) score += 15;
    else if (metrics.roi > 50) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }, [campaign, metrics]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaign) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted campaign:", campaign.name);
      router.push("/sales/campaigns");
    } catch (error) {
      console.error("Error deleting campaign:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  // Form handlers
  const handleEditCampaign = () => {
    if (!campaign) return;
    
    setEditingCampaign({
      name: campaign.name,
      type: campaign.type as any,
      status: campaign.status as any,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: campaign.budget,
      assignedTo: campaign.owner,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<CampaignType>) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Updating campaign:", data);
      setFormDrawerOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error("Error updating campaign:", error);
      throw error;
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  const handleActivatePause = () => {
    if (!campaign) return;
    console.log("Toggle campaign status:", campaign.id);
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Active: "bg-primary/10 text-primary",
      Planned: "bg-accent/10 text-accent",
      Completed: "bg-secondary/10 text-secondary",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  // Type badge colors
  const getTypeColors = (type: string) => {
    const colors = {
      Email: "bg-primary/10 text-primary",
      "Social Media": "bg-secondary/10 text-secondary",
      LinkedIn: "bg-accent/10 text-accent",
      Webinar: "bg-primary/20 text-primary",
      Event: "bg-secondary/20 text-secondary",
      Referral: "bg-accent/20 text-accent",
      Content: "bg-primary/10 text-primary",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  // If campaign not found
  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Campaign Not Found</h2>
        <p className="text-gray-600">The campaign you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/sales/campaigns")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "performance" as TabType, label: "Performance", icon: BarChart3 },
    { id: "leads" as TabType, label: "Leads", icon: Users },
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
              onClick={() => router.push("/sales/campaigns")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {campaign.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{campaign.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColors(campaign.type)}`}>
                    {campaign.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Budget: ${(campaign.budget / 1000).toFixed(0)}K
                  </span>
                  <span className="text-sm text-muted-foreground">Created {campaign.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditCampaign}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {campaign.status === "Active" ? (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleActivatePause}>
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleActivatePause}>
                  <Play className="h-4 w-4" />
                  Activate
                </Button>
              )}
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
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  ${(campaign.budget / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground">
                  ${(campaign.spent / 1000).toFixed(0)}K spent
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leads Generated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground">{campaign.leads}</p>
                <p className="text-xs text-muted-foreground">
                  {campaign.conversions} conversions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {metrics?.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {campaign.conversions} of {campaign.leads} leads
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {metrics?.roi.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  ${((campaign.revenue - campaign.spent) / 1000).toFixed(0)}K profit
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
                            <h3 className="text-lg font-semibold mb-4">Campaign Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Campaign Name</p>
                                <p className="text-base font-medium">{campaign.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Type</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getTypeColors(campaign.type)}`}>
                                  {campaign.type}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(campaign.status)}`}>
                                  {campaign.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                                <p className="text-base font-medium">{campaign.owner}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                                <p className="text-base font-medium">{campaign.startDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">End Date</p>
                                <p className="text-base font-medium">{campaign.endDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Budget</p>
                                <p className="text-base font-medium">
                                  ${(campaign.budget / 1000).toFixed(0)}K
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Spent</p>
                                <p className="text-base font-medium">
                                  ${(campaign.spent / 1000).toFixed(0)}K
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {campaign.description && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Description</h3>
                            <p className="text-base text-muted-foreground">{campaign.description}</p>
                          </div>
                        )}

                        {campaign.targetAudience && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Target Audience</h3>
                            <p className="text-base text-muted-foreground">{campaign.targetAudience}</p>
                          </div>
                        )}

                        {campaign.channels && campaign.channels.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Channels</h3>
                            <div className="flex flex-wrap gap-2">
                              {campaign.channels.map((channel, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                                >
                                  {channel}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "performance" && (
                      <motion.div
                        key="performance"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockPerformanceMetrics.map((metric, index) => {
                              const Icon = metric.icon;
                              return (
                                <Card key={index} className="border border-border">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                      <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                                      <span className={`text-sm font-medium ${metric.isPositive ? "text-green-600" : "text-red-600"}`}>
                                        {metric.change}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
                          <Card className="border border-border">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                                  <span className="text-lg font-bold text-foreground">
                                    ${(campaign.revenue / 1000).toFixed(0)}K
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Total Spent</span>
                                  <span className="text-lg font-semibold text-foreground">
                                    ${(campaign.spent / 1000).toFixed(0)}K
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                  <span className="text-sm font-medium text-foreground">Net Profit</span>
                                  <span className="text-lg font-bold text-primary">
                                    ${((campaign.revenue - campaign.spent) / 1000).toFixed(0)}K
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "leads" && (
                      <motion.div
                        key="leads"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockLeads.length > 0 ? (
                          mockLeads.map((lead) => (
                            <div
                              key={lead.id}
                              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <p className="font-medium">{lead.name}</p>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    lead.status === "Qualified"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                      : lead.status === "Contacted"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                      : "bg-muted text-muted-foreground"
                                  }`}>
                                    {lead.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{lead.email}</span>
                                  <span>•</span>
                                  <span>{lead.company}</span>
                                  <span>•</span>
                                  <span>{lead.source}</span>
                                  <span>•</span>
                                  <span>{lead.date}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3" />
                            <p>No leads generated yet</p>
                          </div>
                        )}
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
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Add Note</label>
                          <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Enter your note here..."
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end">
                            <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim()}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          </div>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-foreground">Previous Notes</h3>
                          {mockNotes.map((note) => (
                            <div key={note.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                              <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                                {note.content}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{note.author}</span>
                                <span>{note.date} at {note.time}</span>
                              </div>
                            </div>
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("View Report")}>
                  <BarChart3 className="h-4 w-4" />
                  View Report
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Export")}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Share")}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </CardContent>
            </Card>

            {/* Campaign Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Campaign Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-full h-8 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${campaignHealthScore}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-brand-teal to-brand-purple"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {campaignHealthScore}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Based on performance metrics
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Key Milestones/Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Key Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockMilestones.map((milestone, index) => {
                  const Icon = milestone.icon;
                  return (
                    <div key={milestone.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          milestone.status === "completed"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {index < mockMilestones.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className={`text-sm font-medium ${
                          milestone.status === "completed" ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {milestone.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{milestone.date}</p>
                      </div>
                    </div>
                  );
                })}
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
        title="Delete Campaign"
        description="Are you sure you want to delete this campaign? This will permanently remove it from your CRM and cannot be undone."
        itemName={campaign.name}
        itemType="Campaign"
        icon={Megaphone}
        isDeleting={isDeleting}
      />

      {/* Campaign Form Drawer */}
      <CampaignFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingCampaign(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCampaign}
        mode="edit"
        defaultView="detailed"
      />
    </div>
  );
}
