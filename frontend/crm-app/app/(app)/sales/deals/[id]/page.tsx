"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Loader2,
  Trophy,
  XCircle,
  RefreshCw,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { DealFormDrawer, type Deal as DealType } from "@/components/Forms/Sales";
import { 
  useDeal, 
  useUpdateDeal, 
  useDeleteDeal,
  useWinDeal,
  useLoseDeal,
  useReopenDeal,
  DealFormData,
} from "@/lib/queries/useDeals";
import { useActivities, useCreateActivity } from "@/lib/queries/useActivities";
import { useCreateMeeting, type MeetingFormData } from "@/lib/queries/useMeetings";
import { useCreateCall } from "@/lib/queries/useCalls";
import { MeetingFormDrawer } from "@/components/Forms/Activities/MeetingFormDrawer";
import { CallFormDrawer } from "@/components/Forms/Activities/CallFormDrawer";
import type { Meeting, Call } from "@/lib/types";
import { useContact } from "@/lib/queries/useContacts";
import { toast } from "sonner";
import { THEME_COLORS, getStatusColor } from "@/lib/utils";
import { usePermission, DEALS_WRITE, DEALS_DELETE, ACTIVITIES_WRITE } from "@/lib/permissions";

// Activity type icon/color mapping
const ACTIVITY_TYPE_MAP: Record<string, { icon: typeof Mail; color: string; bgColor: string }> = {
  email: { icon: Mail, color: THEME_COLORS.info.text, bgColor: THEME_COLORS.info.bg },
  call: { icon: Phone, color: THEME_COLORS.success.text, bgColor: THEME_COLORS.success.bg },
  meeting: { icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-100" },
  note: { icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
  task: { icon: Activity, color: "text-teal-600", bgColor: "bg-teal-100" },
};

type TabType = "details" | "activity" | "contacts" | "notes";

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossReason, setLossReason] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Partial<DealType> | null>(null);

  // Permissions
  const { can } = usePermission();

  // Quick action drawers
  const [meetingDrawerOpen, setMeetingDrawerOpen] = useState(false);
  const [callDrawerOpen, setCallDrawerOpen] = useState(false);

  // API hooks
  const { data: deal, isLoading: isDealLoading, isError } = useDeal(id);
  const updateDeal = useUpdateDeal();
  const deleteDealMutation = useDeleteDeal();
  const winDeal = useWinDeal();
  const loseDeal = useLoseDeal();
  const reopenDeal = useReopenDeal();

  // Activities for this deal (all types)
  // Fetch all deal activities — notes derived from this, no extra API call
  const { data: dealActivitiesData, isLoading: activitiesLoading } = useActivities({
    deal_id: id,
    page_size: 50,
  });

  // Create activity mutation (for adding notes)
  const createActivity = useCreateActivity();
  const createMeeting = useCreateMeeting();
  const createCall = useCreateCall();

  // Derive notes from already-fetched activities (zero-cost client filter)
  const dealNotes = useMemo(
    () => (dealActivitiesData?.data ?? []).filter((a) => a.type === 'note'),
    [dealActivitiesData]
  );

  // Primary contact for this deal
  const { data: primaryContact, isLoading: contactLoading } = useContact(deal?.contactId || '');

  // Calculate effective probability (use stage probability as fallback)
  const effectiveProbability = useMemo(() => {
    if (!deal) return 0;
    return deal.probability ?? deal.stage?.probability ?? 0;
  }, [deal]);

  // Calculate expected revenue (amount * probability / 100)
  const expectedRevenue = useMemo(() => {
    if (!deal) return 0;
    return Math.round((deal.value * effectiveProbability) / 100);
  }, [deal, effectiveProbability]);

  // Calculate days in pipeline
  const daysInPipeline = useMemo(() => {
    if (!deal) return 0;
    const createdDate = new Date(deal.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [deal]);

  // Days in current stage
  const daysInStage = useMemo(() => {
    if (!deal?.stageEnteredAt) return 0;
    const stageDate = new Date(deal.stageEnteredAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - stageDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [deal]);

  // Check deal status
  const isWon = deal?.status === 'won';
  const isLost = deal?.status === 'lost';
  const isOpen = deal?.status === 'open';

  // Format currency helper
  const formatCurrency = (value: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || deal?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format date helper
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deal) return;

    try {
      await deleteDealMutation.mutateAsync(deal.id);
      router.push("/sales/deals");
    } catch (error) {
      console.error("Error deleting deal:", error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  // Win/Lose/Reopen handlers
  const handleWinDeal = async () => {
    if (!deal) return;
    try {
      await winDeal.mutateAsync({ id: deal.id });
    } catch (error) {
      console.error("Error marking deal as won:", error);
    }
  };

  const handleLoseDeal = async () => {
    if (!deal || !lossReason.trim()) {
      toast.error("Please provide a reason for losing the deal");
      return;
    }
    try {
      await loseDeal.mutateAsync({ 
        id: deal.id, 
        params: { loss_reason: lossReason } 
      });
      setShowLossModal(false);
      setLossReason("");
    } catch (error) {
      console.error("Error marking deal as lost:", error);
    }
  };

  const handleReopenDeal = async () => {
    if (!deal) return;
    try {
      await reopenDeal.mutateAsync({ id: deal.id });
    } catch (error) {
      console.error("Error reopening deal:", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !deal) return;
    try {
      await createActivity.mutateAsync({
        activityType: 'note',
        subject: newNote.trim().slice(0, 100),
        description: newNote.trim(),
        dealId: deal.id,
        contactId: deal.contactId,
        companyId: deal.companyId,
      });
      toast.success("Note added successfully");
      setNewNote("");
    } catch (error) {
      console.error("Failed to add note:", error);
      toast.error("Failed to add note");
    }
  };

  const handleCreateMeeting = async (data: Partial<Meeting>) => {
    await createMeeting.mutateAsync({
      subject: data.subject || "",
      description: data.description,
      status: data.status as MeetingFormData["status"],
      priority: data.priority as MeetingFormData["priority"],
      dueDate: data.dueDate,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      dealId: id,
      contactId: deal?.contactId,
      companyId: deal?.companyId,
      assignedTo: data.assignedTo,
      reminderAt: data.reminderAt,
    });
    setMeetingDrawerOpen(false);
  };

  const handleCreateCall = async (data: Partial<Call>) => {
    await createCall.mutateAsync({
      subject: data.subject || "",
      description: data.description,
      callDirection: data.callDirection,
      callOutcome: data.callOutcome,
      dueDate: data.dueDate,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      dealId: id,
      contactId: deal?.contactId,
      companyId: deal?.companyId,
      assignedTo: data.assignedTo,
    });
    setCallDrawerOpen(false);
  };

  // Form handlers
  const handleEditDeal = () => {
    if (!deal) return;
    
    setEditingDeal({
      name: deal.name,
      pipelineId: deal.pipelineId,
      stageId: deal.stageId,
      value: deal.value,
      currency: deal.currency,
      probability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate,
      companyId: deal.companyId,
      contactId: deal.contactId,
      ownerId: deal.ownerId,
      description: deal.description,
      tagIds: deal.tagIds || [],
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<DealType>) => {
    if (!deal) return;
    
    try {
      const formData: DealFormData = {
        name: data.name || deal.name,
        pipelineId: data.pipelineId || deal.pipelineId,
        stageId: data.stageId || deal.stageId,
        value: data.value ?? deal.value,
        currency: data.currency || deal.currency,
        probability: data.probability ?? deal.probability,
        expectedCloseDate: data.expectedCloseDate || deal.expectedCloseDate,
        contactId: data.contactId || deal.contactId,
        companyId: data.companyId || deal.companyId,
        ownerId: data.ownerId || deal.ownerId,
        description: data.description ?? deal.description,
        tagIds: data.tagIds,
      };
      
      await updateDeal.mutateAsync({ id: deal.id, data: formData });

      setFormDrawerOpen(false);
      setEditingDeal(null);
    } catch (error) {
      console.error("Error updating deal:", error);
      throw error;
    }
  };

  // Deal score based on probability
  const dealScore = effectiveProbability;

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground">Error Loading Deal</h2>
        <p className="text-muted-foreground">There was an error loading this deal.</p>
        <Button onClick={() => router.push("/sales/deals")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deals
        </Button>
      </div>
    );
  }

  // Show loading state while fetching
  if (isDealLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Loading deal...</p>
      </div>
    );
  }

  // If deal not found (only show after loading is complete)
  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Deal Not Found</h2>
        <p className="text-muted-foreground">The deal you&apos;re looking for doesn&apos;t exist.</p>
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
                <h1 className="text-3xl font-bold text-foreground mb-2">{deal.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {deal.companyName && (
                    <Link href={`/sales/companies/${deal.companyId}`} className="text-lg text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {deal.companyName}
                    </Link>
                  )}
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: deal.stage?.color ? `${deal.stage.color}20` : 'var(--muted)',
                      color: deal.stage?.color || 'var(--muted-foreground)',
                    }}
                  >
                    {deal.stageName}
                  </span>
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(deal.status, 'deal')}`}>
                    {deal.status}
                  </span>
                  <span className="text-lg font-semibold text-foreground font-tabular">
                    {formatCurrency(deal.value)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isOpen && can(DEALS_WRITE) && (
                <>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleEditDeal}>
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${THEME_COLORS.success.text} hover:opacity-80`}
                    onClick={handleWinDeal}
                    disabled={winDeal.isPending}
                  >
                    <Trophy className="h-4 w-4" />
                    {winDeal.isPending ? 'Winning...' : 'Won'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-orange-600 hover:text-orange-700"
                    onClick={() => setShowLossModal(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    Lost
                  </Button>
                </>
              )}
              {(isWon || isLost) && can(DEALS_WRITE) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleReopenDeal}
                  disabled={reopenDeal.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                  {reopenDeal.isPending ? 'Reopening...' : 'Reopen'}
                </Button>
              )}
              {can(DEALS_DELETE) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Won/Lost Status Banner */}
        {isWon && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 ${THEME_COLORS.success.bg} border border-primary/20 rounded-lg`}
          >
            <div className={`flex items-center gap-2 ${THEME_COLORS.success.text}`}>
              <Trophy className="h-5 w-5" />
              <span className="font-medium">
                This deal was won on {formatDate(deal.actualCloseDate || deal.updatedAt)}
              </span>
            </div>
          </motion.div>
        )}

        {isLost && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 ${THEME_COLORS.error.bg} border border-destructive/20 rounded-lg`}
          >
            <div className={`flex items-center gap-2 ${THEME_COLORS.error.text}`}>
              <XCircle className="h-5 w-5" />
              <span className="font-medium">
                This deal was lost on {formatDate(deal.actualCloseDate || deal.updatedAt)}
              </span>
            </div>
            {deal.lossReason && (
              <p className={`text-sm ${THEME_COLORS.error.text} mt-1`}>
                Reason: {deal.lossReason}
              </p>
            )}
            {deal.lossNotes && (
              <p className={`text-sm ${THEME_COLORS.error.text} mt-1`}>
                Notes: {deal.lossNotes}
              </p>
            )}
          </motion.div>
        )}

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
                Deal Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {formatCurrency(deal.value)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Weighted: {formatCurrency(deal.weightedValue || expectedRevenue)}
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
                  {effectiveProbability}%
                </p>
                <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${effectiveProbability}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-brand-teal to-brand-purple rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {deal.probability !== deal.stage?.probability ? 'Custom' : `From stage: ${deal.stageName}`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expected Close Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-lg font-semibold">{formatDate(deal.expectedCloseDate)}</p>
                {deal.actualCloseDate && (
                  <p className="text-xs text-muted-foreground">
                    Actual: {formatDate(deal.actualCloseDate)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-lg font-semibold font-tabular">
                  {daysInPipeline} <span className="text-sm font-normal text-muted-foreground">days</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {daysInStage} days in {deal.stageName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(deal.createdAt)}
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
                        {/* Main Grid - Deal Value & Pipeline Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Deal Value Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.success.bg} rounded-lg`}>
                                <DollarSign className={`h-4 w-4 ${THEME_COLORS.success.text}`} />
                              </div>
                              <h3 className="text-base font-semibold">Deal Value</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Deal Name</span>
                                <span className="text-sm font-medium text-right max-w-[60%]">{deal.name}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Value</span>
                                <span className="text-sm font-medium font-tabular">{formatCurrency(deal.value)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Weighted Value</span>
                                <span className="text-sm font-medium font-tabular">
                                  {formatCurrency(deal.weightedValue || expectedRevenue)}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Currency</span>
                                <span className="text-sm font-medium">{deal.currency}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(deal.status, 'deal')}`}>
                                  {deal.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Pipeline Details Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-brand-purple/10 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-brand-purple" />
                              </div>
                              <h3 className="text-base font-semibold">Pipeline Details</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Pipeline</span>
                                <span className="text-sm font-medium">{deal.pipelineName}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Stage</span>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    style={{ 
                                      backgroundColor: deal.stage?.color ? `${deal.stage.color}20` : 'var(--muted)',
                                      color: deal.stage?.color || 'var(--muted-foreground)',
                                    }}
                                  >
                                    {deal.stageName}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Probability</span>
                                <span className="text-sm font-medium">{effectiveProbability}%</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Days in Stage</span>
                                <span className="text-sm font-medium">{daysInStage} days</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Days in Pipeline</span>
                                <span className="text-sm font-medium">{daysInPipeline} days</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contact & Company Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Contact Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="text-base font-semibold">Contact</h3>
                            </div>
                            {deal.contactId ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                    {deal.contactName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'C'}
                                  </div>
                                  <div>
                                    <Link href={`/sales/contacts/${deal.contactId}`} className="text-sm font-medium text-primary hover:underline">
                                      {deal.contactName}
                                    </Link>
                                    {deal.contactEmail && (
                                      <p className="text-xs text-muted-foreground">{deal.contactEmail}</p>
                                    )}
                                  </div>
                                </div>
                                {deal.contactEmail && (
                                  <div className="flex justify-between items-start gap-4">
                                    <span className="text-sm text-muted-foreground shrink-0">Email</span>
                                    <a href={`mailto:${deal.contactEmail}`} className="text-sm font-medium text-primary hover:underline text-right break-all">
                                      {deal.contactEmail}
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No contact linked to this deal</p>
                            )}
                          </div>

                          {/* Company Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Building2 className="h-4 w-4 text-orange-500" />
                              </div>
                              <h3 className="text-base font-semibold">Company</h3>
                            </div>
                            {deal.companyId ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <Link href={`/sales/companies/${deal.companyId}`} className="text-sm font-medium text-primary hover:underline">
                                    {deal.companyName}
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No company linked to this deal</p>
                            )}
                          </div>
                        </div>

                        {/* Dates & Activity Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Important Dates Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`p-2 ${THEME_COLORS.info.bg} rounded-lg`}>
                                <Calendar className={`h-4 w-4 ${THEME_COLORS.info.text}`} />
                              </div>
                              <h3 className="text-base font-semibold">Important Dates</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Expected Close</span>
                                <span className="text-sm font-medium">{formatDate(deal.expectedCloseDate)}</span>
                              </div>
                              {deal.actualCloseDate && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Actual Close</span>
                                  <span className="text-sm font-medium">{formatDate(deal.actualCloseDate)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Stage Entered</span>
                                <span className="text-sm font-medium">{formatDate(deal.stageEnteredAt)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">{formatDate(deal.createdAt)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="text-sm font-medium">{formatDate(deal.updatedAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Activity & Source Card */}
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-teal-500/10 rounded-lg">
                                <Activity className="h-4 w-4 text-teal-500" />
                              </div>
                              <h3 className="text-base font-semibold">Activity & Source</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Activity Count</span>
                                <span className="text-sm font-medium">{deal.activityCount ?? 0}</span>
                              </div>
                              {deal.lastActivityAt && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Last Activity</span>
                                  <span className="text-sm font-medium">{formatDate(deal.lastActivityAt)}</span>
                                </div>
                              )}
                              {deal.convertedFromLeadId && (
                                <div className="flex justify-between items-start">
                                  <span className="text-sm text-muted-foreground">Converted From</span>
                                  <Link href={`/sales/leads/${deal.convertedFromLeadId}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                    View Lead <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description (if exists) */}
                        {deal.description && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-gray-500/10 rounded-lg">
                                <FileText className="h-4 w-4 text-gray-500" />
                              </div>
                              <h3 className="text-base font-semibold">Description</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{deal.description}</p>
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
                        {activitiesLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 w-3/4 rounded bg-muted" />
                                  <div className="h-3 w-1/2 rounded bg-muted" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (dealActivitiesData?.data?.length || 0) > 0 ? (
                          dealActivitiesData!.data.map((activity, index) => {
                            const mapping = ACTIVITY_TYPE_MAP[activity.type] || ACTIVITY_TYPE_MAP.task;
                            const Icon = mapping.icon;
                            return (
                              <div key={activity.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full ${mapping.bgColor} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${mapping.color}`} />
                                  </div>
                                  {index < dealActivitiesData!.data.length - 1 && (
                                    <div className="w-0.5 h-full bg-border mt-2" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="font-medium">{activity.subject}</p>
                                    <span className="text-sm text-muted-foreground">
                                      {formatDate(activity.createdAt)}
                                    </span>
                                  </div>
                                  {activity.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                                  )}
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground capitalize">{activity.type}</span>
                                    {activity.contact && (
                                      <Link href={`/sales/contacts/${activity.contact.id}`} className="text-xs text-primary hover:underline">
                                        {activity.contact.name}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p>No activities recorded for this deal</p>
                            <p className="text-sm mt-1">Log a call, email, or meeting to see it here</p>
                          </div>
                        )}
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
                        {contactLoading ? (
                          <div className="animate-pulse space-y-4">
                            <div className="flex items-center gap-3 p-4">
                              <div className="w-10 h-10 rounded-full bg-muted" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted" />
                              </div>
                            </div>
                          </div>
                        ) : primaryContact ? (
                          <Card className="border border-border">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                    {primaryContact.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'C'}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-foreground">
                                      {primaryContact.name}
                                    </h4>
                                    {primaryContact.jobTitle && (
                                      <p className="text-xs text-muted-foreground">{primaryContact.jobTitle}</p>
                                    )}
                                    <div className="mt-2 space-y-1">
                                      {primaryContact.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <Mail className="h-4 w-4 text-muted-foreground" />
                                          <a href={`mailto:${primaryContact.email}`} className="text-primary hover:underline">
                                            {primaryContact.email}
                                          </a>
                                        </div>
                                      )}
                                      {primaryContact.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-foreground">{primaryContact.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/sales/contacts/${primaryContact.id}`)}
                                >
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p>No contact linked to this deal</p>
                            <p className="text-sm mt-1">Edit the deal to associate a contact</p>
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
                        {can(ACTIVITIES_WRITE) && (
                          <div className="border border-border rounded-lg p-4 bg-muted/30">
                            <Textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Add a note about this deal..."
                              className="min-h-[100px] resize-none"
                            />
                            <div className="flex justify-end mt-3">
                              <Button
                                onClick={handleAddNote}
                                size="sm"
                                disabled={!newNote.trim() || createActivity.isPending}
                              >
                                {createActivity.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Note
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Notes List */}
                        {activitiesLoading ? (
                          <div className="space-y-4">
                            {[1, 2].map((i) => (
                              <Card key={i} className="border border-border">
                                <CardContent className="p-4 animate-pulse space-y-2">
                                  <div className="h-4 w-full rounded bg-muted" />
                                  <div className="h-4 w-3/4 rounded bg-muted" />
                                  <div className="h-3 w-1/4 rounded bg-muted mt-3" />
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : dealNotes.length > 0 ? (
                          <div className="space-y-4">
                            {dealNotes.map((note) => (
                              <Card key={note.id} className="border border-border">
                                <CardContent className="p-4">
                                  <p className="text-sm text-foreground whitespace-pre-wrap">
                                    {note.description || note.subject}
                                  </p>
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                    <span className="text-xs text-muted-foreground">
                                      {note.contact?.name || 'System'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(note.createdAt)}
                                    </span>
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

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Deal Status Actions */}
            {isOpen && can(DEALS_WRITE) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deal Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className={`w-full justify-start gap-2 ${THEME_COLORS.success.text} hover:opacity-80 hover:${THEME_COLORS.success.bg}`}
                    variant="outline"
                    onClick={handleWinDeal}
                    disabled={winDeal.isPending}
                  >
                    <Trophy className="h-4 w-4" />
                    {winDeal.isPending ? 'Marking as Won...' : 'Mark as Won'}
                  </Button>
                  <Button
                    className={`w-full justify-start gap-2 ${THEME_COLORS.warning.text} hover:opacity-80 hover:${THEME_COLORS.warning.bg}`}
                    variant="outline"
                    onClick={() => setShowLossModal(true)}
                    disabled={loseDeal.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    {loseDeal.isPending ? 'Marking as Lost...' : 'Mark as Lost'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {(isWon || isLost) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deal Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`p-3 rounded-lg ${isWon ? THEME_COLORS.success.bg : THEME_COLORS.error.bg}`}>
                    <div className={`flex items-center gap-2 ${isWon ? THEME_COLORS.success.text : THEME_COLORS.error.text}`}>
                      {isWon ? <Trophy className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      <span className="font-medium capitalize">{deal.status}</span>
                    </div>
                    {deal.actualCloseDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Closed on {formatDate(deal.actualCloseDate)}
                      </p>
                    )}
                  </div>
                  {can(DEALS_WRITE) && (
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={handleReopenDeal}
                      disabled={reopenDeal.isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                      {reopenDeal.isPending ? 'Reopening...' : 'Reopen Deal'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deal.contactEmail && (
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `mailto:${deal.contactEmail}`}
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                )}
                {can(ACTIVITIES_WRITE) && (
                  <>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setCallDrawerOpen(true)}
                      disabled={!isOpen}
                    >
                      <Phone className="h-4 w-4" />
                      Log Call
                    </Button>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setMeetingDrawerOpen(true)}
                      disabled={!isOpen}
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule Meeting
                    </Button>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("notes")}
                    >
                      <FileText className="h-4 w-4" />
                      Add Note
                    </Button>
                  </>
                )}
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

            {/* Deal Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deal Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pipeline</span>
                    <span className="text-sm font-medium">{deal.pipelineName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stage</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: deal.stage?.color ? `${deal.stage.color}20` : 'var(--muted)',
                        color: deal.stage?.color || 'var(--muted-foreground)',
                      }}
                    >
                      {deal.stageName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-sm font-medium font-tabular">{formatCurrency(deal.value)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Probability</span>
                    <span className="text-sm font-medium">{effectiveProbability}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Close Date</span>
                    <span className="text-sm font-medium">{formatDate(deal.expectedCloseDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Days in Pipeline</span>
                    <span className="text-sm font-medium">{daysInPipeline} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Activity Count</span>
                    <span className="text-sm font-medium">{deal.activityCount ?? 0}</span>
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
        itemName={deal.name}
        itemType="Deal"
        icon={DollarSign}
        isDeleting={deleteDealMutation.isPending}
      />

      {/* Loss Reason Modal */}
      <AnimatePresence>
        {showLossModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setShowLossModal(false);
                setLossReason("");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-background rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-orange-500" />
                Mark Deal as Lost
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide a reason for marking this deal as lost. This helps track deal performance and identify areas for improvement.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Loss Reason *</label>
                  <Textarea
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    placeholder="e.g., Price too high, Lost to competitor, Budget constraints..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowLossModal(false);
                      setLossReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLoseDeal}
                    disabled={!lossReason.trim() || loseDeal.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {loseDeal.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      'Mark as Lost'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Quick Action: Meeting Form Drawer */}
      <MeetingFormDrawer
        isOpen={meetingDrawerOpen}
        onClose={() => setMeetingDrawerOpen(false)}
        onSubmit={handleCreateMeeting}
        initialData={{ dealId: id, contactId: deal?.contactId, companyId: deal?.companyId }}
        mode="add"
      />

      {/* Quick Action: Call Form Drawer */}
      <CallFormDrawer
        isOpen={callDrawerOpen}
        onClose={() => setCallDrawerOpen(false)}
        onSubmit={handleCreateCall}
        initialData={{ dealId: id, contactId: deal?.contactId, companyId: deal?.companyId }}
        mode="add"
      />
    </div>
  );
}
