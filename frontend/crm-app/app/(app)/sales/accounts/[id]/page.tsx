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
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { AccountFormDrawer } from "@/components/Forms/Sales";
import type { Account as AccountType } from "@/lib/types";
import { useAccount, useUpdateAccount, useDeleteAccount, useAccounts } from "@/lib/queries/useAccounts";
import { companiesApi, getSizeDisplayLabel } from "@/lib/api/companies";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";

// Format date helper
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format currency
const formatCurrency = (value: number | undefined) => {
  if (!value) return "$0";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

// Get size/type colors
const getSizeColors = (size: string) => {
  const colors: Record<string, string> = {
    "1": "bg-muted text-muted-foreground",
    "2-10": "bg-muted text-muted-foreground",
    "11-50": "bg-accent/10 text-accent",
    "51-200": "bg-secondary/10 text-secondary",
    "201-500": "bg-secondary/10 text-secondary",
    "501-1000": "bg-primary/10 text-primary",
    "1000+": "bg-primary/10 text-primary",
  };
  return colors[size] || "bg-muted text-muted-foreground";
};

// Mock data for activities (TODO: Replace with real API when available)
const mockActivities = [
  {
    id: "1",
    type: "email",
    title: "Follow-up email sent",
    description: "Sent proposal for Q1 2026 partnership",
    date: "Jan 28, 2026",
    time: "2:30 PM",
    icon: Mail,
  },
  {
    id: "2",
    type: "call",
    title: "Discovery call completed",
    description: "Discussed requirements and timeline",
    date: "Jan 25, 2026",
    time: "10:15 AM",
    icon: Phone,
  },
  {
    id: "3",
    type: "meeting",
    title: "Product demo scheduled",
    description: "Scheduled for Feb 5, 2026 at 3:00 PM",
    date: "Jan 24, 2026",
    time: "4:45 PM",
    icon: Calendar,
  },
];

// Mock deals (TODO: Replace with real API - GET /deals?company_id={id})
const mockDeals = [
  {
    id: "1",
    name: "Enterprise Partnership Q1",
    value: "$125,000",
    stage: "Proposal",
    probability: 75,
    closeDate: "Feb 15, 2026",
  },
  {
    id: "2",
    name: "Annual License Renewal",
    value: "$45,000",
    stage: "Negotiation",
    probability: 60,
    closeDate: "Mar 1, 2026",
  },
];

// Mock notes (TODO: Replace with real API when available)
const mockNotes = [
  {
    id: "1",
    content: "Account is very interested in our enterprise solutions. Follow up next week.",
    author: "John Doe",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: "2",
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
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<AccountType> | null>(null);

  // Fetch account from API
  const { data: account, isLoading, error } = useAccount(id);
  const deleteAccountMutation = useDeleteAccount();
  const updateAccountMutation = useUpdateAccount();

  // Fetch related accounts from same industry
  const { data: relatedAccountsResponse } = useAccounts(
    {
      industry: account?.industry,
      page_size: 5,
    },
    { enabled: !!account?.industry }
  );

  // Filter out current account from related accounts
  const relatedAccounts = useMemo(() => {
    if (!account || !relatedAccountsResponse?.data) return [];
    return relatedAccountsResponse.data.filter((a) => a.id !== account.id).slice(0, 4);
  }, [account, relatedAccountsResponse?.data]);

  // Calculate communication stats (mock for now)
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

    try {
      await deleteAccountMutation.mutateAsync(account.id);
      toast.success("Account deleted successfully");
      router.push("/sales/accounts");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  // Form handlers
  const handleEditAccount = async () => {
    if (!account) return;

    try {
      // Fetch full account details to get all fields
      const fullAccount = await companiesApi.getById(account.id);

      setEditingAccount({
        accountName: fullAccount.accountName,
        website: fullAccount.website,
        phone: fullAccount.phone,
        email: fullAccount.email,
        industry: fullAccount.industry,
        type: fullAccount.type as "1" | "2-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+",
        employees: fullAccount.employees,
        annualRevenue: fullAccount.annualRevenue,
        // Address fields
        addressLine1: fullAccount.addressLine1 || "",
        addressLine2: fullAccount.addressLine2 || "",
        city: fullAccount.city,
        state: fullAccount.state,
        postalCode: fullAccount.postalCode || "",
        country: fullAccount.country,
        // Business info
        description: fullAccount.description || "",
        // Social URLs
        linkedinUrl: fullAccount.linkedinUrl || "",
        twitterUrl: fullAccount.twitterUrl || "",
        facebookUrl: fullAccount.facebookUrl || "",
        // Tags
        tagIds: fullAccount.tagIds || [],
      });
      setFormDrawerOpen(true);
    } catch (error) {
      console.error("Error fetching account details:", error);
      toast.error("Failed to load account details");
    }
  };

  const handleFormSubmit = async (data: Partial<AccountType>) => {
    if (!account) return;

    try {
      const accountData = {
        accountName: data.accountName || "",
        industry: data.industry || "",
        type: data.type || "",
        website: data.website || "",
        phone: data.phone || "",
        email: data.email || "",
        // Address fields
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        city: data.city || "",
        state: data.state || "",
        postalCode: data.postalCode || "",
        country: data.country || "",
        // Business fields
        employees: typeof data.employees === "number" ? data.employees : parseInt(String(data.employees) || "0"),
        annualRevenue: data.annualRevenue || 0,
        description: data.description || "",
        // Social URLs
        linkedinUrl: data.linkedinUrl || "",
        twitterUrl: data.twitterUrl || "",
        facebookUrl: data.facebookUrl || "",
        // Tags
        tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
      };

      await updateAccountMutation.mutateAsync({ id: account.id, data: accountData });
      toast.success("Account updated successfully");
      setFormDrawerOpen(false);
      setEditingAccount(null);
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Failed to update account");
      throw error;
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // TODO: Implement note creation via API
    console.log("Adding note:", newNote);
    toast.success("Note added");
    setNewNote("");
  };

  // Loading state
  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground">Error Loading Account</h2>
        <p className="text-muted-foreground">Failed to load account details. Please try again.</p>
        <Button onClick={() => router.push("/sales/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>
      </div>
    );
  }

  // If account not found
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Account Not Found</h2>
        <p className="text-muted-foreground">The account you&apos;re looking for doesn&apos;t exist.</p>
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

  // Build location string
  const locationParts = [account.city, account.state, account.country].filter(Boolean);
  const locationString = locationParts.join(", ") || "N/A";

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
                  <span className="text-lg text-muted-foreground">{account.industry || "No Industry"}</span>
                  {account.type && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSizeColors(account.type)}`}>
                      {getSizeDisplayLabel(account.type)}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">Created {formatDate(account.created)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditAccount}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {account.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.location.href = `mailto:${account.email}`}
                >
                  <Mail className="h-4 w-4" />
                  Send Email
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
                <Mail className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{account.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{account.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                {account.website ? (
                  <a
                    href={account.website.startsWith("http") ? account.website : `https://${account.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {account.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm font-medium">N/A</p>
                )}
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
                <p className="text-sm font-medium">{account.industry || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company Size</p>
                <p className="text-sm font-medium">{getSizeDisplayLabel(account.type) || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employees</p>
                <p className="text-sm font-medium">
                  {account.employees ? new Intl.NumberFormat("en-US").format(account.employees) : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Annual Revenue</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(account.annualRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Related Deals</p>
                <p className="text-sm font-medium">{account.dealCount || 0} deals</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contacts</p>
                <p className="text-sm font-medium">{account.contactCount || 0} contacts</p>
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
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
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
                        {/* Main Grid - Company & Business Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Company Information Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="text-base font-semibold">Company Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Company Name</span>
                                <span className="text-sm font-medium text-right">{account.accountName}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Industry</span>
                                <span className="text-sm font-medium">{account.industry || "-"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Company Size</span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                                  {getSizeDisplayLabel(account.type) || "-"}
                                </span>
                              </div>
                              {account.website && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">Website</span>
                                  <a
                                    href={account.website.startsWith("http") ? account.website : `https://${account.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-primary hover:underline text-right break-all"
                                  >
                                    {account.website}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Business Details Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-green-500/10 rounded-lg">
                                <DollarSign className="h-4 w-4 text-green-500" />
                              </div>
                              <h3 className="text-base font-semibold">Business Details</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Annual Revenue</span>
                                <span className="text-sm font-semibold text-green-600">
                                  {formatCurrency(account.annualRevenue)}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Employees</span>
                                <span className="text-sm font-medium">
                                  {account.employees ? new Intl.NumberFormat("en-US").format(account.employees) : "-"}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">{account.created}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contact & Address Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Contact Details Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Mail className="h-4 w-4 text-purple-500" />
                              </div>
                              <h3 className="text-base font-semibold">Contact Details</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground shrink-0">Email</span>
                                {account.email ? (
                                  <a href={`mailto:${account.email}`} className="text-sm font-medium text-primary hover:underline text-right break-all">
                                    {account.email}
                                  </a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Phone</span>
                                {account.phone ? (
                                  <a href={`tel:${account.phone}`} className="text-sm font-medium">{account.phone}</a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Address Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-orange-500/10 rounded-lg">
                                <MapPin className="h-4 w-4 text-orange-500" />
                              </div>
                              <h3 className="text-base font-semibold">Address</h3>
                            </div>
                            {(account.addressLine1 || account.city || account.country) ? (
                              <div className="text-sm space-y-1">
                                {account.addressLine1 && <p className="font-medium">{account.addressLine1}</p>}
                                {account.addressLine2 && <p className="text-muted-foreground">{account.addressLine2}</p>}
                                <p className="text-muted-foreground">
                                  {[account.city, account.state, account.postalCode].filter(Boolean).join(", ")}
                                </p>
                                {account.country && <p className="font-medium">{account.country}</p>}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No address information</p>
                            )}
                          </div>
                        </div>

                        {/* Social Profiles & Tags Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Social Profiles Card */}
                          {(account.linkedinUrl || account.twitterUrl || account.facebookUrl) && (
                            <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                  <Globe className="h-4 w-4 text-blue-500" />
                                </div>
                                <h3 className="text-base font-semibold">Social Profiles</h3>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {account.linkedinUrl && (
                                  <a
                                    href={account.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors text-sm font-medium"
                                  >
                                    <Linkedin className="h-4 w-4" />
                                    LinkedIn
                                  </a>
                                )}
                                {account.twitterUrl && (
                                  <a
                                    href={account.twitterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors text-sm font-medium"
                                  >
                                    <Twitter className="h-4 w-4" />
                                    Twitter
                                  </a>
                                )}
                                {account.facebookUrl && (
                                  <a
                                    href={account.facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors text-sm font-medium"
                                  >
                                    <Facebook className="h-4 w-4" />
                                    Facebook
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tags Card */}
                          {account.tags && account.tags.length > 0 && (
                            <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-violet-500/10 rounded-lg">
                                  <svg className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                </div>
                                <h3 className="text-base font-semibold">Tags</h3>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  {account.tags.length}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {account.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                                    style={{
                                      backgroundColor: tag.color ? `${tag.color}20` : 'hsl(var(--primary) / 0.1)',
                                      color: tag.color || 'hsl(var(--primary))',
                                    }}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: tag.color || 'hsl(var(--primary))' }}
                                    />
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Description Card */}
                        {account.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-gray-500/10 rounded-lg">
                                <FileText className="h-4 w-4 text-gray-500" />
                              </div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {account.description}
                            </p>
                          </div>
                        )}
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
                        {mockActivities.length > 0 ? (
                          mockActivities.map((activity, index) => {
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
                          })
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-3" />
                            <p>No activities recorded yet</p>
                          </div>
                        )}
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
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      deal.stage === "Proposal" || deal.stage === "Negotiation"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
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
                            className="w-full min-h-[100px] p-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
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
                          {mockNotes.length > 0 ? (
                            mockNotes.map((note) => (
                              <div key={note.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                                <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{note.content}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{note.author}</span>
                                  <span>
                                    {note.date} at {note.time}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <p>No notes yet</p>
                            </div>
                          )}
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
                {account.email && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={() => window.location.href = `mailto:${account.email}`}
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                )}
                {account.phone && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={() => window.location.href = `tel:${account.phone}`}
                  >
                    <Phone className="h-4 w-4" />
                    Make Call
                  </Button>
                )}
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => toast.info("Schedule meeting feature coming soon")}
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Location Card */}
            {locationString !== "N/A" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{locationString}</p>
                  {account.addressLine1 && (
                    <p className="text-sm text-muted-foreground mt-1">{account.addressLine1}</p>
                  )}
                  {account.addressLine2 && (
                    <p className="text-sm text-muted-foreground">{account.addressLine2}</p>
                  )}
                  {account.postalCode && (
                    <p className="text-sm text-muted-foreground">{account.postalCode}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Related Accounts */}
            {relatedAccounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-2">From {account.industry} industry</p>
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
                        <p className="text-xs text-muted-foreground truncate">{relatedAccount.industry}</p>
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
        isDeleting={deleteAccountMutation.isPending}
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
        defaultView="detailed"
      />
    </div>
  );
}
