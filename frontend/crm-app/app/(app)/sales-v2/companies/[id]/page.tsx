"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, Building2,
  TrendingUp, FileText, MessageSquare, Plus,
  MapPin, AlertCircle, Loader2, Link2, Users,
  Tag as TagIcon, X as XIcon, Unlink, ExternalLink,
  Activity, Calendar, Search, DollarSign,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CompanyV2FormDrawer } from "@/components/Forms/Sales";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { useCompanyV2, useUpdateCompanyV2, useDeleteCompanyV2 } from "@/lib/queries/useCompaniesV2";
import { useActivitiesV2 } from "@/lib/queries/useActivitiesV2";
import { useContactsV2, useUpdateContactV2 } from "@/lib/queries/useContactsV2";
import { useDealsV2 } from "@/lib/queries/useDealsV2";
import type { CreateCompanyV2Input } from "@/lib/api/companiesV2";
import { THEME_COLORS, getStatusColor, formatCurrency } from "@/lib/utils";
import { usePermission, COMPANIES_WRITE, COMPANIES_DELETE } from "@/lib/permissions";
import { useEntityTagsV2, useTagsV2, useAssignTagV2, useUnassignTagV2 } from "@/lib/queries/useTagsV2";

const getCompanyStatusColor = (status: string) => getStatusColor(status, 'company');

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

const daysSince = (dateString: string | undefined) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

type TabType = "details" | "activity" | "contacts" | "deals" | "notes";

export default function CompanyV2DetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { can } = usePermission();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const { data: company, isLoading, error } = useCompanyV2(companyId);
  const updateCompany = useUpdateCompanyV2();
  const deleteCompany = useDeleteCompanyV2();

  const { data: entityTags = [] } = useEntityTagsV2("company", companyId);
  const { data: allTags = [] } = useTagsV2("company");
  const assignTag = useAssignTagV2();
  const unassignTag = useUnassignTagV2();
  const [showTagPicker, setShowTagPicker] = useState(false);
  const assignedTagIds = new Set(entityTags.map((et) => et.tag.id));
  const availableTags = allTags.filter((t) => !assignedTagIds.has(t.id));

  const { data: activitiesData, isLoading: isLoadingActivities } = useActivitiesV2({ company_id: companyId, page_size: 50 });
  const companyActivities = activitiesData?.results || [];

  const { data: contactsData, isLoading: isLoadingContacts } = useContactsV2({ company_id: companyId, page_size: 50 });
  const companyContacts = contactsData?.results || [];

  const { data: dealsData, isLoading: isLoadingDeals } = useDealsV2({ company_id: companyId, page_size: 50 });
  const companyDeals = dealsData?.results || [];

  const updateContact = useUpdateContactV2();
  const [showLinkContactModal, setShowLinkContactModal] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDepartment, setLinkDepartment] = useState("");
  const { data: contactSearchResults } = useContactsV2(
    { search: contactSearchTerm || undefined, page_size: 10 },
    { enabled: showLinkContactModal && contactSearchTerm.length > 0 }
  );
  const existingContactIds = new Set(companyContacts.map(c => c.id));
  const filteredContactResults = (contactSearchResults?.results ?? []).filter(c => !existingContactIds.has(c.id));

  const handleLinkContact = async () => {
    if (!selectedContactId) return;
    try {
      await updateContact.mutateAsync({
        id: selectedContactId,
        data: { company_id: companyId },
      });
      toast.success("Contact linked to company");
      setShowLinkContactModal(false);
      setContactSearchTerm("");
      setSelectedContactId(null);
      setLinkTitle("");
      setLinkDepartment("");
    } catch {
      toast.error("Failed to link contact");
    }
  };

  const handleUnlinkContact = async (contactId: string) => {
    try {
      await updateContact.mutateAsync({
        id: contactId,
        data: { company_id: null as unknown as string },
      });
      toast.success("Contact unlinked from company");
    } catch {
      toast.error("Failed to unlink contact");
    }
  };

  const daysSinceCreation = useMemo(() => {
    return company?.created_at ? daysSince(company.created_at) : 0;
  }, [company?.created_at]);

  const dealStats = useMemo(() => {
    const open = companyDeals.filter(d => d.status === 'open');
    const won = companyDeals.filter(d => d.status === 'won');
    const lost = companyDeals.filter(d => d.status === 'lost');
    const totalValue = companyDeals.reduce((sum, d) => {
      const v = typeof d.value === 'string' ? parseFloat(d.value) : (d.value ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    const wonValue = won.reduce((sum, d) => {
      const v = typeof d.value === 'string' ? parseFloat(d.value) : (d.value ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    return { total: companyDeals.length, open: open.length, won: won.length, lost: lost.length, totalValue, wonValue };
  }, [companyDeals]);

  const handleDelete = async () => {
    if (!companyId) return;
    setIsDeleting(true);
    try {
      await deleteCompany.mutateAsync(companyId);
      toast.success("Company deleted successfully");
      router.push("/sales-v2/companies");
    } catch {
      toast.error("Failed to delete company");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleFormSubmit = async (data: CreateCompanyV2Input) => {
    try {
      if (companyId) {
        await updateCompany.mutateAsync({ id: companyId, data });
      }
      setIsEditDrawerOpen(false);
    } catch (error) {
      throw error;
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !company) return;
    try {
      const existingNotes = company.entity_data.notes || [];
      const newNoteObj = {
        id: Date.now().toString(),
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        createdBy: "Current User",
      };

      await updateCompany.mutateAsync({
        id: companyId,
        data: {
          status: company.status,
          entity_data: {
            ...company.entity_data,
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {error ? "Error Loading Company" : "Company Not Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {error ? "There was an error loading this company. Please try again." : "The company you're looking for doesn't exist or has been deleted."}
          </p>
          <Button className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90" onClick={() => router.push("/sales-v2/companies")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
        </motion.div>
      </div>
    );
  }

  const notes = company.entity_data.notes || [];

  return (
    <div className="min-h-screen">
      <div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/sales-v2/companies")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Companies
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {(company.entity_data.name || 'C')[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {company.entity_data.name || 'Unnamed Company'}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {(company.industry || company.entity_data.industry) && (
                    <span className="text-lg text-muted-foreground capitalize">
                      {(company.industry || company.entity_data.industry)?.replace(/_/g, ' ')}
                    </span>
                  )}
                  {company.size && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground`}>
                      {company.size}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">Created {formatDate(company.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {can(COMPANIES_WRITE) && (
                <Button variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {company.entity_data.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.location.href = `mailto:${company.entity_data.email}`}
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
              )}
              {can(COMPANIES_DELETE) && (
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
                <p className="text-sm font-medium">{company.entity_data.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{company.entity_data.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                {company.entity_data.website ? (
                  <a
                    href={company.entity_data.website.startsWith("http") ? company.entity_data.website : `https://${company.entity_data.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {company.entity_data.website}
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
                <p className="text-sm font-medium capitalize">{(company.industry || company.entity_data.industry || 'N/A').replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company Size</p>
                <p className="text-sm font-medium">{company.size || company.entity_data.size || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employees</p>
                <p className="text-sm font-medium">
                  {company.entity_data.employee_count ? new Intl.NumberFormat("en-US").format(Number(company.entity_data.employee_count)) : "N/A"}
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
                <p className="text-lg font-bold text-primary">{formatCurrency(Number(company.entity_data.annual_revenue) || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Related Deals</p>
                <p className="text-sm font-medium">{companyDeals.length} deals</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contacts</p>
                <p className="text-sm font-medium">{companyContacts.length} contacts</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Deal Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Total Deals</p>
                <p className="text-sm font-medium">{dealStats.total}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open Deals</p>
                <p className={`text-sm font-medium ${THEME_COLORS.info.text}`}>{dealStats.open}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Won</p>
                <p className={`text-sm font-medium ${THEME_COLORS.success.text}`}>{dealStats.won}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lost</p>
                <p className={`text-sm font-medium ${THEME_COLORS.error.text}`}>{dealStats.lost}</p>
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
                    { id: "contacts", label: `Contacts (${companyContacts.length})`, icon: Users },
                    { id: "deals", label: `Deals (${companyDeals.length})`, icon: DollarSign },
                    { id: "activity", label: "Activity", icon: Activity },
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
                              <div className="p-2 bg-primary/10 rounded-lg"><Building2 className="h-4 w-4 text-primary" /></div>
                              <h3 className="text-base font-semibold">Company Details</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Company Name</span>
                                <span className="text-sm font-medium text-right">{company.entity_data.name || "-"}</span>
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground shrink-0">Email</span>
                                {company.entity_data.email ? (
                                  <a href={`mailto:${company.entity_data.email}`} className="text-sm font-medium text-primary hover:underline text-right break-all">{company.entity_data.email}</a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Phone</span>
                                {company.entity_data.phone ? (
                                  <a href={`tel:${company.entity_data.phone}`} className="text-sm font-medium">{company.entity_data.phone}</a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Website</span>
                                {company.entity_data.website ? (
                                  <a href={company.entity_data.website.startsWith('http') ? company.entity_data.website : `https://${company.entity_data.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">{company.entity_data.website.replace(/^https?:\/\//, '')}</a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg"><Users className="h-4 w-4 text-purple-500" /></div>
                              <h3 className="text-base font-semibold">Business Info</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Industry</span>
                                <span className="text-sm font-medium capitalize">{(company.industry || company.entity_data.industry || '-').replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Size</span>
                                <span className="text-sm font-medium">{company.size || company.entity_data.size || "-"}</span>
                              </div>
                              {company.entity_data.employee_count && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Employee Count</span>
                                  <span className="text-sm font-medium">{company.entity_data.employee_count}</span>
                                </div>
                              )}
                              {company.entity_data.annual_revenue && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Annual Revenue</span>
                                  <span className="text-sm font-medium">${Number(company.entity_data.annual_revenue).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.success.bg} rounded-lg`}><Building2 className={`h-4 w-4 ${THEME_COLORS.success.text}`} /></div>
                              <h3 className="text-base font-semibold">Company Status</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCompanyStatusColor(company.status)}`}>{company.status}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Days Since Created</span>
                                <span className="text-sm font-medium">{daysSinceCreation} days</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.warning.bg} rounded-lg`}><TrendingUp className={`h-4 w-4 ${THEME_COLORS.warning.text}`} /></div>
                              <h3 className="text-base font-semibold">Timeline</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">{formatDate(company.created_at)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="text-sm font-medium">{formatDate(company.updated_at)}</span>
                              </div>
                              {company.last_activity_at && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Last Activity</span>
                                  <span className="text-sm font-medium">{formatDate(company.last_activity_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {(company.entity_data.address_line1 || company.entity_data.city || company.entity_data.state || company.entity_data.country) && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.info.bg} rounded-lg`}><MapPin className={`h-4 w-4 ${THEME_COLORS.info.text}`} /></div>
                              <h3 className="text-base font-semibold">Address</h3>
                            </div>
                            <div className="text-sm space-y-1">
                              {company.entity_data.address_line1 && <p className="font-medium">{company.entity_data.address_line1}</p>}
                              {company.entity_data.address_line2 && <p className="text-muted-foreground">{company.entity_data.address_line2}</p>}
                              <p className="text-muted-foreground">
                                {[company.entity_data.city, company.entity_data.state, company.entity_data.postal_code].filter(Boolean).join(", ")}
                              </p>
                              {company.entity_data.country && <p className="font-medium">{company.entity_data.country}</p>}
                            </div>
                          </div>
                        )}

                        {(company.entity_data.linkedin_url || company.entity_data.twitter_url || company.entity_data.facebook_url) && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-blue-500/10 rounded-lg"><Link2 className="h-4 w-4 text-blue-500" /></div>
                              <h3 className="text-base font-semibold">Social & Web</h3>
                            </div>
                            <div className="space-y-3">
                              {company.entity_data.linkedin_url && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">LinkedIn</span>
                                  <a href={company.entity_data.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline text-right break-all">{company.entity_data.linkedin_url}</a>
                                </div>
                              )}
                              {company.entity_data.twitter_url && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">Twitter / X</span>
                                  <a href={company.entity_data.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline text-right break-all">{company.entity_data.twitter_url}</a>
                                </div>
                              )}
                              {company.entity_data.facebook_url && (
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-muted-foreground shrink-0">Facebook</span>
                                  <a href={company.entity_data.facebook_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline text-right break-all">{company.entity_data.facebook_url}</a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {company.entity_data.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-indigo-500/10 rounded-lg"><FileText className="h-4 w-4 text-indigo-500" /></div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{company.entity_data.description}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "activity" && (
                      <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {isLoadingActivities ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : companyActivities.length > 0 ? (
                          companyActivities.map((activity, index) => {
                            const Icon = getActivityIcon(activity.activity_type || '');
                            const colors = getActivityColor(activity.activity_type || '');
                            const actDate = activity.created_at || '';
                            return (
                              <div key={activity.id || index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${colors.color}`} />
                                  </div>
                                  {index < companyActivities.length - 1 && (
                                    <div className="w-0.5 h-full bg-border mt-2" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-start justify-between mb-1">
                                    <div>
                                      <p className="font-medium">{activity.subject || (activity as { title?: string }).title || 'Activity'}</p>
                                      <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted">
                                        {activity.activity_type || 'general'}
                                      </span>
                                    </div>
                                    {actDate && (
                                      <span className="text-sm text-muted-foreground">
                                        {formatActivityDate(actDate)}
                                      </span>
                                    )}
                                  </div>
                                  {activity.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {actDate && <span>{formatActivityTime(actDate)}</span>}
                                    {activity.status && (
                                      <span className={`px-2 py-0.5 rounded-full capitalize ${getStatusColor(activity.status, 'generic')}`}>
                                        {activity.status}
                                      </span>
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

                    {activeTab === "contacts" && (
                      <motion.div key="contacts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {companyContacts.length} contact{companyContacts.length !== 1 ? 's' : ''} linked
                          </p>
                          {can(COMPANIES_WRITE) && (
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowLinkContactModal(true)}>
                              <Plus className="h-4 w-4" />
                              Link Contact
                            </Button>
                          )}
                        </div>

                        {isLoadingContacts ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : companyContacts.length > 0 ? (
                          <div className="space-y-3">
                            {companyContacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="group flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/sales-v2/contacts/${contact.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                    {(contact.display_name || contact.entity_data?.first_name || 'C')[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{contact.display_name || `${contact.entity_data?.first_name || ''} ${contact.entity_data?.last_name || ''}`.trim()}</p>
                                    <p className="text-sm text-muted-foreground">{contact.entity_data?.title || 'No title'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  {contact.status && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(contact.status, 'contact')}`}>
                                      {contact.status}
                                    </span>
                                  )}
                                  {contact.display_email && (
                                    <a href={`mailto:${contact.display_email}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                      <Mail className="h-4 w-4" />
                                    </a>
                                  )}
                                  {contact.display_phone && (
                                    <a href={`tel:${contact.display_phone}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                      <Phone className="h-4 w-4" />
                                    </a>
                                  )}
                                  {can(COMPANIES_WRITE) && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUnlinkContact(contact.id); }}
                                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5 rounded-md hover:bg-destructive/10"
                                      title="Unlink contact"
                                    >
                                      <Unlink className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No contacts linked</p>
                            <p className="text-sm">Contacts associated with this company will appear here</p>
                            {can(COMPANIES_WRITE) && (
                              <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowLinkContactModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />Link Contact
                              </Button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "deals" && (
                      <motion.div key="deals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {isLoadingDeals ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : companyDeals.length > 0 ? (
                          <>
                            <div className="grid grid-cols-4 gap-3">
                              <div className="p-3 rounded-lg bg-muted/50 text-center">
                                <p className="text-lg font-bold">{dealStats.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50 text-center">
                                <p className={`text-lg font-bold ${THEME_COLORS.info.text}`}>{dealStats.open}</p>
                                <p className="text-xs text-muted-foreground">Open</p>
                              </div>
                              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                                <p className="text-lg font-bold text-green-600">{dealStats.won}</p>
                                <p className="text-xs text-muted-foreground">Won</p>
                              </div>
                              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                                <p className="text-lg font-bold text-red-600">{dealStats.lost}</p>
                                <p className="text-xs text-muted-foreground">Lost</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {companyDeals.map((deal) => (
                                <div key={deal.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/sales-v2/deals/${deal.id}`)}>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{deal.entity_data?.name || deal.display_name || 'Unnamed Deal'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(deal.status, 'deal')}`}>{deal.status}</span>
                                      {deal.stage && <span className="text-xs text-muted-foreground capitalize">{deal.stage.replace(/_/g, ' ')}</span>}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold">{deal.value ? formatCurrency(Number(deal.value)) : '-'}</p>
                                    {deal.expected_close_date && <p className="text-xs text-muted-foreground">{new Date(deal.expected_close_date).toLocaleDateString()}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No deals yet</p>
                            <p className="text-sm">Deals associated with this company will appear here</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "notes" && (
                      <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {can(COMPANIES_WRITE) && (
                          <div className="border border-border rounded-lg p-4 bg-muted/30">
                            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note about this company..." className="min-h-[100px] resize-none" />
                            <div className="flex justify-end mt-3">
                              <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim() || updateCompany.isPending}>
                                {updateCompany.isPending ? (
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
                {company.entity_data.email && (
                  <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => window.location.href = `mailto:${company.entity_data.email}`}>
                    <Mail className="h-4 w-4" />Send Email
                  </Button>
                )}
                {company.entity_data.phone && (
                  <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => window.location.href = `tel:${company.entity_data.phone}`}>
                    <Phone className="h-4 w-4" />Make Call
                  </Button>
                )}
                <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => setActiveTab("activity")}>
                  <Calendar className="h-4 w-4" />Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Financial Info */}
            {(company.entity_data?.annual_revenue || company.entity_data?.employees || company.entity_data?.industry) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {company.entity_data?.annual_revenue && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Revenue</span>
                      <span className="font-medium">{formatCurrency(Number(company.entity_data.annual_revenue) || 0)}</span>
                    </div>
                  )}
                  {company.entity_data?.employees && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employees</span>
                      <span className="font-medium">{company.entity_data.employees}</span>
                    </div>
                  )}
                  {company.entity_data?.industry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-medium capitalize">{company.entity_data.industry}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Deal Summary */}
            {companyDeals.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Deal Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{dealStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{dealStats.open}</p>
                      <p className="text-xs text-muted-foreground">Open</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <p className="text-lg font-bold text-green-600">{dealStats.won}</p>
                      <p className="text-xs text-muted-foreground">Won</p>
                    </div>
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <p className="text-lg font-bold text-red-600">{dealStats.lost}</p>
                      <p className="text-xs text-muted-foreground">Lost</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Value</span>
                      <span className="font-semibold">{formatCurrency(dealStats.totalValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Won Value</span>
                      <span className="font-semibold text-green-600">{formatCurrency(dealStats.wonValue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            {(company.entity_data?.city || company.entity_data?.state || company.entity_data?.country || company.entity_data?.address) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {company.entity_data?.address && <p className="text-muted-foreground">{company.entity_data.address}</p>}
                  <p className="text-muted-foreground">
                    {[company.entity_data?.city, company.entity_data?.state, company.entity_data?.zip_code].filter(Boolean).join(', ')}
                  </p>
                  {company.entity_data?.country && <p className="text-muted-foreground">{company.entity_data.country}</p>}
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
                  {can(COMPANIES_WRITE) && (
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
                        {can(COMPANIES_WRITE) && (
                          <button
                            onClick={() => unassignTag.mutate({ tagId: et.tag.id, entityType: "company", entityId: companyId })}
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
                          assignTag.mutate({ tagId: tag.id, entityType: "company", entityId: companyId });
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

      <AnimatePresence>
        {showLinkContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => { setShowLinkContactModal(false); setContactSearchTerm(""); setSelectedContactId(null); setLinkTitle(""); setLinkDepartment(""); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-[101] w-full max-w-lg bg-background border border-border rounded-xl shadow-2xl"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Link Contact</h3>
                    <p className="text-sm text-muted-foreground">Add a contact association to {company.entity_data.name || 'this company'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={contactSearchTerm}
                    onChange={(e) => { setContactSearchTerm(e.target.value); setSelectedContactId(null); }}
                    className="pl-9"
                    autoFocus
                  />
                </div>

                {!selectedContactId && contactSearchTerm.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                    {filteredContactResults.length > 0 ? (
                      filteredContactResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedContactId(c.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold shrink-0">
                            {(c.display_name || 'C')[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{c.display_name || 'Unnamed'}</p>
                            {c.display_email && <p className="text-xs text-muted-foreground truncate">{c.display_email}</p>}
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No contacts found</p>
                    )}
                  </div>
                )}

                {selectedContactId && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {(filteredContactResults.find(c => c.id === selectedContactId)?.display_name || contactSearchTerm || 'C')[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{filteredContactResults.find(c => c.id === selectedContactId)?.display_name || 'Selected Contact'}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedContactId(null)}>
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Role at this company (optional)</p>
                      <Input
                        placeholder="Job Title"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                      />
                      <Input
                        placeholder="Department"
                        value={linkDepartment}
                        onChange={(e) => setLinkDepartment(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowLinkContactModal(false); setContactSearchTerm(""); setSelectedContactId(null); setLinkTitle(""); setLinkDepartment(""); }}>
                  Cancel
                </Button>
                <Button onClick={handleLinkContact} disabled={!selectedContactId || updateContact.isPending}>
                  {updateContact.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Link Contact
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Company"
        description="Are you sure you want to delete this company? This will permanently remove it from your CRM and cannot be undone."
        itemName={company.entity_data.name || 'Company'}
        itemType="Company"
        icon={Building2}
        isDeleting={isDeleting}
      />

      <CompanyV2FormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={company}
        mode="edit"
      />
    </div>
  );
}
