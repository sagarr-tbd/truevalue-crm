"use client";

import React, { useState, useMemo } from "react";
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
  MapPin,
  Tag,
  User,
  AlertCircle,
  XCircle,
  Clock,
  Loader2,
  Video,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { LeadConversionModal, type ConversionParams } from "@/components/LeadConversionModal";
import { Textarea } from "@/components/ui/textarea";
import { LeadFormDrawer } from "@/components/Forms/Sales";
import { TaskFormDrawer } from "@/components/Forms/Activities/TaskFormDrawer";
import { MeetingFormDrawer } from "@/components/Forms/Activities/MeetingFormDrawer";
import { CallFormDrawer } from "@/components/Forms/Activities/CallFormDrawer";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import {
  useLead,
  useUpdateLead,
  useDeleteLead,
  useConvertLead,
  useDisqualifyLead,
  type LeadFormData,
} from "@/lib/queries/useLeads";
import { useMembers } from "@/lib/queries/useMembers";
import { useLeadActivities, useCreateActivity, type ActivityType } from "@/lib/queries/useActivities";
import { useCreateTask, type TaskFormData } from "@/lib/queries/useTasks";
import { useCreateMeeting, type MeetingFormData } from "@/lib/queries/useMeetings";
import { useCreateCall } from "@/lib/queries/useCalls";
import type { Task, Meeting, Call } from "@/lib/types";
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, LEADS_WRITE, LEADS_DELETE, ACTIVITIES_WRITE } from "@/lib/permissions";

// Status color mapping - use centralized utility
const getLeadStatusColor = (status: string) => getStatusColor(status, 'lead');

// Score color based on value - uses theme colors
const getScoreColor = (score: number | undefined) => {
  if (score === undefined || score === null) return THEME_COLORS.neutral.text;
  if (score >= 80) return THEME_COLORS.success.text;
  if (score >= 50) return THEME_COLORS.warning.text;
  return THEME_COLORS.error.text;
};

const getScoreBgColor = (score: number | undefined) => {
  if (score === undefined || score === null) return THEME_COLORS.neutral.bg;
  if (score >= 80) return THEME_COLORS.success.bg;
  if (score >= 50) return THEME_COLORS.warning.bg;
  return THEME_COLORS.error.bg;
};

// Calculate days since date
const daysSince = (dateString: string | undefined) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Activity type helpers
const getActivityIcon = (type: string) => {
  const icons: Record<string, React.ElementType> = {
    task: FileText,
    call: Phone,
    email: Mail,
    meeting: Video,
    note: MessageSquare,
  };
  return icons[type] || Activity;
};

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    task: `${THEME_COLORS.info.bg} ${THEME_COLORS.info.text}`,
    call: `${THEME_COLORS.success.bg} ${THEME_COLORS.success.text}`,
    email: "bg-brand-purple/10 text-brand-purple",
    meeting: `${THEME_COLORS.warning.bg} ${THEME_COLORS.warning.text}`,
    note: THEME_COLORS.neutral.badge,
  };
  return colors[type] || THEME_COLORS.neutral.badge;
};

const getStatusBadge = (status: string) => getStatusColor(status, 'generic');

const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

type TabType = "details" | "activity" | "notes";

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [newNote, setNewNote] = useState("");

  // Permissions
  const { can } = usePermission();

  // Form drawer state
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [meetingDrawerOpen, setMeetingDrawerOpen] = useState(false);
  const [callDrawerOpen, setCallDrawerOpen] = useState(false);

  // Fetch lead from API
  const { data: lead, isLoading, error } = useLead(leadId);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();
  const disqualifyLead = useDisqualifyLead();
  
  // Fetch all team members for owner name resolution
  const { data: members = [], isLoading: isMembersLoading } = useMembers();
  
  // Fetch lead activities — notes derived from this, no extra API call
  const { data: activities = [], isLoading: isActivitiesLoading } = useLeadActivities(leadId);
  const createActivity = useCreateActivity();
  const createTask = useCreateTask();
  const createMeeting = useCreateMeeting();
  const createCall = useCreateCall();

  // Derive notes from already-fetched activities (zero-cost client filter)
  const notes = useMemo(
    () => activities.filter((a) => a.type === 'note'),
    [activities]
  );

  // Calculate days in pipeline
  const daysInPipeline = useMemo(() => {
    return lead?.createdAt ? daysSince(lead.createdAt) : 0;
  }, [lead?.createdAt]);
  
  // Get owner name from ID
  const ownerInfo = useMemo(() => {
    if (!lead?.ownerId) return { name: null, isLoading: false };
    if (isMembersLoading) return { name: null, isLoading: true };
    const owner = members.find(m => m.user_id === lead.ownerId);
    if (owner) {
      const fullName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
      const name = fullName || owner.display_name || 'Unknown';
      return { name, isLoading: false };
    }
    return { name: null, isLoading: false };
  }, [lead?.ownerId, members, isMembersLoading]);

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteLead.mutateAsync(leadId);
      router.push("/sales/leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  // Handle form submission (update)
  const handleFormSubmit = async (data: Partial<LeadFormData>) => {
    try {
      await updateLead.mutateAsync({
        id: leadId,
        data: data as LeadFormData,
      });
      setEditFormOpen(false);
    } catch (error) {
      console.error("Failed to update lead:", error);
      throw error;
    }
  };

  // Handle convert to contact with modal params
  const handleConvertWithParams = async (params: ConversionParams) => {
    try {
      const result = await convertLead.mutateAsync({
        id: leadId,
        params,
      });
      setShowConversionModal(false);
      // Navigate to the new contact
      if (result.contact?.id) {
        router.push(`/sales/contacts/${result.contact.id}`);
      } else {
        router.push("/sales/leads");
      }
    } catch (error) {
      console.error("Failed to convert lead:", error);
    }
  };

  // Handle disqualify
  const handleDisqualify = async () => {
    try {
      await disqualifyLead.mutateAsync({
        id: leadId,
        reason: disqualifyReason || "Not qualified",
      });
      setShowDisqualifyModal(false);
      setDisqualifyReason("");
    } catch (error) {
      console.error("Failed to disqualify lead:", error);
    }
  };

  // Handle add note - creates a note activity
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await createActivity.mutateAsync({
        activityType: 'note' as ActivityType,
        subject: newNote.trim().slice(0, 100),
        description: newNote.trim(),
        status: 'completed',
        leadId: leadId,
      });
      toast.success("Note added successfully");
      setNewNote("");
    } catch (error) {
      console.error("Failed to add note:", error);
      toast.error("Failed to add note");
    }
  };
  
  // Quick action submit handlers
  const handleCreateTask = async (data: Partial<Task>) => {
    await createTask.mutateAsync({
      subject: data.subject || "",
      description: data.description,
      priority: data.priority as TaskFormData["priority"],
      status: data.status as TaskFormData["status"],
      dueDate: data.dueDate,
      leadId: leadId,
      contactId: data.contactId,
      companyId: data.companyId,
      dealId: data.dealId,
      assignedTo: data.assignedTo,
      reminderAt: data.reminderAt,
    });
    setTaskDrawerOpen(false);
  };

  const handleCreateMeeting = async (data: Partial<Meeting>) => {
    await createMeeting.mutateAsync({
      subject: data.subject || "",
      description: data.description,
      status: data.status as MeetingFormData["status"],
      priority: data.priority as MeetingFormData["priority"],
      dueDate: data.dueDate,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      leadId: leadId,
      contactId: data.contactId,
      companyId: data.companyId,
      dealId: data.dealId,
      assignedTo: data.assignedTo,
      reminderAt: data.reminderAt,
    });
    setMeetingDrawerOpen(false);
  };

  const handleCreateCall = async (data: Partial<Call>) => {
    await createCall.mutateAsync({
      subject: data.subject || "",
      description: data.description,
      status: data.status as MeetingFormData["status"],
      priority: data.priority as MeetingFormData["priority"],
      callDirection: data.callDirection,
      callOutcome: data.callOutcome,
      dueDate: data.dueDate,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      leadId: leadId,
      contactId: data.contactId,
      companyId: data.companyId,
      dealId: data.dealId,
      assignedTo: data.assignedTo,
    });
    setCallDrawerOpen(false);
  };

  // Use formatDate for consistency with other detail pages
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  // Error state
  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {error ? "Error Loading Lead" : "Lead Not Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {error
              ? "There was an error loading this lead. Please try again."
              : "The lead you're looking for doesn't exist or has been deleted."}
          </p>
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

  // Map LeadViewModel to form data format
  const leadFormData: Partial<LeadFormData> = {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    mobile: lead.mobile,
    companyName: lead.companyName,
    title: lead.title,
    website: lead.website,
    source: lead.source,
    sourceDetail: lead.sourceDetail,
    status: lead.status as "new" | "contacted" | "qualified" | "unqualified" | "converted" | undefined,
    score: lead.score,
    addressLine1: lead.addressLine1,
    city: lead.city,
    state: lead.state,
    postalCode: lead.postalCode,
    country: lead.country,
    description: lead.description,
    tagIds: lead.tagIds,
    ownerId: lead.ownerId,
  };

  const isConverted = lead.status?.toLowerCase() === "converted";
  const isUnqualified = lead.status?.toLowerCase() === "unqualified";

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
                {lead.initials || `${lead.firstName?.[0] || ""}${lead.lastName?.[0] || ""}`}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {lead.fullName || `${lead.firstName} ${lead.lastName}`}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {lead.companyName && (
                    <span className="text-lg text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {lead.companyName}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getLeadStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  {lead.score !== undefined && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreBgColor(lead.score)} ${getScoreColor(lead.score)}`}>
                      Score: {lead.score}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!isConverted && !isUnqualified && can(LEADS_WRITE) && (
                <>
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
                    onClick={() => setShowConversionModal(true)}
                    disabled={convertLead.isPending}
                  >
                    <UserPlus className="h-4 w-4" />
                    {convertLead.isPending ? "Converting..." : "Convert"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-orange-600 hover:text-orange-700"
                    onClick={() => setShowDisqualifyModal(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    Disqualify
                  </Button>
                </>
              )}
              {can(LEADS_DELETE) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Conversion/Disqualification Banner */}
        {isConverted && lead.convertedAt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg"
          >
            <div className="flex items-center gap-2 text-purple-700">
              <UserPlus className="h-5 w-5" />
              <span className="font-medium">
                This lead was converted on {formatDate(lead.convertedAt)}
              </span>
            </div>
            {lead.convertedContactId && (
              <Link href={`/sales/contacts/${lead.convertedContactId}`}>
                <Button variant="link" className="text-purple-700 p-0 h-auto mt-1">
                  View Contact →
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {isUnqualified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-2 text-gray-700">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">
                This lead was disqualified on {formatDate(lead.disqualifiedAt)}
              </span>
            </div>
            {lead.disqualifiedReason && (
              <p className="text-sm text-gray-600 mt-1">
                Reason: {lead.disqualifiedReason}
              </p>
            )}
          </motion.div>
        )}

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
              {lead.mobile && (
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="text-sm font-medium">{lead.mobile}</p>
                </div>
              )}
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
                <p className="text-sm font-medium">{lead.companyName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="text-sm font-medium">{lead.title || "N/A"}</p>
              </div>
              {lead.website && (
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {lead.website}
                  </a>
                </div>
              )}
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
                <p className="text-sm font-medium capitalize">{lead.source?.replace(/_/g, " ") || "N/A"}</p>
              </div>
              {lead.sourceDetail && (
                <div>
                  <p className="text-xs text-muted-foreground">Source Detail</p>
                  <p className="text-sm font-medium">{lead.sourceDetail}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{lead.created || formatDate(lead.createdAt)}</p>
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
                <p className="text-xs text-muted-foreground">Activity Count</p>
                <p className="text-sm font-medium">{lead.activityCount ?? 0}</p>
              </div>
              {lead.lastActivityAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Last Activity</p>
                  <p className="text-sm font-medium">{formatDate(lead.lastActivityAt)}</p>
                </div>
              )}
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
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
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
                        {/* Main Grid - Contact & Company Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Contact Information Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Mail className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="text-base font-semibold">Contact Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Full Name</span>
                                <span className="text-sm font-medium text-right">
                                  {lead.fullName || `${lead.firstName} ${lead.lastName}`}
                                </span>
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground shrink-0">Email</span>
                                <a href={`mailto:${lead.email}`} className="text-sm font-medium text-primary hover:underline text-right break-all">
                                  {lead.email}
                                </a>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Phone</span>
                                {lead.phone ? (
                                  <a href={`tel:${lead.phone}`} className="text-sm font-medium">{lead.phone}</a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                              {lead.mobile && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Mobile</span>
                                  <a href={`tel:${lead.mobile}`} className="text-sm font-medium">{lead.mobile}</a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Company Information Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Building2 className="h-4 w-4 text-purple-500" />
                              </div>
                              <h3 className="text-base font-semibold">Company Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Company</span>
                                <span className="text-sm font-medium">{lead.companyName || "-"}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Job Title</span>
                                <span className="text-sm font-medium">{lead.title || "-"}</span>
                              </div>
                              {lead.website && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">Website</span>
                                  <a
                                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-primary hover:underline text-right break-all"
                                  >
                                    {lead.website}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Lead Status & Source Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Lead Status Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.success.bg} rounded-lg`}>
                                <Target className={`h-4 w-4 ${THEME_COLORS.success.text}`} />
                              </div>
                              <h3 className="text-base font-semibold">Lead Status</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getLeadStatusColor(lead.status)}`}>
                                  {lead.status}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Score</span>
                                <span className={`text-sm font-semibold ${getScoreColor(lead.score)}`}>
                                  {lead.score !== undefined ? `${lead.score}/100` : "-"}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Days in Pipeline</span>
                                <span className="text-sm font-medium">{daysInPipeline} days</span>
                              </div>
                            </div>
                          </div>

                          {/* Source Information Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.warning.bg} rounded-lg`}>
                                <Target className={`h-4 w-4 ${THEME_COLORS.warning.text}`} />
                              </div>
                              <h3 className="text-base font-semibold">Source Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Source</span>
                                <span className="text-sm font-medium capitalize">{lead.source?.replace(/_/g, " ") || "-"}</span>
                              </div>
                              {lead.sourceDetail && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Detail</span>
                                  <span className="text-sm font-medium">{lead.sourceDetail}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">{lead.created || formatDate(lead.createdAt)}</span>
                              </div>
                              {lead.lastActivityAt && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Last Activity</span>
                                  <span className="text-sm font-medium">{formatDate(lead.lastActivityAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Address & Tags Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Address Card */}
                          {(lead.addressLine1 || lead.city || lead.state || lead.country) && (
                            <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                              <div className="flex items-center gap-2 mb-4">
                                <div className={`p-2 ${THEME_COLORS.info.bg} rounded-lg`}>
                                  <MapPin className={`h-4 w-4 ${THEME_COLORS.info.text}`} />
                                </div>
                                <h3 className="text-base font-semibold">Address</h3>
                              </div>
                              <div className="text-sm space-y-1">
                                {lead.addressLine1 && <p className="font-medium">{lead.addressLine1}</p>}
                                <p className="text-muted-foreground">
                                  {[lead.city, lead.state, lead.postalCode].filter(Boolean).join(", ")}
                                </p>
                                {lead.country && <p className="font-medium">{lead.country}</p>}
                              </div>
                            </div>
                          )}

                          {/* Tags Card */}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                  <Tag className="h-4 w-4 text-pink-500" />
                                </div>
                                <h3 className="text-base font-semibold">Tags</h3>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {lead.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={{
                                      backgroundColor: tag.color ? `${tag.color}20` : 'hsl(var(--primary) / 0.1)',
                                      color: tag.color || 'hsl(var(--primary))',
                                    }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Description Card */}
                        {lead.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <FileText className="h-4 w-4 text-indigo-500" />
                              </div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {lead.description}
                            </p>
                          </div>
                        )}

                        {/* Owner Card - if assigned */}
                        {lead.ownerId && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-teal-500/10 rounded-lg">
                                <User className="h-4 w-4 text-teal-500" />
                              </div>
                              <h3 className="text-base font-semibold">Assignment</h3>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Assigned To</span>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-medium">
                                  {ownerInfo.name ? ownerInfo.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                                </div>
                                <span className="text-sm font-medium">
                                  {ownerInfo.isLoading ? 'Loading...' : (ownerInfo.name || 'Unknown User')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
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
                        {/* Activity Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">Activity Timeline</h3>
                          <span className="text-xs text-muted-foreground">
                            {activities.length} {activities.length === 1 ? "activity" : "activities"}
                          </span>
                        </div>

                        {/* Activity List */}
                        {isActivitiesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : activities.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No activities yet</p>
                            <p className="text-sm">Activities will appear here when created</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activities.map((activity, index) => {
                              const ActivityIcon = getActivityIcon(activity.type);
                              return (
                                <div
                                  key={activity.id}
                                  className="relative flex gap-4 pb-4 last:pb-0"
                                >
                                  {/* Timeline line */}
                                  {index < activities.length - 1 && (
                                    <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                                  )}
                                  
                                  {/* Icon */}
                                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                                    <ActivityIcon className="h-5 w-5" />
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="font-medium text-sm text-foreground">
                                          {activity.subject}
                                        </p>
                                        {activity.description && (
                                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {activity.description}
                                          </p>
                                        )}
                                      </div>
                                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(activity.status)}`}>
                                        {activity.status.replace("_", " ")}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDateTime(activity.createdAt)}
                                      </span>
                                      {activity.dueDate && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          Due: {formatDate(activity.dueDate)}
                                        </span>
                                      )}
                                      <span className="capitalize">{activity.type}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
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
                        {can(ACTIVITIES_WRITE) && (
                          <div className="border border-border rounded-lg p-4 bg-muted/30">
                            <Textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Add a note about this lead..."
                              className="min-h-[100px] resize-none"
                            />
                            <div className="flex justify-end mt-3">
                              <Button
                                onClick={handleAddNote}
                                size="sm"
                                disabled={!newNote.trim() || createActivity.isPending}
                              >
                                {createActivity.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Note
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Notes List */}
                        {isActivitiesLoading ? (
                          <div className="space-y-4">
                            {[1, 2].map((i) => (
                              <Card key={i} className="border border-border">
                                <CardContent className="p-4 animate-pulse space-y-2">
                                  <div className="h-4 w-full rounded bg-muted" />
                                  <div className="h-4 w-3/4 rounded bg-muted" />
                                  <div className="h-3 w-1/4 rounded bg-muted mt-3" />
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : notes.length > 0 ? (
                          <div className="space-y-4">
                            {notes.map((note) => (
                              <Card key={note.id} className="border border-border">
                                <CardContent className="p-4">
                                  <p className="text-sm text-foreground whitespace-pre-wrap">
                                    {note.description || note.subject}
                                  </p>
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                    <span className="text-xs text-muted-foreground">
                                      {note.contact?.name || 'System'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(note.createdAt)}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p>No notes yet</p>
                            <p className="text-sm mt-1">Add a note above to get started</p>
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
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - (lead.score ?? 0) / 100)}`}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score ?? "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {lead.score !== undefined
                        ? lead.score >= 80
                          ? "Hot Lead"
                          : lead.score >= 50
                          ? "Warm Lead"
                          : "Cold Lead"
                        : "No score"}
                    </p>
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
                {lead.email && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `mailto:${lead.email}`}
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                )}
                {lead.phone && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `tel:${lead.phone}`}
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                )}
                {can(ACTIVITIES_WRITE) && (
                  <>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setTaskDrawerOpen(true)}
                      disabled={isConverted || isUnqualified}
                    >
                      <FileText className="h-4 w-4" />
                      Create Task
                    </Button>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setMeetingDrawerOpen(true)}
                      disabled={isConverted || isUnqualified}
                    >
                      <Video className="h-4 w-4" />
                      Schedule Meeting
                    </Button>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setCallDrawerOpen(true)}
                      disabled={isConverted || isUnqualified}
                    >
                      <Phone className="h-4 w-4" />
                      Log Call
                    </Button>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("notes")}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Add Note
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Owner Info */}
            {lead.ownerId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned To
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-medium">
                      {ownerInfo.name ? ownerInfo.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                    </div>
                    <span className="text-sm font-medium">
                      {ownerInfo.isLoading ? 'Loading...' : (ownerInfo.name || 'Unknown User')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
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
        itemName={lead.fullName || `${lead.firstName} ${lead.lastName}`}
        itemType="Lead"
        icon={Target}
        isDeleting={deleteLead.isPending}
      />

      {/* Disqualify Modal */}
      {showDisqualifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              Disqualify Lead
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to disqualify this lead? You can optionally provide a reason.
            </p>
            <Textarea
              placeholder="Reason for disqualification (optional)"
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
              rows={3}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisqualifyModal(false);
                  setDisqualifyReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDisqualify}
                disabled={disqualifyLead.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {disqualifyLead.isPending ? "Disqualifying..." : "Disqualify"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Form Drawer */}
      <LeadFormDrawer
        isOpen={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={leadFormData}
        mode="edit"
        defaultView="detailed"
      />

      {/* Quick Action Form Drawers */}
      <TaskFormDrawer
        isOpen={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        onSubmit={handleCreateTask}
        initialData={{ leadId }}
        mode="add"
      />
      <MeetingFormDrawer
        isOpen={meetingDrawerOpen}
        onClose={() => setMeetingDrawerOpen(false)}
        onSubmit={handleCreateMeeting}
        initialData={{ leadId }}
        mode="add"
      />
      <CallFormDrawer
        isOpen={callDrawerOpen}
        onClose={() => setCallDrawerOpen(false)}
        onSubmit={handleCreateCall}
        initialData={{ leadId }}
        mode="add"
      />

      {/* Conversion Modal */}
      {lead && (
        <LeadConversionModal
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          onConvert={handleConvertWithParams}
          lead={{
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            companyName: lead.companyName,
            title: lead.title,
            website: lead.website,
          }}
          isConverting={convertLead.isPending}
        />
      )}
    </div>
  );
}
