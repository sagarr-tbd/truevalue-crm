"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  LifeBuoy,
  AlertCircle,
  Clock,
  User,
  MessageSquare,
  Plus,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Circle,
  Mail,
  Phone,
  Building2,
  Link as LinkIcon,
  Flag,
  AlertTriangle,
  ArrowUpRight,
  GitMerge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { CaseFormDrawer } from "@/components/Forms/Support";
import type { Case as CaseType } from "@/lib/types";

// Case data structure (matching cases list page)
type Case = {
  id: number;
  caseNumber: string;
  subject: string;
  description: string;
  customer: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Waiting" | "Resolved" | "Closed";
  type: string;
  category: string;
  assignedTo: string;
  created: string;
  lastModified: string;
  dueDate: string;
  responseTime: string;
  resolutionTime: string | null;
  comments: number;
  initials: string;
  accountId?: number;
};

// Mock cases data
const cases: Case[] = [
  {
    id: 1,
    caseNumber: "CASE-2026-001",
    subject: "Login Issue - Cannot Access Dashboard",
    description: "User unable to login after password reset. Error message shows &apos;Invalid credentials&apos; even with correct password. Tried clearing cache and cookies but issue persists.",
    customer: "Acme Corporation",
    contactName: "John Doe",
    contactEmail: "john.doe@acmecorp.com",
    contactPhone: "+1 (555) 100-2001",
    priority: "High",
    status: "In Progress",
    type: "Technical",
    category: "Authentication",
    assignedTo: "Sarah Johnson",
    created: "Jan 28, 2026 09:15 AM",
    lastModified: "Jan 28, 2026 11:30 AM",
    dueDate: "Jan 29, 2026",
    responseTime: "15 mins",
    resolutionTime: null,
    comments: 8,
    initials: "JD",
    accountId: 1,
  },
  {
    id: 2,
    caseNumber: "CASE-2026-002",
    subject: "Feature Request - Export to Excel",
    description: "Customer requesting bulk export functionality for reports. Need ability to export large datasets (10,000+ rows) to Excel format with formatting preserved.",
    customer: "TechVision Inc",
    contactName: "Jane Smith",
    contactEmail: "jane.smith@techvision.io",
    contactPhone: "+1 (555) 200-3002",
    priority: "Medium",
    status: "Open",
    type: "Feature Request",
    category: "Enhancement",
    assignedTo: "Mike Wilson",
    created: "Jan 28, 2026 08:45 AM",
    lastModified: "Jan 28, 2026 08:45 AM",
    dueDate: "Feb 2, 2026",
    responseTime: "2 hrs",
    resolutionTime: null,
    comments: 3,
    initials: "JS",
    accountId: 2,
  },
  {
    id: 3,
    caseNumber: "CASE-2026-003",
    subject: "Billing Question - Invoice Discrepancy",
    description: "Customer has questions about recent invoice charges. Invoice #INV-2026-001 shows charges that don&apos;t match their subscription plan. Need to review billing history.",
    customer: "Global Solutions Ltd",
    contactName: "Robert Brown",
    contactEmail: "r.brown@globalsolutions.com",
    contactPhone: "+1 (555) 300-4003",
    priority: "High",
    status: "Waiting",
    type: "Billing",
    category: "Finance",
    assignedTo: "Emily Davis",
    created: "Jan 27, 2026 04:30 PM",
    lastModified: "Jan 28, 2026 10:00 AM",
    dueDate: "Jan 28, 2026",
    responseTime: "30 mins",
    resolutionTime: null,
    comments: 12,
    initials: "RB",
    accountId: 3,
  },
  {
    id: 4,
    caseNumber: "CASE-2026-004",
    subject: "System Performance - Slow Loading",
    description: "Reports taking too long to generate. Customer reports 5+ minute wait times for standard reports. Performance degradation noticed after recent update.",
    customer: "Innovate Labs",
    contactName: "Lisa Anderson",
    contactEmail: "l.anderson@innovatelabs.io",
    contactPhone: "+1 (555) 400-5004",
    priority: "Medium",
    status: "In Progress",
    type: "Technical",
    category: "Performance",
    assignedTo: "Tom Harris",
    created: "Jan 27, 2026 02:15 PM",
    lastModified: "Jan 28, 2026 09:45 AM",
    dueDate: "Jan 30, 2026",
    responseTime: "1 hr",
    resolutionTime: null,
    comments: 6,
    initials: "LA",
    accountId: 4,
  },
  {
    id: 5,
    caseNumber: "CASE-2026-005",
    subject: "Data Integration - API Connection Failed",
    description: "Third-party integration not syncing data. Salesforce integration stopped working after API credentials were updated. Error logs show authentication failures.",
    customer: "NextGen Systems",
    contactName: "David Lee",
    contactEmail: "d.lee@nextgensystems.com",
    contactPhone: "+1 (555) 500-6005",
    priority: "Critical",
    status: "In Progress",
    type: "Technical",
    category: "Integration",
    assignedTo: "Sarah Johnson",
    created: "Jan 28, 2026 07:00 AM",
    lastModified: "Jan 28, 2026 11:15 AM",
    dueDate: "Jan 28, 2026",
    responseTime: "10 mins",
    resolutionTime: null,
    comments: 15,
    initials: "DL",
    accountId: 5,
  },
];

// Mock activity timeline data
const mockActivities = [
  {
    id: 1,
    type: "response",
    title: "Response sent to customer",
    description: "Provided troubleshooting steps for login issue. Waiting for customer feedback.",
    date: "Jan 28, 2026",
    time: "11:30 AM",
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    user: "Sarah Johnson",
  },
  {
    id: 2,
    type: "status",
    title: "Status changed to In Progress",
    description: "Case moved from Open to In Progress",
    date: "Jan 28, 2026",
    time: "10:15 AM",
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-100",
    user: "Sarah Johnson",
  },
  {
    id: 3,
    type: "note",
    title: "Internal note added",
    description: "Customer mentioned they tried password reset multiple times. May need to check account lockout settings.",
    date: "Jan 28, 2026",
    time: "09:45 AM",
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    user: "Sarah Johnson",
  },
  {
    id: 4,
    type: "response",
    title: "Customer response received",
    description: "Customer confirmed they are still unable to login. Requesting escalation.",
    date: "Jan 28, 2026",
    time: "09:20 AM",
    icon: MessageSquare,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    user: "John Doe",
  },
  {
    id: 5,
    type: "created",
    title: "Case created",
    description: "Case opened by customer via support portal",
    date: "Jan 28, 2026",
    time: "09:15 AM",
    icon: LifeBuoy,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    user: "System",
  },
];

// Mock related items
const mockRelatedContacts = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@acmecorp.com",
    jobTitle: "IT Manager",
    initials: "JD",
  },
];

const mockRelatedAccounts = [
  {
    id: 1,
    name: "Acme Corporation",
    industry: "Technology",
    initials: "AC",
  },
];

const mockRelatedSolutions = [
  {
    id: 1,
    title: "Password Reset Troubleshooting Guide",
    category: "Authentication",
    views: 245,
  },
  {
    id: 2,
    title: "Account Lockout Resolution Steps",
    category: "Security",
    views: 189,
  },
];

const mockRelatedArticles = [
  {
    id: 1,
    title: "Common Login Issues and Solutions",
    category: "Technical Support",
    published: "Jan 15, 2026",
  },
  {
    id: 2,
    title: "Two-Factor Authentication Setup",
    category: "Security",
    published: "Jan 10, 2026",
  },
];

// Mock notes data
const mockNotes = [
  {
    id: 1,
    content: "Customer is experiencing persistent login issues. Verified account is not locked. May need to check session management configuration.",
    author: "Sarah Johnson",
    date: "Jan 28, 2026",
    time: "11:30 AM",
  },
  {
    id: 2,
    content: "Escalated to technical team for deeper investigation. Customer is VIP account, prioritize resolution.",
    author: "Sarah Johnson",
    date: "Jan 28, 2026",
    time: "10:15 AM",
  },
];

type TabType = "details" | "activity" | "related" | "notes";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Partial<CaseType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("edit");

  // Find case by ID
  const caseItem = useMemo(() => {
    const caseId = parseInt(id);
    return cases.find((c) => c.id === caseId);
  }, [id]);

  // Calculate response time status
  const responseTimeStatus = useMemo(() => {
    if (!caseItem) return { status: "normal", text: "N/A" };
    const responseTime = caseItem.responseTime;
    if (responseTime.includes("mins") && parseInt(responseTime) < 30) {
      return { status: "good", text: responseTime };
    } else if (responseTime.includes("hrs") && parseInt(responseTime) < 2) {
      return { status: "normal", text: responseTime };
    } else {
      return { status: "warning", text: responseTime };
    }
  }, [caseItem]);

  // Calculate time since last update
  const timeSinceUpdate = useMemo(() => {
    if (!caseItem) return "N/A";
    // Simple calculation - in real app would parse dates properly
    return "2 hours ago";
  }, [caseItem]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!caseItem) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted case:", caseItem.caseNumber);
      router.push("/support/cases");
    } catch (error) {
      console.error("Error deleting case:", error);
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

  const handleCloseCase = () => {
    if (!caseItem) return;
    console.log("Closing case:", caseItem.caseNumber);
    // In a real app, this would update the case status
  };

  // Form drawer handlers
  const handleEditCase = () => {
    if (!caseItem) return;
    
    // Map priority: "Critical" -> "Urgent", others stay the same
    const priorityMap: Record<string, CaseType["priority"]> = {
      "Critical": "Urgent",
      "High": "High",
      "Medium": "Medium",
      "Low": "Low",
    };
    
    // Map status: "Scheduled" -> "Open", others stay the same
    const statusMap: Record<string, CaseType["status"]> = {
      "Scheduled": "Open",
      "In Progress": "In Progress",
      "Open": "Open",
      "Escalated": "Escalated",
      "Resolved": "Resolved",
      "Closed": "Closed",
      "Waiting": "Open",
    };

    setEditingCase({
      caseNumber: caseItem.caseNumber,
      subject: caseItem.subject,
      description: caseItem.description,
      customer: caseItem.customer,
      contactName: caseItem.contactName,
      contactEmail: caseItem.contactEmail,
      contactPhone: caseItem.contactPhone,
      priority: priorityMap[caseItem.priority] || "Medium",
      status: statusMap[caseItem.status] || "Open",
      type: caseItem.type as CaseType["type"],
      category: caseItem.category,
      assignedTo: caseItem.assignedTo,
      dueDate: caseItem.dueDate,
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<CaseType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data, "Mode:", formMode);
      setFormDrawerOpen(false);
      setEditingCase(null);
      // In a real app, you would refresh the case data here
    } catch (error) {
      console.error("Error saving case:", error);
      throw error;
    }
  };

  // Priority badge colors
  const getPriorityColors = (priority: string) => {
    const colors = {
      Critical: "bg-destructive/10 text-destructive",
      High: "bg-primary/10 text-primary",
      Medium: "bg-accent/10 text-accent",
      Low: "bg-muted text-muted-foreground",
    };
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Open: "bg-primary/20 text-primary",
      "In Progress": "bg-accent/10 text-accent",
      Waiting: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
      Resolved: "bg-primary/30 text-primary",
      Closed: "bg-muted text-muted-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Priority icon
  const getPriorityIcon = (priority: string) => {
    if (priority === "Critical") return AlertTriangle;
    if (priority === "High") return Flag;
    return Flag;
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    if (status === "Closed") return XCircle;
    if (status === "Resolved") return CheckCircle2;
    if (status === "In Progress") return Clock;
    if (status === "Waiting") return Circle;
    return Circle;
  };

  // If case not found
  if (!caseItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Case Not Found</h2>
        <p className="text-gray-600">The case you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/support/cases")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "activity" as TabType, label: "Activity Timeline", icon: Activity },
    { id: "related" as TabType, label: "Related Items", icon: LinkIcon },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  const PriorityIcon = getPriorityIcon(caseItem.priority);
  const StatusIcon = getStatusIcon(caseItem.status);

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
              onClick={() => router.push("/support/cases")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cases
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <LifeBuoy className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{caseItem.caseNumber}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{caseItem.subject}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(
                    caseItem.priority
                  )}`}>
                    <PriorityIcon className="h-3 w-3 inline mr-1" />
                    {caseItem.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    caseItem.status
                  )}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {caseItem.status}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {caseItem.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditCase}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCloseCase}
                disabled={caseItem.status === "Closed" || caseItem.status === "Resolved"}
              >
                <XCircle className="h-4 w-4" />
                Close Case
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
                <PriorityIcon className="h-4 w-4" />
                Priority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getPriorityColors(
                  caseItem.priority
                )}`}>
                  <PriorityIcon className="h-3 w-3 inline mr-1" />
                  {caseItem.priority}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                  caseItem.status
                )}`}>
                  <StatusIcon className="h-3 w-3 inline mr-1" />
                  {caseItem.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className={`text-sm font-medium ${
                  responseTimeStatus.status === "good" ? "text-green-600" :
                  responseTimeStatus.status === "warning" ? "text-destructive" :
                  "text-foreground"
                }`}>
                  {responseTimeStatus.text}
                </p>
                <p className="text-xs text-muted-foreground">SLA: {caseItem.dueDate}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{timeSinceUpdate}</p>
                <p className="text-xs text-muted-foreground">{caseItem.lastModified}</p>
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
                            <h3 className="text-lg font-semibold mb-4">Case Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Subject</p>
                                <p className="text-base font-medium">{caseItem.subject}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{caseItem.description}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Category</p>
                                <p className="text-base font-medium">{caseItem.category}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Type</p>
                                <p className="text-base font-medium">{caseItem.type}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                                <p className="text-base font-medium">{caseItem.assignedTo}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Case Details</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Priority</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(
                                  caseItem.priority
                                )}`}>
                                  <PriorityIcon className="h-3 w-3 inline mr-1" />
                                  {caseItem.priority}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                  caseItem.status
                                )}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {caseItem.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                                <p className="text-base font-medium">{caseItem.dueDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Created</p>
                                <p className="text-base font-medium">{caseItem.created}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Last Modified</p>
                                <p className="text-base font-medium">{caseItem.lastModified}</p>
                              </div>
                              {caseItem.resolutionTime && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Resolution Time</p>
                                  <p className="text-base font-medium">{caseItem.resolutionTime}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "activity" && (
                      <motion.div
                        key="activity"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockActivities.map((activity, index) => {
                          const Icon = activity.icon;
                          return (
                            <div key={activity.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                {index < mockActivities.length - 1 && (
                                  <div className="w-0.5 h-full bg-border mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium">{activity.title}</p>
                                  <span className="text-sm text-muted-foreground">{activity.date}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{activity.user}</span>
                                  <span>•</span>
                                  <span>{activity.time}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}

                    {activeTab === "related" && (
                      <motion.div
                        key="related"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {/* Related Contacts */}
                        {mockRelatedContacts.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Related Contacts</h3>
                            <div className="space-y-2">
                              {mockRelatedContacts.map((contact) => (
                                <Link
                                  key={contact.id}
                                  href={`/sales/contacts/${contact.id}`}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                    {contact.initials}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                      {contact.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {contact.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {contact.jobTitle}
                                    </p>
                                  </div>
                                  <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related Accounts */}
                        {mockRelatedAccounts.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Related Accounts</h3>
                            <div className="space-y-2">
                              {mockRelatedAccounts.map((account) => (
                                <Link
                                  key={account.id}
                                  href={`/sales/accounts/${account.id}`}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                    {account.initials}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                      {account.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {account.industry}
                                    </p>
                                  </div>
                                  <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related Solutions */}
                        {mockRelatedSolutions.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Related Solutions</h3>
                            <div className="space-y-2">
                              {mockRelatedSolutions.map((solution) => (
                                <Link
                                  key={solution.id}
                                  href={`/support/solutions/${solution.id}`}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                      {solution.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {solution.category} • {solution.views} views
                                    </p>
                                  </div>
                                  <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related Articles */}
                        {mockRelatedArticles.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
                            <div className="space-y-2">
                              {mockRelatedArticles.map((article) => (
                                <div
                                  key={article.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-accent" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                      {article.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {article.category} • Published {article.published}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
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
                        <div className="border border-border rounded-lg p-4 bg-gray-50">
                          <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note about this case..."
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.location.href = `mailto:${caseItem.contactEmail}`}>
                  <MessageSquare className="h-4 w-4" />
                  Reply
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Escalate case")}>
                  <ArrowUpRight className="h-4 w-4" />
                  Escalate
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Merge case")}>
                  <GitMerge className="h-4 w-4" />
                  Merge Case
                </Button>
              </CardContent>
            </Card>

            {/* Case Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Case Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{caseItem.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium">{caseItem.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <p className="text-sm font-medium">{caseItem.assignedTo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Comments</p>
                  <p className="text-sm font-medium">{caseItem.comments} comments</p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contact Name</p>
                  <Link
                    href={`/sales/contacts/${mockRelatedContacts[0]?.id || 1}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <User className="h-3 w-3" />
                    {caseItem.contactName}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a
                    href={`mailto:${caseItem.contactEmail}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {caseItem.contactEmail}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <a
                    href={`tel:${caseItem.contactPhone}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {caseItem.contactPhone}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Account</p>
                  <Link
                    href={`/sales/accounts/${mockRelatedAccounts[0]?.id || 1}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Building2 className="h-3 w-3" />
                    {caseItem.customer}
                  </Link>
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
        title="Delete Case"
        description="Are you sure you want to delete this case? This will permanently remove it from your support system and cannot be undone."
        itemName={caseItem.caseNumber}
        itemType="Case"
        icon={LifeBuoy}
        isDeleting={isDeleting}
      />

      {/* Case Form Drawer */}
      <CaseFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingCase(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCase}
        mode={formMode}
      />
    </div>
  );
}
