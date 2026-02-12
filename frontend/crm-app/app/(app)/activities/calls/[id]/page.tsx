"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Mail,
  Trash2,
  Phone,
  Calendar,
  User,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  AlertCircle,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  CheckSquare,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { CallFormDrawer } from "@/components/Forms/Activities";
import type { Call as CallType } from "@/lib/types";

// Call data structure (matching calls list page)
type Call = {
  id: number;
  subject: string;
  description: string;
  direction: "Incoming" | "Outgoing";
  status: "Completed" | "Scheduled" | "Missed" | "Cancelled";
  duration: string | null;
  date: string;
  time: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  relatedTo: string;
  callBy: string | null;
  outcome: string | null;
  created: string;
  initials: string;
};

// Mock calls data
const calls: Call[] = [
  {
    id: 1,
    subject: "Follow-up Call - Acme Corp",
    description: "Discuss proposal feedback and next steps",
    direction: "Outgoing",
    status: "Completed",
    duration: "25 min",
    date: "Jan 28, 2026",
    time: "10:30 AM",
    contactName: "Sarah Williams",
    contactPhone: "+1 (555) 123-4567",
    contactEmail: "sarah.williams@acme.com",
    relatedTo: "Acme Corporation",
    callBy: "John Smith",
    outcome: "Interested",
    created: "Jan 28, 2026",
    initials: "AC",
  },
  {
    id: 2,
    subject: "Discovery Call - TechVision Inc",
    description: "Initial consultation to understand requirements",
    direction: "Outgoing",
    status: "Scheduled",
    duration: "30 min",
    date: "Jan 30, 2026",
    time: "2:00 PM",
    contactName: "Michael Chen",
    contactPhone: "+1 (555) 234-5678",
    contactEmail: "michael.chen@techvision.io",
    relatedTo: "TechVision Inc",
    callBy: "Jane Doe",
    outcome: null,
    created: "Jan 27, 2026",
    initials: "TV",
  },
  {
    id: 3,
    subject: "Contract Negotiation",
    description: "Discuss pricing and terms",
    direction: "Outgoing",
    status: "Completed",
    duration: "45 min",
    date: "Jan 27, 2026",
    time: "11:00 AM",
    contactName: "Jessica Lee",
    contactPhone: "+1 (555) 345-6789",
    contactEmail: "jessica.lee@globalsolutions.com",
    relatedTo: "Global Solutions Ltd",
    callBy: "Mike Johnson",
    outcome: "Follow Up",
    created: "Jan 27, 2026",
    initials: "GS",
  },
  {
    id: 4,
    subject: "Support Request - CloudFirst Inc",
    description: "Technical issue escalation",
    direction: "Incoming",
    status: "Completed",
    duration: "15 min",
    date: "Jan 28, 2026",
    time: "3:45 PM",
    contactName: "Rachel Green",
    contactPhone: "+1 (555) 456-7890",
    contactEmail: "rachel.green@cloudfirst.com",
    relatedTo: "CloudFirst Inc",
    callBy: "Sarah Brown",
    outcome: "Resolved",
    created: "Jan 28, 2026",
    initials: "CF",
  },
  {
    id: 5,
    subject: "Check-in Call - NextGen Systems",
    description: "Monthly account review",
    direction: "Outgoing",
    status: "Completed",
    duration: "20 min",
    date: "Jan 26, 2026",
    time: "9:00 AM",
    contactName: "David Park",
    contactPhone: "+1 (555) 567-8901",
    contactEmail: "david.park@nextgensys.com",
    relatedTo: "NextGen Systems",
    callBy: "John Smith",
    outcome: "Positive",
    created: "Jan 26, 2026",
    initials: "NS",
  },
  {
    id: 6,
    subject: "Urgent Inquiry - Prime Industries",
    description: "Request for immediate assistance",
    direction: "Incoming",
    status: "Missed",
    duration: null,
    date: "Jan 28, 2026",
    time: "4:30 PM",
    contactName: "Lisa Anderson",
    contactPhone: "+1 (555) 678-9012",
    contactEmail: "lisa.anderson@primeindustries.com",
    relatedTo: "Prime Industries",
    callBy: null,
    outcome: null,
    created: "Jan 28, 2026",
    initials: "PI",
  },
  {
    id: 7,
    subject: "Renewal Discussion",
    description: "Discuss contract renewal options",
    direction: "Outgoing",
    status: "Completed",
    duration: "35 min",
    date: "Jan 25, 2026",
    time: "1:30 PM",
    contactName: "James Wilson",
    contactPhone: "+1 (555) 789-0123",
    contactEmail: "james.wilson@apexsolutions.com",
    relatedTo: "Apex Solutions",
    callBy: "Jane Doe",
    outcome: "Follow Up",
    created: "Jan 25, 2026",
    initials: "AS",
  },
  {
    id: 8,
    subject: "Demo Feedback",
    description: "Gather feedback from recent product demo",
    direction: "Outgoing",
    status: "Completed",
    duration: "18 min",
    date: "Jan 27, 2026",
    time: "10:00 AM",
    contactName: "Emma Johnson",
    contactPhone: "+1 (555) 890-1234",
    contactEmail: "emma.johnson@strategicpartners.com",
    relatedTo: "Strategic Partners",
    callBy: "Mike Johnson",
    outcome: "Interested",
    created: "Jan 27, 2026",
    initials: "SP",
  },
];

// Mock call notes
const mockCallNotes = [
  {
    id: 1,
    content: "Client showed strong interest in the enterprise package. Discussed pricing options and implementation timeline. They requested a detailed proposal by end of week.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "10:30 AM",
  },
  {
    id: 2,
    content: "Follow-up call scheduled for next week to review proposal. Client mentioned they need to discuss with their team before making a decision.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "10:55 AM",
  },
];

// Mock follow-up tasks
const mockFollowUps = [
  {
    id: 1,
    title: "Send detailed proposal",
    description: "Prepare and send enterprise package proposal",
    dueDate: "Feb 1, 2026",
    status: "Pending",
    assignedTo: "John Smith",
  },
  {
    id: 2,
    title: "Schedule follow-up call",
    description: "Call client next week to review proposal",
    dueDate: "Feb 5, 2026",
    status: "Pending",
    assignedTo: "John Smith",
  },
];

// Mock related items
const mockRelatedContact = {
  id: 1,
  name: "Sarah Williams",
  email: "sarah.williams@acme.com",
  phone: "+1 (555) 123-4567",
  company: "Acme Corporation",
  jobTitle: "VP Sales",
  initials: "SW",
};

const mockRelatedDeals = [
  {
    id: 1,
    name: "Enterprise CRM Package",
    value: "$125,000",
    stage: "Proposal",
    probability: 75,
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

type TabType = "details" | "notes" | "recording" | "followups";

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<Partial<CallType> | null>(null);

  // Find call by ID
  const call = useMemo(() => {
    const callId = parseInt(id);
    return calls.find((c) => c.id === callId);
  }, [id]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!call) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted call:", call.subject);
      router.push("/activities/calls");
    } catch (error) {
      console.error("Error deleting call:", error);
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
  const handleEditCall = () => {
    if (!call) return;
    setEditingCall({
      id: call.id,
      subject: call.subject,
      description: call.description,
      direction: call.direction as "Incoming" | "Outgoing",
      status: call.status as "Scheduled" | "Completed" | "Missed" | "Cancelled" | undefined,
      date: call.date,
      time: call.time,
      duration: call.duration || undefined,
      contactName: call.contactName,
      contactPhone: call.contactPhone,
      relatedTo: call.relatedTo,
      outcome: call.outcome || undefined,
      callBy: call.callBy || undefined,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<CallType>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Form submitted:", data);
      
      // Close drawer
      setFormDrawerOpen(false);
      setEditingCall(null);
      
      // In production: refresh data or update state
    } catch (error) {
      console.error("Error saving call:", error);
      throw error;
    }
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Completed: "bg-primary/20 text-primary",
      Scheduled: "bg-accent/10 text-accent",
      Missed: "bg-destructive/10 text-destructive",
      Cancelled: "bg-gray-100 text-gray-600",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  // Direction badge colors
  const getDirectionColors = (direction: string) => {
    const colors = {
      Outgoing: "bg-primary/10 text-primary",
      Incoming: "bg-secondary/10 text-secondary",
    };
    return colors[direction as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  // Outcome badge colors
  const getOutcomeColors = (outcome: string | null) => {
    if (!outcome) return "bg-gray-100 text-gray-600";
    const colors = {
      Interested: "bg-primary/20 text-primary",
      "Not Interested": "bg-destructive/10 text-destructive",
      "Follow Up": "bg-accent/10 text-accent",
      Positive: "bg-primary/20 text-primary",
      Resolved: "bg-primary/20 text-primary",
      "Quote Sent": "bg-accent/10 text-accent",
    };
    return colors[outcome as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  // Get direction icon
  const getDirectionIcon = (direction: string) => {
    if (direction === "Outgoing") return PhoneOutgoing;
    if (direction === "Incoming") return PhoneIncoming;
    return Phone;
  };

  // If call not found
  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Call Not Found</h2>
        <p className="text-gray-600">The call you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/activities/calls")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calls
        </Button>
      </div>
    );
  }

  const DirectionIcon = getDirectionIcon(call.direction);

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "notes" as TabType, label: "Call Notes", icon: MessageSquare },
    { id: "recording" as TabType, label: "Recording & Transcript", icon: Play },
    { id: "followups" as TabType, label: "Follow-ups", icon: CheckSquare },
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
              onClick={() => router.push("/activities/calls")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Calls
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <DirectionIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{call.subject}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{call.contactName}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDirectionColors(
                    call.direction
                  )}`}>
                    {call.direction}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    call.status
                  )}`}>
                    {call.status}
                  </span>
                  {call.outcome && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOutcomeColors(
                      call.outcome
                    )}`}>
                      {call.outcome}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditCall}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => console.log("Log Call")}
              >
                <Phone className="h-4 w-4" />
                Log Call
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
                <Clock className="h-4 w-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">
                  {call.duration || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">Call length</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{call.date}</p>
                <p className="text-xs text-muted-foreground">{call.time}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{call.contactName}</p>
                <p className="text-xs text-muted-foreground">{call.relatedTo}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                {call.outcome ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getOutcomeColors(
                    call.outcome
                  )}`}>
                    {call.outcome}
                  </span>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">No outcome</p>
                )}
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
                            <h3 className="text-lg font-semibold mb-4">Call Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Subject</p>
                                <p className="text-base font-medium">{call.subject}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base font-medium">{call.description}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Contact</p>
                                <p className="text-base font-medium">{call.contactName}</p>
                                {call.contactEmail && (
                                  <p className="text-sm text-muted-foreground">{call.contactEmail}</p>
                                )}
                                <p className="text-sm text-muted-foreground">{call.contactPhone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                                <p className="text-base font-medium">{call.date} at {call.time}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Call Details</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                                <p className="text-base font-medium">{call.duration || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Direction</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDirectionColors(
                                  call.direction
                                )}`}>
                                  {call.direction}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                  call.status
                                )}`}>
                                  {call.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Outcome</p>
                                {call.outcome ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOutcomeColors(
                                    call.outcome
                                  )}`}>
                                    {call.outcome}
                                  </span>
                                ) : (
                                  <p className="text-base font-medium text-muted-foreground">No outcome</p>
                                )}
                              </div>
                              {call.callBy && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Called By</p>
                                  <p className="text-base font-medium">{call.callBy}</p>
                                </div>
                              )}
                            </div>
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
                            placeholder="Add a note about this call..."
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
                          {mockCallNotes.map((note) => (
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

                    {activeTab === "recording" && (
                      <motion.div
                        key="recording"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="text-center py-12 border border-border rounded-lg bg-muted/30">
                          <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Call Recording
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Call recording and transcript will appear here when available
                          </p>
                          <Button variant="outline" size="sm">
                            Upload Recording
                          </Button>
                        </div>

                        <div className="text-center py-12 border border-border rounded-lg bg-muted/30">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Transcript
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Transcript will be generated automatically when recording is available
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "followups" && (
                      <motion.div
                        key="followups"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockFollowUps.length > 0 ? (
                          mockFollowUps.map((followUp) => (
                            <Card key={followUp.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                      {followUp.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-2">{followUp.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>Due: {followUp.dueDate}</span>
                                      <span>•</span>
                                      <span>Assigned to: {followUp.assignedTo}</span>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    followUp.status === "Pending"
                                      ? "bg-accent/10 text-accent"
                                      : "bg-primary/20 text-primary"
                                  }`}>
                                    {followUp.status}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No follow-up tasks found</p>
                          </div>
                        )}
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.location.href = `tel:${call.contactPhone}`}>
                  <Phone className="h-4 w-4" />
                  Call Again
                </Button>
                {call.contactEmail && (
                  <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.location.href = `mailto:${call.contactEmail}`}>
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                )}
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Schedule follow-up")}>
                  <Calendar className="h-4 w-4" />
                  Schedule Follow-up
                </Button>
              </CardContent>
            </Card>

            {/* Call Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {call.callBy && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Called By</p>
                    <p className="text-sm font-medium">{call.callBy}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-medium">{call.duration || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Outcome</p>
                  {call.outcome ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getOutcomeColors(
                      call.outcome
                    )}`}>
                      {call.outcome}
                    </span>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">No outcome</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Related Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Related Contact */}
                {mockRelatedContact && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Contact</p>
                    <Link
                      href={`/sales/contacts/${mockRelatedContact.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                        {mockRelatedContact.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {mockRelatedContact.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {mockRelatedContact.jobTitle}
                        </p>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Related Deals */}
                {mockRelatedDeals.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Related Deals</p>
                    {mockRelatedDeals.map((deal) => (
                      <Link
                        key={deal.id}
                        href={`/sales/deals/${deal.id}`}
                        className="block p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {deal.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{deal.value} • {deal.stage}</p>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Related Accounts */}
                {mockRelatedAccounts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Account</p>
                    {mockRelatedAccounts.map((account) => (
                      <Link
                        key={account.id}
                        href={`/sales/accounts/${account.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
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
                      </Link>
                    ))}
                  </div>
                )}
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
        title="Delete Call"
        description="Are you sure you want to delete this call? This will permanently remove it from your CRM and cannot be undone."
        itemName={call.subject}
        itemType="Call"
        icon={Phone}
        isDeleting={isDeleting}
      />

      {/* Call Form Drawer */}
      <CallFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingCall(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCall}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
