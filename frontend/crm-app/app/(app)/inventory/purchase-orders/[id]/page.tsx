"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Mail,
  Truck,
  Package,
  ShoppingCart,
  Calendar,
  Building2,
  Phone,
  FileText,
  MessageSquare,
  Plus,
  AlertCircle,
  DollarSign,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { PurchaseOrderFormDrawer } from "@/components/Forms/Inventory";
import type { PurchaseOrder as PurchaseOrderType } from "@/lib/types";

// Purchase Order data structure
type PurchaseOrder = {
  id: number;
  poNumber: string;
  vendor: string;
  vendorContact: string;
  vendorPhone: string;
  vendorEmail: string;
  status: "Draft" | "Sent" | "Confirmed" | "Received" | "Cancelled";
  totalAmount: number;
  orderDate: string;
  deliveryDate: string;
  terms: string;
  shippingAddress: string;
  createdDate: string;
  items: LineItem[];
  receivingHistory: ReceivingRecord[];
  notes: Note[];
};

type LineItem = {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  received: number;
  receivedStatus: "pending" | "partial" | "complete";
};

type ReceivingRecord = {
  id: number;
  date: string;
  time: string;
  items: {
    productName: string;
    quantity: number;
  }[];
  receivedBy: string;
};

type Note = {
  id: number;
  content: string;
  author: string;
  date: string;
  time: string;
};

// Mock purchase orders data
const purchaseOrders: PurchaseOrder[] = [
  {
    id: 1,
    poNumber: "PO-2026-001",
    vendor: "Dell Technologies",
    vendorContact: "John Smith",
    vendorPhone: "+1-555-100-2001",
    vendorEmail: "john.smith@dell.com",
    status: "Confirmed",
    totalAmount: 6495.00,
    orderDate: "Jan 15, 2026",
    deliveryDate: "Jan 25, 2026",
    terms: "Net 30",
    shippingAddress: "123 Business St, Suite 100, San Francisco, CA 94105",
    createdDate: "Jan 15, 2026",
    items: [
      {
        id: 1,
        productName: "Dell OptiPlex 7090 Desktop",
        sku: "DELL-OP7090-001",
        quantity: 5,
        unitPrice: 899.00,
        total: 4495.00,
        received: 5,
        receivedStatus: "complete",
      },
      {
        id: 2,
        productName: "Dell UltraSharp 27 Monitor",
        sku: "DELL-U2720Q-001",
        quantity: 5,
        unitPrice: 400.00,
        total: 2000.00,
        received: 3,
        receivedStatus: "partial",
      },
    ],
    receivingHistory: [
      {
        id: 1,
        date: "Jan 20, 2026",
        time: "2:30 PM",
        items: [
          { productName: "Dell OptiPlex 7090 Desktop", quantity: 5 },
        ],
        receivedBy: "Sarah Johnson",
      },
      {
        id: 2,
        date: "Jan 22, 2026",
        time: "10:15 AM",
        items: [
          { productName: "Dell UltraSharp 27 Monitor", quantity: 3 },
        ],
        receivedBy: "Mike Chen",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Vendor confirmed delivery date. All items will be shipped together.",
        author: "John Doe",
        date: "Jan 16, 2026",
        time: "3:45 PM",
      },
      {
        id: 2,
        content: "Received partial shipment. Waiting for remaining monitors.",
        author: "Sarah Johnson",
        date: "Jan 22, 2026",
        time: "10:30 AM",
      },
    ],
  },
  {
    id: 2,
    poNumber: "PO-2026-002",
    vendor: "Microsoft Corporation",
    vendorContact: "Emily Davis",
    vendorPhone: "+1-555-200-3002",
    vendorEmail: "emily.davis@microsoft.com",
    status: "Received",
    totalAmount: 948.00,
    orderDate: "Jan 10, 2026",
    deliveryDate: "Jan 20, 2026",
    terms: "Net 15",
    shippingAddress: "456 Tech Avenue, Building B, Seattle, WA 98101",
    createdDate: "Jan 10, 2026",
    items: [
      {
        id: 1,
        productName: "Microsoft 365 Business Premium",
        sku: "MS-365-BP-001",
        quantity: 12,
        unitPrice: 79.00,
        total: 948.00,
        received: 12,
        receivedStatus: "complete",
      },
    ],
    receivingHistory: [
      {
        id: 1,
        date: "Jan 18, 2026",
        time: "11:00 AM",
        items: [
          { productName: "Microsoft 365 Business Premium", quantity: 12 },
        ],
        receivedBy: "David Brown",
      },
    ],
    notes: [
      {
        id: 1,
        content: "License keys received via email. All accounts activated successfully.",
        author: "David Brown",
        date: "Jan 18, 2026",
        time: "11:30 AM",
      },
    ],
  },
  {
    id: 3,
    poNumber: "PO-2026-003",
    vendor: "AWS Cloud Services",
    vendorContact: "Robert Wilson",
    vendorPhone: "+1-555-300-4003",
    vendorEmail: "robert.wilson@aws.com",
    status: "Draft",
    totalAmount: 2997.00,
    orderDate: "Jan 20, 2026",
    deliveryDate: "Feb 1, 2026",
    terms: "Net 30",
    shippingAddress: "789 Cloud Street, Data Center 1, Portland, OR 97201",
    createdDate: "Jan 20, 2026",
    items: [
      {
        id: 1,
        productName: "AWS EC2 Reserved Instances",
        sku: "AWS-EC2-RI-001",
        quantity: 3,
        unitPrice: 999.00,
        total: 2997.00,
        received: 0,
        receivedStatus: "pending",
      },
    ],
    receivingHistory: [],
    notes: [],
  },
];

type TabType = "details" | "lineItems" | "receivingHistory" | "notes";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<Partial<PurchaseOrderType> | null>(null);

  // Find purchase order by ID
  const purchaseOrder = useMemo(() => {
    const poId = parseInt(id);
    return purchaseOrders.find((po) => po.id === poId);
  }, [id]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!purchaseOrder) return null;
    
    const totalItems = purchaseOrder.items.length;
    const totalReceived = purchaseOrder.items.reduce((sum, item) => sum + item.received, 0);
    const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedPercentage = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

    return {
      totalAmount: purchaseOrder.totalAmount,
      itemsOrdered: totalItems,
      expectedDelivery: purchaseOrder.deliveryDate,
      receivedItems: `${totalReceived} of ${totalOrdered} (${receivedPercentage}%)`,
      receivedPercentage,
    };
  }, [purchaseOrder]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!purchaseOrder) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted purchase order:", purchaseOrder.poNumber);
      router.push("/inventory/purchase-orders");
    } catch (error) {
      console.error("Error deleting purchase order:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleEditPurchaseOrder = () => {
    if (!purchaseOrder) return;
    setEditingPurchaseOrder({
      id: purchaseOrder.id,
      poNumber: purchaseOrder.poNumber,
      vendor: purchaseOrder.vendor,
      total: purchaseOrder.totalAmount,
      status: purchaseOrder.status as "Draft" | "Ordered" | "Received" | "Cancelled",
      orderDate: purchaseOrder.orderDate,
      expectedDate: purchaseOrder.deliveryDate,
      shippingAddress: purchaseOrder.shippingAddress,
      notes: purchaseOrder.notes?.map(n => n.content).join("\n"),
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<PurchaseOrderType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      setFormDrawerOpen(false);
      setEditingPurchaseOrder(null);
    } catch (error) {
      console.error("Error saving purchase order:", error);
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
      Sent: "bg-accent/10 text-accent",
      Confirmed: "bg-primary/20 text-primary",
      Received: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      Cancelled: "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Received status colors
  const getReceivedStatusColors = (status: string) => {
    const colors = {
      pending: "bg-muted text-muted-foreground",
      partial: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
      complete: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // If purchase order not found
  if (!purchaseOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Purchase Order Not Found</h2>
        <p className="text-gray-600">The purchase order you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/inventory/purchase-orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Purchase Orders
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "lineItems" as TabType, label: "Line Items", icon: Package },
    { id: "receivingHistory" as TabType, label: "Receiving History", icon: Truck },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  if (!stats) return null;

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
              onClick={() => router.push("/inventory/purchase-orders")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Purchase Orders
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{purchaseOrder.poNumber}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="text-lg">{purchaseOrder.vendor}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    purchaseOrder.status
                  )}`}>
                    {purchaseOrder.status}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {purchaseOrder.createdDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Download", purchaseOrder.id)}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Send to Vendor", purchaseOrder.id)}>
                <Mail className="h-4 w-4" />
                Send to Vendor
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Receive Items", purchaseOrder.id)}>
                <PackageCheck className="h-4 w-4" />
                Receive Items
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditPurchaseOrder}>
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
                  ${purchaseOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items Ordered
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {stats.itemsOrdered}
                </p>
                <p className="text-xs text-muted-foreground">Line items</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expected Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{purchaseOrder.deliveryDate}</p>
                <p className="text-xs text-muted-foreground">Delivery date</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PackageCheck className="h-4 w-4" />
                Received Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{stats.receivedItems}</p>
                <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.receivedPercentage}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-brand-teal to-brand-purple rounded-full"
                  />
                </div>
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
                            <h3 className="text-lg font-semibold mb-4">Purchase Order Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">PO Number</p>
                                <p className="text-base font-medium">{purchaseOrder.poNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Vendor</p>
                                <p className="text-base font-medium">{purchaseOrder.vendor}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                                <p className="text-base font-medium">{purchaseOrder.orderDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Delivery Date</p>
                                <p className="text-base font-medium">{purchaseOrder.deliveryDate}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Terms & Shipping</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Payment Terms</p>
                                <p className="text-base font-medium">{purchaseOrder.terms}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                                <p className="text-base font-medium">{purchaseOrder.shippingAddress}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                  purchaseOrder.status
                                )}`}>
                                  {purchaseOrder.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Created</p>
                                <p className="text-base font-medium">{purchaseOrder.createdDate}</p>
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
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SKU</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Quantity</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Unit Price</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Received</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {purchaseOrder.items.map((item) => (
                                <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                  <td className="py-3 px-4">
                                    <p className="text-sm font-medium text-foreground">{item.productName}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-sm text-muted-foreground">{item.sku}</p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-sm font-medium text-foreground">{item.quantity}</p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-sm font-medium text-foreground">
                                      ${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-sm font-semibold text-foreground">
                                      ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <p className="text-sm font-medium text-foreground">{item.received} / {item.quantity}</p>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReceivedStatusColors(
                                      item.receivedStatus
                                    )}`}>
                                      {item.receivedStatus === "complete" ? "Complete" : item.receivedStatus === "partial" ? "Partial" : "Pending"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-border">
                                <td colSpan={4} className="py-3 px-4 text-right">
                                  <p className="text-sm font-semibold text-foreground">Total:</p>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <p className="text-lg font-bold text-foreground">
                                    ${purchaseOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </td>
                                <td colSpan={2}></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "receivingHistory" && (
                      <motion.div
                        key="receivingHistory"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {purchaseOrder.receivingHistory.length > 0 ? (
                          purchaseOrder.receivingHistory.map((record, index) => (
                            <div key={record.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Truck className="h-5 w-5 text-primary" />
                                </div>
                                {index < purchaseOrder.receivingHistory.length - 1 && (
                                  <div className="w-0.5 h-full bg-border mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium">Items Received</p>
                                  <span className="text-sm text-muted-foreground">{record.date}</span>
                                </div>
                                <div className="space-y-2 mb-2">
                                  {record.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Package className="h-3 w-3" />
                                      <span>{item.productName} - Qty: {item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>Received by: {record.receivedBy}</span>
                                  <span>•</span>
                                  <span>{record.time}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Truck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No receiving history available</p>
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
                            placeholder="Add a note about this purchase order..."
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
                          {purchaseOrder.notes.map((note) => (
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Download", purchaseOrder.id)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.location.href = `mailto:${purchaseOrder.vendorEmail}`}>
                  <Mail className="h-4 w-4" />
                  Email Vendor
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Mark Received", purchaseOrder.id)}>
                  <PackageCheck className="h-4 w-4" />
                  Mark Received
                </Button>
              </CardContent>
            </Card>

            {/* PO Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">PO Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{purchaseOrder.createdDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Delivery Date</p>
                  <p className="text-sm font-medium">{purchaseOrder.deliveryDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                    purchaseOrder.status
                  )}`}>
                    {purchaseOrder.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Vendor Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Vendor</p>
                  <p className="text-sm font-medium">{purchaseOrder.vendor}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contact</p>
                  <p className="text-sm font-medium">{purchaseOrder.vendorContact}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <a href={`tel:${purchaseOrder.vendorPhone}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {purchaseOrder.vendorPhone}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a href={`mailto:${purchaseOrder.vendorEmail}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {purchaseOrder.vendorEmail}
                  </a>
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
        title="Delete Purchase Order"
        description="Are you sure you want to delete this purchase order? This will permanently remove it from your CRM and cannot be undone."
        itemName={purchaseOrder.poNumber}
        itemType="Purchase Order"
        icon={ShoppingCart}
        isDeleting={isDeleting}
      />

      {/* Purchase Order Form Drawer */}
      <PurchaseOrderFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingPurchaseOrder(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingPurchaseOrder}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
