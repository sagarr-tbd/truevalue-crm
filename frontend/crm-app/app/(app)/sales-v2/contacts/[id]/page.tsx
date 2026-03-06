"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, Building2,
  TrendingUp, FileText, MessageSquare, Users, Plus, DollarSign,
  MapPin, AlertCircle, Loader2, Link2, Tag as TagIcon, X as XIcon,
  Activity, Calendar, Merge, Target, Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ContactV2FormDrawer } from "@/components/Forms/Sales";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { useContactV2, useUpdateContactV2, useDeleteContactV2, useContactV2Timeline, useMergeContactsV2, useContactCompaniesV2, useAddContactCompanyV2, useRemoveContactCompanyV2, contactsV2QueryKeys } from "@/lib/queries/useContactsV2";
import type { CreateContactV2Input } from "@/lib/api/contactsV2";
import { contactsV2Api } from "@/lib/api/contactsV2";
import { MergeContactModal, type ContactSummary } from "@/components/MergeContactModal";
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, CONTACTS_WRITE, CONTACTS_DELETE } from "@/lib/permissions";
import { useEntityTagsV2, useTagsV2, useAssignTagV2, useUnassignTagV2 } from "@/lib/queries/useTagsV2";
import { useDealsV2 } from "@/lib/queries/useDealsV2";
import { useCompaniesV2 } from "@/lib/queries/useCompaniesV2";

const getContactStatusColor = (status: string) => getStatusColor(status, 'contact');

const daysSince = (dateString: string | undefined) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

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
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

interface TimelineActivity {
  id?: string;
  type?: string;
  activity_type?: string;
  subject?: string;
  title?: string;
  description?: string;
  body?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  duration_minutes?: number;
}

type TabType = "details" | "activity" | "deals" | "notes";

export default function ContactV2DetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const { data: contact, isLoading, error } = useContactV2(contactId);
  const updateContact = useUpdateContactV2();
  const deleteContact = useDeleteContactV2();

  const { data: timelineData, isLoading: isLoadingTimeline } = useContactV2Timeline(contactId);
  const activities = (timelineData?.results ?? []) as TimelineActivity[];

  const mergeContacts = useMergeContactsV2();
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const { data: contactDealsData } = useDealsV2({ contact_id: contactId, page_size: 50 });
  const contactDeals = contactDealsData?.results ?? [];

  const { data: contactCompanies = [] } = useContactCompaniesV2(contactId);
  const addContactCompany = useAddContactCompanyV2();
  const removeContactCompany = useRemoveContactCompanyV2();

  const { data: entityTags = [] } = useEntityTagsV2("contact", contactId);
  const { data: allTags = [] } = useTagsV2("contact");
  const assignTag = useAssignTagV2();
  const unassignTag = useUnassignTagV2();
  const [showTagPicker, setShowTagPicker] = useState(false);

  const assignedTagIds = new Set(entityTags.map((et) => et.tag.id));
  const availableTags = allTags.filter((t) => !assignedTagIds.has(t.id));

  const [showLinkCompanyModal, setShowLinkCompanyModal] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDepartment, setLinkDepartment] = useState("");
  const { data: companyResults } = useCompaniesV2(
    { search: companySearch || undefined, page_size: 20 },
    { enabled: showLinkCompanyModal }
  );
  const existingCompanyIds = new Set(contactCompanies.map(a => a.company_id));
  const companySearchResults = (companyResults?.results ?? []).filter(c => !existingCompanyIds.has(c.id));

  const daysSinceCreation = useMemo(() => {
    return contact?.created_at ? daysSince(contact.created_at) : 0;
  }, [contact?.created_at]);

  const communicationStats = useMemo(() => ({
    emails: activities.filter(a => (a.type || a.activity_type) === 'email').length,
    calls: activities.filter(a => (a.type || a.activity_type) === 'call').length,
    meetings: activities.filter(a => (a.type || a.activity_type) === 'meeting').length,
  }), [activities]);

  const handleDelete = async () => {
    if (!contactId) return;
    setIsDeleting(true);
    try {
      await deleteContact.mutateAsync(contactId);
      router.push("/sales-v2/contacts");
    } catch {
      toast.error("Failed to delete contact");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleFormSubmit = async (data: CreateContactV2Input) => {
    try {
      if (contactId) {
        await updateContact.mutateAsync({ id: contactId, data });
      }
      setIsEditDrawerOpen(false);
    } catch (error) {
      throw error;
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !contact) return;
    try {
      const existingNotes = contact.entity_data.notes || [];
      const newNoteObj = {
        id: Date.now().toString(),
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        createdBy: "Current User",
      };

      await updateContact.mutateAsync({
        id: contactId,
        data: {
          status: contact.status,
          entity_data: {
            ...contact.entity_data,
            notes: [...existingNotes, newNoteObj],
          },
        },
      });

      toast.success("Note added successfully");
      setNewNote("");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleLinkCompany = async () => {
    if (!selectedCompanyId) return;
    try {
      await addContactCompany.mutateAsync({
        contactId,
        data: {
          company_id: selectedCompanyId,
          title: linkTitle || undefined,
          department: linkDepartment || undefined,
          is_primary: contactCompanies.length === 0,
        },
      });
      setShowLinkCompanyModal(false);
      setCompanySearch("");
      setSelectedCompanyId(null);
      setLinkTitle("");
      setLinkDepartment("");
    } catch {
      // handled by hook
    }
  };

  const handleUnlinkCompany = async (associationId: string) => {
    try {
      await removeContactCompany.mutateAsync({ contactId, associationId });
    } catch {
      // handled by hook
    }
  };

  const fetchContactV2 = async (id: string): Promise<ContactSummary> => {
    const c = await contactsV2Api.getById(id);
    return {
      id: c.id,
      name: `${c.entity_data?.first_name || ''} ${c.entity_data?.last_name || ''}`.trim() || c.display_name || 'Unknown',
      email: c.entity_data?.email,
      phone: c.entity_data?.phone,
      company: c.display_company || c.entity_data?.company,
      title: c.entity_data?.title,
      isLoading: false,
    };
  };

  const handleFindDuplicates = async () => {
    const email = contact?.entity_data?.email;
    const firstName = contact?.entity_data?.first_name;
    const lastName = contact?.entity_data?.last_name;
    const phone = contact?.entity_data?.phone || contact?.entity_data?.mobile;

    if (!email && !firstName && !phone) {
      toast.info("No email, name, or phone on this contact — cannot check for duplicates");
      return;
    }
    setIsCheckingDuplicates(true);
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      const result = await contactsV2Api.checkDuplicate({
        ...(email ? { email } : {}),
        ...(fullName ? { name: fullName } : {}),
        ...(phone ? { phone } : {}),
      });
      if (result.has_duplicates) {
        const others = result.duplicates.filter((d) => d.id !== contactId);
        if (others.length > 0) {
          setSelectedDuplicateId(others[0].id);
          setShowMergeModal(true);
        } else {
          toast.info("No duplicate contacts found");
        }
      } else {
        toast.info("No duplicate contacts found");
      }
    } catch {
      toast.error("Failed to check for duplicates");
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleMergeComplete = useCallback((mergedContactId: string) => {
    setShowMergeModal(false);
    setSelectedDuplicateId(null);
    queryClient.invalidateQueries({ queryKey: contactsV2QueryKeys.detail(mergedContactId) });
    queryClient.invalidateQueries({ queryKey: contactsV2QueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: contactsV2QueryKeys.stats() });
    if (mergedContactId !== contactId) {
      router.push(`/sales-v2/contacts/${mergedContactId}`);
    }
  }, [contactId, queryClient, router]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {error ? "Error Loading Contact" : "Contact Not Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {error ? "There was an error loading this contact. Please try again." : "The contact you're looking for doesn't exist or has been deleted."}
          </p>
          <Button className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90" onClick={() => router.push("/sales-v2/contacts")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </motion.div>
      </div>
    );
  }

  const notes = contact.entity_data.notes || [];

  return (
    <div className="min-h-screen">
      <div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/sales-v2/contacts")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Contacts
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {`${contact.entity_data.first_name?.[0] || ""}${contact.entity_data.last_name?.[0] || "C"}`.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {contact.entity_data.first_name} {contact.entity_data.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {contact.entity_data.title && (
                    <span className="text-lg text-muted-foreground">{contact.entity_data.title}</span>
                  )}
                  {(contactCompanies.find(a => a.is_primary)?.company_name || contact.display_company) && (
                    <span className="text-lg text-muted-foreground">
                      at {contactCompanies.find(a => a.is_primary)?.company_name || contact.display_company}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getContactStatusColor(contact.status)}`}>
                    {contact.status}
                  </span>
                  {contact.entity_data?.do_not_call && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Do Not Call
                    </span>
                  )}
                  {contact.entity_data?.do_not_email && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Do Not Email
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">Created {formatDate(contact.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {can(CONTACTS_WRITE) && (
                <Button variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {contact.entity_data.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.location.href = `mailto:${contact.entity_data.email}`}
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
              )}
              {can(CONTACTS_WRITE) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFindDuplicates}
                  disabled={isCheckingDuplicates}
                  className="flex items-center gap-2"
                >
                  {isCheckingDuplicates ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Merge className="h-4 w-4" />
                  )}
                  Find & Merge
                </Button>
              )}
              {can(CONTACTS_DELETE) && (
                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <p className="text-sm font-medium">{contact.entity_data.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{contact.entity_data.phone || "N/A"}</p>
              </div>
              {contact.entity_data.mobile && (
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="text-sm font-medium">{contact.entity_data.mobile}</p>
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
                  {contactCompanies.length > 0 && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{contactCompanies.length}</span>
                  )}
                </span>
                {can(CONTACTS_WRITE) && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowLinkCompanyModal(true)} title="Link company">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contactCompanies.length > 0 ? (
                contactCompanies.map((assoc) => (
                  <div key={assoc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                    <button onClick={() => router.push(`/sales-v2/companies/${assoc.company_id}`)} className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                        {(assoc.company_name || '??').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate hover:text-primary transition-colors">
                          {assoc.company_name || 'Unknown'}
                          {assoc.is_primary && (
                            <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">Primary</span>
                          )}
                        </p>
                        {(assoc.title || assoc.department) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {[assoc.title, assoc.department].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </button>
                    {can(CONTACTS_WRITE) && (
                      <button onClick={() => handleUnlinkCompany(assoc.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded" title="Unlink company">
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">No companies linked</p>
                  {can(CONTACTS_WRITE) && (
                    <Button variant="ghost" size="sm" className="mt-1 text-xs h-7" onClick={() => setShowLinkCompanyModal(true)}>
                      <Plus className="h-3 w-3 mr-1" />Link Company
                    </Button>
                  )}
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block capitalize ${getContactStatusColor(contact.status)}`}>
                  {contact.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium capitalize">{(contact.source || contact.entity_data.source)?.replace(/_/g, " ") || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(contact.created_at)}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
                  {[
                    { id: "details", label: "Details", icon: FileText },
                    { id: "activity", label: "Activity", icon: Activity },
                    { id: "deals", label: `Deals (${contactDeals.length})`, icon: DollarSign },
                    { id: "notes", label: "Notes", icon: MessageSquare },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                        {tab.id === "notes" && notes.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs">{notes.length}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === "details" && (
                      <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-lg"><Mail className="h-4 w-4 text-primary" /></div>
                              <h3 className="text-base font-semibold">Contact Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Full Name</span>
                                <span className="text-sm font-medium text-right">{contact.entity_data.first_name} {contact.entity_data.last_name}</span>
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground shrink-0">Email</span>
                                <a href={`mailto:${contact.entity_data.email}`} className="text-sm font-medium text-primary hover:underline text-right break-all">{contact.entity_data.email}</a>
                              </div>
                              {contact.entity_data.secondary_email && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">Secondary Email</span>
                                  <a href={`mailto:${contact.entity_data.secondary_email}`} className="text-sm font-medium text-primary hover:underline text-right break-all">{contact.entity_data.secondary_email}</a>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Phone</span>
                                {contact.entity_data.phone ? (
                                  <a href={`tel:${contact.entity_data.phone}`} className="text-sm font-medium">{contact.entity_data.phone}</a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                              {contact.entity_data.mobile && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Mobile</span>
                                  <a href={`tel:${contact.entity_data.mobile}`} className="text-sm font-medium">{contact.entity_data.mobile}</a>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg"><Building2 className="h-4 w-4 text-purple-500" /></div>
                              <h3 className="text-base font-semibold">Professional Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Company</span>
                                <span className="text-sm font-medium">{contact.display_company || "-"}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Job Title</span>
                                <span className="text-sm font-medium">{contact.entity_data.title || "-"}</span>
                              </div>
                              {contact.entity_data.department && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Department</span>
                                  <span className="text-sm font-medium">{contact.entity_data.department}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.success.bg} rounded-lg`}><Users className={`h-4 w-4 ${THEME_COLORS.success.text}`} /></div>
                              <h3 className="text-base font-semibold">Contact Status</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getContactStatusColor(contact.status)}`}>{contact.status}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Days Since Created</span>
                                <span className="text-sm font-medium">{daysSinceCreation} days</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.warning.bg} rounded-lg`}><Users className={`h-4 w-4 ${THEME_COLORS.warning.text}`} /></div>
                              <h3 className="text-base font-semibold">Source Information</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Source</span>
                                <span className="text-sm font-medium capitalize">{(contact.source || contact.entity_data.source)?.replace(/_/g, " ") || "-"}</span>
                              </div>
                              {contact.entity_data.source_detail && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Detail</span>
                                  <span className="text-sm font-medium">{contact.entity_data.source_detail}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">{formatDate(contact.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {(contact.entity_data.address_line1 || contact.entity_data.city || contact.entity_data.state || contact.entity_data.country) && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.info.bg} rounded-lg`}><MapPin className={`h-4 w-4 ${THEME_COLORS.info.text}`} /></div>
                              <h3 className="text-base font-semibold">Address</h3>
                            </div>
                            <div className="text-sm space-y-1">
                              {contact.entity_data.address_line1 && <p className="font-medium">{contact.entity_data.address_line1}</p>}
                              <p className="text-muted-foreground">
                                {[contact.entity_data.city, contact.entity_data.state, contact.entity_data.postal_code].filter(Boolean).join(", ")}
                              </p>
                              {contact.entity_data.country && <p className="font-medium">{contact.entity_data.country}</p>}
                            </div>
                          </div>
                        )}

                        {(contact.entity_data.linkedin_url || contact.entity_data.twitter_url) && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-blue-500/10 rounded-lg"><Link2 className="h-4 w-4 text-blue-500" /></div>
                              <h3 className="text-base font-semibold">Social & Web</h3>
                            </div>
                            <div className="space-y-3">
                              {contact.entity_data.linkedin_url && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">LinkedIn</span>
                                  <a href={contact.entity_data.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline text-right break-all">{contact.entity_data.linkedin_url}</a>
                                </div>
                              )}
                              {contact.entity_data.twitter_url && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">Twitter / X</span>
                                  <a href={contact.entity_data.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline text-right break-all">{contact.entity_data.twitter_url}</a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {contact.entity_data.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-indigo-500/10 rounded-lg"><FileText className="h-4 w-4 text-indigo-500" /></div>
                              <h3 className="text-base font-semibold">Notes</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{contact.entity_data.description}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "activity" && (
                      <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {isLoadingTimeline ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : activities.length > 0 ? (
                          activities.map((activity, index) => {
                            const Icon = getActivityIcon(activity.type || activity.activity_type || '');
                            const colors = getActivityColor(activity.type || activity.activity_type || '');
                            const actDate = activity.created_at || activity.createdAt || '';
                            return (
                              <div key={activity.id || index} className="flex gap-4">
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
                                      <p className="font-medium">{activity.subject || activity.title || 'Activity'}</p>
                                      <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted">
                                        {activity.type || activity.activity_type || 'general'}
                                      </span>
                                    </div>
                                    {actDate && (
                                      <span className="text-sm text-muted-foreground">
                                        {formatActivityDate(actDate)}
                                      </span>
                                    )}
                                  </div>
                                  {(activity.description || activity.body) && (
                                    <p className="text-sm text-muted-foreground mb-2">{activity.description || activity.body}</p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {actDate && <span>{formatActivityTime(actDate)}</span>}
                                    {activity.status && (
                                      <span className={`px-2 py-0.5 rounded-full capitalize ${getStatusColor(activity.status, 'generic')}`}>
                                        {activity.status}
                                      </span>
                                    )}
                                    {activity.duration_minutes && (
                                      <span>{activity.duration_minutes} min</span>
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
                      <motion.div key="deals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {contactDeals.length > 0 ? (
                          contactDeals.map((deal) => (
                            <Card
                              key={deal.id}
                              className="border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => router.push(`/sales-v2/deals/${deal.id}`)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-sm font-semibold text-foreground">{deal.display_name || 'Untitled Deal'}</h4>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        deal.status === 'won' ? 'bg-green-500/10 text-green-600' :
                                        deal.status === 'lost' ? 'bg-red-500/10 text-red-600' :
                                        'bg-blue-500/10 text-blue-600'
                                      }`}>
                                        {deal.display_stage || deal.status || 'open'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span className="font-medium text-foreground">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD' }).format(parseFloat(String(deal.value)) || 0)}
                                      </span>
                                      {deal.probability != null && (
                                        <>
                                          <span>•</span>
                                          <span>{deal.probability}% probability</span>
                                        </>
                                      )}
                                      {deal.expected_close_date && (
                                        <>
                                          <span>•</span>
                                          <span>Close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
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
                            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No related deals found</p>
                            <p className="text-sm">Deals associated with this contact will appear here</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "notes" && (
                      <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {can(CONTACTS_WRITE) && (
                          <div className="border border-border rounded-lg p-4 bg-muted/30">
                            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note about this contact..." className="min-h-[100px] resize-none" />
                            <div className="flex justify-end mt-3">
                              <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim() || updateContact.isPending}>
                                {updateContact.isPending ? (
                                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
                                ) : (
                                  <><Plus className="h-4 w-4 mr-2" />Add Note</>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {notes.length > 0 ? (
                          <div className="space-y-4">
                            {notes.map((note: { id: string; text: string; createdAt: string; createdBy: string }) => (
                              <Card key={note.id} className="border border-border">
                                <CardContent className="p-4">
                                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                    <span className="text-xs text-muted-foreground">{note.createdBy || 'System'}</span>
                                    <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p>No notes yet</p>
                            <p className="text-sm mt-1">Add a note above to get started</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => window.location.href = `mailto:${contact.entity_data.email || ''}`}>
                  <Mail className="h-4 w-4" />Send Email
                </Button>
                {contact.entity_data.phone && (
                  <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => window.location.href = `tel:${contact.entity_data.phone}`}>
                    <Phone className="h-4 w-4" />Make Call
                  </Button>
                )}
                <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => setActiveTab("activity")}>
                  <Calendar className="h-4 w-4" />Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Location */}
            {(contact.entity_data?.city || contact.entity_data?.state || contact.entity_data?.country || contact.entity_data?.address) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {contact.entity_data?.address && <p className="text-muted-foreground">{contact.entity_data.address}</p>}
                  <p className="text-muted-foreground">
                    {[contact.entity_data?.city, contact.entity_data?.state, contact.entity_data?.zip_code].filter(Boolean).join(', ')}
                  </p>
                  {contact.entity_data?.country && <p className="text-muted-foreground">{contact.entity_data.country}</p>}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Tags
                  </span>
                  {can(CONTACTS_WRITE) && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowTagPicker(!showTagPicker)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entityTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {entityTags.map((et) => (
                      <span
                        key={et.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: et.tag.color || "#6B7280" }}
                      >
                        {et.tag.name}
                        {can(CONTACTS_WRITE) && (
                          <button
                            onClick={() => unassignTag.mutate({ tagId: et.tag.id, entityType: "contact", entityId: contactId })}
                            className="hover:bg-white/20 rounded-full p-0.5"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No tags assigned</p>
                )}

                {showTagPicker && availableTags.length > 0 && (
                  <div className="border border-border rounded-lg p-2 mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          assignTag.mutate({ tagId: tag.id, entityType: "contact", entityId: contactId });
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                      >
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color || "#6B7280" }} />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
                {showTagPicker && availableTags.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">All tags assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Timestamps Footer */}
      <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-6 text-xs text-muted-foreground">
        <span>Created: {formatDate(contact.created_at)}</span>
        <span>Updated: {formatDate(contact.updated_at)}</span>
        {contact.entity_data?.last_contacted && <span>Last Contacted: {formatDate(contact.entity_data.last_contacted)}</span>}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This will permanently remove it from your CRM and cannot be undone."
        itemName={`${contact.entity_data.first_name || ''} ${contact.entity_data.last_name || ''}`.trim() || contact.entity_data.email || 'Contact'}
        itemType="Contact"
        icon={Users}
        isDeleting={isDeleting}
      />

      <ContactV2FormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={contact}
        mode="edit"
      />

      {/* Link Company Modal */}
      <AnimatePresence mode="wait">
        {showLinkCompanyModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => { setShowLinkCompanyModal(false); setCompanySearch(""); setSelectedCompanyId(null); setLinkTitle(""); setLinkDepartment(""); }}
              style={{ margin: 0 }}
            />
            <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ margin: 0 }}>
              <div className="min-h-screen px-4 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full my-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Link Company</h2>
                          <p className="text-sm text-muted-foreground">
                            Add a company association to {contact.entity_data.first_name} {contact.entity_data.last_name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowLinkCompanyModal(false); setCompanySearch(""); setSelectedCompanyId(null); setLinkTitle(""); setLinkDepartment(""); }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="px-6 pb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search companies..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="px-6 pb-3 max-h-48 overflow-y-auto">
                    {companySearchResults.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        {companySearch ? "No matching companies found" : "Type to search companies"}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {companySearchResults.map((company) => (
                          <button
                            key={company.id}
                            onClick={() => setSelectedCompanyId(company.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                              selectedCompanyId === company.id
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/50 border border-transparent"
                            }`}
                          >
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                              {(company.display_name || '??').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{company.display_name || 'Unnamed'}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {[company.entity_data?.industry, company.entity_data?.city].filter(Boolean).join(" · ") || "No details"}
                              </p>
                            </div>
                            {selectedCompanyId === company.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Role at company (shown when company selected) */}
                  {selectedCompanyId && (
                    <div className="px-6 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Role at this company (optional)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Job Title</label>
                          <Input
                            placeholder="e.g. CEO, CTO"
                            value={linkTitle}
                            onChange={(e) => setLinkTitle(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                          <Input
                            placeholder="e.g. Engineering"
                            value={linkDepartment}
                            onChange={(e) => setLinkDepartment(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end rounded-b-2xl">
                    <Button variant="outline" onClick={() => { setShowLinkCompanyModal(false); setCompanySearch(""); setSelectedCompanyId(null); setLinkTitle(""); setLinkDepartment(""); }} className="sm:w-auto w-full">
                      Cancel
                    </Button>
                    <Button onClick={() => handleLinkCompany()} disabled={!selectedCompanyId || addContactCompany.isPending} className="sm:w-auto w-full">
                      {addContactCompany.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Linking...</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-2" />Link Company</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {showMergeModal && selectedDuplicateId && (
        <MergeContactModal
          isOpen={showMergeModal}
          onClose={() => {
            setShowMergeModal(false);
            setSelectedDuplicateId(null);
          }}
          onMergeComplete={handleMergeComplete}
          primaryContactId={contactId}
          secondaryContactId={selectedDuplicateId}
          isLoading={mergeContacts.isPending}
          fetchContact={fetchContactV2}
          onMerge={(primaryId, secondaryId, strategy) => {
            const v2Strategy = strategy === 'fill_empty' ? 'merge' : 'keep_primary';
            mergeContacts.mutate(
              { primaryId, secondaryId, mergeStrategy: v2Strategy },
              {
                onSuccess: (result) => {
                  const mergedId = result.merged_contact?.id || primaryId;
                  handleMergeComplete(mergedId);
                },
              }
            );
          }}
        />
      )}
    </div>
  );
}
