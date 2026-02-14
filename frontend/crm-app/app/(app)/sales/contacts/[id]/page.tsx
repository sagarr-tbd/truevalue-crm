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
  TrendingUp,
  FileText,
  DollarSign,
  MessageSquare,
  Plus,
  AlertCircle,
  Activity,
  Users,
  Target,
  Merge,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { ContactFormDrawer, type Contact as ContactType } from "@/components/Forms/Sales";
import { useContact, useDeleteContact, useUpdateContact, useContacts, useCheckDuplicates, useMergeContacts, useRemoveContactCompany, type ContactFormData } from "@/lib/queries/useContacts";
import { useDeals } from "@/lib/queries/useDeals";
import { MergeContactModal } from "@/components/MergeContactModal";
import { useContactTimeline, useCreateActivity } from "@/lib/queries/useActivities";
import LinkCompanyModal from "@/components/LinkCompanyModal/LinkCompanyModal";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { THEME_COLORS, getStatusColor, getDealStageColor } from "@/lib/utils";

// Activity type icon mapping
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'email': return Mail;
    case 'call': return Phone;
    case 'meeting': return Calendar;
    case 'task': return FileText;
    case 'note': return MessageSquare;
    default: return Activity;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'email': return { color: THEME_COLORS.info.text, bg: THEME_COLORS.info.bg };
    case 'call': return { color: THEME_COLORS.success.text, bg: THEME_COLORS.success.bg };
    case 'meeting': return { color: 'text-brand-purple', bg: 'bg-brand-purple/10' };
    case 'task': return { color: THEME_COLORS.warning.text, bg: THEME_COLORS.warning.bg };
    case 'note': return { color: THEME_COLORS.neutral.text, bg: THEME_COLORS.neutral.bg };
    default: return { color: 'text-primary', bg: 'bg-primary/10' };
  }
};

const formatActivityDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatActivityTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Deals are fetched via useDeals hook with contact_id filter

type TabType = "details" | "activity" | "deals" | "notes";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<ContactType> | null>(null);

  // Merge state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [duplicatesToMerge, setDuplicatesToMerge] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(null);

  // Link company state
  const [showLinkCompanyModal, setShowLinkCompanyModal] = useState(false);

  // Fetch contact from API
  const { data: contact, isLoading, error } = useContact(id);
  const deleteContactMutation = useDeleteContact();
  const updateContactMutation = useUpdateContact();
  const checkDuplicates = useCheckDuplicates();
  const mergeContacts = useMergeContacts();
  const removeCompany = useRemoveContactCompany();

  // Fetch related contacts from same company (only when contact has a company)
  const { data: relatedContactsResponse } = useContacts(
    {
      company_id: contact?.primaryCompanyId,
      page_size: 10,
    },
    { enabled: !!contact?.primaryCompanyId }
  );
  
  // Fetch contact timeline (activities)
  const { data: activities = [], isLoading: isLoadingActivities } = useContactTimeline(id);
  const createActivity = useCreateActivity();

  // Fetch deals linked to this contact
  const { data: linkedDealsResponse } = useDeals({
    contact_id: id,
    page_size: 50,
  });
  const linkedDeals = linkedDealsResponse?.data ?? [];

  // Filter out current contact from related contacts
  const relatedContacts = useMemo(() => {
    if (!contact || !relatedContactsResponse?.data) return [];
    return relatedContactsResponse.data.filter((c) => c.id !== contact.id);
  }, [contact, relatedContactsResponse?.data]);

  // Calculate communication stats from real activities
  const communicationStats = useMemo(() => {
    const emails = activities.filter((a) => a.type === "email").length;
    const calls = activities.filter((a) => a.type === "call").length;
    const meetings = activities.filter((a) => a.type === "meeting").length;
    return { emails, calls, meetings };
  }, [activities]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contact) return;

    try {
      await deleteContactMutation.mutateAsync(contact.id);
      router.push("/sales/contacts");
    } catch (error) {
      console.error("Error deleting contact:", error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !contact) return;
    
    try {
      await createActivity.mutateAsync({
        activityType: 'note',
        subject: 'Note added',
        description: newNote,
        contactId: contact.id,
      });
      setNewNote("");
      toast.success("Note added successfully");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  // Form handlers
  const handleEditContact = () => {
    if (!contact) return;
    
    const nameParts = contact.name.split(" ");
    // Populate form with ALL available contact data from API
    setEditingContact({
      // Name
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      // Contact info
      email: contact.email,
      secondaryEmail: contact.secondaryEmail,
      phone: contact.phone !== "-" ? contact.phone : undefined,
      mobile: contact.mobile !== "-" ? contact.mobile : undefined,
      // Job info
      title: contact.jobTitle,
      department: contact.department,
      primaryCompanyId: contact.primaryCompanyId,
      ownerId: contact.ownerId,
      // Address
      addressLine1: contact.addressLine1,
      addressLine2: contact.addressLine2,
      city: contact.city,
      state: contact.state,
      postalCode: contact.postalCode,
      country: contact.country,
      // Profile
      description: contact.description,
      avatarUrl: contact.avatarUrl,
      // Social
      linkedinUrl: contact.linkedinUrl,
      twitterUrl: contact.twitterUrl,
      // Status & Source
      status: contact.status,
      source: contact.source,
      sourceDetail: contact.sourceDetail,
      // Communication preferences
      doNotCall: contact.doNotCall,
      doNotEmail: contact.doNotEmail,
      // Tags
      tagIds: contact.tagIds,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<ContactType>) => {
    if (!contact) return;
    
    try {
      // Build update data with all form fields
      const updateData: ContactFormData = {
        // Name fields
        firstName: data.firstName,
        lastName: data.lastName,
        // Contact info
        email: data.email,
        secondaryEmail: data.secondaryEmail,
        phone: data.phone,
        mobile: data.mobile,
        // Job info
        title: data.title,
        department: data.department,
        primaryCompanyId: data.primaryCompanyId,
        ownerId: data.ownerId,
        // Address
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        // Profile
        description: data.description,
        avatarUrl: data.avatarUrl,
        // Social
        linkedinUrl: data.linkedinUrl,
        twitterUrl: data.twitterUrl,
        // Status & Source
        status: data.status,
        source: data.source,
        sourceDetail: data.sourceDetail,
        // Communication preferences
        doNotCall: data.doNotCall,
        doNotEmail: data.doNotEmail,
        // Tags
        tagIds: data.tagIds,
      };
      
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: updateData,
      });
      
      setFormDrawerOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error("Error updating contact:", error);
      throw error; // Let FormDrawer handle the error toast
    }
  };

  // Find duplicates handler
  const handleFindDuplicates = async () => {
    if (!contact) return;

    try {
      const result = await checkDuplicates.mutateAsync({
        email: contact.email,
        phone: contact.phone,
        name: contact.name,
      });

      if (result.has_duplicates) {
        // Filter out the current contact from duplicates
        const otherDuplicates = result.duplicates.filter(d => d.id !== contact.id);
        
        if (otherDuplicates.length > 0) {
          setDuplicatesToMerge(otherDuplicates);
          setSelectedDuplicateId(otherDuplicates[0].id);
          setShowMergeModal(true);
        } else {
          toast.info("No duplicate contacts found");
        }
      } else {
        toast.info("No duplicate contacts found");
      }
    } catch (error) {
      toast.error("Failed to check for duplicates");
    }
  };

  // Handle merge complete
  const handleMergeComplete = (mergedContactId: string) => {
    setShowMergeModal(false);
    setDuplicatesToMerge([]);
    setSelectedDuplicateId(null);
    // Refresh the page to show merged contact
    if (mergedContactId === id) {
      window.location.reload();
    } else {
      router.push(`/sales/contacts/${mergedContactId}`);
    }
  };

  // Status badge colors - use centralized utility
  const getStatusColors = (status: string) => getStatusColor(status, 'contact');

  // Score percentage for visualization (currently not provided by backend)
  const scorePercentage = 0;

  // Loading state - use same skeleton as loading.tsx for consistency
  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-semibold text-gray-900">Error Loading Contact</h2>
        <p className="text-gray-600">{error instanceof Error ? error.message : 'An error occurred'}</p>
        <Button onClick={() => router.push("/sales/contacts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  // If contact not found
  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Contact Not Found</h2>
        <p className="text-gray-600">The contact you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/sales/contacts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "activity" as TabType, label: "Activity", icon: Activity },
    { id: "deals" as TabType, label: `Deals (${linkedDeals.length})`, icon: DollarSign },
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
              onClick={() => router.push("/sales/contacts")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Contacts
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {contact.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{contact.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {contact.jobTitle && (
                    <span className="text-lg text-muted-foreground">{contact.jobTitle}</span>
                  )}
                  {contact.company && (
                    <span className="text-lg text-muted-foreground">at {contact.company}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColors(contact.status)}`}>
                    {contact.status}
                  </span>
                  {contact.tags && contact.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : 'hsl(var(--primary) / 0.1)',
                        color: tag.color || 'hsl(var(--primary))',
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {contact.tags && contact.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{contact.tags.length - 3} more
                    </span>
                  )}
                  {contact.doNotCall && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${THEME_COLORS.error.badge}`}>
                      Do Not Call
                    </span>
                  )}
                  {contact.doNotEmail && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${THEME_COLORS.error.badge}`}>
                      Do Not Email
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-2">Created {contact.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditContact}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.location.href = `mailto:${contact.email}`}
              >
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleFindDuplicates}
                disabled={checkDuplicates.isPending}
              >
                {checkDuplicates.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Merge className="h-4 w-4" />
                )}
                Find & Merge
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
                <p className="text-sm font-medium">{contact.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{contact.phone}</p>
              </div>
              {contact.mobile && contact.mobile !== "-" && (
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="text-sm font-medium">{contact.mobile}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Companies
                  {contact.companies && contact.companies.length > 0 && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {contact.companies.length}
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowLinkCompanyModal(true)}
                  title="Link company"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contact.companies && contact.companies.length > 0 ? (
                contact.companies.map((assoc) => (
                  <div
                    key={assoc.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Link
                      href={`/sales/accounts/${assoc.companyId}`}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                        {assoc.companyName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate hover:text-primary transition-colors">
                          {assoc.companyName}
                          {assoc.isPrimary && (
                            <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">Primary</span>
                          )}
                        </p>
                        {(assoc.title || assoc.department) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {[assoc.title, assoc.department].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => removeCompany.mutate({ contactId: contact.id, companyId: assoc.companyId })}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                      title="Unlink company"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">No companies linked</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-xs h-7"
                    onClick={() => setShowLinkCompanyModal(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Link Company
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Status & Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block capitalize ${getStatusColors(contact.status)}`}>
                  {contact.status}
                </span>
              </div>
              {contact.source && (
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-sm font-medium">{contact.source}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{contact.created}</p>
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
                    {/* Main Grid - Contact & Professional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Contact Information Card */}
                      <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="text-base font-semibold">Contact Information</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Full Name</span>
                            <span className="text-sm font-medium text-right">{contact.name}</span>
                          </div>
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-sm text-muted-foreground shrink-0">Email</span>
                            <a href={`mailto:${contact.email}`} className="text-sm font-medium text-primary hover:underline text-right break-all">
                              {contact.email}
                            </a>
                          </div>
                          {contact.secondaryEmail && (
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-sm text-muted-foreground shrink-0">Secondary Email</span>
                              <a href={`mailto:${contact.secondaryEmail}`} className="text-sm font-medium text-primary hover:underline text-right break-all">
                                {contact.secondaryEmail}
                              </a>
                            </div>
                          )}
                          {contact.phone && contact.phone !== "-" && (
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">Phone</span>
                              <a href={`tel:${contact.phone}`} className="text-sm font-medium">{contact.phone}</a>
                            </div>
                          )}
                          {contact.mobile && contact.mobile !== "-" && (
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">Mobile</span>
                              <a href={`tel:${contact.mobile}`} className="text-sm font-medium">{contact.mobile}</a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Professional Information Card */}
                      <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Building2 className="h-4 w-4 text-purple-500" />
                          </div>
                          <h3 className="text-base font-semibold">Professional Information</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Job Title</span>
                            <span className="text-sm font-medium">{contact.jobTitle || "-"}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Department</span>
                            <span className="text-sm font-medium">{contact.department || "-"}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Company</span>
                            <span className="text-sm font-medium">{contact.company || "-"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColors(contact.status)}`}>
                              {contact.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address & Source Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Address Information Card */}
                      {(contact.addressLine1 || contact.city || contact.country) && (
                        <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                          <div className="flex items-center gap-2 mb-4">
                            <div className={`p-2 ${THEME_COLORS.success.bg} rounded-lg`}>
                              <svg className={`h-4 w-4 ${THEME_COLORS.success.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <h3 className="text-base font-semibold">Address</h3>
                          </div>
                          <div className="text-sm space-y-1">
                            {contact.addressLine1 && <p className="font-medium">{contact.addressLine1}</p>}
                            {contact.addressLine2 && <p className="text-muted-foreground">{contact.addressLine2}</p>}
                            <p className="text-muted-foreground">
                              {[contact.city, contact.state, contact.postalCode].filter(Boolean).join(", ")}
                            </p>
                            {contact.country && <p className="font-medium">{contact.country}</p>}
                          </div>
                        </div>
                      )}

                      {/* Source Information Card */}
                      {(contact.source || contact.sourceDetail) && (
                        <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                          <div className="flex items-center gap-2 mb-4">
                            <div className={`p-2 ${THEME_COLORS.warning.bg} rounded-lg`}>
                              <Target className={`h-4 w-4 ${THEME_COLORS.warning.text}`} />
                            </div>
                            <h3 className="text-base font-semibold">Source Information</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">Source</span>
                              <span className="text-sm font-medium">{contact.source || "-"}</span>
                            </div>
                            {contact.sourceDetail && (
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Detail</span>
                                <span className="text-sm font-medium">{contact.sourceDetail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Social Profiles & Communication Preferences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Social Profiles Card */}
                      {(contact.linkedinUrl || contact.twitterUrl) && (
                        <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                          <div className="flex items-center gap-2 mb-4">
                            <div className={`p-2 ${THEME_COLORS.info.bg} rounded-lg`}>
                              <Users className={`h-4 w-4 ${THEME_COLORS.info.text}`} />
                            </div>
                            <h3 className="text-base font-semibold">Social Profiles</h3>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {contact.linkedinUrl && (
                              <a 
                                href={contact.linkedinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors text-sm font-medium"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                LinkedIn
                              </a>
                            )}
                            {contact.twitterUrl && (
                              <a 
                                href={contact.twitterUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors text-sm font-medium"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                                Twitter
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Communication Preferences Card */}
                      <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-2 ${THEME_COLORS.error.bg} rounded-lg`}>
                            <Phone className={`h-4 w-4 ${THEME_COLORS.error.text}`} />
                          </div>
                          <h3 className="text-base font-semibold">Communication Preferences</h3>
                        </div>
                        {(contact.doNotCall || contact.doNotEmail) ? (
                          <div className="flex flex-wrap gap-2">
                            {contact.doNotCall && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${THEME_COLORS.error.badge} text-sm font-medium`}>
                                <Phone className="h-3.5 w-3.5" />
                                Do Not Call
                              </span>
                            )}
                            {contact.doNotEmail && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${THEME_COLORS.error.badge} text-sm font-medium`}>
                                <Mail className="h-3.5 w-3.5" />
                                Do Not Email
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No communication restrictions</p>
                        )}
                      </div>
                    </div>

                    {/* Tags Card */}
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-violet-500/10 rounded-lg">
                            <svg className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <h3 className="text-base font-semibold">Tags</h3>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {contact.tags.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {contact.tags.map((tag) => (
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

                    {/* Description Card */}
                    {contact.description && (
                      <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-gray-500/10 rounded-lg">
                            <FileText className="h-4 w-4 text-gray-500" />
                          </div>
                          <h3 className="text-base font-semibold">Description</h3>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{contact.description}</p>
                      </div>
                    )}

                    {/* Activity Timestamps Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>Created:</span>
                          <span className="font-medium text-foreground">{contact.created}</span>
                        </div>
                        {contact.lastActivityAt && (
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-4 w-4" />
                            <span>Last Activity:</span>
                            <span className="font-medium text-foreground">{new Date(contact.lastActivityAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {contact.lastContactedAt && (
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            <span>Last Contacted:</span>
                            <span className="font-medium text-foreground">{new Date(contact.lastContactedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {(contact.dealCount !== undefined || contact.activityCount !== undefined) && (
                        <div className="flex gap-4 text-sm">
                          {contact.dealCount !== undefined && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 ${THEME_COLORS.success.bg} ${THEME_COLORS.success.text} rounded-lg`}>
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">{contact.dealCount}</span>
                              <span>Deals</span>
                            </div>
                          )}
                          {contact.activityCount !== undefined && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 ${THEME_COLORS.info.bg} ${THEME_COLORS.info.text} rounded-lg`}>
                              <Activity className="h-4 w-4" />
                              <span className="font-medium">{contact.activityCount}</span>
                              <span>Activities</span>
                            </div>
                          )}
                        </div>
                      )}
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
                    {isLoadingActivities ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : activities.length > 0 ? (
                      activities.map((activity, index) => {
                        const Icon = getActivityIcon(activity.type);
                        const colors = getActivityColor(activity.type);
                        return (
                          <div key={activity.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                                <Icon className={`h-5 w-5 ${colors.color}`} />
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-0.5 h-full bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <p className="font-medium">{activity.subject}</p>
                                  <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted">
                                    {activity.type}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {formatActivityDate(activity.createdAt)}
                                </span>
                              </div>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatActivityTime(activity.createdAt)}</span>
                                {activity.status && (
                                  <span className={`px-2 py-0.5 rounded-full capitalize ${getStatusColor(activity.status, 'generic')}`}>
                                    {activity.status}
                                  </span>
                                )}
                                {activity.durationMinutes && (
                                  <span>{activity.durationMinutes} min</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No activities yet</p>
                        <p className="text-sm">Activities will appear here when you log calls, emails, or meetings</p>
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
                    {linkedDeals.length > 0 ? (
                      linkedDeals.map((deal) => (
                        <Card 
                          key={deal.id} 
                          className="border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => router.push(`/sales/deals/${deal.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    {deal.name}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDealStageColor(deal.stageName, deal.status)}`}>
                                    {deal.stageName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD' }).format(deal.value || 0)}
                                  </span>
                                  <span>•</span>
                                  <span>{deal.probability}% probability</span>
                                  {deal.expectedCloseDate && (
                                    <>
                                      <span>•</span>
                                      <span>Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-3" />
                        <p>No related deals found</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={() => router.push('/sales/deals')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Deal
                        </Button>
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
                    <div className="border border-border rounded-lg p-4 bg-muted/30">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note about this contact..."
                        className="w-full min-h-[100px] p-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
                      />
                      <div className="flex justify-end mt-3">
                        <Button 
                          onClick={handleAddNote} 
                          size="sm"
                          disabled={!newNote.trim() || createActivity.isPending}
                        >
                          {createActivity.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Add Note
                        </Button>
                      </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-4">
                      {activities
                        .filter(a => a.type === 'note')
                        .map((note) => (
                          <Card key={note.id} className="border border-border">
                            <CardContent className="p-4">
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {note.description || note.subject}
                              </p>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                <span className="text-xs text-muted-foreground">
                                  {note.subject !== 'Note added' ? note.subject : 'Note'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatActivityDate(note.createdAt)} at {formatActivityTime(note.createdAt)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {activities.filter(a => a.type === 'note').length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
                          <p className="font-medium">No notes yet</p>
                          <p className="text-sm">Add a note above to keep track of important information</p>
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.location.href = `mailto:${contact.email}`}>
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.location.href = `tel:${contact.phone}`}>
                  <Phone className="h-4 w-4" />
                  Make Call
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Schedule meeting")}>
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Address Card */}
            {(contact.city || contact.country) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {[contact.city, contact.state, contact.country].filter(Boolean).join(", ")}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Related Contacts */}
            {relatedContacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    From {contact.company}
                  </p>
                  {relatedContacts.map((relatedContact) => (
                    <Link
                      key={relatedContact.id}
                      href={`/sales/contacts/${relatedContact.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                        {relatedContact.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {relatedContact.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {relatedContact.jobTitle}
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
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This will permanently remove it from your CRM and cannot be undone."
        itemName={contact.name}
        itemType="Contact"
        icon={Users}
        isDeleting={deleteContactMutation.isPending}
      />

      {/* Contact Form Drawer */}
      <ContactFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingContact(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingContact}
        mode="edit"
        defaultView="detailed"
      />

      {/* Merge Contact Modal */}
      {showMergeModal && selectedDuplicateId && (
        <MergeContactModal
          isOpen={showMergeModal}
          onClose={() => {
            setShowMergeModal(false);
            setDuplicatesToMerge([]);
            setSelectedDuplicateId(null);
          }}
          onMergeComplete={handleMergeComplete}
          primaryContactId={id}
          secondaryContactId={selectedDuplicateId}
          isLoading={mergeContacts.isPending}
          onMerge={(primaryId, secondaryId, strategy) => {
            mergeContacts.mutate(
              { primaryId, secondaryId, mergeStrategy: strategy },
              {
                onSuccess: (result) => {
                  if (result.success && result.merged_contact) {
                    handleMergeComplete(result.merged_contact.id);
                  }
                }
              }
            );
          }}
        />
      )}

      {/* Link Company Modal */}
      <LinkCompanyModal
        isOpen={showLinkCompanyModal}
        onClose={() => setShowLinkCompanyModal(false)}
        contactId={id}
        contactName={contact.name}
        existingCompanyIds={contact.companies?.map((c) => c.companyId) ?? []}
      />
    </div>
  );
}
