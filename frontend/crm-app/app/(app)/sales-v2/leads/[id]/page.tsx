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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { LeadV2FormDrawer } from "@/components/Forms/Sales";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { useLeadV2, useUpdateLeadV2, useDeleteLeadV2 } from "@/lib/queries/useLeadsV2";
import type { CreateLeadV2Input } from "@/lib/api/leadsV2";
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, LEADS_WRITE, LEADS_DELETE } from "@/lib/permissions";

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

type TabType = "details" | "notes";

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
        toast.success("Lead updated successfully");
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
                <p className="text-xs text-muted-foreground">Notes Count</p>
                <p className="text-sm font-medium">{notes.length}</p>
              </div>
              {lead.entity_data.rating && (
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-medium capitalize">{lead.entity_data.rating}</p>
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
            {leadScore !== undefined && (
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
                          <span className={`text-2xl font-bold ${getScoreColor(leadScore)}`}>
                            {leadScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {leadScore >= 80 ? "Hot Lead" : leadScore >= 50 ? "Warm Lead" : "Cold Lead"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
    </div>
  );
}
