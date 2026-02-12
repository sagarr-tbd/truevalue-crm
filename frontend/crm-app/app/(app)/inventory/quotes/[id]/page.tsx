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
  Send,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Building2,
  Mail,
  Phone,
  Receipt,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { QuoteFormDrawer } from "@/components/Forms/Inventory";
import type { Quote as QuoteType } from "@/lib/types";

// Quote data structure
type Quote = {
  id: number;
  quoteNumber: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  discount: number;
  discountType: "amount" | "percentage";
  status: "Draft" | "Sent" | "Accepted" | "Declined" | "Expired";
  quoteDate: string;
  validUntil: string;
  terms: string;
  billingAddress: string;
  shippingAddress: string;
  created: string;
  lineItems: LineItem[];
  history: HistoryItem[];
  notes: Note[];
};

type LineItem = {
  id: number;
  product: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: "amount" | "percentage";
  total: number;
};

type HistoryItem = {
  id: number;
  type: "sent" | "viewed" | "accepted" | "declined" | "expired" | "created" | "updated";
  title: string;
  description: string;
  date: string;
  time: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
};

type Note = {
  id: number;
  content: string;
  author: string;
  date: string;
  time: string;
};

// Mock quotes data
const quotes: Quote[] = [
  {
    id: 1,
    quoteNumber: "QT-2026-001",
    customer: "Acme Corporation",
    customerEmail: "procurement@acme.com",
    customerPhone: "+1-555-100-1001",
    total: 12470.0,
    discount: 250.0,
    discountType: "amount",
    status: "Sent",
    quoteDate: "Jan 20, 2026",
    validUntil: "Feb 15, 2026",
    terms: "Net 30",
    billingAddress: "123 Business St, Suite 100\nNew York, NY 10001",
    shippingAddress: "123 Business St, Suite 100\nNew York, NY 10001",
    created: "Jan 20, 2026",
    lineItems: [
      {
        id: 1,
        product: "Enterprise License",
        description: "Annual enterprise software license",
        quantity: 1,
        unitPrice: 10000.0,
        discount: 0,
        discountType: "amount",
        total: 10000.0,
      },
      {
        id: 2,
        product: "Premium Support",
        description: "24/7 premium support package",
        quantity: 1,
        unitPrice: 2500.0,
        discount: 0,
        discountType: "amount",
        total: 2500.0,
      },
      {
        id: 3,
        product: "Training Sessions",
        description: "On-site training (2 sessions)",
        quantity: 2,
        unitPrice: 500.0,
        discount: 0,
        discountType: "amount",
        total: 1000.0,
      },
    ],
    history: [
      {
        id: 1,
        type: "created",
        title: "Quote created",
        description: "Quote created and saved as draft",
        date: "Jan 20, 2026",
        time: "10:30 AM",
        icon: FileText,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        id: 2,
        type: "sent",
        title: "Quote sent to customer",
        description: "Quote sent via email to procurement@acme.com",
        date: "Jan 20, 2026",
        time: "2:45 PM",
        icon: Send,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        id: 3,
        type: "viewed",
        title: "Quote viewed by customer",
        description: "Customer opened the quote email",
        date: "Jan 21, 2026",
        time: "9:15 AM",
        icon: FileText,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Customer requested pricing for enterprise license. Follow up in 3 days if no response.",
        author: "John Smith",
        date: "Jan 20, 2026",
        time: "10:30 AM",
      },
    ],
  },
  {
    id: 2,
    quoteNumber: "QT-2026-002",
    customer: "TechStart Inc",
    customerEmail: "purchasing@techstart.io",
    customerPhone: "+1-555-222-3001",
    total: 2899.99,
    discount: 10,
    discountType: "percentage",
    status: "Draft",
    quoteDate: "Jan 22, 2026",
    validUntil: "Feb 20, 2026",
    terms: "Net 15",
    billingAddress: "456 Innovation Ave\nSan Francisco, CA 94102",
    shippingAddress: "456 Innovation Ave\nSan Francisco, CA 94102",
    created: "Jan 22, 2026",
    lineItems: [
      {
        id: 1,
        product: "Professional License",
        description: "Quarterly professional software license",
        quantity: 2,
        unitPrice: 1500.0,
        discount: 5,
        discountType: "percentage",
        total: 2850.0,
      },
      {
        id: 2,
        product: "Setup Fee",
        description: "Initial setup and configuration",
        quantity: 1,
        unitPrice: 500.0,
        discount: 0,
        discountType: "amount",
        total: 500.0,
      },
    ],
    history: [
      {
        id: 1,
        type: "created",
        title: "Quote created",
        description: "Quote created and saved as draft",
        date: "Jan 22, 2026",
        time: "3:20 PM",
        icon: FileText,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
    ],
    notes: [],
  },
  {
    id: 3,
    quoteNumber: "QT-2026-003",
    customer: "Global Solutions Ltd",
    customerEmail: "finance@globalsolutions.com",
    customerPhone: "+1-555-444-5001",
    total: 549.0,
    discount: 0,
    discountType: "amount",
    status: "Accepted",
    quoteDate: "Jan 18, 2026",
    validUntil: "Feb 10, 2026",
    terms: "Net 30",
    billingAddress: "789 Corporate Blvd\nChicago, IL 60601",
    shippingAddress: "789 Corporate Blvd\nChicago, IL 60601",
    created: "Jan 18, 2026",
    lineItems: [
      {
        id: 1,
        product: "Basic License",
        description: "Monthly basic software license",
        quantity: 1,
        unitPrice: 549.0,
        discount: 0,
        discountType: "amount",
        total: 549.0,
      },
    ],
    history: [
      {
        id: 1,
        type: "created",
        title: "Quote created",
        description: "Quote created and saved as draft",
        date: "Jan 18, 2026",
        time: "11:00 AM",
        icon: FileText,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        id: 2,
        type: "sent",
        title: "Quote sent to customer",
        description: "Quote sent via email to finance@globalsolutions.com",
        date: "Jan 18, 2026",
        time: "2:00 PM",
        icon: Send,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        id: 3,
        type: "accepted",
        title: "Quote accepted",
        description: "Customer accepted the quote",
        date: "Jan 19, 2026",
        time: "10:30 AM",
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Customer accepted quote. Proceed with invoice generation.",
        author: "Jane Doe",
        date: "Jan 19, 2026",
        time: "10:35 AM",
      },
    ],
  },
];

type TabType = "details" | "lineItems" | "history" | "notes";

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Partial<QuoteType> | null>(null);

  // Find quote by ID
  const quote = useMemo(() => {
    const quoteId = parseInt(id);
    return quotes.find((q) => q.id === quoteId);
  }, [id]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!quote) return 0;
    const validDate = new Date(quote.validUntil);
    const today = new Date();
    const diffTime = validDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [quote]);

  // Calculate discount display
  const discountDisplay = useMemo(() => {
    if (!quote) return { text: "$0.00", value: 0 };
    if (quote.discountType === "percentage") {
      return { text: `${quote.discount}%`, value: (quote.total * quote.discount) / 100 };
    }
    return { text: `$${quote.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, value: quote.discount };
  }, [quote]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quote) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted quote:", quote.quoteNumber);
      router.push("/inventory/quotes");
    } catch (error) {
      console.error("Error deleting quote:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleEditQuote = () => {
    if (!quote) return;
    setEditingQuote({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      customer: quote.customer,
      total: quote.total,
      status: quote.status as "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired",
      validUntil: quote.validUntil,
      terms: quote.terms,
      notes: quote.notes?.map(n => n.content).join("\n"),
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<QuoteType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      setFormDrawerOpen(false);
      setEditingQuote(null);
    } catch (error) {
      console.error("Error saving quote:", error);
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
      Draft: "bg-muted text-muted-foreground",
      Sent: "bg-primary/20 text-primary",
      Accepted: "bg-secondary/20 text-secondary",
      Declined: "bg-destructive/20 text-destructive",
      Expired: "bg-muted text-muted-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // If quote not found
  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Quote Not Found</h2>
        <p className="text-gray-600">The quote you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/inventory/quotes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "lineItems" as TabType, label: "Line Items", icon: Package },
    { id: "history" as TabType, label: "History", icon: Clock },
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
              onClick={() => router.push("/inventory/quotes")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Quotes
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{quote.quoteNumber}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{quote.customer}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    quote.status
                  )}`}>
                    {quote.status}
                  </span>
                  <span className="text-sm text-muted-foreground">Total: ${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-sm text-muted-foreground">Created {quote.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Download PDF", quote.id)}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Send", quote.id)}>
                <Send className="h-4 w-4" />
                Send
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Convert to Invoice", quote.id)}>
                <Receipt className="h-4 w-4" />
                Convert to Invoice
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditQuote}>
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
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  ${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Discount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {discountDisplay.text}
                </p>
                {quote.discountType === "percentage" && (
                  <p className="text-xs text-muted-foreground">
                    ${discountDisplay.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} off
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Valid Until
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{quote.validUntil}</p>
                <p className={`text-xs ${daysRemaining < 0 ? "text-destructive" : daysRemaining === 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                  {daysRemaining < 0
                    ? `Expired ${Math.abs(daysRemaining)} days ago`
                    : daysRemaining === 0
                    ? "Expires today"
                    : `${daysRemaining} days remaining`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {quote.lineItems.length}
                </p>
                <p className="text-xs text-muted-foreground">line items</p>
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
                            <h3 className="text-lg font-semibold mb-4">Quote Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Quote Number</p>
                                <p className="text-base font-medium">{quote.quoteNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Customer</p>
                                <p className="text-base font-medium">{quote.customer}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Quote Date</p>
                                <p className="text-base font-medium">{quote.quoteDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Valid Until</p>
                                <p className="text-base font-medium">{quote.validUntil}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Terms</p>
                                <p className="text-base font-medium">{quote.terms}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Addresses</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Billing Address</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{quote.billingAddress}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{quote.shippingAddress}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "lineItems" && (
                      <motion.div
                        key="lineItems"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Product</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Description</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Quantity</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Unit Price</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Discount</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quote.lineItems.map((item) => {
                                const itemDiscount = item.discountType === "percentage" 
                                  ? (item.unitPrice * item.quantity * item.discount) / 100
                                  : item.discount;
                                const itemTotal = (item.unitPrice * item.quantity) - itemDiscount;
                                return (
                                  <tr key={item.id} className="border-b border-border">
                                    <td className="py-3 px-4 text-sm font-medium text-foreground">{item.product}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.description}</td>
                                    <td className="py-3 px-4 text-sm text-foreground text-right">{item.quantity}</td>
                                    <td className="py-3 px-4 text-sm text-foreground text-right">
                                      ${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-foreground text-right">
                                      {item.discount > 0 ? (
                                        item.discountType === "percentage" 
                                          ? `${item.discount}%`
                                          : `$${item.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      ) : "-"}
                                    </td>
                                    <td className="py-3 px-4 text-sm font-semibold text-foreground text-right">
                                      ${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-border">
                                <td colSpan={5} className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                                  Subtotal:
                                </td>
                                <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                                  ${(quote.total + discountDisplay.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                              {quote.discount > 0 && (
                                <tr>
                                  <td colSpan={5} className="py-3 px-4 text-right text-sm text-muted-foreground">
                                    Discount:
                                  </td>
                                  <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                                    -{discountDisplay.text}
                                  </td>
                                </tr>
                              )}
                              <tr className="border-t-2 border-border">
                                <td colSpan={5} className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                                  Total:
                                </td>
                                <td className="py-3 px-4 text-right text-lg font-bold text-foreground">
                                  ${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "history" && (
                      <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {quote.history.length > 0 ? (
                          quote.history.map((item, index) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${item.color}`} />
                                  </div>
                                  {index < quote.history.length - 1 && (
                                    <div className="w-0.5 h-full bg-border mt-2" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="font-medium">{item.title}</p>
                                    <span className="text-sm text-muted-foreground">{item.date}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                  <p className="text-xs text-muted-foreground">{item.time}</p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No history found</p>
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
                            placeholder="Add a note about this quote..."
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
                          {quote.notes.length > 0 ? (
                            quote.notes.map((note) => (
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
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p>No notes found</p>
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Download PDF", quote.id)}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Send Quote", quote.id)}>
                  <Send className="h-4 w-4" />
                  Send Quote
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Convert to Invoice", quote.id)}>
                  <Receipt className="h-4 w-4" />
                  Convert to Invoice
                </Button>
              </CardContent>
            </Card>

            {/* Quote Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quote Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{quote.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
                  <p className="text-sm font-medium">{quote.validUntil}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                    quote.status
                  )}`}>
                    {quote.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Customer</p>
                  <p className="text-sm font-medium">{quote.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <Link
                    href={`mailto:${quote.customerEmail}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {quote.customerEmail}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <Link
                    href={`tel:${quote.customerPhone}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {quote.customerPhone}
                  </Link>
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
        title="Delete Quote"
        description="Are you sure you want to delete this quote? This will permanently remove it from your records and cannot be undone."
        itemName={quote.quoteNumber}
        itemType="Quote"
        icon={FileText}
        isDeleting={isDeleting}
      />

      {/* Quote Form Drawer */}
      <QuoteFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingQuote(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingQuote}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
