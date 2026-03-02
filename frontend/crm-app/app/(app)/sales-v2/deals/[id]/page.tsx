"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, DollarSign,
  TrendingUp, FileText, MessageSquare, Plus,
  AlertCircle, Loader2, Calendar, Target, Trophy,
  Users, GitBranch,
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
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, DEALS_WRITE, DEALS_DELETE } from "@/lib/permissions";

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

type TabType = "details" | "notes";

export default function DealV2DetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { can } = usePermission();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const { data: deal, isLoading, error } = useDealV2(dealId);
  const updateDeal = useUpdateDealV2();
  const deleteDeal = useDeleteDealV2();

  const daysSinceCreation = useMemo(() => {
    return deal?.created_at ? daysSince(deal.created_at) : 0;
  }, [deal?.created_at]);

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
                  <span className="text-lg font-semibold text-muted-foreground">
                    {formatCurrency(deal.value, deal.currency)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getDealStatusColor(deal.status)}`}>
                    {deal.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage] || 'bg-muted text-muted-foreground'}`}>
                    {STAGE_LABELS[deal.stage] || deal.stage}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {can(DEALS_WRITE) && (
                <Button variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Deal Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(deal.value, deal.currency)}</p>
              {deal.probability != null && (
                <p className="text-sm text-muted-foreground mt-1">Probability: {deal.probability}%</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pipeline & Stage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deal.display_pipeline && (
                <div>
                  <p className="text-xs text-muted-foreground">Pipeline</p>
                  <p className="text-sm font-medium">{deal.display_pipeline}</p>
                </div>
              )}
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STAGE_COLORS[deal.stage] || 'bg-muted text-muted-foreground'}`}>
                {STAGE_LABELS[deal.stage] || deal.stage}
              </span>
              <p className="text-xs text-muted-foreground">
                Status: <span className="capitalize font-medium">{deal.status}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Close Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Expected</p>
                <p className="text-sm font-medium">{formatDate(deal.expected_close_date || undefined)}</p>
              </div>
              {deal.actual_close_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Actual</p>
                  <p className="text-sm font-medium">{formatDate(deal.actual_close_date)}</p>
                </div>
              )}
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
                <p className="text-xs text-muted-foreground">Days Since Created</p>
                <p className="text-sm font-medium">{daysSinceCreation}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notes Count</p>
                <p className="text-sm font-medium">{notes.length}</p>
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
                                  <span className="text-sm font-medium">{deal.display_contact || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Company</span>
                                  <span className="text-sm font-medium">{deal.display_company || '-'}</span>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {can(DEALS_WRITE) && (
                  <>
                    <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)}>
                      <Edit className="h-4 w-4" />Edit Deal
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => setActiveTab("notes")}>
                      <MessageSquare className="h-4 w-4" />Add Note
                    </Button>
                  </>
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
