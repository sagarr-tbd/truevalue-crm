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
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle2,
  XCircle,
  Circle,
  Link as LinkIcon,
  Loader2,
  Flag,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { CallFormDrawer } from "@/components/Forms/Activities";
import type { Call as CallType } from "@/lib/types";
import {
  useCall,
  useUpdateCall,
  useDeleteCall,
  useCompleteCall,
  type CallFormData,
} from "@/lib/queries/useCalls";
import { useCreateActivity } from "@/lib/queries/useActivities";
import { useMemberOptions } from "@/lib/queries/useMembers";
import type { ActivityFormData } from "@/lib/api/activities";

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DIRECTION_DISPLAY: Record<string, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
};

const OUTCOME_DISPLAY: Record<string, string> = {
  answered: "Answered",
  voicemail: "Voicemail",
  no_answer: "No Answer",
  busy: "Busy",
  failed: "Failed",
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

function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().split("T")[0];
  } catch {
    return iso.split("T")[0] || "";
  }
}

function toDateTimeLocalValue(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso.slice(0, 16) || "";
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

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<Partial<CallType> | null>(null);

  // React Query hooks
  const { data: call, isLoading, isError } = useCall(id);
  const updateCall = useUpdateCall();
  const deleteCallMutation = useDeleteCall();
  const completeCall = useCompleteCall();
  const createActivity = useCreateActivity();
  const { data: memberOptions = [], isLoading: isMembersLoading } = useMemberOptions();

  const resolveMemberName = (uuid?: string): string | null => {
    if (!uuid) return null;
    if (isMembersLoading) return "Loading...";
    const member = memberOptions.find(m => m.value === uuid);
    return member?.label || "Unknown Member";
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!call?.id) return;

    try {
      await deleteCallMutation.mutateAsync(call.id);
      router.push("/activities/calls");
    } catch (error) {
      console.error("Error deleting call:", error);
    }
  };

  const handleToggleComplete = async () => {
    if (!call?.id) return;

    if (call.status === "completed") {
      await updateCall.mutateAsync({
        id: call.id,
        data: { status: "pending" },
      });
    } else {
      await completeCall.mutateAsync(call.id);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !call) return;

    try {
      const noteData: ActivityFormData = {
        activityType: "note",
        subject: `Note on call: ${call.subject}`,
        description: newNote,
        status: "completed",
        contactId: call.contact?.id,
        companyId: call.company?.id,
        dealId: call.deal?.id,
        leadId: call.lead?.id,
      };
      await createActivity.mutateAsync(noteData);
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  // Form handlers
  const handleEditCall = () => {
    if (!call) return;
    setEditingCall({
      id: call.id,
      subject: call.subject,
      description: call.description,
      callDirection: call.callDirection as CallType["callDirection"],
      callOutcome: call.callOutcome as CallType["callOutcome"],
      status: call.status,
      priority: call.priority,
      dueDate: toDateInputValue(call.dueDate),
      startTime: toDateTimeLocalValue(call.startTime),
      endTime: toDateTimeLocalValue(call.endTime),
      durationMinutes: call.durationMinutes,
      assignedTo: call.assignedTo,
      contactId: call.contact?.id,
      companyId: call.company?.id,
      dealId: call.deal?.id,
      leadId: call.lead?.id,
      reminderAt: toDateTimeLocalValue(call.reminderAt),
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<CallType>) => {
    if (!call?.id) return;

    try {
      const callData: CallFormData = {
        subject: data.subject || "",
        description: data.description,
        callDirection: data.callDirection,
        callOutcome: data.callOutcome,
        status: data.status as CallFormData["status"],
        priority: data.priority as CallFormData["priority"],
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

      await updateCall.mutateAsync({ id: call.id, data: callData });
      setFormDrawerOpen(false);
      setEditingCall(null);
    } catch (error) {
      console.error("Error saving call:", error);
      throw error;
    }
  };

  const StatusIcon = call ? getStatusIcon(call.status) : Circle;
  const DirectionIcon = call?.callDirection === "inbound" ? PhoneIncoming : PhoneOutgoing;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading call...</p>
      </div>
    );
  }

  // Error / Not found state
  if (isError || !call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Call Not Found</h2>
        <p className="text-muted-foreground">The call you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/activities/calls")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calls
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
                {call.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{call.subject}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {call.callDirection && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DirectionIcon className="h-4 w-4" />
                      <span className="text-sm">{DIRECTION_DISPLAY[call.callDirection] || call.callDirection}</span>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(call.status)}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {STATUS_DISPLAY[call.status] || call.status}
                  </span>
                  {call.callOutcome && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {OUTCOME_DISPLAY[call.callOutcome] || call.callOutcome}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">Created {formatDate(call.createdAt)}</span>
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
                onClick={handleToggleComplete}
                disabled={completeCall.isPending || updateCall.isPending}
              >
                {call.status === "completed" ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Reopen
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setIsDeleteModalOpen(true)}
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
                <DirectionIcon className="h-4 w-4" />
                Direction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{DIRECTION_DISPLAY[call.callDirection || ''] || call.callDirection || "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{formatDate(call.dueDate)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(call.status)}`}>
                <StatusIcon className="h-3 w-3 inline mr-1" />
                {STATUS_DISPLAY[call.status] || call.status}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{call.durationMinutes ? `${call.durationMinutes} min` : "—"}</p>
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
                        {/* Call Information & Call Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Phone className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="text-base font-semibold">Call Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Subject</span>
                                <span className="text-sm font-medium text-right max-w-[60%]">{call.subject}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Direction</span>
                                <span className="text-sm font-medium flex items-center gap-1.5">
                                  <DirectionIcon className="h-3.5 w-3.5" />
                                  {DIRECTION_DISPLAY[call.callDirection || ''] || call.callDirection || "—"}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Outcome</span>
                                <span className="text-sm font-medium">{OUTCOME_DISPLAY[call.callOutcome || ''] || call.callOutcome || "—"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColors(call.status)}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {STATUS_DISPLAY[call.status] || call.status}
                                </span>
                              </div>
                              {call.assignedTo && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Assigned To</span>
                                  <span className="text-sm font-medium">{resolveMemberName(call.assignedTo)}</span>
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
                                <span className="text-sm font-medium">{formatDate(call.dueDate)}</span>
                              </div>
                              {call.startTime && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Start Time</span>
                                  <span className="text-sm font-medium">{formatDateTime(call.startTime)}</span>
                                </div>
                              )}
                              {call.endTime && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">End Time</span>
                                  <span className="text-sm font-medium">{formatDateTime(call.endTime)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Duration</span>
                                <span className="text-sm font-medium">{call.durationMinutes ? `${call.durationMinutes} min` : "—"}</span>
                              </div>
                              {call.reminderAt && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Reminder</span>
                                  <span className="text-sm font-medium">{formatDateTime(call.reminderAt)}</span>
                                </div>
                              )}
                              {call.completedAt && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Completed At</span>
                                  <span className="text-sm font-medium">{formatDateTime(call.completedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {call.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-orange-500/10 rounded-lg">
                                <FileText className="h-4 w-4 text-orange-500" />
                              </div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{call.description}</p>
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
                                <span className="text-sm font-medium">{formatDateTime(call.createdAt)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="text-sm font-medium">{formatDateTime(call.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "activity" && (
                      <motion.div
                        key="activity"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-sm">Activity tracking for this call</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            Changes to this call are tracked automatically
                          </p>
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
                        <div className="border border-border rounded-lg p-4 bg-muted/30">
                          <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note about this call..."
                            className="min-h-[100px] resize-none"
                          />
                          <div className="flex justify-end mt-3">
                            <Button
                              onClick={handleAddNote}
                              size="sm"
                              disabled={!newNote.trim() || createActivity.isPending}
                            >
                              {createActivity.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
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

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={handleToggleComplete}
                  disabled={completeCall.isPending || updateCall.isPending}
                >
                  {call.status === "completed" ? (
                    <>
                      <XCircle className="h-4 w-4" />
                      Reopen Call
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={handleEditCall}
                >
                  <Edit className="h-4 w-4" />
                  Edit Call
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Call Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{formatDate(call.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(call.updatedAt)}</p>
                </div>
                {call.relatedTo && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Related To</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <LinkIcon className="h-3 w-3" />
                      {call.relatedTo}
                      {call.relatedToType && (
                        <span className="text-xs text-muted-foreground">({call.relatedToType})</span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(call.contact || call.company || call.deal || call.lead) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {call.contact && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Contact</p>
                      <Link
                        href={`/sales/contacts/${call.contact.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {call.contact.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.contact.name}
                        </p>
                      </Link>
                    </div>
                  )}

                  {call.company && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Company</p>
                      <Link
                        href={`/sales/accounts/${call.company.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {call.company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.company.name}
                        </p>
                      </Link>
                    </div>
                  )}

                  {call.deal && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Deal</p>
                      <Link
                        href={`/sales/deals/${call.deal.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {call.deal.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.deal.name}
                        </p>
                      </Link>
                    </div>
                  )}

                  {call.lead && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Lead</p>
                      <Link
                        href={`/sales/leads/${call.lead.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {call.lead.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.lead.name}
                        </p>
                      </Link>
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
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Call"
        description="Are you sure you want to delete this call? This will permanently remove it from your CRM and cannot be undone."
        itemName={call.subject}
        itemType="Call"
        icon={Phone}
        isDeleting={deleteCallMutation.isPending}
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
