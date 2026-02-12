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
  Receipt,
  CreditCard,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceFormDrawer } from "@/components/Forms/Inventory";
import type { Invoice as InvoiceType } from "@/lib/types";

// Invoice data structure
type Invoice = {
  id: number;
  invoiceNumber: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
  dueDate: string;
  invoiceDate: string;
  terms: string;
  billingAddress: string;
  shippingAddress: string;
  created: string;
  lineItems: LineItem[];
  paymentHistory: PaymentRecord[];
  notes: Note[];
};

type LineItem = {
  id: number;
  product: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type PaymentRecord = {
  id: number;
  date: string;
  amount: number;
  method: string;
  reference: string;
};

type Note = {
  id: number;
  content: string;
  author: string;
  date: string;
  time: string;
};

// Mock invoices data
const invoices: Invoice[] = [
  {
    id: 1,
    invoiceNumber: "INV-2026-001",
    customer: "Acme Corporation",
    customerEmail: "billing@acme.com",
    customerPhone: "+1-555-100-1001",
    amount: 12500.0,
    amountPaid: 12500.0,
    amountDue: 0.0,
    status: "Paid",
    dueDate: "Jan 15, 2026",
    invoiceDate: "Jan 1, 2026",
    terms: "Net 30",
    billingAddress: "123 Business St, Suite 100, New York, NY 10001",
    shippingAddress: "123 Business St, Suite 100, New York, NY 10001",
    created: "Jan 1, 2026",
    lineItems: [
      {
        id: 1,
        product: "Enterprise License",
        description: "Annual enterprise software license",
        quantity: 1,
        unitPrice: 10000.0,
        total: 10000.0,
      },
      {
        id: 2,
        product: "Premium Support",
        description: "24/7 premium support package",
        quantity: 1,
        unitPrice: 2500.0,
        total: 2500.0,
      },
    ],
    paymentHistory: [
      {
        id: 1,
        date: "Jan 12, 2026",
        amount: 12500.0,
        method: "Bank Transfer",
        reference: "TXN-2026-001234",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Payment received early. Customer requested receipt confirmation.",
        author: "John Smith",
        date: "Jan 12, 2026",
        time: "2:30 PM",
      },
    ],
  },
  {
    id: 2,
    invoiceNumber: "INV-2026-002",
    customer: "TechStart Inc.",
    customerEmail: "accounts@techstart.io",
    customerPhone: "+1-555-222-3001",
    amount: 8500.5,
    amountPaid: 0.0,
    amountDue: 8500.5,
    status: "Sent",
    dueDate: "Jan 25, 2026",
    invoiceDate: "Jan 5, 2026",
    terms: "Net 15",
    billingAddress: "456 Innovation Ave, San Francisco, CA 94102",
    shippingAddress: "456 Innovation Ave, San Francisco, CA 94102",
    created: "Jan 5, 2026",
    lineItems: [
      {
        id: 1,
        product: "Professional License",
        description: "Quarterly professional software license",
        quantity: 2,
        unitPrice: 3500.0,
        total: 7000.0,
      },
      {
        id: 2,
        product: "Setup Fee",
        description: "Initial setup and configuration",
        quantity: 1,
        unitPrice: 1500.5,
        total: 1500.5,
      },
    ],
    paymentHistory: [],
    notes: [
      {
        id: 1,
        content: "Invoice sent via email. Follow up if payment not received by due date.",
        author: "Jane Doe",
        date: "Jan 5, 2026",
        time: "10:15 AM",
      },
    ],
  },
  {
    id: 3,
    invoiceNumber: "INV-2026-003",
    customer: "Global Solutions Ltd",
    customerEmail: "finance@globalsolutions.com",
    customerPhone: "+1-555-444-5001",
    amount: 15200.0,
    amountPaid: 5000.0,
    amountDue: 10200.0,
    status: "Overdue",
    dueDate: "Jan 10, 2026",
    invoiceDate: "Dec 28, 2025",
    terms: "Net 30",
    billingAddress: "789 Corporate Blvd, Chicago, IL 60601",
    shippingAddress: "789 Corporate Blvd, Chicago, IL 60601",
    created: "Dec 28, 2025",
    lineItems: [
      {
        id: 1,
        product: "Enterprise License",
        description: "Annual enterprise software license",
        quantity: 1,
        unitPrice: 12000.0,
        total: 12000.0,
      },
      {
        id: 2,
        product: "Training Sessions",
        description: "On-site training (4 sessions)",
        quantity: 4,
        unitPrice: 800.0,
        total: 3200.0,
      },
    ],
    paymentHistory: [
      {
        id: 1,
        date: "Jan 5, 2026",
        amount: 5000.0,
        method: "Credit Card",
        reference: "CC-2026-567890",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Partial payment received. Remaining balance overdue. Contact customer for payment plan.",
        author: "Mike Johnson",
        date: "Jan 15, 2026",
        time: "9:00 AM",
      },
      {
        id: 2,
        content: "Customer requested payment extension. Awaiting approval.",
        author: "Sarah Brown",
        date: "Jan 10, 2026",
        time: "3:45 PM",
      },
    ],
  },
];

type TabType = "details" | "lineItems" | "payments" | "notes";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<InvoiceType> | null>(null);

  // Find invoice by ID
  const invoice = useMemo(() => {
    const invoiceId = parseInt(id);
    return invoices.find((inv) => inv.id === invoiceId);
  }, [id]);

  // Calculate days remaining/overdue
  const daysRemaining = useMemo(() => {
    if (!invoice) return 0;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [invoice]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoice) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted invoice:", invoice.invoiceNumber);
      router.push("/inventory/invoices");
    } catch (error) {
      console.error("Error deleting invoice:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleEditInvoice = () => {
    if (!invoice) return;
    setEditingInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      amount: invoice.amount,
      status: invoice.status as "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled",
      dueDate: invoice.dueDate,
      terms: invoice.terms,
      notes: invoice.notes?.map(n => n.content).join("\n"),
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<InvoiceType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      setFormDrawerOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      console.error("Error saving invoice:", error);
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
      Paid: "bg-secondary/20 text-secondary",
      Overdue: "bg-destructive/20 text-destructive",
      Cancelled: "bg-muted text-muted-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // If invoice not found
  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Invoice Not Found</h2>
        <p className="text-gray-600">The invoice you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/inventory/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "lineItems" as TabType, label: "Line Items", icon: Package },
    { id: "payments" as TabType, label: "Payment History", icon: CreditCard },
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
              onClick={() => router.push("/inventory/invoices")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Invoices
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <Receipt className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{invoice.invoiceNumber}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{invoice.customer}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    invoice.status
                  )}`}>
                    {invoice.status}
                  </span>
                  <span className="text-sm text-muted-foreground">Total: ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-sm text-muted-foreground">Created {invoice.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Download PDF", invoice.id)}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Send", invoice.id)}>
                <Send className="h-4 w-4" />
                Send
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditInvoice}>
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
                  ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Amount Paid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-secondary font-tabular">
                  ${invoice.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount Due
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className={`text-2xl font-bold font-tabular ${invoice.amountDue > 0 ? "text-destructive" : "text-foreground"}`}>
                  ${invoice.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{invoice.dueDate}</p>
                <p className={`text-xs ${daysRemaining < 0 ? "text-destructive" : daysRemaining === 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0
                    ? "Due today"
                    : `${daysRemaining} days remaining`}
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
                            <h3 className="text-lg font-semibold mb-4">Invoice Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
                                <p className="text-base font-medium">{invoice.invoiceNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Customer</p>
                                <p className="text-base font-medium">{invoice.customer}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Invoice Date</p>
                                <p className="text-base font-medium">{invoice.invoiceDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                                <p className="text-base font-medium">{invoice.dueDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Terms</p>
                                <p className="text-base font-medium">{invoice.terms}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Addresses</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Billing Address</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{invoice.billingAddress}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{invoice.shippingAddress}</p>
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
                                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.lineItems.map((item) => (
                                <tr key={item.id} className="border-b border-border">
                                  <td className="py-3 px-4 text-sm font-medium text-foreground">{item.product}</td>
                                  <td className="py-3 px-4 text-sm text-muted-foreground">{item.description}</td>
                                  <td className="py-3 px-4 text-sm text-foreground text-right">{item.quantity}</td>
                                  <td className="py-3 px-4 text-sm text-foreground text-right">
                                    ${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4 text-sm font-semibold text-foreground text-right">
                                    ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-border">
                                <td colSpan={4} className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                                  Total:
                                </td>
                                <td className="py-3 px-4 text-right text-lg font-bold text-foreground">
                                  ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "payments" && (
                      <motion.div
                        key="payments"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {invoice.paymentHistory.length > 0 ? (
                          invoice.paymentHistory.map((payment) => (
                            <Card key={payment.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-secondary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-foreground">
                                          ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{payment.method}</p>
                                      </div>
                                    </div>
                                    <div className="ml-13 space-y-1">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>Date: {payment.date}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <FileText className="h-3 w-3" />
                                        <span>Reference: {payment.reference}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No payment history found</p>
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
                            placeholder="Add a note about this invoice..."
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
                          {invoice.notes.map((note) => (
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Download PDF", invoice.id)}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Send Invoice", invoice.id)}>
                  <Send className="h-4 w-4" />
                  Send Invoice
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Record Payment", invoice.id)}>
                  <CreditCard className="h-4 w-4" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>

            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{invoice.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Terms</p>
                  <p className="text-sm font-medium">{invoice.terms}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                    invoice.status
                  )}`}>
                    {invoice.status}
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
                  <p className="text-sm font-medium">{invoice.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <Link
                    href={`mailto:${invoice.customerEmail}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {invoice.customerEmail}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <Link
                    href={`tel:${invoice.customerPhone}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {invoice.customerPhone}
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
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This will permanently remove it from your records and cannot be undone."
        itemName={invoice.invoiceNumber}
        itemType="Invoice"
        icon={Receipt}
        isDeleting={isDeleting}
      />

      {/* Invoice Form Drawer */}
      <InvoiceFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingInvoice(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingInvoice}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
