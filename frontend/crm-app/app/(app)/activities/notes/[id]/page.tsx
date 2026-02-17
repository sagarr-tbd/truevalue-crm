"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Circle,
  Link as LinkIcon,
  Loader2,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { NoteFormDrawer } from "@/components/Forms/Activities";
import type { Note as NoteType } from "@/lib/types";
import {
  useNote,
  useUpdateNote,
  useDeleteNote,
  type NoteFormData,
} from "@/lib/queries/useNotes";
import { useMemberOptions } from "@/lib/queries/useMembers";
import { usePermission, ACTIVITIES_WRITE, ACTIVITIES_DELETE } from "@/lib/permissions";

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_DISPLAY: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

function formatDate(isoDate?: string): string {
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

function formatDateTime(isoDate?: string): string {
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

const getStatusColors = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    in_progress: "bg-accent/10 text-accent",
    completed: "bg-primary/20 text-primary",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return colors[status] || "bg-muted text-muted-foreground";
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

const getStatusIcon = (status: string) => {
  if (status === "completed") return CheckCircle2;
  if (status === "in_progress") return Clock;
  if (status === "cancelled") return XCircle;
  return Circle;
};

type TabType = "details" | "related";

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Permissions
  const { can } = usePermission();

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<NoteType> | null>(null);

  const { data: note, isLoading, isError } = useNote(id);
  const updateNote = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const { data: memberOptions = [], isLoading: isMembersLoading } = useMemberOptions();

  const resolveMemberName = (uuid?: string): string | null => {
    if (!uuid) return null;
    if (isMembersLoading) return "Loading...";
    const member = memberOptions.find(m => m.value === uuid);
    return member?.label || "Unknown Member";
  };

  const handleDeleteConfirm = async () => {
    if (!note?.id) return;
    try {
      await deleteNoteMutation.mutateAsync(note.id);
      router.push("/activities/notes");
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleEditNote = () => {
    if (!note) return;
    setEditingNote({
      id: note.id,
      subject: note.subject,
      description: note.description,
      status: note.status,
      priority: note.priority,
      assignedTo: note.assignedTo,
      contactId: note.contact?.id,
      companyId: note.company?.id,
      dealId: note.deal?.id,
      leadId: note.lead?.id,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<NoteType>) => {
    if (!note?.id) return;
    try {
      const noteData: NoteFormData = {
        subject: data.subject || "",
        description: data.description,
        status: data.status as NoteFormData["status"],
        priority: data.priority as NoteFormData["priority"],
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        leadId: data.leadId,
        assignedTo: data.assignedTo,
      };
      await updateNote.mutateAsync({ id: note.id, data: noteData });
      setFormDrawerOpen(false);
      setEditingNote(null);
    } catch (error) {
      console.error("Error saving note:", error);
      throw error;
    }
  };

  const StatusIcon = note ? getStatusIcon(note.status) : Circle;

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
        <Button onClick={() => router.push("/activities/notes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "related" as TabType, label: "Related", icon: LinkIcon },
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
              onClick={() => router.push("/activities/notes")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Notes
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {note.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{note.subject}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(note.status)}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {STATUS_DISPLAY[note.status] || note.status}
                  </span>
                  {note.priority && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(note.priority)}`}>
                      {PRIORITY_DISPLAY[note.priority] || note.priority}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">Created {formatDate(note.createdAt)}</span>
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
                <StatusIcon className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(note.status)}`}>
                <StatusIcon className="h-3 w-3 inline mr-1" />
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
                  {PRIORITY_DISPLAY[note.priority] || note.priority}
                </span>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
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
              <p className="text-sm font-medium">{formatDate(note.createdAt)}</p>
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
              <p className="text-sm font-medium">{resolveMemberName(note.assignedTo) || "—"}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
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
                        {/* Note Content */}
                        <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-base font-semibold">Note Content</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm text-muted-foreground block mb-1">Title</span>
                              <p className="text-sm font-medium">{note.subject}</p>
                            </div>
                            {note.description && (
                              <div>
                                <span className="text-sm text-muted-foreground block mb-1">Content</span>
                                <p className="text-sm text-foreground whitespace-pre-wrap bg-background/50 rounded-lg p-4 border border-border/30">
                                  {note.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Note Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg">
                                <MessageSquare className="h-4 w-4 text-purple-500" />
                              </div>
                              <h3 className="text-base font-semibold">Note Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColors(note.status)}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {STATUS_DISPLAY[note.status] || note.status}
                                </span>
                              </div>
                              {note.priority && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Priority</span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColors(note.priority)}`}>
                                    {PRIORITY_DISPLAY[note.priority] || note.priority}
                                  </span>
                                </div>
                              )}
                              {note.assignedTo && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Assigned To</span>
                                  <span className="text-sm font-medium">{resolveMemberName(note.assignedTo)}</span>
                                </div>
                              )}
                            </div>
                          </div>

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
                                <span className="text-sm font-medium">{formatDateTime(note.createdAt)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="text-sm font-medium">{formatDateTime(note.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "related" && (
                      <motion.div
                        key="related"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {(note.contact || note.company || note.deal || note.lead) ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {note.contact && (
                              <Link
                                href={`/sales/contacts/${note.contact.id}`}
                                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                  {note.contact.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Contact</p>
                                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {note.contact.name}
                                  </p>
                                </div>
                              </Link>
                            )}
                            {note.company && (
                              <Link
                                href={`/sales/accounts/${note.company.id}`}
                                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                  {note.company.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Company</p>
                                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {note.company.name}
                                  </p>
                                </div>
                              </Link>
                            )}
                            {note.deal && (
                              <Link
                                href={`/sales/deals/${note.deal.id}`}
                                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                  {note.deal.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Deal</p>
                                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {note.deal.name}
                                  </p>
                                </div>
                              </Link>
                            )}
                            {note.lead && (
                              <Link
                                href={`/sales/leads/${note.lead.id}`}
                                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                  {note.lead.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Lead</p>
                                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {note.lead.name}
                                  </p>
                                </div>
                              </Link>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <LinkIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm">No related items linked to this note</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              Edit this note to link it to contacts, companies, deals, or leads
                            </p>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {can(ACTIVITIES_WRITE) && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={handleEditNote}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Note
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Note Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{formatDate(note.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(note.updatedAt)}</p>
                </div>
                {note.relatedTo && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Related To</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <LinkIcon className="h-3 w-3" />
                      {note.relatedTo}
                      {note.relatedToType && (
                        <span className="text-xs text-muted-foreground">({note.relatedToType})</span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
        isDeleting={deleteNoteMutation.isPending}
      />

      <NoteFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingNote}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
