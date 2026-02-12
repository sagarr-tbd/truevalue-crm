"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Mail,
  Trash2,
  Phone,
  Calendar,
  User,
  TrendingUp,
  Clock,
  FileText,
  DollarSign,
  MessageSquare,
  Plus,
  AlertCircle,
  Activity,
  Users,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { DealFormDrawer, type Deal as DealType } from "@/components/Forms/Sales";

// Deal data structure (matching deals list page)
type Deal = {
  id: number;
  dealName: string;
  company: string;
  contactName: string;
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
  created: string;
  initials: string;
};

// Mock deals data (same structure as deals list page)
const deals: Deal[] = [
  {
    id: 1,
    dealName: "Enterprise CRM Package",
    company: "Acme Corporation",
    contactName: "Sarah Williams",
    amount: 125000,
    stage: "Negotiation",
    probability: 80,
    closeDate: "Feb 15, 2026",
    owner: "John Smith",
    created: "Dec 10, 2025",
    initials: "AC",
  },
  {
    id: 2,
    dealName: "Marketing Automation Suite",
    company: "CloudNine Solutions",
    contactName: "Robert Chen",
    amount: 85000,
    stage: "Proposal",
    probability: 60,
    closeDate: "Feb 28, 2026",
    owner: "Jane Doe",
    created: "Dec 15, 2025",
    initials: "CS",
  },
  {
    id: 3,
    dealName: "Sales Analytics Platform",
    company: "TechStart Inc",
    contactName: "Jessica Lee",
    amount: 45000,
    stage: "Qualification",
    probability: 40,
    closeDate: "Mar 10, 2026",
    owner: "Mike Johnson",
    created: "Dec 18, 2025",
    initials: "TS",
  },
  {
    id: 4,
    dealName: "Customer Support System",
    company: "GlobalTech Systems",
    contactName: "Emma Johnson",
    amount: 95000,
    stage: "Prospecting",
    probability: 20,
    closeDate: "Mar 25, 2026",
    owner: "Sarah Brown",
    created: "Dec 20, 2025",
    initials: "GT",
  },
  {
    id: 5,
    dealName: "API Integration Package",
    company: "Innovate Labs",
    contactName: "Michael Chen",
    amount: 35000,
    stage: "Closed Won",
    probability: 100,
    closeDate: "Jan 15, 2026",
    owner: "John Smith",
    created: "Nov 28, 2025",
    initials: "IL",
  },
  {
    id: 6,
    dealName: "Mobile App Development",
    company: "Nexus Solutions",
    contactName: "Sophie Martinez",
    amount: 150000,
    stage: "Negotiation",
    probability: 75,
    closeDate: "Feb 20, 2026",
    owner: "Jane Doe",
    created: "Dec 5, 2025",
    initials: "NS",
  },
  {
    id: 7,
    dealName: "Data Warehouse Solution",
    company: "Zenith Corp",
    contactName: "James Wilson",
    amount: 200000,
    stage: "Proposal",
    probability: 55,
    closeDate: "Mar 5, 2026",
    owner: "Mike Johnson",
    created: "Dec 12, 2025",
    initials: "ZC",
  },
  {
    id: 8,
    dealName: "Security Audit Service",
    company: "DataFlow Inc",
    contactName: "Lisa Anderson",
    amount: 25000,
    stage: "Closed Lost",
    probability: 0,
    closeDate: "Jan 10, 2026",
    owner: "Sarah Brown",
    created: "Nov 15, 2025",
    initials: "DF",
  },
  {
    id: 9,
    dealName: "Training & Onboarding",
    company: "Swift Solutions",
    contactName: "David Park",
    amount: 15000,
    stage: "Closed Won",
    probability: 100,
    closeDate: "Jan 20, 2026",
    owner: "John Smith",
    created: "Dec 1, 2025",
    initials: "SS",
  },
  {
    id: 10,
    dealName: "Cloud Infrastructure Setup",
    company: "FutureTech Co",
    contactName: "Rachel Green",
    amount: 180000,
    stage: "Qualification",
    probability: 45,
    closeDate: "Mar 15, 2026",
    owner: "Jane Doe",
    created: "Dec 22, 2025",
    initials: "FT",
  },
];

// Mock activity data
const mockActivities = [
  {
    id: 1,
    type: "email",
    title: "Proposal sent to client",
    description: "Sent detailed proposal document for Enterprise CRM Package",
    date: "Jan 28, 2026",
    time: "2:30 PM",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: 2,
    type: "call",
    title: "Negotiation call completed",
    description: "Discussed pricing and contract terms. Client requested minor adjustments.",
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
    description: "Scheduled for Feb 5, 2026 at 3:00 PM with technical team",
    date: "Jan 24, 2026",
    time: "4:45 PM",
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: 4,
    type: "note",
    title: "Internal note added",
    description: "Client showed strong interest. Budget approved. Decision expected by Feb 10.",
    date: "Jan 22, 2026",
    time: "11:20 AM",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
];

// Mock related contacts
const mockContacts = [
  {
    id: 1,
    name: "Sarah Williams",
    email: "sarah.williams@acme.com",
    phone: "+1-555-100-1001",
    jobTitle: "VP Sales",
    initials: "SW",
  },
  {
    id: 2,
    name: "David Brown",
    email: "david.brown@acme.com",
    phone: "+1-555-100-1002",
    jobTitle: "Sales Manager",
    initials: "DB",
  },
];

// Mock notes
const mockNotes = [
  {
    id: 1,
    content: "Deal is progressing well. Client has approved budget and is reviewing contract terms. Expected to close by Feb 15.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Discussed implementation timeline and support options. Client requested additional training sessions included in the package.",
    author: "John Smith",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
];

type TabType = "details" | "activity" | "contacts" | "notes";

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Partial<DealType> | null>(null);

  // Find deal by ID
  const deal = useMemo(() => {
    const dealId = parseInt(id);
    return deals.find((d) => d.id === dealId);
  }, [id]);

  // Calculate expected revenue (amount * probability / 100)
  const expectedRevenue = useMemo(() => {
    if (!deal) return 0;
    return Math.round((deal.amount * deal.probability) / 100);
  }, [deal]);

  // Calculate days in pipeline
  const daysInPipeline = useMemo(() => {
    if (!deal) return 0;
    const createdDate = new Date(deal.created);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [deal]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deal) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted deal:", deal.dealName);
      router.push("/sales/deals");
    } catch (error) {
      console.error("Error deleting deal:", error);
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

  // Form handlers
  const handleEditDeal = () => {
    if (!deal) return;
    
    setEditingDeal({
      dealName: deal.dealName,
      amount: deal.amount,
      stage: deal.stage as any,
      probability: deal.probability,
      closeDate: deal.closeDate,
      accountId: deal.company,
      contactId: deal.contactName,
      assignedTo: deal.owner,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<DealType>) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Updating deal:", data);
      // Toast is shown by FormDrawer component

      setFormDrawerOpen(false);
      setEditingDeal(null);
    } catch (error) {
      console.error("Error updating deal:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Stage badge colors (matching deals list page)
  const getStageColors = (stage: string) => {
    const colors = {
      Prospecting: "bg-muted text-muted-foreground",
      Qualification: "bg-secondary/10 text-secondary",
      Proposal: "bg-accent/10 text-accent",
      Negotiation: "bg-primary/10 text-primary",
      "Closed Won": "bg-primary/20 text-primary",
      "Closed Lost": "bg-destructive/10 text-destructive",
    };
    return colors[stage as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Deal score based on probability
  const dealScore = deal?.probability || 0;

  // If deal not found
  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Deal Not Found</h2>
        <p className="text-gray-600">The deal you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/sales/deals")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deals
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "activity" as TabType, label: "Activity", icon: Activity },
    { id: "contacts" as TabType, label: "Related Contacts", icon: Users },
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
              onClick={() => router.push("/sales/deals")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Deals
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {deal.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{deal.dealName}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{deal.company}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColors(
                    deal.stage
                  )}`}>
                    {deal.stage}
                  </span>
                  <span className="text-lg font-semibold text-foreground font-tabular">
                    ${deal.amount.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {deal.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditDeal}>
                <Edit className="h-4 w-4" />
                Edit
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
                <DollarSign className="h-4 w-4" />
                Expected Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  ${expectedRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {deal.probability}% of ${deal.amount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Probability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {deal.probability}%
                </p>
                <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${deal.probability}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-brand-teal to-brand-purple rounded-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Close Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{deal.closeDate}</p>
                <p className="text-xs text-muted-foreground">
                  {daysInPipeline} days in pipeline
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Days in Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {daysInPipeline}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {deal.created}
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
                            <h3 className="text-lg font-semibold mb-4">Deal Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Deal Name</p>
                                <p className="text-base font-medium">{deal.dealName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Company</p>
                                <p className="text-base font-medium">{deal.company}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Contact Name</p>
                                <p className="text-base font-medium">{deal.contactName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Deal Value</p>
                                <p className="text-base font-medium font-tabular">
                                  ${deal.amount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Pipeline Details</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Stage</p>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColors(
                                    deal.stage
                                  )}`}
                                >
                                  {deal.stage}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Probability</p>
                                <p className="text-base font-medium">{deal.probability}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Close Date</p>
                                <p className="text-base font-medium">{deal.closeDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                                <p className="text-base font-medium">{deal.owner}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Created</p>
                                <p className="text-base font-medium">{deal.created}</p>
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

                    {activeTab === "contacts" && (
                      <motion.div
                        key="contacts"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockContacts.length > 0 ? (
                          mockContacts.map((contact) => (
                            <Card key={contact.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                      {contact.initials}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-sm font-semibold text-gray-900">
                                        {contact.name}
                                      </h4>
                                      <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2 text-sm">
                                          <Mail className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-900">{contact.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <Phone className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-600">{contact.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <User className="h-4 w-4 text-gray-400" />
                                          <span className="text-gray-600">{contact.jobTitle}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/sales/contacts/${contact.id}`)}
                                  >
                                    View
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No related contacts found</p>
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
                        <div className="border border-border rounded-lg p-4 bg-gray-50">
                          <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note about this deal..."
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Send email")}>
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Log call")}>
                  <Phone className="h-4 w-4" />
                  Log Call
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Schedule meeting")}>
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Deal Score Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Deal Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-full h-8 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dealScore}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-brand-teal to-brand-purple"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {dealScore}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Based on probability and stage
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Review contract terms</p>
                      <p className="text-xs text-muted-foreground mt-1">Due: Feb 8, 2026</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Finalize pricing agreement</p>
                      <p className="text-xs text-muted-foreground mt-1">Due: Feb 12, 2026</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Close deal</p>
                      <p className="text-xs text-muted-foreground mt-1">Target: {deal.closeDate}</p>
                    </div>
                  </div>
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
        title="Delete Deal"
        description="Are you sure you want to delete this deal? This will permanently remove it from your CRM and cannot be undone."
        itemName={deal.dealName}
        itemType="Deal"
        icon={DollarSign}
        isDeleting={isDeleting}
      />

      {/* Deal Form Drawer */}
      <DealFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingDeal(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDeal}
        mode="edit"
        defaultView="detailed"
      />
    </div>
  );
}
