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
  Plus,
  AlertCircle,
  Activity,
  Users,
  Flag,
  CheckCircle2,
  XCircle,
  Circle,
  Link as LinkIcon,
  Loader2,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { MeetingFormDrawer } from "@/components/Forms/Activities";
import type { Meeting as MeetingType } from "@/lib/types";
import {
  useMeeting,
  useUpdateMeeting,
  useDeleteMeeting,
  useCompleteMeeting,
  type MeetingFormData,
} from "@/lib/queries/useMeetings";
import { useCreateActivity } from "@/lib/queries/useActivities";
import { useMemberOptions } from "@/lib/queries/useMembers";
import type { ActivityFormData } from "@/lib/api/activities";

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const PRIORITY_DISPLAY: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(isoDate?: string): string {
  if (!isoDate) return "—";
  try {
    return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return isoDate; }
}

function formatDateTime(isoDate?: string): string {
  if (!isoDate) return "—";
  try {
    return new Date(isoDate).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return isoDate; }
}

function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  try { return new Date(iso).toISOString().split("T")[0]; } catch { return iso.split("T")[0] || ""; }
}

function toDateTimeLocalValue(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return iso.slice(0, 16) || ""; }
}

const getPriorityColors = (priority: string) => {
  const colors: Record<string, string> = { urgent: "bg-destructive/10 text-destructive", high: "bg-primary/10 text-primary", normal: "bg-accent/10 text-accent", low: "bg-muted text-muted-foreground" };
  return colors[priority] || "bg-muted text-muted-foreground";
};

const getStatusColors = (status: string) => {
  const colors: Record<string, string> = { pending: "bg-muted text-muted-foreground", in_progress: "bg-accent/10 text-accent", completed: "bg-primary/20 text-primary", cancelled: "bg-destructive/10 text-destructive" };
  return colors[status] || "bg-muted text-muted-foreground";
};

const getStatusIcon = (status: string) => {
  if (status === "completed") return CheckCircle2;
  if (status === "in_progress") return Clock;
  if (status === "cancelled") return XCircle;
  return Circle;
};

type TabType = "details" | "activity" | "notes";

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Partial<MeetingType> | null>(null);

  const { data: meeting, isLoading, isError } = useMeeting(id);
  const updateMeeting = useUpdateMeeting();
  const deleteMeetingMutation = useDeleteMeeting();
  const completeMeeting = useCompleteMeeting();
  const createActivity = useCreateActivity();
  const { data: memberOptions = [], isLoading: isMembersLoading } = useMemberOptions();

  const resolveMemberName = (uuid?: string): string | null => {
    if (!uuid) return null;
    if (isMembersLoading) return "Loading...";
    const member = memberOptions.find(m => m.value === uuid);
    return member?.label || "Unknown Member";
  };

  const handleDeleteConfirm = async () => {
    if (!meeting?.id) return;
    try {
      await deleteMeetingMutation.mutateAsync(meeting.id);
      router.push("/activities/meetings");
    } catch (error) {
      console.error("Error deleting meeting:", error);
    }
  };

  const handleToggleComplete = async () => {
    if (!meeting?.id) return;
    if (meeting.status === "completed") {
      await updateMeeting.mutateAsync({ id: meeting.id, data: { status: "pending" } });
    } else {
      await completeMeeting.mutateAsync(meeting.id);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !meeting) return;
    try {
      const noteData: ActivityFormData = {
        activityType: "note",
        subject: `Note on meeting: ${meeting.subject}`,
        description: newNote,
        status: "completed",
        contactId: meeting.contact?.id,
        companyId: meeting.company?.id,
        dealId: meeting.deal?.id,
        leadId: meeting.lead?.id,
      };
      await createActivity.mutateAsync(noteData);
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleEditMeeting = () => {
    if (!meeting) return;
    setEditingMeeting({
      id: meeting.id,
      subject: meeting.subject,
      description: meeting.description,
      status: meeting.status,
      priority: meeting.priority,
      dueDate: toDateInputValue(meeting.dueDate),
      startTime: toDateTimeLocalValue(meeting.startTime),
      endTime: toDateTimeLocalValue(meeting.endTime),
      durationMinutes: meeting.durationMinutes,
      assignedTo: meeting.assignedTo,
      contactId: meeting.contact?.id,
      companyId: meeting.company?.id,
      dealId: meeting.deal?.id,
      leadId: meeting.lead?.id,
      reminderAt: toDateTimeLocalValue(meeting.reminderAt),
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<MeetingType>) => {
    if (!meeting?.id) return;
    try {
      const meetingData: MeetingFormData = {
        subject: data.subject || "",
        description: data.description,
        status: data.status as MeetingFormData["status"],
        priority: data.priority as MeetingFormData["priority"],
        dueDate: data.dueDate,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        leadId: data.leadId,
        assignedTo: data.assignedTo,
        reminderAt: data.reminderAt,
      };
      await updateMeeting.mutateAsync({ id: meeting.id, data: meetingData });
      setFormDrawerOpen(false);
      setEditingMeeting(null);
    } catch (error) {
      console.error("Error saving meeting:", error);
      throw error;
    }
  };

  const StatusIcon = meeting ? getStatusIcon(meeting.status) : Circle;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading meeting...</p>
      </div>
    );
  }

  if (isError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Meeting Not Found</h2>
        <p className="text-muted-foreground">The meeting you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/activities/meetings")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meetings
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "activity" as TabType, label: "Activity", icon: Activity },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen">
      <div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/activities/meetings")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Meetings
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">{meeting.initials}</div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{meeting.subject}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {meeting.assignedTo && (
                    <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><span className="text-sm">{resolveMemberName(meeting.assignedTo)}</span></div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(meeting.priority)}`}>
                    <Flag className="h-3 w-3 inline mr-1" />{PRIORITY_DISPLAY[meeting.priority] || meeting.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(meeting.status)}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />{STATUS_DISPLAY[meeting.status] || meeting.status}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {formatDate(meeting.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditMeeting}><Edit className="h-4 w-4" />Edit</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleToggleComplete} disabled={completeMeeting.isPending || updateMeeting.isPending}>
                {meeting.status === "completed" ? (<><XCircle className="h-4 w-4" />Reopen</>) : (<><CheckCircle2 className="h-4 w-4" />Complete</>)}
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash2 className="h-4 w-4" />Delete
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Flag className="h-4 w-4" />Priority</CardTitle></CardHeader><CardContent><span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getPriorityColors(meeting.priority)}`}><Flag className="h-3 w-3 inline mr-1" />{PRIORITY_DISPLAY[meeting.priority] || meeting.priority}</span></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />Date</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{formatDate(meeting.dueDate)}</p></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><StatusIcon className="h-4 w-4" />Status</CardTitle></CardHeader><CardContent><span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(meeting.status)}`}><StatusIcon className="h-3 w-3 inline mr-1" />{STATUS_DISPLAY[meeting.status] || meeting.status}</span></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Duration</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{meeting.durationMinutes ? `${meeting.durationMinutes} min` : "—"}</p></CardContent></Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        <Icon className="h-4 w-4" />{tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === "details" && (
                      <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                        {/* Meeting Information & Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="text-base font-semibold">Meeting Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Subject</span>
                                <span className="text-sm font-medium text-right max-w-[60%]">{meeting.subject}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Priority</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColors(meeting.priority)}`}>
                                  <Flag className="h-3 w-3 inline mr-1" />
                                  {PRIORITY_DISPLAY[meeting.priority] || meeting.priority}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColors(meeting.status)}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {STATUS_DISPLAY[meeting.status] || meeting.status}
                                </span>
                              </div>
                              {meeting.assignedTo && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Assigned To</span>
                                  <span className="text-sm font-medium">{resolveMemberName(meeting.assignedTo)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Calendar className="h-4 w-4 text-purple-500" />
                              </div>
                              <h3 className="text-base font-semibold">Schedule & Duration</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Due Date</span>
                                <span className="text-sm font-medium">{formatDate(meeting.dueDate)}</span>
                              </div>
                              {meeting.startTime && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Start Time</span>
                                  <span className="text-sm font-medium">{formatDateTime(meeting.startTime)}</span>
                                </div>
                              )}
                              {meeting.endTime && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">End Time</span>
                                  <span className="text-sm font-medium">{formatDateTime(meeting.endTime)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Duration</span>
                                <span className="text-sm font-medium">{meeting.durationMinutes ? `${meeting.durationMinutes} min` : "—"}</span>
                              </div>
                              {meeting.reminderAt && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Reminder</span>
                                  <span className="text-sm font-medium">{formatDateTime(meeting.reminderAt)}</span>
                                </div>
                              )}
                              {meeting.completedAt && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Completed At</span>
                                  <span className="text-sm font-medium">{formatDateTime(meeting.completedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {meeting.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-orange-500/10 rounded-lg">
                                <FileText className="h-4 w-4 text-orange-500" />
                              </div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{meeting.description}</p>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <span className="text-sm font-medium">{formatDateTime(meeting.createdAt)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="text-sm font-medium">{formatDateTime(meeting.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "activity" && (
                      <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-sm">Activity tracking for this meeting</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Changes to this meeting are tracked automatically</p>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "notes" && (
                      <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        <div className="border border-border rounded-lg p-4 bg-muted/30">
                          <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note about this meeting..." className="min-h-[100px] resize-none" />
                          <div className="flex justify-end mt-3">
                            <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim() || createActivity.isPending}>
                              {createActivity.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                              Add Note
                            </Button>
                          </div>
                        </div>
                        <div className="text-center py-6 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm">Notes are saved as activities linked to the related entities.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card><CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader><CardContent className="space-y-2">
              <Button className="w-full justify-start gap-2" variant="outline" onClick={handleToggleComplete} disabled={completeMeeting.isPending || updateMeeting.isPending}>
                {meeting.status === "completed" ? (<><XCircle className="h-4 w-4" />Reopen Meeting</>) : (<><CheckCircle2 className="h-4 w-4" />Mark Complete</>)}
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" onClick={handleEditMeeting}><Edit className="h-4 w-4" />Edit Meeting</Button>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-base">Meeting Info</CardTitle></CardHeader><CardContent className="space-y-3">
              <div><p className="text-xs text-muted-foreground mb-1">Created</p><p className="text-sm font-medium">{formatDate(meeting.createdAt)}</p></div>
              <div><p className="text-xs text-muted-foreground mb-1">Last Updated</p><p className="text-sm font-medium">{formatDate(meeting.updatedAt)}</p></div>
              {meeting.relatedTo && <div><p className="text-xs text-muted-foreground mb-1">Related To</p><p className="text-sm font-medium flex items-center gap-1"><LinkIcon className="h-3 w-3" />{meeting.relatedTo}{meeting.relatedToType && <span className="text-xs text-muted-foreground">({meeting.relatedToType})</span>}</p></div>}
            </CardContent></Card>

            {(meeting.contact || meeting.company || meeting.deal || meeting.lead) && (
              <Card><CardHeader><CardTitle className="text-base">Related Items</CardTitle></CardHeader><CardContent className="space-y-4">
                {meeting.contact && (
                  <div><p className="text-xs text-muted-foreground mb-2">Contact</p>
                    <Link href={`/sales/contacts/${meeting.contact.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">{meeting.contact.name.substring(0, 2).toUpperCase()}</div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{meeting.contact.name}</p>
                    </Link>
                  </div>
                )}
                {meeting.company && (
                  <div><p className="text-xs text-muted-foreground mb-2">Company</p>
                    <Link href={`/sales/accounts/${meeting.company.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">{meeting.company.name.substring(0, 2).toUpperCase()}</div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{meeting.company.name}</p>
                    </Link>
                  </div>
                )}
                {meeting.deal && (
                  <div><p className="text-xs text-muted-foreground mb-2">Deal</p>
                    <Link href={`/sales/deals/${meeting.deal.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">{meeting.deal.name.substring(0, 2).toUpperCase()}</div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{meeting.deal.name}</p>
                    </Link>
                  </div>
                )}
                {meeting.lead && (
                  <div><p className="text-xs text-muted-foreground mb-2">Lead</p>
                    <Link href={`/sales/leads/${meeting.lead.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">{meeting.lead.name.substring(0, 2).toUpperCase()}</div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{meeting.lead.name}</p>
                    </Link>
                  </div>
                )}
              </CardContent></Card>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} title="Delete Meeting" description="Are you sure you want to delete this meeting? This will permanently remove it from your CRM and cannot be undone." itemName={meeting.subject} itemType="Meeting" icon={Users} isDeleting={deleteMeetingMutation.isPending} />

      <MeetingFormDrawer isOpen={formDrawerOpen} onClose={() => { setFormDrawerOpen(false); setEditingMeeting(null); }} onSubmit={handleFormSubmit} initialData={editingMeeting} mode="edit" defaultView="quick" />
    </div>
  );
}
