"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
  Clock,
  Flag,
  User,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { ActivityV2FormDrawer } from "@/components/Forms/ActivitiesV2";
import {
  useActivityV2,
  useUpdateActivityV2,
  useDeleteActivityV2,
} from "@/lib/queries/useActivitiesV2";
import { useMemberOptions } from "@/lib/queries/useMembers";
import { usePermission, ACTIVITIES_WRITE, ACTIVITIES_DELETE } from "@/lib/permissions";
import type { ActivityV2, CreateActivityV2Input } from "@/lib/api/activitiesV2";

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return "—";
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function formatDateTime(isoDate?: string | null): string {
  if (!isoDate) return "—";
  try {
    return new Date(isoDate).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    completed: "bg-primary/10 text-primary",
    in_progress: "bg-accent/10 text-accent",
    pending: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};

const PRIORITY_DISPLAY: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

const getPriorityColors = (priority: string) => {
  const colors: Record<string, string> = {
    urgent: "bg-destructive/10 text-destructive",
    high: "bg-orange-100 text-orange-700",
    normal: "bg-primary/10 text-primary",
    low: "bg-muted text-muted-foreground",
  };
  return colors[priority] || "bg-muted text-muted-foreground";
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function NoteV2DetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const { can } = usePermission();

  const { data: note, isLoading, isError } = useActivityV2(id);
  const updateActivityV2 = useUpdateActivityV2();
  const deleteActivityV2 = useDeleteActivityV2();
  const { data: memberOptions = [], isLoading: isMembersLoading } = useMemberOptions();

  const resolveMemberName = (uuid?: string | null): string | null => {
    if (!uuid) return null;
    if (isMembersLoading) return "Loading...";
    const member = memberOptions.find((m) => m.value === uuid);
    return member?.label || "Unknown Member";
  };

  const displayAssignedTo =
    note?.display_assigned_to ?? resolveMemberName(note?.assigned_to_id ?? undefined) ?? null;

  const handleDeleteConfirm = async () => {
    if (!note?.id) return;
    try {
      await deleteActivityV2.mutateAsync(note.id);
      router.push("/activities-v2/notes");
    } catch {
      // Error handled by mutation
    }
  };

  const handleEditNote = () => {
    if (!note) return;
    setIsEditDrawerOpen(true);
  };

  const handleFormSubmit = async (data: CreateActivityV2Input) => {
    if (!note?.id) return;
    try {
      await updateActivityV2.mutateAsync({ id: note.id, data });
      setIsEditDrawerOpen(false);
    } catch {
      throw new Error("Failed to update note");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading note...</p>
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Note Not Found</h2>
        <p className="text-muted-foreground">The note you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/activities-v2/notes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
      </div>
    );
  }

  const initials = note.subject ? note.subject.substring(0, 2).toUpperCase() : "N";

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
              onClick={() => router.push("/activities-v2/notes")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Notes
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{note.subject}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                    {STATUS_DISPLAY[note.status] || note.status}
                  </span>
                  {note.priority && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(note.priority)}`}>
                      <Flag className="h-3 w-3 inline mr-1" />
                      {PRIORITY_DISPLAY[note.priority] || note.priority}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">Created {formatDate(note.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {can(ACTIVITIES_WRITE) && (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleEditNote}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {can(ACTIVITIES_DELETE) && (
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
                <FileText className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(note.status)}`}>
                {STATUS_DISPLAY[note.status] || note.status}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              {note.priority ? (
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getPriorityColors(note.priority)}`}>
                  <Flag className="h-3 w-3 inline mr-1" />
                  {PRIORITY_DISPLAY[note.priority] || note.priority}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{formatDate(note.created_at)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned To
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{displayAssignedTo || "—"}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content (3/4) */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Note Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Note Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Subject</span>
                      <span className="text-sm font-medium text-right max-w-[60%]">{note.subject}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                        {STATUS_DISPLAY[note.status] || note.status}
                      </span>
                    </div>
                    {note.priority && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Priority</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColors(note.priority)}`}>
                          <Flag className="h-3 w-3 inline mr-1" />
                          {PRIORITY_DISPLAY[note.priority] || note.priority}
                        </span>
                      </div>
                    )}
                    {displayAssignedTo && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Assigned To</span>
                        <span className="text-sm font-medium">{displayAssignedTo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {note.description && (
                  <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <FileText className="h-4 w-4 text-orange-500" />
                      </div>
                      <h3 className="text-base font-semibold">Description</h3>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.description}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Clock className="h-4 w-4 text-emerald-500" />
                    </div>
                    <h3 className="text-base font-semibold">Timestamps</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm font-medium">{formatDateTime(note.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium">{formatDateTime(note.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (1/4) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {can(ACTIVITIES_WRITE) && (
                  <Button className="w-full justify-start gap-2" variant="outline" onClick={handleEditNote}>
                    <Edit className="h-4 w-4" />
                    Edit Note
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Note Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Note Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{formatDate(note.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(note.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Related Items */}
            {(note.display_contact || note.display_company || note.display_deal || note.display_lead) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {note.display_contact && note.contact_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Contact</p>
                      <Link
                        href={`/sales-v2/contacts/${note.contact_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {note.display_contact.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {note.display_contact}
                        </p>
                        <LinkIcon className="h-3 w-3 text-muted-foreground ml-auto" />
                      </Link>
                    </div>
                  )}

                  {note.display_company && note.company_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Company</p>
                      <Link
                        href={`/sales-v2/companies/${note.company_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {note.display_company.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {note.display_company}
                        </p>
                        <LinkIcon className="h-3 w-3 text-muted-foreground ml-auto" />
                      </Link>
                    </div>
                  )}

                  {note.display_deal && note.deal_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Deal</p>
                      <Link
                        href={`/sales-v2/deals/${note.deal_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {note.display_deal.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {note.display_deal}
                        </p>
                        <LinkIcon className="h-3 w-3 text-muted-foreground ml-auto" />
                      </Link>
                    </div>
                  )}

                  {note.display_lead && note.lead_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Lead</p>
                      <Link
                        href={`/sales-v2/leads/${note.lead_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {note.display_lead.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {note.display_lead}
                        </p>
                        <LinkIcon className="h-3 w-3 text-muted-foreground ml-auto" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        description="Are you sure you want to delete this note? This will permanently remove it from your CRM and cannot be undone."
        itemName={note.subject}
        itemType="Note"
        icon={FileText}
        isDeleting={deleteActivityV2.isPending}
      />

      <ActivityV2FormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={note}
        mode="edit"
        activityType="note"
      />
    </div>
  );
}
