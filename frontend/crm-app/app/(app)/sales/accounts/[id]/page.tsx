"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Mail,
  Trash2,
  Phone,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  MessageSquare,
  Plus,
  AlertCircle,
  Activity,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { AccountFormDrawer } from "@/components/Forms/Sales";
import type { Account as AccountType } from "@/lib/types";

// Account data structure (same as accounts list page)
type Account = {
  id: number;
  accountName: string;
  industry: string;
  type: string;
  website: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  country: string;
  employees: number;
  annualRevenue: number;
  status: string;
  owner: string;
  created: string;
  lastActivity: string;
  initials: string;
};

// Mock accounts data
const accounts: Account[] = [
  {
    id: 1,
    accountName: "Acme Corporation",
    industry: "Technology",
    type: "Enterprise",
    website: "www.acmecorp.com",
    phone: "+1 (555) 100-2000",
    email: "contact@acmecorp.com",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    employees: 5000,
    annualRevenue: 2500000,
    status: "Active",
    owner: "John Smith",
    created: "Nov 15, 2025",
    lastActivity: "Jan 28, 2026",
    initials: "AC",
  },
  {
    id: 2,
    accountName: "TechVision Inc",
    industry: "Software",
    type: "Mid-Market",
    website: "www.techvision.io",
    phone: "+1 (555) 200-3000",
    email: "info@techvision.io",
    city: "Austin",
    state: "TX",
    country: "USA",
    employees: 1200,
    annualRevenue: 850000,
    status: "Active",
    owner: "Jane Doe",
    created: "Dec 1, 2025",
    lastActivity: "Jan 27, 2026",
    initials: "TV",
  },
  {
    id: 3,
    accountName: "Global Solutions Ltd",
    industry: "Consulting",
    type: "Enterprise",
    website: "www.globalsolutions.com",
    phone: "+1 (555) 300-4000",
    email: "contact@globalsolutions.com",
    city: "New York",
    state: "NY",
    country: "USA",
    employees: 8500,
    annualRevenue: 4200000,
    status: "Active",
    owner: "Mike Johnson",
    created: "Oct 20, 2025",
    lastActivity: "Jan 26, 2026",
    initials: "GS",
  },
  {
    id: 4,
    accountName: "Innovate Labs",
    industry: "Research",
    type: "Small Business",
    website: "www.innovatelabs.io",
    phone: "+1 (555) 400-5000",
    email: "hello@innovatelabs.io",
    city: "Seattle",
    state: "WA",
    country: "USA",
    employees: 350,
    annualRevenue: 280000,
    status: "Active",
    owner: "Sarah Brown",
    created: "Dec 10, 2025",
    lastActivity: "Jan 25, 2026",
    initials: "IL",
  },
  {
    id: 5,
    accountName: "NextGen Systems",
    industry: "IT Services",
    type: "Mid-Market",
    website: "www.nextgensys.com",
    phone: "+1 (555) 500-6000",
    email: "info@nextgensys.com",
    city: "Boston",
    state: "MA",
    country: "USA",
    employees: 2800,
    annualRevenue: 1650000,
    status: "Active",
    owner: "John Smith",
    created: "Nov 5, 2025",
    lastActivity: "Jan 28, 2026",
    initials: "NS",
  },
  {
    id: 6,
    accountName: "Digital Dynamics",
    industry: "Marketing",
    type: "Small Business",
    website: "www.digitaldynamics.com",
    phone: "+1 (555) 600-7000",
    email: "contact@digitaldynamics.com",
    city: "Miami",
    state: "FL",
    country: "USA",
    employees: 180,
    annualRevenue: 420000,
    status: "Inactive",
    owner: "Jane Doe",
    created: "Dec 18, 2025",
    lastActivity: "Jan 15, 2026",
    initials: "DD",
  },
  {
    id: 7,
    accountName: "CloudFirst Inc",
    industry: "Cloud Services",
    type: "Enterprise",
    website: "www.cloudfirst.com",
    phone: "+1 (555) 700-8000",
    email: "hello@cloudfirst.com",
    city: "Denver",
    state: "CO",
    country: "USA",
    employees: 6200,
    annualRevenue: 3800000,
    status: "Active",
    owner: "Mike Johnson",
    created: "Sep 12, 2025",
    lastActivity: "Jan 27, 2026",
    initials: "CF",
  },
  {
    id: 8,
    accountName: "Prime Industries",
    industry: "Manufacturing",
    type: "Enterprise",
    website: "www.primeindustries.com",
    phone: "+1 (555) 800-9000",
    email: "contact@primeindustries.com",
    city: "Chicago",
    state: "IL",
    country: "USA",
    employees: 12000,
    annualRevenue: 8500000,
    status: "Active",
    owner: "Sarah Brown",
    created: "Aug 22, 2025",
    lastActivity: "Jan 26, 2026",
    initials: "PI",
  },
  {
    id: 9,
    accountName: "Apex Solutions",
    industry: "Healthcare",
    type: "Mid-Market",
    website: "www.apexsolutions.com",
    phone: "+1 (555) 900-0100",
    email: "info@apexsolutions.com",
    city: "Phoenix",
    state: "AZ",
    country: "USA",
    employees: 1850,
    annualRevenue: 1200000,
    status: "Active",
    owner: "John Smith",
    created: "Nov 28, 2025",
    lastActivity: "Jan 24, 2026",
    initials: "AS",
  },
  {
    id: 10,
    accountName: "Strategic Partners",
    industry: "Finance",
    type: "Mid-Market",
    website: "www.strategicpartners.com",
    phone: "+1 (555) 000-1200",
    email: "contact@strategicpartners.com",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    employees: 980,
    annualRevenue: 720000,
    status: "Prospecting",
    owner: "Jane Doe",
    created: "Jan 5, 2026",
    lastActivity: "Jan 20, 2026",
    initials: "SP",
  },
];

// Mock data for activities, deals, and notes
const mockActivities = [
  {
    id: 1,
    type: "email",
    title: "Follow-up email sent",
    description: "Sent proposal for Q1 2026 partnership",
    date: "Jan 28, 2026",
    time: "2:30 PM",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: 2,
    type: "call",
    title: "Discovery call completed",
    description: "Discussed requirements and timeline",
    date: "Jan 25, 2026",
    time: "10:15 AM",
    icon: Phone,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: 3,
    type: "meeting",
    title: "Product demo scheduled",
    description: "Scheduled for Feb 5, 2026 at 3:00 PM",
    date: "Jan 24, 2026",
    time: "4:45 PM",
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: 4,
    type: "note",
    title: "Note added",
    description: "Account showed interest in enterprise plan",
    date: "Jan 22, 2026",
    time: "11:20 AM",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
];

const mockDeals = [
  {
    id: 1,
    name: "Enterprise Partnership Q1",
    value: "$125,000",
    stage: "Proposal",
    probability: 75,
    closeDate: "Feb 15, 2026",
  },
  {
    id: 2,
    name: "Annual License Renewal",
    value: "$45,000",
    stage: "Negotiation",
    probability: 60,
    closeDate: "Mar 1, 2026",
  },
];

const mockNotes = [
  {
    id: 1,
    content: "Account is very interested in our enterprise solutions. Follow up next week.",
    author: "John Doe",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Discussed pricing options and implementation timeline. Decision expected by end of Q1.",
    author: "Jane Smith",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
];

type TabType = "details" | "activity" | "deals" | "notes";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");
  
  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<AccountType> | null>(null);

  // Find account by ID
  const account = useMemo(() => {
    const accountId = parseInt(id);
    return accounts.find((acc) => acc.id === accountId);
  }, [id]);

  // Find related accounts from same industry
  const relatedAccounts = useMemo(() => {
    if (!account) return [];
    return accounts.filter(
      (acc) => acc.industry === account.industry && acc.id !== account.id
    );
  }, [account]);

  // Calculate communication stats
  const communicationStats = useMemo(() => {
    const emails = mockActivities.filter((a) => a.type === "email").length;
    const calls = mockActivities.filter((a) => a.type === "call").length;
    const meetings = mockActivities.filter((a) => a.type === "meeting").length;
    return { emails, calls, meetings };
  }, []);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!account) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted account:", account.accountName);
      router.push("/sales/accounts");
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  // Form handlers
  const handleEditAccount = () => {
    if (!account) return;
    
    setEditingAccount({
      id: account.id,
      accountName: account.accountName,
      website: account.website,
      phone: account.phone,
      email: account.email,
      industry: account.industry,
      type: account.type as "Customer" | "Partner" | "Prospect" | "Vendor" | "Other" | undefined,
      employees: account.employees.toString(),
      annualRevenue: account.annualRevenue,
      assignedTo: account.owner,
      city: account.city,
      state: account.state,
      country: account.country,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<AccountType>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Form submitted:", data);
      
      // Close drawer
      setFormDrawerOpen(false);
      setEditingAccount(null);
      
      // In production: refresh data or update state
    } catch (error) {
      console.error("Error saving account:", error);
      throw error;
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Active: "bg-primary/10 text-primary",
      Inactive: "bg-gray-100 text-gray-600",
      Prospecting: "bg-secondary/10 text-secondary",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  // Type badge colors
  const getTypeColors = (type: string) => {
    const colors = {
      Enterprise: "bg-primary/10 text-primary",
      "Mid-Market": "bg-secondary/10 text-secondary",
      "Small Business": "bg-accent/10 text-accent",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  // Score percentage for visualization
  const scorePercentage = 75; // Mock score for accounts

  // If account not found
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Account Not Found</h2>
        <p className="text-gray-600">The account you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/sales/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "activity" as TabType, label: "Activity", icon: Activity },
    { id: "deals" as TabType, label: "Related Deals", icon: DollarSign },
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
              onClick={() => router.push("/sales/accounts")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Accounts
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {account.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{account.accountName}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{account.industry}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    account.status
                  )}`}>
                    {account.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColors(
                    account.type
                  )}`}>
                    {account.type}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {account.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditAccount}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.location.href = `mailto:${account.email}`}
              >
                <Mail className="h-4 w-4" />
                Send Email
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
                <Mail className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{account.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{account.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                <a
                  href={`https://${account.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {account.website}
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-sm font-medium">{account.industry}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium">{account.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employees</p>
                <p className="text-sm font-medium">{new Intl.NumberFormat("en-US").format(account.employees)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                    account.status
                  )}`}
                >
                  {account.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm font-medium">{account.owner}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{account.created}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Communication Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Emails</p>
                <p className="text-sm font-medium">{communicationStats.emails}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calls</p>
                <p className="text-sm font-medium">{communicationStats.calls}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Meetings</p>
                <p className="text-sm font-medium">{communicationStats.meetings}</p>
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
                        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Account Name</p>
                            <p className="text-base font-medium">{account.accountName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Industry</p>
                            <p className="text-base font-medium">{account.industry}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Type</p>
                            <p className="text-base font-medium">{account.type}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Employees</p>
                            <p className="text-base font-medium">{new Intl.NumberFormat("en-US").format(account.employees)}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Email</p>
                            <p className="text-base font-medium">{account.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Phone</p>
                            <p className="text-base font-medium">{account.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Website</p>
                            <a
                              href={`https://${account.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-medium text-primary hover:underline"
                            >
                              {account.website}
                            </a>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Location</p>
                            <p className="text-base font-medium">
                              {account.city}, {account.state}, {account.country}
                            </p>
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
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === "deals" && (
                  <motion.div
                    key="deals"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {mockDeals.length > 0 ? (
                      mockDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-medium">{deal.name}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                deal.stage === "Proposal" || deal.stage === "Negotiation"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {deal.stage}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{deal.value}</span>
                              <span>•</span>
                              <span>{deal.probability}% probability</span>
                              <span>•</span>
                              <span>Close: {deal.closeDate}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-3" />
                        <p>No related deals found</p>
                      </div>
                    )}
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
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Add Note</label>
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter your note here..."
                        className="w-full min-h-[100px] p-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground">Previous Notes</h3>
                      {mockNotes.map((note) => (
                        <div key={note.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                          <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                            {note.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{note.author}</span>
                            <span>{note.date} at {note.time}</span>
                          </div>
                        </div>
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.location.href = `mailto:${account.email}`}>
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.location.href = `tel:${account.phone}`}>
                  <Phone className="h-4 w-4" />
                  Make Call
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Schedule meeting")}>
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Account Score Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Account Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-full h-8 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scorePercentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-brand-teal to-brand-purple"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {scorePercentage}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Based on engagement and interactions
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Related Accounts */}
            {relatedAccounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    From {account.industry} industry
                  </p>
                  {relatedAccounts.map((relatedAccount) => (
                    <Link
                      key={relatedAccount.id}
                      href={`/sales/accounts/${relatedAccount.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                        {relatedAccount.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {relatedAccount.accountName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {relatedAccount.industry}
                        </p>
                      </div>
                    </Link>
                  ))}
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
        title="Delete Account"
        description="Are you sure you want to delete this account? This will permanently remove it from your CRM and cannot be undone."
        itemName={account.accountName}
        itemType="Account"
        icon={Building2}
        isDeleting={isDeleting}
      />

      {/* Account Form Drawer */}
      <AccountFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingAccount}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
