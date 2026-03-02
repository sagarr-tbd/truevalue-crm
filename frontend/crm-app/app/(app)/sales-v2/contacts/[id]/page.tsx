"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, Building2,
  TrendingUp, FileText, MessageSquare, Users, Plus,
  MapPin, AlertCircle, Loader2, Link2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { ContactV2FormDrawer } from "@/components/Forms/Sales";
import { DetailPageSkeleton } from "@/components/LoadingSkeletons";
import { toast } from "sonner";
import { useContactV2, useUpdateContactV2, useDeleteContactV2 } from "@/lib/queries/useContactsV2";
import type { CreateContactV2Input } from "@/lib/api/contactsV2";
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, CONTACTS_WRITE, CONTACTS_DELETE } from "@/lib/permissions";

const getContactStatusColor = (status: string) => getStatusColor(status, 'contact');

const daysSince = (dateString: string | undefined) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

type TabType = "details" | "notes";

export default function ContactV2DetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { can } = usePermission();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const { data: contact, isLoading, error } = useContactV2(contactId);
  const updateContact = useUpdateContactV2();
  const deleteContact = useDeleteContactV2();

  const daysSinceCreation = useMemo(() => {
    return contact?.created_at ? daysSince(contact.created_at) : 0;
  }, [contact?.created_at]);

  const handleDelete = async () => {
    if (!contactId) return;
    setIsDeleting(true);
    try {
      await deleteContact.mutateAsync(contactId);
      toast.success("Contact deleted successfully");
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
                  {contact.display_company && (
                    <span className="text-lg text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {contact.display_company}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getContactStatusColor(contact.status)}`}>
                    {contact.status}
                  </span>
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
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Professional Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="text-sm font-medium">{contact.display_company || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="text-sm font-medium">{contact.entity_data.title || "N/A"}</p>
              </div>
              {contact.entity_data.department && (
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{contact.entity_data.department}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium capitalize">{(contact.source || contact.entity_data.source)?.replace(/_/g, " ") || "N/A"}</p>
              </div>
              {contact.entity_data.source_detail && (
                <div>
                  <p className="text-xs text-muted-foreground">Source Detail</p>
                  <p className="text-sm font-medium">{contact.entity_data.source_detail}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(contact.created_at)}</p>
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
              {contact.last_contacted_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Last Contacted</p>
                  <p className="text-sm font-medium">{formatDate(contact.last_contacted_at)}</p>
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
                {contact.entity_data.email && (
                  <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => window.location.href = `mailto:${contact.entity_data.email}`}>
                    <Mail className="h-4 w-4" />Send Email
                  </Button>
                )}
                {contact.entity_data.phone && (
                  <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => window.location.href = `tel:${contact.entity_data.phone}`}>
                    <Phone className="h-4 w-4" />Call
                  </Button>
                )}
                {can(CONTACTS_WRITE) && (
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
    </div>
  );
}
