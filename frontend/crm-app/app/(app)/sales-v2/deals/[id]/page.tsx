"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, DollarSign,
  TrendingUp, FileText, MessageSquare, Plus,
  AlertCircle, Loader2, Calendar, Target, Trophy, Clock,
  Users, GitBranch, Tag as TagIcon, X as XIcon, Building2,
  Activity, Mail, Phone, CheckCircle, XCircle, RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { DealV2FormDrawer } from "@/components/Forms/Sales";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { useDealV2, useUpdateDealV2, useDeleteDealV2 } from "@/lib/queries/useDealsV2";
import type { CreateDealV2Input, DealV2 } from "@/lib/api/dealsV2";
import { dealsV2Api } from "@/lib/api/dealsV2";
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, DEALS_WRITE, DEALS_DELETE } from "@/lib/permissions";
import { useEntityTagsV2, useTagsV2, useAssignTagV2, useUnassignTagV2 } from "@/lib/queries/useTagsV2";
import { useActivitiesV2 } from "@/lib/queries/useActivitiesV2";
import { useContactV2 } from "@/lib/queries/useContactsV2";
import Link from "next/link";

const STAGE_LABELS: Record<string, string> = {
  prospecting: "Prospecting",
  qualification: "Qualification",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const STAGE_COLORS: Record<string, string> = {
  prospecting: "bg-blue-500/10 text-blue-600",
  qualification: "bg-indigo-500/10 text-indigo-600",
  proposal: "bg-purple-500/10 text-purple-600",
  negotiation: "bg-amber-500/10 text-amber-600",
  closed_won: "bg-green-500/10 text-green-600",
  closed_lost: "bg-red-500/10 text-red-600",
};

function formatCurrency(value: string | number | undefined, currency = "USD") {
  if (value === undefined || value === null) return `${currency} 0.00`;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return `${currency} 0.00`;
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const getDealStatusColor = (status: string) => getStatusColor(status, 'deal');

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

type TabType = "details" | "activity" | "contacts" | "notes";

export default function DealV2DetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showLossReasonInput, setShowLossReasonInput] = useState(false);
  const [lossReason, setLossReason] = useState("");

  const { can } = usePermission();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const { data: deal, isLoading, error } = useDealV2(dealId);
  const updateDeal = useUpdateDealV2();
  const deleteDeal = useDeleteDealV2();

  const { data: entityTags = [] } = useEntityTagsV2("deal", dealId);
  const { data: allTags = [] } = useTagsV2("deal");
  const assignTag = useAssignTagV2();
  const unassignTag = useUnassignTagV2();
  const [showTagPicker, setShowTagPicker] = useState(false);
  const { data: activitiesData, isLoading: isLoadingActivities } = useActivitiesV2({ deal_id: dealId, page_size: 50 });
  const activities = activitiesData?.results || [];
  const { data: primaryContact, isLoading: contactLoading } = useContactV2(deal?.contact_id || '');
  const assignedTagIds = new Set(entityTags.map((et) => et.tag.id));
  const availableTags = allTags.filter((t) => !assignedTagIds.has(t.id));

  const daysSinceCreation = useMemo(() => {
    return deal?.created_at ? daysSince(deal.created_at) : 0;
  }, [deal?.created_at]);

  const dealScore = deal?.probability ?? 0;
  const expectedRevenue = useMemo(() => {
    if (!deal) return 0;
    const val = typeof deal.value === 'string' ? parseFloat(deal.value) : (deal.value ?? 0);
    return isNaN(val) ? 0 : val * (dealScore / 100);
  }, [deal, dealScore]);

  const handleDelete = async () => {
    if (!dealId) return;
    setIsDeleting(true);
    try {
      await deleteDeal.mutateAsync(dealId);
      toast.success("Deal deleted successfully");
      router.push("/sales-v2/deals");
    } catch {
      toast.error("Failed to delete deal");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleFormSubmit = async (data: CreateDealV2Input) => {
    try {
      if (dealId) {
        await updateDeal.mutateAsync({ id: dealId, data: data as Partial<DealV2> });
      }
      setIsEditDrawerOpen(false);
    } catch (error) {
      throw error;
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !deal) return;
    try {
      const existingNotes = deal.entity_data.notes || [];
      const newNoteObj = {
        id: Date.now().toString(),
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        createdBy: "Current User",
      };

      await updateDeal.mutateAsync({
        id: dealId,
        data: {
          status: deal.status,
          entity_data: {
            ...deal.entity_data,
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

  const handleWinDeal = async () => {
    setIsUpdatingStatus(true);
    try {
      await dealsV2Api.updateStatus(dealId, 'won');
      toast.success("Deal marked as won!");
      window.location.reload();
    } catch {
      toast.error("Failed to update deal status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLoseDeal = async () => {
    if (showLossReasonInput && !lossReason.trim()) {
      setShowLossReasonInput(true);
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await dealsV2Api.updateStatus(dealId, 'lost');
      if (lossReason.trim()) {
        await updateDeal.mutateAsync({
          id: dealId,
          data: { entity_data: { ...deal!.entity_data, loss_notes: lossReason.trim() } },
        });
      }
      toast.success("Deal marked as lost");
      window.location.reload();
    } catch {
      toast.error("Failed to update deal status");
    } finally {
      setIsUpdatingStatus(false);
      setShowLossReasonInput(false);
      setLossReason("");
    }
  };

  const handleReopenDeal = async () => {
    setIsUpdatingStatus(true);
    try {
      await dealsV2Api.updateStatus(dealId, 'open');
      toast.success("Deal reopened");
      window.location.reload();
    } catch {
      toast.error("Failed to reopen deal");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {error ? "Error Loading Deal" : "Deal Not Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {error ? "There was an error loading this deal. Please try again." : "The deal you're looking for doesn't exist or has been deleted."}
          </p>
          <Button className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90" onClick={() => router.push("/sales-v2/deals")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Button>
        </motion.div>
      </div>
    );
  }

  const notes = deal.entity_data.notes || [];

  return (
    <div className="min-h-screen">
      <div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/sales-v2/deals")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Deals
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {(deal.entity_data.name || 'D')[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {deal.entity_data.name || 'Unnamed Deal'}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {deal.company_id && deal.display_company && (
                    <Link href={`/sales-v2/companies/${deal.company_id}`} className="text-lg text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {deal.display_company}
                    </Link>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage] || 'bg-muted text-muted-foreground'}`}>
                    {STAGE_LABELS[deal.stage] || deal.display_stage || deal.stage}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getDealStatusColor(deal.status)}`}>
                    {deal.status}
                  </span>
                  <span className="text-lg font-semibold text-foreground font-tabular">
                    {formatCurrency(deal.value, deal.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {deal.status === 'open' && can(DEALS_WRITE) && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${THEME_COLORS.success.text} hover:opacity-80`}
                    onClick={handleWinDeal}
                    disabled={isUpdatingStatus}
                  >
                    <Trophy className="h-4 w-4" />
                    {isUpdatingStatus ? 'Winning...' : 'Won'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-orange-600 hover:text-orange-700"
                    onClick={() => setShowLossReasonInput(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    Lost
                  </Button>
                </>
              )}
              {(deal.status === 'won' || deal.status === 'lost') && can(DEALS_WRITE) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleReopenDeal}
                  disabled={isUpdatingStatus}
                >
                  <RotateCcw className="h-4 w-4" />
                  {isUpdatingStatus ? 'Reopening...' : 'Reopen'}
                </Button>
              )}
              {can(DEALS_DELETE) && (
                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Won / Lost Banners */}
        {deal.status === 'won' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 ${THEME_COLORS.success.bg} border border-primary/20 rounded-lg`}>
            <div className={`flex items-center gap-2 ${THEME_COLORS.success.text}`}>
              <Trophy className="h-5 w-5" />
              <span className="font-medium">This deal was won{deal.actual_close_date ? ` on ${formatDate(deal.actual_close_date)}` : ''}</span>
            </div>
          </motion.div>
        )}
        {deal.status === 'lost' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 ${THEME_COLORS.error.bg} border border-destructive/20 rounded-lg`}>
            <div className={`flex items-center gap-2 ${THEME_COLORS.error.text}`}>
              <XCircle className="h-5 w-5" />
              <span className="font-medium">This deal was lost{deal.actual_close_date ? ` on ${formatDate(deal.actual_close_date)}` : ''}</span>
            </div>
            {deal.loss_reason && (
              <p className={`text-sm ${THEME_COLORS.error.text} mt-1`}>Reason: {deal.loss_reason}</p>
            )}
            {deal.entity_data?.loss_notes && (
              <p className={`text-sm ${THEME_COLORS.error.text} mt-1`}>Notes: {deal.entity_data.loss_notes}</p>
            )}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Deal Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">{formatCurrency(deal.value, deal.currency)}</p>
                <p className="text-xs text-muted-foreground">
                  Weighted: {formatCurrency(expectedRevenue, deal.currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Probability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">{dealScore}%</p>
                <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dealScore}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-brand-teal to-brand-purple rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {deal.display_stage ? `From stage: ${deal.display_stage}` : 'Custom'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expected Close Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-lg font-semibold">{formatDate(deal.expected_close_date || undefined)}</p>
                {deal.actual_close_date && (
                  <p className="text-xs text-muted-foreground">
                    Actual: {formatDate(deal.actual_close_date)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-lg font-semibold font-tabular">
                  {daysSinceCreation} <span className="text-sm font-normal text-muted-foreground">days</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {deal.display_stage ? `In ${deal.display_stage}` : 'In pipeline'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(deal.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
                  {[
                    { id: "details", label: "Details", icon: FileText },
                    { id: "activity", label: "Activity", icon: Activity },
                    { id: "contacts", label: "Related Contacts", icon: Users },
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
                          <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs">{notes.length}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === "details" && (
                      <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="h-4 w-4 text-primary" /></div>
                              <h3 className="text-base font-semibold">Deal Details</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Deal Name</span>
                                <span className="text-sm font-medium text-right">{deal.entity_data.name || "-"}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Value</span>
                                <span className="text-sm font-bold">{formatCurrency(deal.value, deal.currency)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Currency</span>
                                <span className="text-sm font-medium">{deal.currency || 'USD'}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Probability</span>
                                <span className="text-sm font-medium">{deal.probability != null ? `${deal.probability}%` : '-'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg"><Target className="h-4 w-4 text-purple-500" /></div>
                              <h3 className="text-base font-semibold">Pipeline</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getDealStatusColor(deal.status)}`}>{deal.status}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Stage</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage] || 'bg-muted text-muted-foreground'}`}>{STAGE_LABELS[deal.stage] || deal.stage}</span>
                              </div>
                              {deal.expected_close_date && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Expected Close</span>
                                  <span className="text-sm font-medium">{formatDate(deal.expected_close_date)}</span>
                                </div>
                              )}
                              {deal.actual_close_date && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Actual Close</span>
                                  <span className="text-sm font-medium">{formatDate(deal.actual_close_date)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {(deal.display_pipeline || deal.display_owner || deal.display_contact || deal.display_company) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg"><GitBranch className="h-4 w-4 text-indigo-500" /></div>
                                <h3 className="text-base font-semibold">Pipeline & Owner</h3>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Pipeline</span>
                                  <span className="text-sm font-medium">{deal.display_pipeline || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Deal Owner</span>
                                  <span className="text-sm font-medium">{deal.display_owner || '-'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-teal-500/10 rounded-lg"><Users className="h-4 w-4 text-teal-500" /></div>
                                <h3 className="text-base font-semibold">Contact & Company</h3>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Primary Contact</span>
                                  {deal.contact_id && deal.display_contact ? (
                                    <button onClick={() => router.push(`/sales-v2/contacts/${deal.contact_id}`)} className="text-sm font-medium text-primary hover:underline text-right">{deal.display_contact}</button>
                                  ) : (
                                    <span className="text-sm font-medium">{deal.display_contact || '-'}</span>
                                  )}
                                </div>
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Company</span>
                                  {deal.company_id && deal.display_company ? (
                                    <button onClick={() => router.push(`/sales-v2/companies/${deal.company_id}`)} className="text-sm font-medium text-primary hover:underline text-right">{deal.display_company}</button>
                                  ) : (
                                    <span className="text-sm font-medium">{deal.display_company || '-'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.success.bg} rounded-lg`}><Trophy className={`h-4 w-4 ${THEME_COLORS.success.text}`} /></div>
                              <h3 className="text-base font-semibold">Win/Loss</h3>
                            </div>
                            <div className="space-y-3">
                              {deal.loss_reason && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Loss Reason</span>
                                  <span className="text-sm font-medium capitalize">{deal.loss_reason.replace(/_/g, ' ')}</span>
                                </div>
                              )}
                              {deal.entity_data.loss_notes && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Loss Notes</span>
                                  <p className="text-sm font-medium mt-1">{deal.entity_data.loss_notes}</p>
                                </div>
                              )}
                              {!deal.loss_reason && !deal.entity_data.loss_notes && (
                                <p className="text-sm text-muted-foreground">No loss details recorded</p>
                              )}
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.warning.bg} rounded-lg`}><TrendingUp className={`h-4 w-4 ${THEME_COLORS.warning.text}`} /></div>
                              <h3 className="text-base font-semibold">Timeline</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">{formatDate(deal.created_at)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="text-sm font-medium">{formatDate(deal.updated_at)}</span>
                              </div>
                              {deal.last_activity_at && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Last Activity</span>
                                  <span className="text-sm font-medium">{formatDate(deal.last_activity_at)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Days Open</span>
                                <span className="text-sm font-medium">{daysSinceCreation} days</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {deal.entity_data.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-indigo-500/10 rounded-lg"><FileText className="h-4 w-4 text-indigo-500" /></div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{deal.entity_data.description}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "activity" && (
                      <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {isLoadingActivities ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : activities.length > 0 ? (
                          activities.map((activity, index) => {
                            const Icon = getActivityIcon(activity.activity_type || '');
                            const colors = getActivityColor(activity.activity_type || '');
                            const actDate = activity.created_at || '';
                            return (
                              <div key={activity.id || index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${colors.color}`} />
                                  </div>
                                  {index < activities.length - 1 && (
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

                    {activeTab === "contacts" && (
                      <motion.div key="contacts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {contactLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : primaryContact ? (
                          <Card className="border border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/sales-v2/contacts/${primaryContact.id}`)}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                  {`${primaryContact.entity_data?.first_name?.[0] || ''}${primaryContact.entity_data?.last_name?.[0] || 'C'}`.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold">{primaryContact.entity_data?.first_name || ''} {primaryContact.entity_data?.last_name || ''}</p>
                                  {primaryContact.entity_data?.title && <p className="text-sm text-muted-foreground">{primaryContact.entity_data.title}</p>}
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    {primaryContact.entity_data?.email && (
                                      <a href={`mailto:${primaryContact.entity_data.email}`} className="flex items-center gap-1 hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                        <Mail className="h-3.5 w-3.5" />{primaryContact.entity_data.email}
                                      </a>
                                    )}
                                    {primaryContact.entity_data?.phone && (
                                      <a href={`tel:${primaryContact.entity_data.phone}`} className="flex items-center gap-1 hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                        <Phone className="h-3.5 w-3.5" />{primaryContact.entity_data.phone}
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/sales-v2/contacts/${primaryContact.id}`); }}>View</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No contacts linked</p>
                            <p className="text-sm">Link a contact to this deal to see them here</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "notes" && (
                      <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {can(DEALS_WRITE) && (
                          <div className="border border-border rounded-lg p-4 bg-muted/30">
                            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note about this deal..." className="min-h-[100px] resize-none" />
                            <div className="flex justify-end mt-3">
                              <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim() || updateDeal.isPending}>
                                {updateDeal.isPending ? (
                                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
                                ) : (
                                  <><Plus className="h-4 w-4 mr-2" />Add Note</>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {notes.length > 0 ? (
                          <div className="space-y-4">
                            {notes.map((note: { id: string; text: string; createdAt: string; createdBy: string }) => (
                              <Card key={note.id} className="border border-border">
                                <CardContent className="p-4">
                                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                    <span className="text-xs text-muted-foreground">{note.createdBy || 'System'}</span>
                                    <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
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

          <div className="lg:col-span-1 space-y-6">
            {/* Deal Actions */}
            {can(DEALS_WRITE) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deal Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deal.status === 'open' ? (
                    <>
                      <Button className="w-full justify-start gap-2 text-green-600 hover:text-green-700" variant="outline" size="sm" onClick={handleWinDeal} disabled={isUpdatingStatus}>
                        <CheckCircle className="h-4 w-4" />Mark as Won
                      </Button>
                      <Button className="w-full justify-start gap-2 text-red-600 hover:text-red-700" variant="outline" size="sm" onClick={() => setShowLossReasonInput(true)} disabled={isUpdatingStatus}>
                        <XCircle className="h-4 w-4" />Mark as Lost
                      </Button>
                      {showLossReasonInput && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <Textarea value={lossReason} onChange={(e) => setLossReason(e.target.value)} placeholder="Loss reason (optional)..." className="min-h-[60px] resize-none text-sm" />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setShowLossReasonInput(false); setLossReason(""); }}>Cancel</Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleLoseDeal} disabled={isUpdatingStatus}>
                              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                              Confirm Lost
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={handleReopenDeal} disabled={isUpdatingStatus}>
                      <RotateCcw className="h-4 w-4" />Reopen Deal
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {primaryContact?.entity_data?.email && (
                  <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => window.location.href = `mailto:${primaryContact.entity_data.email}`}>
                    <Mail className="h-4 w-4" />Send Email
                  </Button>
                )}
                <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => setActiveTab("activity")}>
                  <Phone className="h-4 w-4" />Log Call
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => setActiveTab("activity")}>
                  <Calendar className="h-4 w-4" />Schedule Meeting
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => setActiveTab("notes")}>
                  <FileText className="h-4 w-4" />Add Note
                </Button>
              </CardContent>
            </Card>

            {/* Deal Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Deal Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-full h-8 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dealScore}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-brand-teal to-brand-purple"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">{dealScore}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Based on probability and stage</p>
                  {expectedRevenue > 0 && (
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Expected Revenue</span>
                        <span className="text-sm font-semibold">{formatCurrency(expectedRevenue, deal?.currency)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Deal Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deal Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pipeline</span>
                    <span className="text-sm font-medium">{deal.display_pipeline || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stage</span>
                    <span className="text-sm font-medium">{deal.display_stage || deal.stage || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-sm font-medium font-tabular">{formatCurrency(deal.value, deal.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Probability</span>
                    <span className="text-sm font-medium">{dealScore}%</span>
                  </div>
                  {deal.expected_close_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Close Date</span>
                      <span className="text-sm font-medium">{new Date(deal.expected_close_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Days in Pipeline</span>
                    <span className="text-sm font-medium">{daysSinceCreation} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Tags
                  </span>
                  {can(DEALS_WRITE) && (
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
                        {can(DEALS_WRITE) && (
                          <button
                            onClick={() => unassignTag.mutate({ tagId: et.tag.id, entityType: "deal", entityId: dealId })}
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
                          assignTag.mutate({ tagId: tag.id, entityType: "deal", entityId: dealId });
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

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Deal"
        description="Are you sure you want to delete this deal? This will permanently remove it from your CRM and cannot be undone."
        itemName={deal.entity_data.name || 'Deal'}
        itemType="Deal"
        icon={DollarSign}
        isDeleting={isDeleting}
      />

      <DealV2FormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={deal}
        mode="edit"
      />
    </div>
  );
}
