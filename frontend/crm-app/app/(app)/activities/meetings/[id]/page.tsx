"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  FileText,
  MessageSquare,
  Plus,
  AlertCircle,
  CheckSquare,
  Mail,
  Link as LinkIcon,
  User,
  Building2,
  DollarSign,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { MeetingFormDrawer } from "@/components/Forms/Activities";
import type { Meeting as MeetingType } from "@/lib/types";

// Meeting data structure
type Meeting = {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  type: "Online" | "In-Person" | "Phone";
  status: "Scheduled" | "Completed" | "Cancelled" | "No Show";
  location: string;
  meetingLink?: string;
  organizer: string;
  organizerEmail: string;
  attendees: Array<{
    id: number;
    name: string;
    email: string;
    rsvpStatus: "Accepted" | "Declined" | "Tentative" | "No Response";
    avatar?: string;
  }>;
  relatedTo: string;
  relatedToType: "Account" | "Deal" | "Contact" | "Internal";
  created: string;
  createdBy: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  agenda: Array<{
    id: number;
    item: string;
    duration?: string;
    presenter?: string;
  }>;
  notes: Array<{
    id: number;
    content: string;
    author: string;
    date: string;
    time: string;
  }>;
  followUps: Array<{
    id: number;
    task: string;
    assignedTo: string;
    dueDate: string;
    status: "Pending" | "In Progress" | "Completed";
  }>;
  initials: string;
};

// Mock meetings data
const meetings: Meeting[] = [
  {
    id: 1,
    title: "Quarterly Business Review - Acme Corp",
    description: "Review Q4 performance and discuss 2026 goals. Cover revenue metrics, customer satisfaction, and strategic initiatives for the upcoming quarter.",
    date: "Jan 30, 2026",
    time: "10:00 AM",
    duration: "60 min",
    type: "In-Person",
    status: "Scheduled",
    location: "Conference Room A, 123 Business St",
    organizer: "John Smith",
    organizerEmail: "john.smith@company.com",
    attendees: [
      {
        id: 1,
        name: "Sarah Williams",
        email: "sarah.williams@acme.com",
        rsvpStatus: "Accepted",
      },
      {
        id: 2,
        name: "Robert Chen",
        email: "robert.chen@acme.com",
        rsvpStatus: "Accepted",
      },
      {
        id: 3,
        name: "Mike Johnson",
        email: "mike.johnson@company.com",
        rsvpStatus: "Accepted",
      },
      {
        id: 4,
        name: "David Brown",
        email: "david.brown@acme.com",
        rsvpStatus: "Tentative",
      },
    ],
    relatedTo: "Acme Corporation",
    relatedToType: "Account",
    created: "Jan 20, 2026",
    createdBy: "John Smith",
    lastUpdated: "Jan 28, 2026",
    lastUpdatedBy: "John Smith",
    agenda: [
      {
        id: 1,
        item: "Q4 Performance Review",
        duration: "20 min",
        presenter: "Sarah Williams",
      },
      {
        id: 2,
        item: "2026 Strategic Goals",
        duration: "25 min",
        presenter: "Robert Chen",
      },
      {
        id: 3,
        item: "Q&A and Discussion",
        duration: "15 min",
      },
    ],
    notes: [],
    followUps: [
      {
        id: 1,
        task: "Send Q4 performance report",
        assignedTo: "John Smith",
        dueDate: "Feb 1, 2026",
        status: "Pending",
      },
      {
        id: 2,
        task: "Schedule follow-up meeting for strategic planning",
        assignedTo: "Sarah Williams",
        dueDate: "Feb 5, 2026",
        status: "Pending",
      },
    ],
    initials: "QBR",
  },
  {
    id: 2,
    title: "Product Demo - TechVision Inc",
    description: "Demonstrate new features and capabilities of our platform. Focus on automation tools and analytics dashboard.",
    date: "Feb 1, 2026",
    time: "2:00 PM",
    duration: "45 min",
    type: "Online",
    status: "Scheduled",
    location: "Zoom",
    meetingLink: "https://zoom.us/j/123456789",
    organizer: "Jane Doe",
    organizerEmail: "jane.doe@company.com",
    attendees: [
      {
        id: 1,
        name: "Michael Chen",
        email: "michael.chen@techvision.io",
        rsvpStatus: "Accepted",
      },
      {
        id: 2,
        name: "Lisa Anderson",
        email: "lisa.anderson@techvision.io",
        rsvpStatus: "Accepted",
      },
    ],
    relatedTo: "TechVision Inc",
    relatedToType: "Account",
    created: "Jan 25, 2026",
    createdBy: "Jane Doe",
    lastUpdated: "Jan 27, 2026",
    lastUpdatedBy: "Jane Doe",
    agenda: [
      {
        id: 1,
        item: "Platform Overview",
        duration: "15 min",
        presenter: "Jane Doe",
      },
      {
        id: 2,
        item: "Automation Features Demo",
        duration: "20 min",
        presenter: "Jane Doe",
      },
      {
        id: 3,
        item: "Q&A Session",
        duration: "10 min",
      },
    ],
    notes: [],
    followUps: [
      {
        id: 1,
        task: "Send product documentation and pricing",
        assignedTo: "Jane Doe",
        dueDate: "Feb 2, 2026",
        status: "Pending",
      },
    ],
    initials: "PD",
  },
  {
    id: 3,
    title: "Sales Team Sync",
    description: "Weekly team standup and pipeline review. Discuss deals, blockers, and upcoming activities.",
    date: "Jan 29, 2026",
    time: "9:00 AM",
    duration: "30 min",
    type: "Online",
    status: "Completed",
    location: "Microsoft Teams",
    meetingLink: "https://teams.microsoft.com/l/meetup-join/123456",
    organizer: "Mike Johnson",
    organizerEmail: "mike.johnson@company.com",
    attendees: [
      {
        id: 1,
        name: "John Smith",
        email: "john.smith@company.com",
        rsvpStatus: "Accepted",
      },
      {
        id: 2,
        name: "Jane Doe",
        email: "jane.doe@company.com",
        rsvpStatus: "Accepted",
      },
      {
        id: 3,
        name: "Sarah Brown",
        email: "sarah.brown@company.com",
        rsvpStatus: "Accepted",
      },
    ],
    relatedTo: "Internal",
    relatedToType: "Internal",
    created: "Jan 22, 2026",
    createdBy: "Mike Johnson",
    lastUpdated: "Jan 29, 2026",
    lastUpdatedBy: "Mike Johnson",
    agenda: [
      {
        id: 1,
        item: "Pipeline Review",
        duration: "15 min",
      },
      {
        id: 2,
        item: "Deal Updates",
        duration: "10 min",
      },
      {
        id: 3,
        item: "Action Items",
        duration: "5 min",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Discussed Enterprise Partnership Q1 deal. Client is reviewing contract terms. Expected decision by Feb 10.",
        author: "John Smith",
        date: "Jan 29, 2026",
        time: "9:15 AM",
      },
      {
        id: 2,
        content: "Marketing Automation Suite deal progressing well. Demo scheduled for next week.",
        author: "Jane Doe",
        date: "Jan 29, 2026",
        time: "9:20 AM",
      },
    ],
    followUps: [
      {
        id: 1,
        task: "Follow up with Acme Corp on contract review",
        assignedTo: "John Smith",
        dueDate: "Feb 3, 2026",
        status: "In Progress",
      },
      {
        id: 2,
        task: "Prepare demo materials for TechVision",
        assignedTo: "Jane Doe",
        dueDate: "Jan 31, 2026",
        status: "Pending",
      },
    ],
    initials: "STS",
  },
  {
    id: 4,
    title: "Contract Negotiation - Global Solutions",
    description: "Discuss terms and finalize agreement. Review pricing, payment terms, and service level agreements.",
    date: "Feb 3, 2026",
    time: "11:00 AM",
    duration: "90 min",
    type: "In-Person",
    status: "Scheduled",
    location: "Global Solutions Office, 456 Corporate Blvd",
    organizer: "Sarah Brown",
    organizerEmail: "sarah.brown@company.com",
    attendees: [
      {
        id: 1,
        name: "Jessica Lee",
        email: "jessica.lee@globalsolutions.com",
        rsvpStatus: "Accepted",
      },
      {
        id: 2,
        name: "David Park",
        email: "david.park@globalsolutions.com",
        rsvpStatus: "Accepted",
      },
    ],
    relatedTo: "Global Solutions Ltd",
    relatedToType: "Account",
    created: "Jan 28, 2026",
    createdBy: "Sarah Brown",
    lastUpdated: "Jan 29, 2026",
    lastUpdatedBy: "Sarah Brown",
    agenda: [
      {
        id: 1,
        item: "Contract Terms Review",
        duration: "30 min",
        presenter: "Sarah Brown",
      },
      {
        id: 2,
        item: "Pricing Discussion",
        duration: "30 min",
      },
      {
        id: 3,
        item: "SLA and Support Terms",
        duration: "20 min",
      },
      {
        id: 4,
        item: "Next Steps",
        duration: "10 min",
      },
    ],
    notes: [],
    followUps: [],
    initials: "CN",
  },
];

// Mock related contacts
const mockContacts = [
  {
    id: 1,
    name: "Sarah Williams",
    email: "sarah.williams@acme.com",
    jobTitle: "VP Sales",
    company: "Acme Corporation",
    initials: "SW",
  },
  {
    id: 2,
    name: "Robert Chen",
    email: "robert.chen@acme.com",
    jobTitle: "CTO",
    company: "Acme Corporation",
    initials: "RC",
  },
];

// Mock related deals
const mockDeals = [
  {
    id: 1,
    name: "Enterprise Partnership Q1",
    value: "$125,000",
    stage: "Proposal",
    probability: 75,
    closeDate: "Feb 15, 2026",
  },
];

type TabType = "details" | "attendees" | "agenda" | "followups";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newFollowUp, setNewFollowUp] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Partial<MeetingType> | null>(null);

  // Find meeting by ID
  const meeting = useMemo(() => {
    const meetingId = parseInt(id);
    return meetings.find((m) => m.id === meetingId);
  }, [id]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!meeting) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted meeting:", meeting.title);
      router.push("/activities/meetings");
    } catch (error) {
      console.error("Error deleting meeting:", error);
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

  const handleAddFollowUp = () => {
    if (!newFollowUp.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding follow-up:", newFollowUp);
    setNewFollowUp("");
  };

  // Form handlers
  const handleEditMeeting = () => {
    if (!meeting) return;
    setEditingMeeting({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      type: meeting.type as "In Person" | "Video Call" | "Phone Call" | undefined,
      status: meeting.status as "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" | undefined,
      location: meeting.location,
      meetingLink: meeting.meetingLink,
      organizer: meeting.organizer,
      attendees: meeting.attendees.map(a => a.name),
      relatedTo: meeting.relatedTo,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<MeetingType>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Form submitted:", data);
      
      // Close drawer
      setFormDrawerOpen(false);
      setEditingMeeting(null);
      
      // In production: refresh data or update state
    } catch (error) {
      console.error("Error saving meeting:", error);
      throw error;
    }
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Scheduled: "bg-accent/10 text-accent",
      Completed: "bg-primary/20 text-primary",
      Cancelled: "bg-destructive/10 text-destructive",
      "No Show": "bg-gray-100 text-gray-600",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Type badge colors
  const getTypeColors = (type: string) => {
    const colors = {
      Online: "bg-primary/10 text-primary",
      "In-Person": "bg-secondary/10 text-secondary",
      Phone: "bg-accent/10 text-accent",
    };
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // RSVP status colors
  const getRSVPColors = (status: string) => {
    const colors = {
      Accepted: "bg-primary/10 text-primary",
      Declined: "bg-destructive/10 text-destructive",
      Tentative: "bg-accent/10 text-accent",
      "No Response": "bg-gray-100 text-gray-600",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Follow-up status colors
  const getFollowUpStatusColors = (status: string) => {
    const colors = {
      Pending: "bg-accent/10 text-accent",
      "In Progress": "bg-primary/10 text-primary",
      Completed: "bg-primary/20 text-primary",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // If meeting not found
  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Meeting Not Found</h2>
        <p className="text-gray-600">The meeting you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/activities/meetings")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meetings
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "attendees" as TabType, label: "Attendees", icon: Users },
    { id: "agenda" as TabType, label: "Agenda & Notes", icon: MessageSquare },
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
              onClick={() => router.push("/activities/meetings")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Meetings
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {meeting.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{meeting.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColors(
                    meeting.type
                  )}`}>
                    {meeting.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    meeting.status
                  )}`}>
                    {meeting.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {meeting.date} at {meeting.time}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditMeeting}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {meeting.status === "Scheduled" && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Cancel/Reschedule")}>
                  <Calendar className="h-4 w-4" />
                  Cancel/Reschedule
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
                <Calendar className="h-4 w-4" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{meeting.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium">{meeting.time}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{meeting.duration}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{meeting.attendees.length} attendees</p>
                <div className="flex -space-x-2 mt-2">
                  {meeting.attendees.slice(0, 4).map((attendee) => (
                    <div
                      key={attendee.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold border-2 border-white"
                      title={attendee.name}
                    >
                      {attendee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                  ))}
                  {meeting.attendees.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold border-2 border-white">
                      +{meeting.attendees.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {meeting.type === "Online" ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                {meeting.type === "Online" ? "Meeting Link" : "Location"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                {meeting.type === "Online" && meeting.meetingLink ? (
                  <a
                    href={meeting.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Join Meeting
                  </a>
                ) : (
                  <p className="text-sm font-medium">{meeting.location}</p>
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
                            <h3 className="text-lg font-semibold mb-4">Meeting Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Subject</p>
                                <p className="text-base font-medium">{meeting.title}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Host</p>
                                <p className="text-base font-medium">{meeting.organizer}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                                <p className="text-base font-medium">
                                  {meeting.date} at {meeting.time}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                                <p className="text-base font-medium">{meeting.duration}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Type</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColors(
                                  meeting.type
                                )}`}>
                                  {meeting.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Location & Details</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  {meeting.type === "Online" ? "Meeting Link" : "Location"}
                                </p>
                                {meeting.type === "Online" && meeting.meetingLink ? (
                                  <a
                                    href={meeting.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-base font-medium text-primary hover:underline flex items-center gap-1"
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                    {meeting.meetingLink}
                                  </a>
                                ) : (
                                  <p className="text-base font-medium">{meeting.location}</p>
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base text-foreground">{meeting.description}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Related To</p>
                                <div className="flex items-center gap-2">
                                  {meeting.relatedToType === "Account" && (
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {meeting.relatedToType === "Deal" && (
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {meeting.relatedToType === "Contact" && (
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <p className="text-base font-medium">{meeting.relatedTo}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "attendees" && (
                      <motion.div
                        key="attendees"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {meeting.attendees.length > 0 ? (
                          meeting.attendees.map((attendee) => (
                            <Card key={attendee.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                      {attendee.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-sm font-semibold text-gray-900">
                                        {attendee.name}
                                      </h4>
                                      <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2 text-sm">
                                          <Mail className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-900">{attendee.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRSVPColors(
                                            attendee.rsvpStatus
                                          )}`}>
                                            {attendee.rsvpStatus}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No attendees found</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "agenda" && (
                      <motion.div
                        key="agenda"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {/* Agenda Section */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Agenda</h3>
                          {meeting.agenda.length > 0 ? (
                            <div className="space-y-3">
                              {meeting.agenda.map((item, index) => (
                                <Card key={item.id} className="border border-border">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">{item.item}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                          {item.duration && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {item.duration}
                                            </span>
                                          )}
                                          {item.presenter && (
                                            <span className="flex items-center gap-1">
                                              <User className="h-3 w-3" />
                                              {item.presenter}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p>No agenda items</p>
                            </div>
                          )}
                        </div>

                        {/* Notes Section */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Meeting Notes</h3>
                          {/* Add Note Form */}
                          <div className="border border-border rounded-lg p-4 bg-gray-50 mb-4">
                            <Textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Add a note from the meeting..."
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
                          {meeting.notes.length > 0 ? (
                            <div className="space-y-4">
                              {meeting.notes.map((note) => (
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
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p>No notes added yet</p>
                            </div>
                          )}
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
                        {/* Add Follow-up Form */}
                        <div className="border border-border rounded-lg p-4 bg-gray-50">
                          <Textarea
                            value={newFollowUp}
                            onChange={(e) => setNewFollowUp(e.target.value)}
                            placeholder="Add a follow-up action item..."
                            className="min-h-[100px] resize-none"
                          />
                          <div className="flex justify-end mt-3">
                            <Button onClick={handleAddFollowUp} size="sm" disabled={!newFollowUp.trim()}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Follow-up
                            </Button>
                          </div>
                        </div>

                        {/* Follow-ups List */}
                        {meeting.followUps.length > 0 ? (
                          <div className="space-y-4">
                            {meeting.followUps.map((followUp) => (
                              <Card key={followUp.id} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm font-medium text-gray-900">{followUp.task}</p>
                                      </div>
                                      <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2 text-sm">
                                          <User className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-600">Assigned to: {followUp.assignedTo}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <Calendar className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-600">Due: {followUp.dueDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFollowUpStatusColors(
                                            followUp.status
                                          )}`}>
                                            {followUp.status}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No follow-up items</p>
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
                {meeting.type === "Online" && meeting.meetingLink && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={() => window.open(meeting.meetingLink, "_blank")}
                  >
                    <Video className="h-4 w-4" />
                    Join Meeting
                  </Button>
                )}
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => console.log("Send reminder")}
                >
                  <Bell className="h-4 w-4" />
                  Send Reminder
                </Button>
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => console.log("Add to calendar")}
                >
                  <Calendar className="h-4 w-4" />
                  Add to Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Meeting Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meeting Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created by</p>
                  <p className="text-sm font-medium">{meeting.createdBy}</p>
                  <p className="text-xs text-muted-foreground">{meeting.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last updated</p>
                  <p className="text-sm font-medium">{meeting.lastUpdatedBy}</p>
                  <p className="text-xs text-muted-foreground">{meeting.lastUpdated}</p>
                </div>
                {meeting.type === "Online" && meeting.meetingLink && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Meeting Link</p>
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Open Link
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Items */}
            {(mockContacts.length > 0 || mockDeals.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockContacts.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Contacts</p>
                      <div className="space-y-2">
                        {mockContacts.map((contact) => (
                          <Link
                            key={contact.id}
                            href={`/sales/contacts/${contact.id}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                              {contact.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {contact.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{contact.jobTitle}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {mockDeals.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Deals</p>
                      <div className="space-y-2">
                        {mockDeals.map((deal) => (
                          <Link
                            key={deal.id}
                            href={`/sales/deals/${deal.id}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {deal.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{deal.value}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Meeting"
        description="Are you sure you want to delete this meeting? This will permanently remove it from your CRM and cannot be undone."
        itemName={meeting.title}
        itemType="Meeting"
        icon={Calendar}
        isDeleting={isDeleting}
      />

      {/* Meeting Form Drawer */}
      <MeetingFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingMeeting(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingMeeting}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
