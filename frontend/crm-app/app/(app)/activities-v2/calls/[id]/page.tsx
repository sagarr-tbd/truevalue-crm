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
  User,
  Clock,
  FileText,
  AlertCircle,
  Phone,
  Flag,
  CheckCircle2,
  XCircle,
  Circle,
  Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { ActivityV2FormDrawer } from "@/components/Forms/ActivitiesV2";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import {
  useActivityV2,
  useUpdateActivityV2,
  useDeleteActivityV2,
  useCompleteActivityV2,
} from "@/lib/queries/useActivitiesV2";
import { useMemberOptions } from "@/lib/queries/useMembers";
import { usePermission, ACTIVITIES_WRITE, ACTIVITIES_DELETE } from "@/lib/permissions";
import type { CreateActivityV2Input } from "@/lib/api/activitiesV2";

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const CALL_DIRECTION_DISPLAY: Record<string, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
};

const CALL_OUTCOME_DISPLAY: Record<string, string> = {
  answered: "Answered",
  voicemail: "Voicemail",
  no_answer: "No Answer",
  busy: "Busy",
  failed: "Failed",
};

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

const getDirectionColors = (direction: string) => {
  const colors: Record<string, string> = {
    inbound: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    outbound: "bg-green-500/10 text-green-600 dark:text-green-400",
  };
  return colors[direction] || "bg-muted text-muted-foreground";
};

const getOutcomeColors = (outcome: string) => {
  const colors: Record<string, string> = {
    answered: "bg-primary/10 text-primary",
    voicemail: "bg-accent/10 text-accent",
    no_answer: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    busy: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    failed: "bg-destructive/10 text-destructive",
  };
  return colors[outcome] || "bg-muted text-muted-foreground";
};

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

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function CallV2DetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const { can } = usePermission();

  const { data: call, isLoading, isError } = useActivityV2(id);
  const updateActivityV2 = useUpdateActivityV2();
  const deleteActivityV2 = useDeleteActivityV2();
  const completeActivityV2 = useCompleteActivityV2();
  const { data: memberOptions = [], isLoading: isMembersLoading } = useMemberOptions();

  const resolveMemberName = (uuid?: string | null): string | null => {
    if (!uuid) return null;
    if (isMembersLoading) return "Loading...";
    const member = memberOptions.find((m) => m.value === uuid);
    return member?.label || "Unknown Member";
  };

  const displayAssignedTo =
    call?.display_assigned_to || resolveMemberName(call?.assigned_to_id) || null;

  const handleDeleteConfirm = async () => {
    if (!call?.id) return;
    try {
      await deleteActivityV2.mutateAsync(call.id);
      router.push("/activities-v2/calls");
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleComplete = async () => {
    if (!call?.id) return;
    if (call.status === "completed") {
      await updateActivityV2.mutateAsync({ id: call.id, data: { status: "pending" } });
    } else {
      await completeActivityV2.mutateAsync(call.id);
    }
  };

  const handleEditCall = () => {
    if (!call) return;
    setIsEditDrawerOpen(true);
  };

  const handleFormSubmit = async (data: CreateActivityV2Input) => {
    if (!call?.id) return;
    try {
      await updateActivityV2.mutateAsync({ id: call.id, data });
      setIsEditDrawerOpen(false);
    } catch {
      throw new Error("Failed to update call");
    }
  };

  const StatusIcon = call ? getStatusIcon(call.status) : Circle;

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Call Not Found</h2>
        <p className="text-muted-foreground">The call you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/activities-v2/calls")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calls
        </Button>
      </div>
    );
  }

  const initials = call.subject ? call.subject.substring(0, 2).toUpperCase() : "C";

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
              onClick={() => router.push("/activities-v2/calls")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Calls
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{call.subject}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {displayAssignedTo && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{displayAssignedTo}</span>
                    </div>
                  )}
                  {call.call_direction && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getDirectionColors(call.call_direction)}`}
                    >
                      <Phone className="h-3 w-3 inline mr-1" />
                      {CALL_DIRECTION_DISPLAY[call.call_direction] || call.call_direction}
                    </span>
                  )}
                  {call.call_outcome && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getOutcomeColors(call.call_outcome)}`}
                    >
                      <Flag className="h-3 w-3 inline mr-1" />
                      {CALL_OUTCOME_DISPLAY[call.call_outcome] || call.call_outcome}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(call.status)}`}
                  >
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {STATUS_DISPLAY[call.status] || call.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Created {formatDate(call.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {can(ACTIVITIES_WRITE) && (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleEditCall}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {can(ACTIVITIES_WRITE) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleToggleComplete}
                  disabled={completeActivityV2.isPending || updateActivityV2.isPending}
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
                <Phone className="h-4 w-4" />
                Direction
              </CardTitle>
            </CardHeader>
            <CardContent>
              {call.call_direction ? (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getDirectionColors(call.call_direction)}`}
                >
                  {CALL_DIRECTION_DISPLAY[call.call_direction] || call.call_direction}
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
                Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{formatDate(call.due_date)}</p>
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
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(call.status)}`}
              >
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
              <p className="text-sm font-medium">
                {call.duration_minutes != null ? `${call.duration_minutes} min` : "—"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Call Information & Schedule & Timing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold">Call Information</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Subject</span>
                        <span className="text-sm font-medium text-right max-w-[60%]">
                          {call.subject}
                        </span>
                      </div>
                      {call.call_direction && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Direction</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDirectionColors(call.call_direction)}`}
                          >
                            {CALL_DIRECTION_DISPLAY[call.call_direction] || call.call_direction}
                          </span>
                        </div>
                      )}
                      {call.call_outcome && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Outcome</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getOutcomeColors(call.call_outcome)}`}
                          >
                            {CALL_OUTCOME_DISPLAY[call.call_outcome] || call.call_outcome}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColors(call.status)}`}
                        >
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {STATUS_DISPLAY[call.status] || call.status}
                        </span>
                      </div>
                      {displayAssignedTo && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Assigned To</span>
                          <span className="text-sm font-medium">{displayAssignedTo}</span>
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
                        <span className="text-sm font-medium">{formatDate(call.due_date)}</span>
                      </div>
                      {call.start_time && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Start Time</span>
                          <span className="text-sm font-medium">
                            {formatDateTime(call.start_time)}
                          </span>
                        </div>
                      )}
                      {call.end_time && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">End Time</span>
                          <span className="text-sm font-medium">
                            {formatDateTime(call.end_time)}
                          </span>
                        </div>
                      )}
                      {call.duration_minutes != null && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Duration</span>
                          <span className="text-sm font-medium">{call.duration_minutes} min</span>
                        </div>
                      )}
                      {call.reminder_at && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Reminder</span>
                          <span className="text-sm font-medium">
                            {formatDateTime(call.reminder_at)}
                          </span>
                        </div>
                      )}
                      {call.completed_at && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Completed At</span>
                          <span className="text-sm font-medium">
                            {formatDateTime(call.completed_at)}
                          </span>
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
                        <span className="text-sm font-medium">
                          {formatDateTime(call.created_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="text-sm font-medium">
                          {formatDateTime(call.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
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
                {can(ACTIVITIES_WRITE) && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={handleToggleComplete}
                    disabled={completeActivityV2.isPending || updateActivityV2.isPending}
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
                )}
                {can(ACTIVITIES_WRITE) && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={handleEditCall}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Call
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Call Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Call Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{formatDate(call.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(call.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Related Items */}
            {(call.display_contact ||
              call.display_company ||
              call.display_deal ||
              call.display_lead) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {call.display_contact && call.contact_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Contact</p>
                      <Link
                        href={`/sales-v2/contacts/${call.contact_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {call.display_contact.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.display_contact}
                        </p>
                        <LinkIcon className="h-3 w-3 text-muted-foreground ml-auto" />
                      </Link>
                    </div>
                  )}

                  {call.display_company && call.company_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Company</p>
                      <Link
                        href={`/sales-v2/companies/${call.company_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {call.display_company.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.display_company}
                        </p>
                        <LinkIcon className="h-3 w-3 text-muted-foreground ml-auto" />
                      </Link>
                    </div>
                  )}

                  {call.display_deal && call.deal_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Deal</p>
                      <Link
                        href={`/sales-v2/deals/${call.deal_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {call.display_deal.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.display_deal}
                        </p>
                        <LinkIcon className="h-3 w-3 text-muted-foreground ml-auto" />
                      </Link>
                    </div>
                  )}

                  {call.display_lead && call.lead_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Lead</p>
                      <Link
                        href={`/sales-v2/leads/${call.lead_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {call.display_lead.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.display_lead}
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
        title="Delete Call"
        description="Are you sure you want to delete this call? This will permanently remove it from your CRM and cannot be undone."
        itemName={call.subject}
        itemType="Call"
        icon={Phone}
        isDeleting={deleteActivityV2.isPending}
      />

      <ActivityV2FormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={call}
        mode="edit"
        activityType="call"
      />
    </div>
  );
}
