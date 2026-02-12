"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Share2,
  FileText,
  Eye,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Plus,
  Activity,
  AlertCircle,
  File,
  Sheet,
  Image,
  Printer,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { DocumentFormDrawer, type Document as DocumentType } from "@/components/Forms/Sales";

// Document data structure (matching documents list page)
type Document = {
  id: number;
  name: string;
  type: string;
  category: string;
  size: string;
  owner: string;
  relatedTo: string;
  created: string;
  modified: string;
  status: string;
  icon: typeof FileText;
  views?: number;
  downloads?: number;
};

// Mock documents data (expanded from list page)
const documents: Document[] = [
  {
    id: 1,
    name: "Q1 Sales Proposal - Acme Corp.pdf",
    type: "PDF",
    category: "Proposal",
    size: "2.4 MB",
    owner: "John Smith",
    relatedTo: "Acme Corporation",
    created: "Jan 20, 2026",
    modified: "Jan 25, 2026",
    status: "Final",
    icon: FileText,
    views: 24,
    downloads: 8,
  },
  {
    id: 2,
    name: "Contract Agreement - TechVision.docx",
    type: "Word",
    category: "Contract",
    size: "1.2 MB",
    owner: "Jane Doe",
    relatedTo: "TechVision Inc",
    created: "Jan 18, 2026",
    modified: "Jan 27, 2026",
    status: "Draft",
    icon: FileText,
    views: 12,
    downloads: 3,
  },
  {
    id: 3,
    name: "Product Catalog 2026.pdf",
    type: "PDF",
    category: "Marketing",
    size: "8.5 MB",
    owner: "Mike Johnson",
    relatedTo: "General",
    created: "Jan 1, 2026",
    modified: "Jan 15, 2026",
    status: "Final",
    icon: FileText,
    views: 156,
    downloads: 42,
  },
  {
    id: 4,
    name: "Pricing Sheet - Enterprise.xlsx",
    type: "Excel",
    category: "Pricing",
    size: "456 KB",
    owner: "Sarah Brown",
    relatedTo: "Global Solutions Ltd",
    created: "Jan 22, 2026",
    modified: "Jan 28, 2026",
    status: "Final",
    icon: Sheet,
    views: 38,
    downloads: 15,
  },
  {
    id: 5,
    name: "Meeting Notes - NextGen Systems.docx",
    type: "Word",
    category: "Notes",
    size: "89 KB",
    owner: "John Smith",
    relatedTo: "NextGen Systems",
    created: "Jan 25, 2026",
    modified: "Jan 26, 2026",
    status: "Draft",
    icon: FileText,
    views: 8,
    downloads: 2,
  },
  {
    id: 6,
    name: "Company Logo - High Res.png",
    type: "Image",
    category: "Marketing",
    size: "3.2 MB",
    owner: "Jane Doe",
    relatedTo: "General",
    created: "Dec 10, 2025",
    modified: "Dec 10, 2025",
    status: "Final",
    icon: Image,
    views: 67,
    downloads: 28,
  },
  {
    id: 7,
    name: "Service Level Agreement.pdf",
    type: "PDF",
    category: "Contract",
    size: "1.8 MB",
    owner: "Mike Johnson",
    relatedTo: "CloudFirst Inc",
    created: "Jan 12, 2026",
    modified: "Jan 20, 2026",
    status: "Final",
    icon: FileText,
    views: 19,
    downloads: 7,
  },
  {
    id: 8,
    name: "ROI Analysis Report.xlsx",
    type: "Excel",
    category: "Report",
    size: "2.1 MB",
    owner: "Sarah Brown",
    relatedTo: "Prime Industries",
    created: "Jan 15, 2026",
    modified: "Jan 24, 2026",
    status: "Final",
    icon: Sheet,
    views: 31,
    downloads: 12,
  },
];

// Mock activity data
const mockActivities = [
  {
    id: 1,
    type: "view",
    title: "Document viewed",
    description: "Viewed by Sarah Johnson",
    date: "Jan 28, 2026",
    time: "2:30 PM",
    icon: Eye,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: 2,
    type: "download",
    title: "Document downloaded",
    description: "Downloaded by Mike Chen",
    date: "Jan 27, 2026",
    time: "10:15 AM",
    icon: Download,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: 3,
    type: "share",
    title: "Document shared",
    description: "Shared with Acme Corporation team",
    date: "Jan 25, 2026",
    time: "4:45 PM",
    icon: Share2,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: 4,
    type: "edit",
    title: "Document updated",
    description: "Updated by John Smith",
    date: "Jan 24, 2026",
    time: "11:20 AM",
    icon: Edit,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
];

// Mock notes data
const mockNotes = [
  {
    id: 1,
    content: "This proposal was well-received by the client. Follow up next week to discuss next steps.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Updated pricing section based on client feedback. Ready for final review.",
    author: "Jane Doe",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
];

// Mock related deals
const mockRelatedDeals = [
  {
    id: 1,
    name: "Enterprise Partnership Q1",
    value: "$125,000",
    stage: "Proposal",
  },
  {
    id: 2,
    name: "Annual License Renewal",
    value: "$45,000",
    stage: "Negotiation",
  },
];

// Mock related contacts
const mockRelatedContacts = [
  {
    id: 1,
    name: "Sarah Williams",
    company: "Acme Corporation",
    jobTitle: "VP Sales",
  },
  {
    id: 2,
    name: "David Brown",
    company: "Acme Corporation",
    jobTitle: "Sales Manager",
  },
];

type TabType = "details" | "preview" | "activity" | "notes";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Partial<DocumentType> | null>(null);

  // Find document by ID
  const document = useMemo(() => {
    const docId = parseInt(id);
    return documents.find((d) => d.id === docId);
  }, [id]);

  // Get status colors
  const getStatusColors = (status: string) => {
    const colors = {
      Final: "bg-primary/10 text-primary",
      Draft: "bg-accent/10 text-accent",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Get category colors
  const getCategoryColors = (category: string) => {
    const colors = {
      Proposal: "bg-primary/10 text-primary",
      Contract: "bg-secondary/10 text-secondary",
      Marketing: "bg-accent/10 text-accent",
      Pricing: "bg-primary/20 text-primary",
      Report: "bg-secondary/20 text-secondary",
      Notes: "bg-muted text-muted-foreground",
    };
    return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!document) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted document:", document.name);
      router.push("/sales/documents");
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  // Form handlers
  const handleEditDocument = () => {
    if (!document) return;
    
    setEditingDocument({
      name: document.name,
      type: document.type as any,
      category: document.category as any,
      status: document.status as any,
      relatedTo: document.relatedTo,
      assignedTo: document.owner,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<DocumentType>) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Updating document:", data);
      setFormDrawerOpen(false);
      setEditingDocument(null);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  // If document not found
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Document Not Found</h2>
        <p className="text-gray-600">The document you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/sales/documents")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
      </div>
    );
  }

  const IconComponent = document.icon;

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "preview" as TabType, label: "Preview", icon: Eye },
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
              onClick={() => router.push("/sales/documents")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Documents
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center shadow-lg">
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{document.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColors(
                    document.category
                  )}`}>
                    {document.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    document.status
                  )}`}>
                    {document.status}
                  </span>
                  <span className="text-sm text-muted-foreground">{document.type}</span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{document.size}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Download", document.id)}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Share", document.id)}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditDocument}>
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
                <File className="h-4 w-4" />
                File Size
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm font-medium">{document.size}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium">{document.type}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{document.created}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm font-medium">{document.owner}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Modified
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Modified</p>
                <p className="text-sm font-medium">{document.modified}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                    document.status
                  )}`}
                >
                  {document.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Views & Downloads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Views</p>
                <p className="text-sm font-medium">{document.views || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Downloads</p>
                <p className="text-sm font-medium">{document.downloads || 0}</p>
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
                            <h3 className="text-lg font-semibold mb-4">Document Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Document Name</p>
                                <p className="text-base font-medium">{document.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Category</p>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColors(
                                    document.category
                                  )}`}
                                >
                                  {document.category}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Type</p>
                                <p className="text-base font-medium">{document.type}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Size</p>
                                <p className="text-base font-medium">{document.size}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Metadata</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                    document.status
                                  )}`}
                                >
                                  {document.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                                <p className="text-base font-medium">{document.owner}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Created Date</p>
                                <p className="text-base font-medium">{document.created}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Last Modified</p>
                                <p className="text-base font-medium">{document.modified}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "preview" && (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg bg-muted/20">
                          <IconComponent className="h-16 w-16 text-muted-foreground mb-4" />
                          <p className="text-lg font-semibold text-foreground mb-2">Document Preview</p>
                          <p className="text-sm text-muted-foreground text-center max-w-md">
                            Document preview will be displayed here. This feature allows you to view the document content without downloading it.
                          </p>
                          <Button className="mt-4" variant="outline" onClick={() => console.log("Open preview")}>
                            <Eye className="h-4 w-4 mr-2" />
                            Open Full Preview
                          </Button>
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
                          <Textarea
                            placeholder="Enter your note here..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={4}
                            className="resize-none"
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
                            <Card key={note.id} className="border border-border">
                              <CardContent className="p-4">
                                <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                                  {note.content}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{note.author}</span>
                                  <span>{note.date} at {note.time}</span>
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Download", document.id)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Share", document.id)}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Print", document.id)}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </CardContent>
            </Card>

            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Related To</p>
                  <p className="text-sm font-medium">{document.relatedTo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getCategoryColors(
                      document.category
                    )}`}
                  >
                    {document.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">File Type</p>
                  <p className="text-sm font-medium">{document.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">File Size</p>
                  <p className="text-sm font-medium">{document.size}</p>
                </div>
              </CardContent>
            </Card>

            {/* Related Items */}
            {(mockRelatedDeals.length > 0 || mockRelatedContacts.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockRelatedDeals.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Related Deals
                      </p>
                      <div className="space-y-2">
                        {mockRelatedDeals.map((deal) => (
                          <Link
                            key={deal.id}
                            href={`/sales/deals/${deal.id}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {deal.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{deal.value}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {mockRelatedContacts.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Related Contacts
                      </p>
                      <div className="space-y-2">
                        {mockRelatedContacts.map((contact) => (
                          <Link
                            key={contact.id}
                            href={`/sales/contacts/${contact.id}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {contact.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{contact.jobTitle}</p>
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
        title="Delete Document"
        description="Are you sure you want to delete this document? This will permanently remove it from your CRM and cannot be undone."
        itemName={document.name}
        itemType="Document"
        icon={FileText}
        isDeleting={isDeleting}
      />

      {/* Document Form Drawer */}
      <DocumentFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingDocument(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDocument}
        mode="edit"
        defaultView="detailed"
      />
    </div>
  );
}
