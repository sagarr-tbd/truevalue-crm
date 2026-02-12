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
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  MessageSquare,
  Plus,
  AlertCircle,
  CheckSquare,
  Flag,
  CheckCircle2,
  Circle,
  Building2,
  Mail,
  Phone,
  FolderOpen,
  Target,
  User,
  Download,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { ProjectFormDrawer } from "@/components/Forms/Projects";
import type { Project as ProjectType } from "@/lib/types";

// Project data structure (matching projects list page)
type Project = {
  id: number;
  projectCode: string;
  projectName: string;
  description: string;
  client: string;
  projectManager: string;
  status: "Planning" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
  priority: "High" | "Medium" | "Low" | "Critical";
  progress: number;
  startDate: string;
  endDate: string;
  budget: string;
  spent: string;
  teamSize: number;
  tasksCompleted: number;
  totalTasks: number;
  type: string;
  initials: string;
};

// Mock projects data
const projects: Project[] = [
  {
    id: 1,
    projectCode: "PRJ-2026-001",
    projectName: "Enterprise CRM Implementation",
    description: "Complete CRM deployment for Fortune 500 company. This project involves migrating legacy systems, training staff, and implementing custom workflows.",
    client: "Acme Corporation",
    projectManager: "Sarah Johnson",
    status: "In Progress",
    priority: "High",
    progress: 65,
    startDate: "Jan 1, 2026",
    endDate: "Mar 31, 2026",
    budget: "$150,000",
    spent: "$97,500",
    teamSize: 8,
    tasksCompleted: 24,
    totalTasks: 37,
    type: "Implementation",
    initials: "AC",
  },
  {
    id: 2,
    projectCode: "PRJ-2026-002",
    projectName: "Mobile App Development",
    description: "iOS and Android mobile app for customer portal",
    client: "TechVision Inc",
    projectManager: "Mike Wilson",
    status: "Planning",
    priority: "Medium",
    progress: 15,
    startDate: "Feb 1, 2026",
    endDate: "May 31, 2026",
    budget: "$200,000",
    spent: "$30,000",
    teamSize: 6,
    tasksCompleted: 5,
    totalTasks: 45,
    type: "Development",
    initials: "TV",
  },
  {
    id: 3,
    projectCode: "PRJ-2026-003",
    projectName: "Data Migration Project",
    description: "Migrate legacy data to new CRM platform",
    client: "Global Solutions Ltd",
    projectManager: "Emily Davis",
    status: "In Progress",
    priority: "Critical",
    progress: 80,
    startDate: "Dec 15, 2025",
    endDate: "Feb 15, 2026",
    budget: "$75,000",
    spent: "$60,000",
    teamSize: 5,
    tasksCompleted: 32,
    totalTasks: 40,
    type: "Migration",
    initials: "GS",
  },
];

// Mock tasks and milestones
const mockTasks = [
  {
    id: 1,
    title: "Setup development environment",
    status: "Completed",
    assignedTo: "John Smith",
    dueDate: "Jan 5, 2026",
    completed: true,
  },
  {
    id: 2,
    title: "Database schema design",
    status: "Completed",
    assignedTo: "Jane Doe",
    dueDate: "Jan 10, 2026",
    completed: true,
  },
  {
    id: 3,
    title: "API integration",
    status: "In Progress",
    assignedTo: "Mike Johnson",
    dueDate: "Jan 30, 2026",
    completed: false,
  },
  {
    id: 4,
    title: "User interface development",
    status: "In Progress",
    assignedTo: "Sarah Brown",
    dueDate: "Feb 15, 2026",
    completed: false,
  },
  {
    id: 5,
    title: "Testing and QA",
    status: "Not Started",
    assignedTo: "David Lee",
    dueDate: "Mar 10, 2026",
    completed: false,
  },
];

const mockMilestones = [
  {
    id: 1,
    title: "Project Kickoff",
    date: "Jan 1, 2026",
    completed: true,
  },
  {
    id: 2,
    title: "Phase 1 Complete",
    date: "Jan 31, 2026",
    completed: true,
  },
  {
    id: 3,
    title: "Phase 2 Complete",
    date: "Feb 28, 2026",
    completed: false,
  },
  {
    id: 4,
    title: "Final Delivery",
    date: "Mar 31, 2026",
    completed: false,
  },
];

// Mock team members
const mockTeamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Project Manager",
    email: "sarah.johnson@company.com",
    allocation: "100%",
    initials: "SJ",
  },
  {
    id: 2,
    name: "John Smith",
    role: "Senior Developer",
    email: "john.smith@company.com",
    allocation: "100%",
    initials: "JS",
  },
  {
    id: 3,
    name: "Jane Doe",
    role: "Backend Developer",
    email: "jane.doe@company.com",
    allocation: "75%",
    initials: "JD",
  },
  {
    id: 4,
    name: "Mike Johnson",
    role: "Frontend Developer",
    email: "mike.johnson@company.com",
    allocation: "100%",
    initials: "MJ",
  },
  {
    id: 5,
    name: "Sarah Brown",
    role: "UI/UX Designer",
    email: "sarah.brown@company.com",
    allocation: "50%",
    initials: "SB",
  },
  {
    id: 6,
    name: "David Lee",
    role: "QA Engineer",
    email: "david.lee@company.com",
    allocation: "50%",
    initials: "DL",
  },
  {
    id: 7,
    name: "Emily Chen",
    role: "DevOps Engineer",
    email: "emily.chen@company.com",
    allocation: "25%",
    initials: "EC",
  },
  {
    id: 8,
    name: "Robert Taylor",
    role: "Business Analyst",
    email: "robert.taylor@company.com",
    allocation: "50%",
    initials: "RT",
  },
];

// Mock client information
const mockClientInfo = {
  name: "Acme Corporation",
  email: "contact@acme.com",
  phone: "+1-555-100-1000",
  accountId: 1,
  industry: "Technology",
  address: "123 Business St, San Francisco, CA 94105",
};

// Mock notes
const mockNotes = [
  {
    id: 1,
    content: "Client is very satisfied with progress so far. They requested additional features for Phase 2. Need to discuss scope changes.",
    author: "Sarah Johnson",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Budget review completed. Currently on track. Spent $97,500 of $150,000 budget. Expected to stay within budget.",
    author: "Sarah Johnson",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
  {
    id: 3,
    content: "Team meeting scheduled for Feb 1st to review Phase 1 deliverables and plan Phase 2 activities.",
    author: "Mike Johnson",
    date: "Jan 22, 2026",
    time: "4:00 PM",
  },
];

type TabType = "details" | "tasks" | "team" | "notes";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<ProjectType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("edit");

  // Find project by ID
  const project = useMemo(() => {
    const projectId = parseInt(id);
    return projects.find((p) => p.id === projectId);
  }, [id]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!project) return 0;
    const endDate = new Date(project.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [project]);

  // Calculate budget percentage
  const budgetPercentage = useMemo(() => {
    if (!project) return 0;
    const budgetNum = parseInt(project.budget.replace(/[^0-9]/g, ""));
    const spentNum = parseInt(project.spent.replace(/[^0-9]/g, ""));
    return Math.round((spentNum / budgetNum) * 100);
  }, [project]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!project) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted project:", project.projectName);
      router.push("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
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

  const handleComplete = () => {
    // In a real app, this would make an API call
    console.log("Completing project:", project?.id);
  };

  // Form drawer handlers
  const handleEditProject = () => {
    if (!project) return;
    
    setEditingProject({
      projectCode: project.projectCode,
      projectName: project.projectName,
      description: project.description,
      client: project.client,
      projectManager: project.projectManager,
      status: project.status as ProjectType["status"],
      priority: project.priority as ProjectType["priority"],
      type: project.type as ProjectType["type"],
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      teamSize: project.teamSize,
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<ProjectType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data, "Mode:", formMode);
      setFormDrawerOpen(false);
      setEditingProject(null);
      // In a real app, you would refresh the project data here
    } catch (error) {
      console.error("Error saving project:", error);
      throw error;
    }
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Planning: "bg-primary/20 text-primary",
      "In Progress": "bg-accent/10 text-accent",
      "On Hold": "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
      Completed: "bg-primary/20 text-primary",
      Cancelled: "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Priority badge colors
  const getPriorityColors = (priority: string) => {
    const colors = {
      Critical: "bg-destructive/10 text-destructive",
      High: "bg-primary/10 text-primary",
      Medium: "bg-accent/10 text-accent",
      Low: "bg-muted text-muted-foreground",
    };
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // If project not found
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Project Not Found</h2>
        <p className="text-gray-600">The project you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "tasks" as TabType, label: "Tasks & Milestones", icon: CheckSquare },
    { id: "team" as TabType, label: "Team & Resources", icon: Users },
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
              onClick={() => router.push("/projects")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {project.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{project.projectName}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/sales/accounts/${mockClientInfo.accountId}`}
                    className="text-lg text-muted-foreground hover:text-primary transition-colors"
                  >
                    {project.client}
                  </Link>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    project.status
                  )}`}>
                    {project.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(
                    project.priority
                  )}`}>
                    <Flag className="h-3 w-3 inline mr-1" />
                    {project.priority}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {project.startDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditProject}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {project.status !== "Completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </Button>
              )}
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
                <DollarSign className="h-4 w-4" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {project.budget}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.spent} spent ({budgetPercentage}%)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {project.progress}%
                </p>
                <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-brand-teal to-brand-purple rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {project.tasksCompleted} of {project.totalTasks} tasks completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Size
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {project.teamSize}
                </p>
                <p className="text-xs text-muted-foreground">
                  Team members
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{project.startDate} - {project.endDate}</p>
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
                            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Project Name</p>
                                <p className="text-base font-medium">{project.projectName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Project Code</p>
                                <p className="text-base font-medium">{project.projectCode}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{project.description}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Client</p>
                                <Link
                                  href={`/sales/accounts/${mockClientInfo.accountId}`}
                                  className="text-base font-medium text-primary hover:underline"
                                >
                                  {project.client}
                                </Link>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Project Type</p>
                                <p className="text-base font-medium">{project.type}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                  project.status
                                )}`}>
                                  {project.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Priority</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColors(
                                  project.priority
                                )}`}>
                                  <Flag className="h-3 w-3 inline mr-1" />
                                  {project.priority}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Project Manager</p>
                                <p className="text-base font-medium">{project.projectManager}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Budget</p>
                                <p className="text-base font-medium font-tabular">{project.budget}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                                <p className="text-base font-medium">{project.startDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">End Date</p>
                                <p className="text-base font-medium">{project.endDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Team Size</p>
                                <p className="text-base font-medium">{project.teamSize} members</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "tasks" && (
                      <motion.div
                        key="tasks"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {/* Tasks Section */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Tasks</h3>
                          <div className="space-y-3">
                            {mockTasks.map((task) => (
                              <Card key={task.id} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() => console.log("Toggle task", task.id)}
                                      className="mt-0.5"
                                    >
                                      {task.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                      ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                            {task.title}
                                          </p>
                                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <User className="h-3 w-3" />
                                              <span>{task.assignedTo}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              <span>Due: {task.dueDate}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          task.status === "Completed"
                                            ? "bg-primary/10 text-primary"
                                            : task.status === "In Progress"
                                            ? "bg-accent/10 text-accent"
                                            : "bg-muted text-muted-foreground"
                                        }`}>
                                          {task.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Milestones Section */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Milestones</h3>
                          <div className="space-y-3">
                            {mockMilestones.map((milestone, index) => (
                              <div key={milestone.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    milestone.completed
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}>
                                    {milestone.completed ? (
                                      <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                      <Target className="h-5 w-5" />
                                    )}
                                  </div>
                                  {index < mockMilestones.length - 1 && (
                                    <div className="w-0.5 h-full bg-border mt-2" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className={`font-medium ${milestone.completed ? "text-foreground" : "text-muted-foreground"}`}>
                                      {milestone.title}
                                    </p>
                                    <span className="text-sm text-muted-foreground">{milestone.date}</span>
                                  </div>
                                  {milestone.completed && (
                                    <p className="text-xs text-muted-foreground">Completed on {milestone.date}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "team" && (
                      <motion.div
                        key="team"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockTeamMembers.map((member) => (
                          <Card key={member.id} className="border border-border">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                    {member.initials}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      {member.name}
                                    </h4>
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{member.role}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-900">{member.email}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Allocation: {member.allocation}</span>
                                      </div>
                                    </div>
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
                            placeholder="Add a note about this project..."
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => router.push(`/activities/tasks?project=${project.id}`)}>
                  <CheckSquare className="h-4 w-4" />
                  View Tasks
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Add team member")}>
                  <UserPlus className="h-4 w-4" />
                  Add Team Member
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Export report")}>
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{project.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Project Manager</p>
                  <p className="text-sm font-medium">{project.projectManager}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    project.status
                  )}`}>
                    {project.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client Name</p>
                  <Link
                    href={`/sales/accounts/${mockClientInfo.accountId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {mockClientInfo.name}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a
                    href={`mailto:${mockClientInfo.email}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {mockClientInfo.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <a
                    href={`tel:${mockClientInfo.phone}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {mockClientInfo.phone}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Account</p>
                  <Link
                    href={`/sales/accounts/${mockClientInfo.accountId}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Building2 className="h-3 w-3" />
                    View Account
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        description="Are you sure you want to delete this project? This will permanently remove it from your CRM and cannot be undone."
        itemName={project.projectName}
        itemType="Project"
        icon={FolderOpen}
        isDeleting={isDeleting}
      />

      {/* Project Form Drawer */}
      <ProjectFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingProject}
        mode={formMode}
      />
    </div>
  );
}
