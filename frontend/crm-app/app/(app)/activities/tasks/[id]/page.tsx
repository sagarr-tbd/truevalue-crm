"use client";

import { useState, useMemo } from "react";
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
  CheckSquare,
  Flag,
  Bell,
  CheckCircle2,
  XCircle,
  Circle,
  Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { TaskFormDrawer } from "@/components/Forms/Activities";
import type { Task as TaskType } from "@/lib/types";

// Task data structure (matching tasks list page)
type Task = {
  id: number;
  title: string;
  description: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  status: "Not Started" | "In Progress" | "Completed" | "Deferred";
  dueDate: string;
  assignedTo: string;
  createdBy: string;
  relatedTo: string;
  category: string;
  created: string;
  lastUpdated: string;
  completedDate: string | null;
  initials: string;
};

// Mock tasks data
const tasks: Task[] = [
  {
    id: 1,
    title: "Follow up with Acme Corp",
    description: "Send proposal and schedule demo for Q1 2026 partnership. Need to discuss pricing options and implementation timeline.",
    priority: "High",
    status: "In Progress",
    dueDate: "Jan 30, 2026",
    assignedTo: "John Smith",
    createdBy: "Sarah Brown",
    relatedTo: "Acme Corporation",
    category: "Sales",
    created: "Jan 25, 2026",
    lastUpdated: "Jan 28, 2026",
    completedDate: null,
    initials: "FA",
  },
  {
    id: 2,
    title: "Prepare Q1 Sales Report",
    description: "Compile quarterly sales data and insights. Include revenue breakdown, top deals, and pipeline analysis.",
    priority: "High",
    status: "Not Started",
    dueDate: "Feb 5, 2026",
    assignedTo: "Jane Doe",
    createdBy: "Mike Johnson",
    relatedTo: "Internal",
    category: "Reporting",
    created: "Jan 28, 2026",
    lastUpdated: "Jan 28, 2026",
    completedDate: null,
    initials: "QR",
  },
  {
    id: 3,
    title: "Update CRM Database",
    description: "Clean up duplicate contacts and accounts. Verify data accuracy and merge duplicates.",
    priority: "Medium",
    status: "In Progress",
    dueDate: "Feb 1, 2026",
    assignedTo: "Mike Johnson",
    createdBy: "John Smith",
    relatedTo: "Internal",
    category: "Maintenance",
    created: "Jan 20, 2026",
    lastUpdated: "Jan 27, 2026",
    completedDate: null,
    initials: "UD",
  },
  {
    id: 4,
    title: "Call TechVision Inc",
    description: "Discuss renewal terms and contract details. Address their concerns about pricing.",
    priority: "High",
    status: "In Progress",
    dueDate: "Jan 29, 2026",
    assignedTo: "Sarah Brown",
    createdBy: "Jane Doe",
    relatedTo: "TechVision Inc",
    category: "Sales",
    created: "Jan 26, 2026",
    lastUpdated: "Jan 28, 2026",
    completedDate: null,
    initials: "CT",
  },
  {
    id: 5,
    title: "Send contract to Global Solutions",
    description: "Finalize and send signed agreement. Ensure all terms are correct before sending.",
    priority: "Urgent",
    status: "Not Started",
    dueDate: "Jan 28, 2026",
    assignedTo: "John Smith",
    createdBy: "Sarah Brown",
    relatedTo: "Global Solutions Ltd",
    category: "Legal",
    created: "Jan 27, 2026",
    lastUpdated: "Jan 27, 2026",
    completedDate: null,
    initials: "SC",
  },
];

// Mock activity timeline data
const mockActivities = [
  {
    id: 1,
    type: "status",
    title: "Status changed to In Progress",
    description: "Task moved from Not Started to In Progress",
    date: "Jan 28, 2026",
    time: "2:30 PM",
    icon: Activity,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    user: "John Smith",
  },
  {
    id: 2,
    type: "comment",
    title: "Comment added",
    description: "Waiting for client response on pricing proposal. Will follow up tomorrow.",
    date: "Jan 27, 2026",
    time: "10:15 AM",
    icon: MessageSquare,
    color: "text-green-600",
    bgColor: "bg-green-100",
    user: "John Smith",
  },
  {
    id: 3,
    type: "status",
    title: "Task created",
    description: "Task assigned to John Smith",
    date: "Jan 25, 2026",
    time: "4:45 PM",
    icon: CheckSquare,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    user: "Sarah Brown",
  },
  {
    id: 4,
    type: "priority",
    title: "Priority set to High",
    description: "Priority updated from Medium to High",
    date: "Jan 25, 2026",
    time: "4:45 PM",
    icon: Flag,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    user: "Sarah Brown",
  },
];

// Mock subtasks data
const mockSubtasks = [
  {
    id: 1,
    title: "Prepare proposal document",
    completed: true,
    dueDate: "Jan 26, 2026",
  },
  {
    id: 2,
    title: "Schedule demo meeting",
    completed: true,
    dueDate: "Jan 27, 2026",
  },
  {
    id: 3,
    title: "Follow up with client",
    completed: false,
    dueDate: "Jan 29, 2026",
  },
  {
    id: 4,
    title: "Finalize pricing discussion",
    completed: false,
    dueDate: "Jan 30, 2026",
  },
];

// Mock notes data
const mockNotes = [
  {
    id: 1,
    content: "Client showed strong interest in our enterprise solutions. Budget approved. Decision expected by Feb 5.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Discussed implementation timeline and support options. Client requested additional training sessions.",
    author: "John Smith",
    date: "Jan 27, 2026",
    time: "10:15 AM",
  },
];

// Mock related items
const mockRelatedContacts = [
  {
    id: 1,
    name: "Sarah Williams",
    email: "sarah.williams@acme.com",
    jobTitle: "VP Sales",
    initials: "SW",
  },
];

const mockRelatedDeals = [
  {
    id: 1,
    name: "Enterprise Partnership Q1",
    value: "$125,000",
    stage: "Proposal",
    initials: "EP",
  },
];

const mockRelatedAccounts = [
  {
    id: 1,
    name: "Acme Corporation",
    industry: "Technology",
    initials: "AC",
  },
];

type TabType = "details" | "activity" | "subtasks" | "notes";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<TaskType> | null>(null);

  // Find task by ID
  const task = useMemo(() => {
    const taskId = parseInt(id);
    return tasks.find((t) => t.id === taskId);
  }, [id]);

  // Calculate days remaining/overdue
  const daysRemaining = useMemo(() => {
    if (!task) return 0;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [task]);

  // Calculate progress percentage based on subtasks
  const progressPercentage = useMemo(() => {
    const completed = mockSubtasks.filter((st) => st.completed).length;
    return Math.round((completed / mockSubtasks.length) * 100);
  }, []);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!task) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted task:", task.title);
      router.push("/activities/tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  const handleToggleComplete = () => {
    setIsCompleted(!isCompleted);
    // In a real app, this would make an API call
    console.log("Task completion toggled:", !isCompleted);
  };

  // Form handlers
  const handleEditTask = () => {
    if (!task) return;
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority as "Urgent" | "High" | "Medium" | "Low",
      status: task.status as "Not Started" | "In Progress" | "Completed" | "Cancelled",
      dueDate: task.dueDate,
      category: task.category,
      relatedTo: task.relatedTo,
      assignedTo: task.assignedTo,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<TaskType>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Form submitted:", data);
      
      // Close drawer
      setFormDrawerOpen(false);
      setEditingTask(null);
      
      // In production: refresh data or update state
    } catch (error) {
      console.error("Error saving task:", error);
      throw error;
    }
  };

  // Priority badge colors
  const getPriorityColors = (priority: string) => {
    const colors = {
      Urgent: "bg-destructive/10 text-destructive",
      High: "bg-primary/10 text-primary",
      Medium: "bg-accent/10 text-accent",
      Low: "bg-muted text-muted-foreground",
    };
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      "Not Started": "bg-muted text-muted-foreground",
      "In Progress": "bg-accent/10 text-accent",
      Completed: "bg-primary/20 text-primary",
      Deferred: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Priority icon
  const getPriorityIcon = (priority: string) => {
    if (priority === "Urgent") return Flag;
    if (priority === "High") return Flag;
    return Flag;
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    if (status === "Completed") return CheckCircle2;
    if (status === "In Progress") return Clock;
    if (status === "Deferred") return XCircle;
    return Circle;
  };

  // If task not found
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Task Not Found</h2>
        <p className="text-gray-600">The task you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/activities/tasks")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "activity" as TabType, label: "Activity Timeline", icon: Activity },
    { id: "subtasks" as TabType, label: "Subtasks", icon: CheckSquare },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  const PriorityIcon = getPriorityIcon(task.priority);
  const StatusIcon = getStatusIcon(task.status);

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
                <h1 className="text-3xl font-bold text-foreground mb-2">{task.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{task.assignedTo}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(
                    task.priority
                  )}`}>
                    <PriorityIcon className="h-3 w-3 inline mr-1" />
                    {task.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    task.status
                  )}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {task.status}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {task.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditTask}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleToggleComplete}
              >
                {task.status === "Completed" ? (
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
                onClick={handleDeleteClick}
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
                <Flag className="h-4 w-4" />
                Priority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getPriorityColors(
                  task.priority
                )}`}>
                  <PriorityIcon className="h-3 w-3 inline mr-1" />
                  {task.priority}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{task.dueDate}</p>
                <p className={`text-xs ${daysRemaining < 0 ? "text-destructive" : daysRemaining === 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0
                    ? "Due today"
                    : `${daysRemaining} days remaining`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                  task.status
                )}`}>
                  <StatusIcon className="h-3 w-3 inline mr-1" />
                  {task.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {progressPercentage}%
                </p>
                <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-brand-teal to-brand-purple rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {mockSubtasks.filter((st) => st.completed).length} of {mockSubtasks.length} subtasks completed
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Task Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Title</p>
                                <p className="text-base font-medium">{task.title}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{task.description}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Category</p>
                                <p className="text-base font-medium">{task.category}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                                <p className="text-base font-medium">{task.assignedTo}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Task Details</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Priority</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(
                                  task.priority
                                )}`}>
                                  <PriorityIcon className="h-3 w-3 inline mr-1" />
                                  {task.priority}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                  task.status
                                )}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {task.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                                <p className="text-base font-medium">{task.dueDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Created By</p>
                                <p className="text-base font-medium">{task.createdBy}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Created</p>
                                <p className="text-base font-medium">{task.created}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                                <p className="text-base font-medium">{task.lastUpdated}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Related To</p>
                                <p className="text-base font-medium">{task.relatedTo}</p>
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
                        className="space-y-4"
                      >
                        {mockActivities.map((activity, index) => {
                          const Icon = activity.icon;
                          return (
                            <div key={activity.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                {index < mockActivities.length - 1 && (
                                  <div className="w-0.5 h-full bg-border mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium">{activity.title}</p>
                                  <span className="text-sm text-muted-foreground">{activity.date}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{activity.user}</span>
                                  <span>•</span>
                                  <span>{activity.time}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}

                    {activeTab === "subtasks" && (
                      <motion.div
                        key="subtasks"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockSubtasks.map((subtask) => (
                          <Card key={subtask.id} className="border border-border">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => console.log("Toggle subtask", subtask.id)}
                                  className="mt-0.5"
                                >
                                  {subtask.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className={`text-sm font-medium ${subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                        {subtask.title}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>Due: {subtask.dueDate}</span>
                                      </div>
                                    </div>
                                    {subtask.completed && (
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
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
                        <div className="border border-border rounded-lg p-4 bg-gray-50">
                          <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note about this task..."
                            className="min-h-[100px] resize-none"
                          />
                          <div className="flex justify-end mt-3">
                            <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim()}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          </div>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-4">
                          {mockNotes.map((note) => (
                            <Card key={note.id} className="border border-border">
                              <CardContent className="p-4">
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                  {note.content}
                                </p>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                  <span className="text-xs text-gray-500">{note.author}</span>
                                  <span className="text-xs text-gray-400">
                                    {note.date} at {note.time}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
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
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={handleToggleComplete}>
                  {task.status === "Completed" ? (
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Assign task")}>
                  <User className="h-4 w-4" />
                  Assign
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Set reminder")}>
                  <Bell className="h-4 w-4" />
                  Set Reminder
                </Button>
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
                  <p className="text-sm font-medium">{task.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{task.lastUpdated}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Related To</p>
                  <Link
                    href="#"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {task.relatedTo}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Related Items */}
            {(mockRelatedContacts.length > 0 || mockRelatedDeals.length > 0 || mockRelatedAccounts.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockRelatedContacts.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Contacts</p>
                      <div className="space-y-2">
                        {mockRelatedContacts.map((contact) => (
                          <Link
                            key={contact.id}
                            href={`/sales/contacts/${contact.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                              {contact.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {contact.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact.jobTitle}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {mockRelatedDeals.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Deals</p>
                      <div className="space-y-2">
                        {mockRelatedDeals.map((deal) => (
                          <Link
                            key={deal.id}
                            href={`/sales/deals/${deal.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                              {deal.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {deal.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {deal.value} • {deal.stage}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {mockRelatedAccounts.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Accounts</p>
                      <div className="space-y-2">
                        {mockRelatedAccounts.map((account) => (
                          <Link
                            key={account.id}
                            href={`/sales/accounts/${account.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                              {account.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {account.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {account.industry}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
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
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        description="Are you sure you want to delete this task? This will permanently remove it from your CRM and cannot be undone."
        itemName={task.title}
        itemType="Task"
        icon={CheckSquare}
        isDeleting={isDeleting}
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
