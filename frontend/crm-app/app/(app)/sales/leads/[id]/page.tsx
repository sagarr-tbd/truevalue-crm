"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  UserPlus,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  TrendingUp,
  FileText,
  MessageSquare,
  Activity,
  Target,
  Plus,
  X,
  CheckSquare,
  FolderOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { LeadFormDrawer } from "@/components/Forms/Sales";
import type { Lead, LeadStatus, LeadRating } from "@/lib/types";

// Mock leads data (same as leads list page)
const leads: Lead[] = [
  {
    id: 1,
    firstName: "Michael",
    lastName: "Anderson",
    company: "TechVision Inc",
    email: "michael.a@techvision.com",
    phone: "+1 (555) 123-4567",
    source: "Website",
    status: "New" as LeadStatus,
    rating: "Hot" as LeadRating,
    industry: "Technology",
    expectedRevenue: 75000,
    createdAt: "Jan 25, 2026",
    lastContact: "Jan 28, 2026",
    initials: "MA",
  },
  {
    id: 2,
    firstName: "Jennifer",
    lastName: "Martinez",
    company: "Global Solutions Ltd",
    email: "j.martinez@globalsol.com",
    phone: "+1 (555) 234-5678",
    source: "Referral",
    status: "Contacted" as LeadStatus,
    rating: "Hot" as LeadRating,
    industry: "Finance",
    expectedRevenue: 125000,
    createdAt: "Jan 20, 2026",
    lastContact: "Jan 27, 2026",
    initials: "JM",
  },
  {
    id: 3,
    firstName: "Robert",
    lastName: "Thompson",
    company: "Innovate Labs",
    email: "r.thompson@innovatelabs.io",
    phone: "+1 (555) 345-6789",
    source: "LinkedIn",
    status: "Qualified" as LeadStatus,
    rating: "Warm" as LeadRating,
    industry: "Software",
    expectedRevenue: 95000,
    createdAt: "Jan 18, 2026",
    lastContact: "Jan 26, 2026",
    initials: "RT",
  },
  {
    id: 4,
    firstName: "Emily",
    lastName: "White",
    company: "Strategic Partners",
    email: "emily.white@stratpartners.com",
    phone: "+1 (555) 456-7890",
    source: "Trade Show",
    status: "New" as LeadStatus,
    rating: "Cold" as LeadRating,
    industry: "Consulting",
    expectedRevenue: 45000,
    createdAt: "Jan 27, 2026",
    lastContact: "Jan 27, 2026",
    initials: "EW",
  },
  {
    id: 5,
    firstName: "David",
    lastName: "Brown",
    company: "NextGen Systems",
    email: "d.brown@nextgensys.com",
    phone: "+1 (555) 567-8901",
    source: "Email Campaign",
    status: "Contacted" as LeadStatus,
    rating: "Hot" as LeadRating,
    industry: "Technology",
    expectedRevenue: 180000,
    createdAt: "Jan 15, 2026",
    lastContact: "Jan 28, 2026",
    initials: "DB",
  },
  {
    id: 6,
    firstName: "Amanda",
    lastName: "Garcia",
    company: "Digital Dynamics",
    email: "a.garcia@digitaldyn.com",
    phone: "+1 (555) 678-9012",
    source: "Website",
    status: "Qualified" as LeadStatus,
    rating: "Warm" as LeadRating,
    industry: "Marketing",
    expectedRevenue: 62000,
    createdAt: "Jan 22, 2026",
    lastContact: "Jan 26, 2026",
    initials: "AG",
  },
  {
    id: 7,
    firstName: "Christopher",
    lastName: "Lee",
    company: "Apex Solutions",
    email: "c.lee@apexsol.com",
    phone: "+1 (555) 789-0123",
    source: "Referral",
    status: "Qualified" as LeadStatus,
    rating: "Warm" as LeadRating,
    industry: "Healthcare",
    expectedRevenue: 88000,
    createdAt: "Jan 10, 2026",
    lastContact: "Jan 24, 2026",
    initials: "CL",
  },
  {
    id: 8,
    firstName: "Nicole",
    lastName: "Taylor",
    company: "Prime Industries",
    email: "nicole.t@primeindustries.com",
    phone: "+1 (555) 890-1234",
    source: "Cold Call",
    status: "New" as LeadStatus,
    rating: "Cold" as LeadRating,
    industry: "Manufacturing",
    expectedRevenue: 52000,
    createdAt: "Jan 28, 2026",
    lastContact: "Jan 28, 2026",
    initials: "NT",
  },
  {
    id: 9,
    firstName: "James",
    lastName: "Wilson",
    company: "FutureTech Co",
    email: "j.wilson@futuretech.io",
    phone: "+1 (555) 901-2345",
    source: "LinkedIn",
    status: "Qualified" as LeadStatus,
    rating: "Hot" as LeadRating,
    industry: "Technology",
    expectedRevenue: 145000,
    createdAt: "Jan 12, 2026",
    lastContact: "Jan 27, 2026",
    initials: "JW",
  },
  {
    id: 10,
    firstName: "Sophia",
    lastName: "Davis",
    company: "CloudFirst Inc",
    email: "sophia.d@cloudfirst.com",
    phone: "+1 (555) 012-3456",
    source: "Website",
    status: "Contacted" as LeadStatus,
    rating: "Warm" as LeadRating,
    industry: "Cloud Services",
    expectedRevenue: 72000,
    createdAt: "Jan 19, 2026",
    lastContact: "Jan 25, 2026",
    initials: "SD",
  },
];

// Mock activity data
type Activity = {
  id: number;
  type: "call" | "email" | "note" | "meeting";
  title: string;
  description: string;
  date: string;
  user: string;
};

const mockActivities: Activity[] = [
  {
    id: 1,
    type: "call",
    title: "Initial Discovery Call",
    description: "Discussed product requirements and timeline. Lead showed strong interest in enterprise features.",
    date: "Jan 28, 2026",
    user: "Sarah Johnson",
  },
  {
    id: 2,
    type: "email",
    title: "Follow-up Email",
    description: "Sent product brochure and pricing information.",
    date: "Jan 27, 2026",
    user: "Sarah Johnson",
  },
  {
    id: 3,
    type: "note",
    title: "Internal Note",
    description: "Lead mentioned budget approval expected next week. High priority follow-up needed.",
    date: "Jan 26, 2026",
    user: "Sarah Johnson",
  },
  {
    id: 4,
    type: "meeting",
    title: "Product Demo Scheduled",
    description: "Scheduled for Feb 5, 2026 at 2:00 PM. Will include technical team.",
    date: "Jan 25, 2026",
    user: "Sarah Johnson",
  },
];

// Mock notes data
type Note = {
  id: number;
  content: string;
  author: string;
  date: string;
};

const mockNotes: Note[] = [
  {
    id: 1,
    content: "Lead expressed interest in our enterprise solution. Budget approved for Q1. Decision maker is the CTO.",
    author: "Sarah Johnson",
    date: "Jan 28, 2026",
  },
  {
    id: 2,
    content: "Follow-up call scheduled for next week. Need to prepare custom demo based on their requirements.",
    author: "Sarah Johnson",
    date: "Jan 26, 2026",
  },
];

// Mock related items
const mockTasks = [
  { id: 1, title: "Schedule product demo", dueDate: "Feb 5, 2026", status: "In Progress" },
  { id: 2, title: "Send pricing proposal", dueDate: "Feb 10, 2026", status: "Pending" },
];

const mockMeetings = [
  { id: 1, title: "Product Demo", date: "Feb 5, 2026", time: "2:00 PM" },
];

const mockDocuments = [
  { id: 1, name: "Product Brochure.pdf", type: "PDF", size: "2.4 MB" },
  { id: 2, name: "Pricing Sheet.xlsx", type: "Excel", size: "156 KB" },
];

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id ? parseInt(params.id as string) : 0;

  const [activeTab, setActiveTab] = useState<"details" | "activity" | "notes" | "related">("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");
  // Edit form modal state
  const [editFormOpen, setEditFormOpen] = useState(false);

  // Find lead by ID
  const lead = useMemo(() => {
    return leads.find((l) => l.id === leadId);
  }, [leadId]);

  // Calculate days in pipeline
  const daysInPipeline = useMemo(() => {
    if (!lead) return 0;
    const createdDate = new Date(lead.createdAt || "");
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [lead]);

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<LeadStatus, string> = {
      New: "bg-secondary/10 text-secondary",
      Contacted: "bg-accent/10 text-accent",
      Qualified: "bg-primary/10 text-primary",
      Unqualified: "bg-muted text-muted-foreground",
    };
    return colors[status as LeadStatus] || "bg-muted text-muted-foreground";
  };

  // Get rating color
  const getRatingColor = (rating: string | undefined) => {
    if (!rating) return "bg-muted text-muted-foreground";
    const colors: Record<LeadRating, string> = {
      Hot: "bg-destructive/10 text-destructive",
      Warm: "bg-accent/10 text-accent",
      Cold: "bg-muted text-muted-foreground",
    };
    return colors[rating as LeadRating] || "bg-muted text-muted-foreground";
  };

  // Calculate lead score based on rating
  const getLeadScore = (rating: string | undefined) => {
    if (!rating) return 50;
    const scores: Record<LeadRating, number> = {
      Hot: 85,
      Warm: 60,
      Cold: 35,
    };
    return scores[rating as LeadRating] || 50;
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/sales/leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Handle form submission (update)
  const handleFormSubmit = async (data: Partial<typeof lead>) => {
    try {
      console.log("Lead updated:", data);
      // TODO: Replace with actual API call
      // await api.updateLead(leadId, data)
      
      // Close modal
      setEditFormOpen(false);
      // Toast is shown by FormDrawer component
      
      // Refresh data (in real app, refetch from API)
      // In this example, we would need to update the local lead object
    } catch (error) {
      console.error("Failed to update lead:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Handle add note
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  // Handle convert to contact
  const handleConvertToContact = () => {
    // In a real app, this would navigate to contact creation with pre-filled data
    router.push(`/sales/contacts/new?leadId=${leadId}`);
  };

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Lead Not Found</h2>
          <p className="text-muted-foreground mb-6">The lead you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/sales/leads">
            <Button className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const leadScore = getLeadScore(lead.rating);

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
              onClick={() => router.push("/sales/leads")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {lead.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {lead.firstName} {lead.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{lead.company}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(lead.rating)}`}>
                    {lead.rating || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditFormOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleConvertToContact}
              >
                <UserPlus className="h-4 w-4" />
                Convert to Contact
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setIsDeleteModalOpen(true)}
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
                <Mail className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{lead.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{lead.phone || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="text-sm font-medium">{lead.company}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-sm font-medium">{lead.industry || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Value</p>
                <p className="text-sm font-medium">${(lead.expectedRevenue || 0).toLocaleString('en-US')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Lead Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium">{lead.source || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{lead.createdAt || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Contact</p>
                <p className="text-sm font-medium">{lead.lastContact}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Days in Pipeline</p>
                <p className="text-sm font-medium">{daysInPipeline}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Activities</p>
                <p className="text-sm font-medium">{mockActivities.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm font-medium">{mockNotes.length}</p>
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
                  {[
                    { id: "details", label: "Details", icon: FileText },
                    { id: "activity", label: "Activity", icon: Activity },
                    { id: "notes", label: "Notes", icon: MessageSquare },
                    { id: "related", label: "Related Items", icon: FolderOpen },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Personal Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Full Name</label>
                            <p className="text-sm font-medium text-foreground mt-1">
                              {lead.firstName} {lead.lastName}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Email</label>
                            <p className="text-sm text-foreground mt-1">{lead.email}</p>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Phone</label>
                            <p className="text-sm text-foreground mt-1">{lead.phone || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Company Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Company Name</label>
                            <p className="text-sm font-medium text-foreground mt-1">{lead.company}</p>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Industry</label>
                            <p className="text-sm text-foreground mt-1">{lead.industry || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Estimated Value</label>
                            <p className="text-sm font-semibold text-foreground mt-1 font-tabular">
                              ${(lead.expectedRevenue || 0).toLocaleString('en-US')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Lead Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Status</label>
                            <div className="mt-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Rating</label>
                            <div className="mt-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(lead.rating)}`}>
                                {lead.rating || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Source</label>
                            <p className="text-sm text-foreground mt-1">{lead.source || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Timeline</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Created Date</label>
                            <p className="text-sm text-foreground mt-1">{lead.createdAt || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Last Contact</label>
                            <p className="text-sm text-foreground mt-1">{lead.lastContact}</p>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Days in Pipeline</label>
                            <p className="text-sm font-semibold text-foreground mt-1">{daysInPipeline} days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "activity" && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {mockActivities.map((activity, index) => {
                      const icons = {
                        call: Phone,
                        email: Mail,
                        note: FileText,
                        meeting: Calendar,
                      };
                      const Icon = icons[activity.type];
                      const colors = {
                        call: "bg-primary/10 text-primary",
                        email: "bg-accent/10 text-accent",
                        note: "bg-secondary/10 text-secondary",
                        meeting: "bg-brand-purple/10 text-brand-purple",
                      };

                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-4 pb-4 border-b border-border last:border-0"
                        >
                          <div className={`w-10 h-10 rounded-full ${colors[activity.type]} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-foreground">{activity.title}</h4>
                              <span className="text-xs text-muted-foreground">{activity.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">by {activity.user}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === "notes" && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Add Note Form */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Add Note</label>
                      <Textarea
                        placeholder="Enter your note here..."
                        value={newNote}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground">Previous Notes</h3>
                      {mockNotes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-muted/50 rounded-lg border border-border"
                        >
                          <p className="text-sm text-foreground mb-2">{note.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{note.author}</span>
                            <span>{note.date}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "related" && (
                  <motion.div
                    key="related"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Tasks */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Tasks ({mockTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {mockTasks.map((task) => (
                          <div key={task.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">{task.title}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                task.status === "In Progress" 
                                  ? "bg-primary/10 text-primary" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Due: {task.dueDate}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Meetings */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Meetings ({mockMeetings.length})
                      </h3>
                      <div className="space-y-2">
                        {mockMeetings.map((meeting) => (
                          <div key={meeting.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">{meeting.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {meeting.date} at {meeting.time}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents ({mockDocuments.length})
                      </h3>
                      <div className="space-y-2">
                        {mockDocuments.map((doc) => (
                          <div key={doc.id} className="p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm text-foreground">{doc.name}</span>
                                <p className="text-xs text-muted-foreground">{doc.type} • {doc.size}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
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
            {/* Lead Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Lead Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="h-32 w-32 mx-auto">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <defs>
                          <linearGradient id={`gradient-${leadId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--brand-teal))" />
                            <stop offset="100%" stopColor="hsl(var(--brand-purple))" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke={`url(#gradient-${leadId})`}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - leadScore / 100)}`}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">{leadScore}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Rating: {lead.rating || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                  <Phone className="h-4 w-4" />
                  Log Call
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                  <CheckSquare className="h-4 w-4" />
                  Create Task
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                  <FileText className="h-4 w-4" />
                  Add Document
                </Button>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Schedule product demo</p>
                      <p className="text-xs text-muted-foreground mt-1">Due: Feb 5, 2026</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Send pricing proposal</p>
                      <p className="text-xs text-muted-foreground mt-1">Due: Feb 10, 2026</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Follow up call</p>
                      <p className="text-xs text-muted-foreground mt-1">After demo</p>
                    </div>
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
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This will permanently remove it from your CRM and cannot be undone."
        itemName={`${lead.firstName} ${lead.lastName}`}
        itemType="Lead"
        icon={Target}
        isDeleting={isDeleting}
      />

      {/* Edit Form Drawer */}
      <LeadFormDrawer
        isOpen={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={lead}
        mode="edit"
        defaultView="detailed"
      />
    </div>
  );
}
