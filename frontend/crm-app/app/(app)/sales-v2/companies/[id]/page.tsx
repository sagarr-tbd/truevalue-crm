"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, Building2,
  TrendingUp, FileText, MessageSquare, Plus,
  MapPin, AlertCircle, Loader2, Link2, Globe, Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { CompanyV2FormDrawer } from "@/components/Forms/Sales";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { useCompanyV2, useUpdateCompanyV2, useDeleteCompanyV2 } from "@/lib/queries/useCompaniesV2";
import type { CreateCompanyV2Input } from "@/lib/api/companiesV2";
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, COMPANIES_WRITE, COMPANIES_DELETE } from "@/lib/permissions";

const getCompanyStatusColor = (status: string) => getStatusColor(status, 'company');

const daysSince = (dateString: string | undefined) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

type TabType = "details" | "notes";

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

  const daysSinceCreation = useMemo(() => {
    return company?.created_at ? daysSince(company.created_at) : 0;
  }, [company?.created_at]);

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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getCompanyStatusColor(company.status)}`}>
                    {company.status}
                  </span>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-sm font-medium capitalize">{(company.industry || company.entity_data.industry || 'N/A').replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm font-medium">{company.size || company.entity_data.size || "N/A"} employees</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Web Presence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                {company.entity_data.website ? (
                  <a href={company.entity_data.website.startsWith('http') ? company.entity_data.website : `https://${company.entity_data.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                    {company.entity_data.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <p className="text-sm font-medium">N/A</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(company.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Days Since Created</p>
                <p className="text-sm font-medium">{daysSinceCreation}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notes Count</p>
                <p className="text-sm font-medium">{notes.length}</p>
              </div>
              {company.entity_data.annual_revenue && (
                <div>
                  <p className="text-xs text-muted-foreground">Annual Revenue</p>
                  <p className="text-sm font-medium">${Number(company.entity_data.annual_revenue).toLocaleString()}</p>
                </div>
              )}
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
                    <Phone className="h-4 w-4" />Call
                  </Button>
                )}
                {company.entity_data.website && (
                  <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => window.open(company.entity_data.website.startsWith('http') ? company.entity_data.website : `https://${company.entity_data.website}`, '_blank')}>
                    <Globe className="h-4 w-4" />Visit Website
                  </Button>
                )}
                {can(COMPANIES_WRITE) && (
                  <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => setActiveTab("notes")}>
                    <MessageSquare className="h-4 w-4" />Add Note
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
