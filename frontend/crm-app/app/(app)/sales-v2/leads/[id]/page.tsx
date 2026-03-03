"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  FileText,
  MessageSquare,
  Target,
  Plus,
  MapPin,
  AlertCircle,
  Loader2,
  Tag as TagIcon,
  X as XIcon,
  Activity,
  Calendar,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { LeadV2FormDrawer } from "@/components/Forms/Sales";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { useLeadV2, useUpdateLeadV2, useDeleteLeadV2, useConvertLeadV2, useDisqualifyLeadV2 } from "@/lib/queries/useLeadsV2";
import type { CreateLeadV2Input } from "@/lib/api/leadsV2";
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, LEADS_WRITE, LEADS_DELETE } from "@/lib/permissions";
import { useEntityTagsV2, useTagsV2, useAssignTagV2, useUnassignTagV2 } from "@/lib/queries/useTagsV2";
import { useMembers } from "@/lib/queries/useMembers";
import { useActivitiesV2 } from "@/lib/queries/useActivitiesV2";
import dynamic from "next/dynamic";

const LeadConversionModal = dynamic(
  () => import("@/components/LeadConversionModal").then(mod => ({ default: mod.LeadConversionModal })),
  { ssr: false }
);
import type { ConversionParams } from "@/components/LeadConversionModal";

// Status color mapping
const getLeadStatusColor = (status: string) => getStatusColor(status, 'lead');

// Score color based on value
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

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'email': return Mail;
    case 'call': return Phone;
    case 'meeting': return Calendar;
    case 'task': return FileText;
    case 'note': return MessageSquare;
    default: return Activity;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'email': return { color: THEME_COLORS.info.text, bg: THEME_COLORS.info.bg };
    case 'call': return { color: THEME_COLORS.success.text, bg: THEME_COLORS.success.bg };
    case 'meeting': return { color: 'text-brand-purple', bg: 'bg-brand-purple/10' };
    case 'task': return { color: THEME_COLORS.warning.text, bg: THEME_COLORS.warning.bg };
    case 'note': return { color: THEME_COLORS.neutral.text, bg: THEME_COLORS.neutral.bg };
    default: return { color: 'text-primary', bg: 'bg-primary/10' };
  }
};

const formatActivityDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatActivityTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

type TabType = "details" | "activity" | "notes";

export default function LeadV2DetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Permissions
  const { can } = usePermission();

  // Form drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Fetch lead from API
  const { data: lead, isLoading, error } = useLeadV2(leadId);
  const updateLead = useUpdateLeadV2();
  const deleteLead = useDeleteLeadV2();

  const { data: entityTags = [] } = useEntityTagsV2("lead", leadId);
  const { data: allTags = [] } = useTagsV2("lead");
  const assignTag = useAssignTagV2();
  const unassignTag = useUnassignTagV2();
  const [showTagPicker, setShowTagPicker] = useState(false);
  const assignedTagIds = new Set(entityTags.map((et) => et.tag.id));
  const availableTags = allTags.filter((t) => !assignedTagIds.has(t.id));

  const { data: activitiesData, isLoading: isLoadingActivities } = useActivitiesV2({ lead_id: leadId, page_size: 50 });
  const leadActivities = activitiesData?.results || [];

  const { data: members = [], isLoading: isMembersLoading } = useMembers();
  const ownerInfo = useMemo(() => {
    if (!lead?.owner_id) return { name: null, isLoading: false };
    if (isMembersLoading) return { name: null, isLoading: true };
    const owner = members.find(m => m.user_id === lead.owner_id);
    if (owner) {
      const fullName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
      return { name: fullName || owner.display_name || 'Unknown', isLoading: false };
    }
    return { name: null, isLoading: false };
  }, [lead?.owner_id, members, isMembersLoading]);

  const convertLead = useConvertLeadV2();
  const disqualifyLead = useDisqualifyLeadV2();
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDisqualifyInput, setShowDisqualifyInput] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState("");

  // Calculate days in pipeline
  const daysInPipeline = useMemo(() => {
    return lead?.created_at ? daysSince(lead.created_at) : 0;
  }, [lead?.created_at]);

  // Handle delete
  const handleDelete = async () => {
    if (!leadId) return;
    
    setIsDeleting(true);
    try {
      await deleteLead.mutateAsync(leadId);
      toast.success("Lead deleted successfully");
      router.push("/sales-v2/leads");
    } catch {
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Handle form submission (update)
  const handleFormSubmit = async (data: CreateLeadV2Input) => {
    try {
      if (leadId) {
        await updateLead.mutateAsync({ id: leadId, data });
      }
      setIsEditDrawerOpen(false);
    } catch (error) {
      throw error;
    }
  };

  // Handle add note - stores in entity_data.notes array
  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;
    try {
      const existingNotes = lead.entity_data.notes || [];
      const newNoteObj = {
        id: Date.now().toString(),
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        createdBy: "Current User", // TODO: Get from auth context
      };
      
      await updateLead.mutateAsync({
        id: leadId,
        data: {
          status: lead.status,
          entity_data: {
            ...lead.entity_data,
            notes: [...existingNotes, newNoteObj],
          },
        },
      });
      
      toast.success("Note added successfully");
      setNewNote("");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleConvert = async (params: ConversionParams) => {
    try {
      const result = await convertLead.mutateAsync({ id: leadId, params: params as unknown as Record<string, unknown> });
      setShowConvertModal(false);
      if (result?.contact_id) {
        router.push(`/sales-v2/contacts/${result.contact_id}`);
      } else if (result?.deal_id) {
        router.push(`/sales-v2/deals/${result.deal_id}`);
      } else if (result?.company_id) {
        router.push(`/sales-v2/companies/${result.company_id}`);
      } else {
        router.push('/sales-v2/leads');
      }
    } catch {
      // error toast handled by hook
    }
  };

  const handleDisqualify = async () => {
    try {
      await disqualifyLead.mutateAsync({ id: leadId, reason: disqualifyReason.trim() || undefined });
      setShowDisqualifyInput(false);
      setDisqualifyReason("");
      window.location.reload();
    } catch {
      // error toast handled by hook
    }
  };

  // Format date
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
          <Button 
            className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
            onClick={() => router.push("/sales-v2/leads")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </motion.div>
      </div>
    );
  }

  const isConverted = lead?.status === 'converted';
  const isDisqualified = lead?.status === 'unqualified';

  const leadScore = lead.entity_data.lead_score;
  const notes = lead.entity_data.notes || [];

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
              onClick={() => router.push("/sales-v2/leads")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {`${lead.entity_data.first_name?.[0] || ""}${lead.entity_data.last_name?.[0] || "L"}`.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {lead.entity_data.first_name} {lead.entity_data.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {lead.entity_data.company_name && (
                    <span className="text-lg text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {lead.entity_data.company_name}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getLeadStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  {leadScore !== undefined && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreBgColor(leadScore)} ${getScoreColor(leadScore)}`}>
                      Score: {leadScore}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {can(LEADS_WRITE) && !isConverted && !isDisqualified && (
                <>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 text-green-600 hover:text-green-700" onClick={() => setShowConvertModal(true)} disabled={convertLead.isPending}>
                    {convertLead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Convert
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 text-orange-600 hover:text-orange-700" onClick={() => setShowDisqualifyInput(true)} disabled={disqualifyLead.isPending}>
                    <XCircle className="h-4 w-4" />
                    Disqualify
                  </Button>
                </>
              )}
              {can(LEADS_WRITE) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDrawerOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
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

        {isConverted && lead.converted_at && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-purple-600 shrink-0" />
            <div>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                This lead was converted on {formatDate(lead.converted_at)}
              </span>
            </div>
            {lead.converted_contact_id && (
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => router.push(`/sales-v2/contacts/${lead.converted_contact_id}`)}>
                View Contact
              </Button>
            )}
          </motion.div>
        )}

        {isDisqualified && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-gray-50 dark:bg-gray-500/10 border border-gray-200 dark:border-gray-500/30 rounded-lg flex items-center gap-3">
            <XCircle className="h-5 w-5 text-gray-600 shrink-0" />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                This lead was disqualified{lead.updated_at ? ` on ${formatDate(lead.updated_at)}` : ''}
              </span>
              {lead.entity_data?.disqualify_reason && <p className="text-xs text-muted-foreground mt-1">{lead.entity_data.disqualify_reason}</p>}
            </div>
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
                <p className="text-sm font-medium">{lead.entity_data.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{lead.entity_data.phone || "N/A"}</p>
              </div>
              {lead.entity_data.mobile && (
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="text-sm font-medium">{lead.entity_data.mobile}</p>
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
                <p className="text-sm font-medium">{lead.entity_data.company_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="text-sm font-medium">{lead.entity_data.title || "N/A"}</p>
              </div>
              {lead.entity_data.website && (
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a
                    href={lead.entity_data.website.startsWith("http") ? lead.entity_data.website : `https://${lead.entity_data.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {lead.entity_data.website}
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
                <p className="text-sm font-medium capitalize">{(lead.source || lead.entity_data.source)?.replace(/_/g, " ") || "N/A"}</p>
              </div>
              {lead.entity_data.source_detail && (
                <div>
                  <p className="text-xs text-muted-foreground">Source Detail</p>
                  <p className="text-sm font-medium">{lead.entity_data.source_detail}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(lead.created_at)}</p>
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
                <p className="text-sm font-medium">{leadActivities.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Activity</p>
                <p className="text-sm font-medium">
                  {leadActivities.length > 0 && leadActivities[0]?.created_at
                    ? formatDate(leadActivities[0].created_at)
                    : "N/A"}
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
                        {tab.id === "notes" && notes.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                            {notes.length}
                          </span>
                        )}
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
                                  {lead.entity_data.first_name} {lead.entity_data.last_name}
                                </span>
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground shrink-0">Email</span>
                                <a href={`mailto:${lead.entity_data.email}`} className="text-sm font-medium text-primary hover:underline text-right break-all">
                                  {lead.entity_data.email}
                                </a>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Phone</span>
                                {lead.entity_data.phone ? (
                                  <a href={`tel:${lead.entity_data.phone}`} className="text-sm font-medium">{lead.entity_data.phone}</a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                              {lead.entity_data.mobile && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Mobile</span>
                                  <a href={`tel:${lead.entity_data.mobile}`} className="text-sm font-medium">{lead.entity_data.mobile}</a>
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
                                <span className="text-sm font-medium">{lead.entity_data.company_name || "-"}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Job Title</span>
                                <span className="text-sm font-medium">{lead.entity_data.title || "-"}</span>
                              </div>
                              {lead.entity_data.website && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">Website</span>
                                  <a
                                    href={lead.entity_data.website.startsWith("http") ? lead.entity_data.website : `https://${lead.entity_data.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-primary hover:underline text-right break-all"
                                  >
                                    {lead.entity_data.website}
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
                              {leadScore !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Score</span>
                                  <span className={`text-sm font-semibold ${getScoreColor(leadScore)}`}>
                                    {leadScore}/100
                                  </span>
                                </div>
                              )}
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
                                <span className="text-sm font-medium capitalize">{(lead.source || lead.entity_data.source)?.replace(/_/g, " ") || "-"}</span>
                              </div>
                              {lead.entity_data.source_detail && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Detail</span>
                                  <span className="text-sm font-medium">{lead.entity_data.source_detail}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">{formatDate(lead.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Address Card */}
                        {(lead.entity_data.address_line1 || lead.entity_data.city || lead.entity_data.state || lead.entity_data.country) && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.info.bg} rounded-lg`}>
                                <MapPin className={`h-4 w-4 ${THEME_COLORS.info.text}`} />
                              </div>
                              <h3 className="text-base font-semibold">Address</h3>
                            </div>
                            <div className="text-sm space-y-1">
                              {lead.entity_data.address_line1 && <p className="font-medium">{lead.entity_data.address_line1}</p>}
                              <p className="text-muted-foreground">
                                {[lead.entity_data.city, lead.entity_data.state, lead.entity_data.postal_code].filter(Boolean).join(", ")}
                              </p>
                              {lead.entity_data.country && <p className="font-medium">{lead.entity_data.country}</p>}
                            </div>
                          </div>
                        )}

                        {/* Description Card */}
                        {lead.entity_data.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <FileText className="h-4 w-4 text-indigo-500" />
                              </div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {lead.entity_data.description}
                            </p>
                          </div>
                        )}
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
                        {isLoadingActivities ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : leadActivities.length > 0 ? (
                          leadActivities.map((activity, index) => {
                            const Icon = getActivityIcon(activity.activity_type || '');
                            const colors = getActivityColor(activity.activity_type || '');
                            const actDate = activity.created_at || '';
                            return (
                              <div key={activity.id || index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${colors.color}`} />
                                  </div>
                                  {index < leadActivities.length - 1 && (
                                    <div className="w-0.5 h-full bg-border mt-2" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-start justify-between mb-1">
                                    <div>
                                      <p className="font-medium">{activity.subject || 'Activity'}</p>
                                      <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted">
                                        {activity.activity_type || 'general'}
                                      </span>
                                    </div>
                                    {actDate && (
                                      <span className="text-sm text-muted-foreground">
                                        {formatActivityDate(actDate)}
                                      </span>
                                    )}
                                  </div>
                                  {activity.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {actDate && <span>{formatActivityTime(actDate)}</span>}
                                    {activity.status && (
                                      <span className={`px-2 py-0.5 rounded-full capitalize ${getStatusColor(activity.status, 'generic')}`}>
                                        {activity.status}
                                      </span>
                                    )}
                                    {activity.duration_minutes && (
                                      <span>{activity.duration_minutes} min</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No activities yet</p>
                            <p className="text-sm">Activities will appear here when you log calls, emails, or meetings</p>
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
                        {can(LEADS_WRITE) && (
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
                                disabled={!newNote.trim() || updateLead.isPending}
                              >
                                {updateLead.isPending ? (
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
                        {notes.length > 0 ? (
                          <div className="space-y-4">
                            {notes.map((note: { id: string; text: string; createdAt: string; createdBy: string }) => (
                              <Card key={note.id} className="border border-border">
                                <CardContent className="p-4">
                                  <p className="text-sm text-foreground whitespace-pre-wrap">
                                    {note.text}
                                  </p>
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                    <span className="text-xs text-muted-foreground">
                                      {note.createdBy || 'System'}
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
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - (leadScore ?? 0) / 100)}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-2xl font-bold ${getScoreColor(leadScore ?? 0)}`}>
                            {leadScore ?? 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {(leadScore ?? 0) >= 80 ? "Hot Lead" : (leadScore ?? 0) >= 50 ? "Warm Lead" : "Cold Lead"}
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
                {lead.entity_data.email && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `mailto:${lead.entity_data.email}`}
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                )}
                {lead.entity_data.phone && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `tel:${lead.entity_data.phone}`}
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                )}
                {can(LEADS_WRITE) && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("notes")}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Add Note
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Assigned To */}
            {lead.owner_id && (
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Tags
                  </span>
                  {can(LEADS_WRITE) && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowTagPicker(!showTagPicker)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entityTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {entityTags.map((et) => (
                      <span
                        key={et.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: et.tag.color || "#6B7280" }}
                      >
                        {et.tag.name}
                        {can(LEADS_WRITE) && (
                          <button
                            onClick={() => unassignTag.mutate({ tagId: et.tag.id, entityType: "lead", entityId: leadId })}
                            className="hover:bg-white/20 rounded-full p-0.5"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No tags assigned</p>
                )}

                {showTagPicker && availableTags.length > 0 && (
                  <div className="border border-border rounded-lg p-2 mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          assignTag.mutate({ tagId: tag.id, entityType: "lead", entityId: leadId });
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                      >
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color || "#6B7280" }} />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
                {showTagPicker && availableTags.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">All tags assigned</p>
                )}
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
        itemName={`${lead.entity_data.first_name || ''} ${lead.entity_data.last_name || ''}`.trim() || lead.entity_data.email || 'Lead'}
        itemType="Lead"
        icon={Target}
        isDeleting={isDeleting}
      />

      {/* Edit Form Drawer */}
      <LeadV2FormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={lead}
        mode="edit"
      />

      {showDisqualifyInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDisqualifyInput(false)} />
          <Card className="relative z-[101] w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Disqualify Lead</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Are you sure you want to disqualify this lead? You can optionally provide a reason.</p>
            <Textarea value={disqualifyReason} onChange={(e) => setDisqualifyReason(e.target.value)} placeholder="Reason for disqualification (optional)" className="min-h-[60px] resize-none mb-4" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowDisqualifyInput(false); setDisqualifyReason(""); }}>Cancel</Button>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleDisqualify} disabled={disqualifyLead.isPending}>
                {disqualifyLead.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Disqualify
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showConvertModal && lead && (
        <LeadConversionModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          onConvert={handleConvert}
          lead={{
            id: leadId,
            firstName: lead.entity_data.first_name || '',
            lastName: lead.entity_data.last_name || '',
            email: lead.entity_data.email || '',
            phone: lead.entity_data.phone,
            companyName: lead.entity_data.company_name || lead.entity_data.company || '',
            title: lead.entity_data.title,
            website: lead.entity_data.website,
          }}
          isConverting={convertLead.isPending}
        />
      )}
    </div>
  );
}
