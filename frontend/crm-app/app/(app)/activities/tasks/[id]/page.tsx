"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Clock,
  FileText,
  AlertCircle,
  CheckSquare,
  Flag,
  CheckCircle2,
  XCircle,
  Circle,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { TaskFormDrawer } from "@/components/Forms/Activities";
import type { Task as TaskType } from "@/lib/types";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  type TaskFormData,
} from "@/lib/queries/useTasks";
import { useMemberOptions } from "@/lib/queries/useMembers";
import { usePermission, ACTIVITIES_WRITE, ACTIVITIES_DELETE } from "@/lib/permissions";

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

/** Convert ISO string → YYYY-MM-DD for <input type="date"> */
function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().split("T")[0];
  } catch {
    return iso.split("T")[0] || "";
  }
}

/** Convert ISO string → YYYY-MM-DDTHH:MM for <input type="datetime-local"> */
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

const getPriorityColors = (priority: string) => {
  const colors: Record<string, string> = {
    urgent: "bg-destructive/10 text-destructive",
    high: "bg-primary/10 text-primary",
    normal: "bg-accent/10 text-accent",
    low: "bg-muted text-muted-foreground",
  };
  return colors[priority] || "bg-muted text-muted-foreground";
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

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Permissions
  const { can } = usePermission();

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<TaskType> | null>(null);

  // React Query hooks
  const { data: task, isLoading, isError } = useTask(id);
  const updateTask = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const completeTask = useCompleteTask();
  const { data: memberOptions = [], isLoading: isMembersLoading } = useMemberOptions();

  const resolveMemberName = (uuid?: string): string | null => {
    if (!uuid) return null;
    if (isMembersLoading) return "Loading...";
    const member = memberOptions.find(m => m.value === uuid);
    return member?.label || "Unknown Member";
  };

  // Calculate days remaining/overdue
  const daysRemaining = useMemo(() => {
    if (!task?.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [task?.dueDate]);

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!task?.id) return;

    try {
      await deleteTaskMutation.mutateAsync(task.id);
      router.push("/activities/tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleToggleComplete = async () => {
    if (!task?.id) return;

    if (task.status === "completed") {
      // Reopen: set status back to pending
      await updateTask.mutateAsync({
        id: task.id,
        data: { status: "pending" },
      });
    } else {
      // Complete
      await completeTask.mutateAsync(task.id);
    }
  };

  // Form handlers
  const handleEditTask = () => {
    if (!task) return;
    setEditingTask({
      id: task.id,
      subject: task.subject,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: toDateInputValue(task.dueDate),
      assignedTo: task.assignedTo,
      contactId: task.contact?.id,
      companyId: task.company?.id,
      dealId: task.deal?.id,
      leadId: task.lead?.id,
      reminderAt: toDateTimeLocalValue(task.reminderAt),
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<TaskType>) => {
    if (!task?.id) return;

    try {
      const taskData: TaskFormData = {
        subject: data.subject || "",
        description: data.description,
        priority: data.priority as TaskFormData["priority"],
        status: data.status as TaskFormData["status"],
        dueDate: data.dueDate,
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        leadId: data.leadId,
        assignedTo: data.assignedTo,
        reminderAt: data.reminderAt,
      };

      await updateTask.mutateAsync({ id: task.id, data: taskData });
      setFormDrawerOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error saving task:", error);
      throw error;
    }
  };

  const StatusIcon = task ? getStatusIcon(task.status) : Circle;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading task...</p>
      </div>
    );
  }

  // Error / Not found state
  if (isError || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Task Not Found</h2>
        <p className="text-muted-foreground">The task you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/activities/tasks")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
    );
  }

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
              onClick={() => router.push("/activities/tasks")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tasks
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {task.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{task.subject}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {task.assignedTo && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{resolveMemberName(task.assignedTo)}</span>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(task.priority)}`}>
                    <Flag className="h-3 w-3 inline mr-1" />
                    {PRIORITY_DISPLAY[task.priority] || task.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(task.status)}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {STATUS_DISPLAY[task.status] || task.status}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {formatDate(task.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {can(ACTIVITIES_WRITE) && (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleEditTask}>
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
                  disabled={completeTask.isPending || updateTask.isPending}
                >
                  {task.status === "completed" ? (
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
                <Flag className="h-4 w-4" />
                Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getPriorityColors(task.priority)}`}>
                <Flag className="h-3 w-3 inline mr-1" />
                {PRIORITY_DISPLAY[task.priority] || task.priority}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{formatDate(task.dueDate)}</p>
              {daysRemaining !== null && (
                <p className={`text-xs ${daysRemaining < 0 ? "text-destructive" : daysRemaining === 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0
                    ? "Due today"
                    : `${daysRemaining} days remaining`}
                </p>
              )}
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
              <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(task.status)}`}>
                <StatusIcon className="h-3 w-3 inline mr-1" />
                {STATUS_DISPLAY[task.status] || task.status}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{formatDate(task.updatedAt)}</p>
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
                        {/* Task Information & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="text-base font-semibold">Task Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Subject</span>
                                <span className="text-sm font-medium text-right max-w-[60%]">{task.subject}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Priority</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColors(task.priority)}`}>
                                  <Flag className="h-3 w-3 inline mr-1" />
                                  {PRIORITY_DISPLAY[task.priority] || task.priority}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColors(task.status)}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {STATUS_DISPLAY[task.status] || task.status}
                                </span>
                              </div>
                              {task.assignedTo && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Assigned To</span>
                                  <span className="text-sm font-medium">{resolveMemberName(task.assignedTo)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Calendar className="h-4 w-4 text-purple-500" />
                              </div>
                              <h3 className="text-base font-semibold">Schedule & Timing</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Due Date</span>
                                <span className="text-sm font-medium">{formatDate(task.dueDate)}</span>
                              </div>
                              {task.startTime && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Start Time</span>
                                  <span className="text-sm font-medium">{formatDateTime(task.startTime)}</span>
                                </div>
                              )}
                              {task.endTime && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">End Time</span>
                                  <span className="text-sm font-medium">{formatDateTime(task.endTime)}</span>
                                </div>
                              )}
                              {task.durationMinutes && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Duration</span>
                                  <span className="text-sm font-medium">{task.durationMinutes} min</span>
                                </div>
                              )}
                              {task.reminderAt && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Reminder</span>
                                  <span className="text-sm font-medium">{formatDateTime(task.reminderAt)}</span>
                                </div>
                              )}
                              {task.completedAt && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Completed At</span>
                                  <span className="text-sm font-medium">{formatDateTime(task.completedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-orange-500/10 rounded-lg">
                                <FileText className="h-4 w-4 text-orange-500" />
                              </div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
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
                                <span className="text-sm font-medium">{formatDateTime(task.createdAt)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="text-sm font-medium">{formatDateTime(task.updatedAt)}</span>
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
                    disabled={completeTask.isPending || updateTask.isPending}
                  >
                    {task.status === "completed" ? (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reopen Task
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
                    onClick={handleEditTask}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Task
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Task Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{formatDate(task.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(task.updatedAt)}</p>
                </div>
                {task.relatedTo && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Related To</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <LinkIcon className="h-3 w-3" />
                      {task.relatedTo}
                      {task.relatedToType && (
                        <span className="text-xs text-muted-foreground">({task.relatedToType})</span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Items */}
            {(task.contact || task.company || task.deal || task.lead) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {task.contact && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Contact</p>
                      <Link
                        href={`/sales/contacts/${task.contact.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {task.contact.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {task.contact.name}
                        </p>
                      </Link>
                    </div>
                  )}

                  {task.company && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Company</p>
                      <Link
                        href={`/sales/accounts/${task.company.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {task.company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {task.company.name}
                        </p>
                      </Link>
                    </div>
                  )}

                  {task.deal && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Deal</p>
                      <Link
                        href={`/sales/deals/${task.deal.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {task.deal.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {task.deal.name}
                        </p>
                      </Link>
                    </div>
                  )}

                  {task.lead && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Lead</p>
                      <Link
                        href={`/sales/leads/${task.lead.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                          {task.lead.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {task.lead.name}
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
        title="Delete Task"
        description="Are you sure you want to delete this task? This will permanently remove it from your CRM and cannot be undone."
        itemName={task.subject}
        itemType="Task"
        icon={CheckSquare}
        isDeleting={deleteTaskMutation.isPending}
      />

      {/* Task Form Drawer */}
      <TaskFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
