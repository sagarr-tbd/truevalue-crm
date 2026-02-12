"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Share2,
  Lightbulb,
  Eye,
  ThumbsUp,
  FileText,
  MessageSquare,
  Plus,
  Activity,
  AlertCircle,
  Star,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { SolutionFormDrawer } from "@/components/Forms/Support";
import type { Solution as SolutionType } from "@/lib/types";

// Solution data structure (matching solutions list page)
type Solution = {
  id: number;
  solutionNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  author: string;
  status: "Published" | "Draft" | "Archived" | "Under Review";
  views: number;
  likes: number;
  dislikes: number;
  helpful: number;
  rating: number;
  comments: number;
  tags: string[];
  created: string;
  lastModified: string;
  relatedCases: number;
  initials: string;
  content?: string;
};

// Mock solutions data (expanded from list page)
const solutions: Solution[] = [
  {
    id: 1,
    solutionNumber: "SOL-2026-001",
    title: "How to Reset Your Password",
    description: "Step-by-step guide to reset your account password",
    category: "Authentication",
    subcategory: "Account Access",
    author: "Sarah Johnson",
    status: "Published",
    views: 2845,
    likes: 234,
    dislikes: 12,
    helpful: 95,
    rating: 4.8,
    comments: 45,
    tags: ["password", "security", "account"],
    created: "Dec 15, 2025",
    lastModified: "Jan 20, 2026",
    relatedCases: 67,
    initials: "SJ",
    content: `# How to Reset Your Password

## Overview
If you've forgotten your password or need to change it for security reasons, follow these simple steps to reset it.

## Step-by-Step Instructions

### Step 1: Navigate to Login Page
1. Go to the login page of your application
2. Click on the "Forgot Password?" link below the login form

### Step 2: Enter Your Email
1. Enter the email address associated with your account
2. Click "Send Reset Link"

### Step 3: Check Your Email
1. Open your email inbox
2. Look for an email from our support team
3. Click the password reset link in the email

### Step 4: Create New Password
1. Enter your new password (must be at least 8 characters)
2. Confirm your new password
3. Click "Reset Password"

## Security Tips
- Use a strong password with a mix of letters, numbers, and symbols
- Don't share your password with anyone
- Change your password regularly
- Enable two-factor authentication for added security

## Troubleshooting
If you don't receive the reset email:
- Check your spam folder
- Verify you're using the correct email address
- Wait a few minutes and try again
- Contact support if issues persist`,
  },
  {
    id: 2,
    solutionNumber: "SOL-2026-002",
    title: "Configuring Email Notifications",
    description: "Learn how to customize your email notification preferences",
    category: "Settings",
    subcategory: "Notifications",
    author: "Mike Wilson",
    status: "Published",
    views: 1923,
    likes: 187,
    dislikes: 8,
    helpful: 92,
    rating: 4.6,
    comments: 32,
    tags: ["notifications", "email", "settings"],
    created: "Dec 20, 2025",
    lastModified: "Jan 25, 2026",
    relatedCases: 45,
    initials: "MW",
    content: `# Configuring Email Notifications

## Overview
Customize your email notification preferences to stay informed about important updates and activities.

## Accessing Notification Settings
1. Navigate to Settings > Notifications
2. Click on "Email Preferences"
3. Review all available notification types

## Notification Types
- **Account Updates**: Changes to your account settings
- **Activity Alerts**: Important activities and events
- **Weekly Reports**: Summary of your weekly activity
- **System Announcements**: Important system updates

## Customization Options
- Enable/disable specific notification types
- Choose frequency (immediate, daily digest, weekly)
- Set quiet hours for non-urgent notifications`,
  },
  {
    id: 3,
    solutionNumber: "SOL-2026-003",
    title: "API Integration Best Practices",
    description: "Complete guide to integrating third-party APIs",
    category: "Integration",
    subcategory: "API",
    author: "Tom Harris",
    status: "Published",
    views: 3421,
    likes: 456,
    dislikes: 23,
    helpful: 93,
    rating: 4.7,
    comments: 78,
    tags: ["api", "integration", "developer"],
    created: "Nov 28, 2025",
    lastModified: "Jan 22, 2026",
    relatedCases: 89,
    initials: "TH",
    content: `# API Integration Best Practices

## Overview
This guide covers best practices for integrating with our REST API.

## Authentication
- Use API keys for authentication
- Store keys securely (never commit to version control)
- Rotate keys regularly

## Rate Limiting
- Respect rate limits (100 requests per minute)
- Implement exponential backoff for retries
- Use webhooks for real-time updates

## Error Handling
- Always check response status codes
- Implement proper error handling
- Log errors for debugging`,
  },
  {
    id: 4,
    solutionNumber: "SOL-2026-004",
    title: "Troubleshooting Slow Performance",
    description: "Identify and resolve common performance issues",
    category: "Technical",
    subcategory: "Performance",
    author: "Emily Davis",
    status: "Published",
    views: 2654,
    likes: 312,
    dislikes: 18,
    helpful: 91,
    rating: 4.5,
    comments: 56,
    tags: ["performance", "troubleshooting", "optimization"],
    created: "Jan 5, 2026",
    lastModified: "Jan 26, 2026",
    relatedCases: 72,
    initials: "ED",
    content: `# Troubleshooting Slow Performance

## Common Causes
- Large datasets
- Network connectivity issues
- Browser cache problems
- Server load

## Solutions
1. Clear browser cache
2. Check network connection
3. Reduce data load
4. Contact support if issues persist`,
  },
];

// Mock related cases data
const mockRelatedCases = [
  {
    id: 1,
    caseNumber: "CASE-2026-001",
    subject: "Password reset not working",
    status: "Resolved",
    priority: "High",
    customer: "John Doe",
    created: "Jan 25, 2026",
    resolved: "Jan 26, 2026",
  },
  {
    id: 2,
    caseNumber: "CASE-2026-045",
    subject: "Unable to access account",
    status: "Resolved",
    priority: "Medium",
    customer: "Jane Smith",
    created: "Jan 20, 2026",
    resolved: "Jan 21, 2026",
  },
  {
    id: 3,
    caseNumber: "CASE-2026-089",
    subject: "Forgot password email not received",
    status: "Resolved",
    priority: "High",
    customer: "Mike Johnson",
    created: "Jan 18, 2026",
    resolved: "Jan 19, 2026",
  },
  {
    id: 4,
    caseNumber: "CASE-2026-112",
    subject: "Password requirements unclear",
    status: "Resolved",
    priority: "Low",
    customer: "Sarah Williams",
    created: "Jan 15, 2026",
    resolved: "Jan 16, 2026",
  },
];

// Mock notes data
const mockNotes = [
  {
    id: 1,
    content: "This solution has been very helpful for customers. Consider adding a video tutorial to make it even more accessible.",
    author: "Sarah Johnson",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Updated content based on customer feedback. Added troubleshooting section for common issues.",
    author: "Mike Wilson",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
  {
    id: 3,
    content: "Solution has resolved 67 cases successfully. High helpfulness rating indicates it's effective.",
    author: "Emily Davis",
    date: "Jan 22, 2026",
    time: "3:45 PM",
  },
];

type TabType = "details" | "content" | "cases" | "notes";

export default function SolutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<Partial<SolutionType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("edit");

  // Find solution by ID
  const solution = useMemo(() => {
    const solutionId = parseInt(id);
    return solutions.find((s) => s.id === solutionId);
  }, [id]);

  // Get status colors
  const getStatusColors = (status: string) => {
    const colors = {
      Published: "bg-primary/10 text-primary",
      Draft: "bg-muted text-muted-foreground",
      Archived: "bg-destructive/10 text-destructive",
      "Under Review": "bg-secondary/10 text-secondary",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Get category colors
  const getCategoryColors = (category: string) => {
    const colors = {
      Authentication: "bg-primary/10 text-primary",
      Settings: "bg-secondary/10 text-secondary",
      Integration: "bg-accent/10 text-accent",
      Technical: "bg-primary/20 text-primary",
      "Data Management": "bg-secondary/20 text-secondary",
      Security: "bg-destructive/10 text-destructive",
      Mobile: "bg-accent/20 text-accent",
      Billing: "bg-primary/10 text-primary",
      Reporting: "bg-secondary/10 text-secondary",
      Automation: "bg-accent/10 text-accent",
    };
    return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!solution) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted solution:", solution.title);
      router.push("/support/solutions");
    } catch (error) {
      console.error("Error deleting solution:", error);
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

  const handleDuplicate = () => {
    if (!solution) return;
    console.log("Duplicating solution:", solution.title);
    // In a real app, this would create a duplicate solution
  };

  // Form drawer handlers
  const handleEditSolution = () => {
    if (!solution) return;
    
    // Map status: "Under Review" -> "Draft" (closest match), others stay the same
    const statusMap: Record<string, SolutionType["status"]> = {
      "Published": "Published",
      "Draft": "Draft",
      "Under Review": "Draft",
      "Archived": "Archived",
    };

    setEditingSolution({
      solutionNumber: solution.solutionNumber,
      title: solution.title,
      description: solution.description,
      category: solution.category,
      subcategory: solution.subcategory,
      author: solution.author,
      status: statusMap[solution.status] || "Draft",
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<SolutionType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data, "Mode:", formMode);
      setFormDrawerOpen(false);
      setEditingSolution(null);
      // In a real app, you would refresh the solution data here
    } catch (error) {
      console.error("Error saving solution:", error);
      throw error;
    }
  };

  // If solution not found
  if (!solution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Solution Not Found</h2>
        <p className="text-gray-600">The solution you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/support/solutions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Solutions
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "content" as TabType, label: "Solution Content", icon: Lightbulb },
    { id: "cases" as TabType, label: "Related Cases", icon: Activity },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  // Render stars for rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-accent text-accent" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-accent/50 text-accent" />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />);
    }
    return stars;
  };

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
              onClick={() => router.push("/support/solutions")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Solutions
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center shadow-lg">
                <Lightbulb className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{solution.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColors(
                    solution.category
                  )}`}>
                    {solution.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    solution.status
                  )}`}>
                    {solution.status}
                  </span>
                  <div className="flex items-center gap-1">
                    {renderStars(solution.rating)}
                    <span className="text-sm text-muted-foreground ml-1">({solution.rating})</span>
                  </div>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{solution.helpful}% helpful</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditSolution}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
                Duplicate
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
                <Eye className="h-4 w-4" />
                Views
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {solution.views.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total views
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Helpful Votes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {solution.likes}
                </p>
                <p className="text-xs text-muted-foreground">
                  {solution.helpful}% helpful rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Cases Resolved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {solution.relatedCases}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cases using this solution
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{solution.lastModified}</p>
                <p className="text-xs text-muted-foreground">
                  Created {solution.created}
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
                            <h3 className="text-lg font-semibold mb-4">Solution Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Title</p>
                                <p className="text-base font-medium">{solution.title}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Solution Number</p>
                                <p className="text-base font-medium">{solution.solutionNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">
                                  {solution.description}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Category</p>
                                <div className="flex flex-wrap gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColors(
                                    solution.category
                                  )}`}>
                                    {solution.category}
                                  </span>
                                  <span className="text-sm text-muted-foreground">{solution.subcategory}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                  {solution.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-1 rounded-md bg-accent/20 px-2 py-0.5 text-xs text-accent-foreground"
                                    >
                                      <Tag className="h-3 w-3" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Metadata</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                    solution.status
                                  )}`}
                                >
                                  {solution.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Author</p>
                                <p className="text-base font-medium">{solution.author}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Created Date</p>
                                <p className="text-base font-medium">{solution.created}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Last Modified</p>
                                <p className="text-base font-medium">{solution.lastModified}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                                <div className="flex items-center gap-2">
                                  {renderStars(solution.rating)}
                                  <span className="text-base font-medium">{solution.rating}</span>
                                  <span className="text-sm text-muted-foreground">({solution.comments} reviews)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "content" && (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="prose prose-sm max-w-none">
                          <div className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                            {solution.content || "No content available for this solution."}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "cases" && (
                      <motion.div
                        key="cases"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockRelatedCases.length > 0 ? (
                          mockRelatedCases.map((caseItem) => (
                            <Card key={caseItem.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <p className="text-sm font-semibold text-foreground">{caseItem.caseNumber}</p>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        caseItem.status === "Resolved" 
                                          ? "bg-primary/10 text-primary" 
                                          : "bg-muted text-muted-foreground"
                                      }`}>
                                        {caseItem.status}
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-medium text-foreground mb-1">{caseItem.subject}</h4>
                                    <p className="text-sm text-muted-foreground mb-2">Customer: {caseItem.customer}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Priority: {caseItem.priority}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Created: {caseItem.created}</span>
                                      </div>
                                      {caseItem.resolved && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <CheckCircle2 className="h-4 w-4 text-primary" />
                                          <span className="text-muted-foreground">Resolved: {caseItem.resolved}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/support/cases/${caseItem.id}`)}
                                  >
                                    View
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No related cases found</p>
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
                            placeholder="Enter your note here..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={4}
                            className="resize-none"
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
                            <Card key={note.id} className="border border-border">
                              <CardContent className="p-4">
                                <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                                  {note.content}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{note.author}</span>
                                  <span>{note.date} at {note.time}</span>
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Share", solution.id)}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Export", solution.id)}>
                  <FileText className="h-4 w-4" />
                  Export
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Mark as Featured", solution.id)}>
                  <Star className="h-4 w-4" />
                  Mark as Featured
                </Button>
              </CardContent>
            </Card>

            {/* Solution Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Solution Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{solution.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Author</p>
                  <p className="text-sm font-medium">{solution.author}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getCategoryColors(
                      solution.category
                    )}`}
                  >
                    {solution.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                      solution.status
                    )}`}
                  >
                    {solution.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Views</p>
                  <p className="text-sm font-medium">{solution.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Helpful Votes</p>
                  <p className="text-sm font-medium">{solution.likes}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cases Resolved</p>
                  <p className="text-sm font-medium">{solution.relatedCases}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    {renderStars(solution.rating)}
                    <span className="text-sm font-medium ml-1">{solution.rating}</span>
                  </div>
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
        title="Delete Solution"
        description="Are you sure you want to delete this solution? This will permanently remove it from your knowledge base and cannot be undone."
        itemName={solution.title}
        itemType="Solution"
        icon={Lightbulb}
        isDeleting={isDeleting}
      />

      {/* Solution Form Drawer */}
      <SolutionFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingSolution(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingSolution}
        mode={formMode}
      />
    </div>
  );
}
