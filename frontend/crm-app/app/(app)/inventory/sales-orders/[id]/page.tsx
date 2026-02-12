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
  Package,
  Truck,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Plus,
  AlertCircle,
  ShoppingCart,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  DollarSign,
  Navigation,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { SalesOrderFormDrawer } from "@/components/Forms/Inventory";
import type { SalesOrder as SalesOrderType } from "@/lib/types";

// Sales Order data structure
type SalesOrder = {
  id: number;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  orderDate: string;
  shipDate: string | null;
  deliveryDate: string;
  shippingMethod: string;
  trackingNumber: string | null;
  billingAddress: string;
  shippingAddress: string;
  created: string;
  lineItems: LineItem[];
  shippingHistory: ShippingEvent[];
  notes: Note[];
};

type LineItem = {
  id: number;
  product: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  fulfilled: number;
  status: "Pending" | "Partial" | "Fulfilled";
};

type ShippingEvent = {
  id: number;
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
};

type Note = {
  id: number;
  content: string;
  author: string;
  date: string;
  time: string;
};

// Mock sales orders data
const salesOrders: SalesOrder[] = [
  {
    id: 1,
    orderNumber: "SO-2026-001",
    customer: "Acme Corporation",
    customerEmail: "orders@acme.com",
    customerPhone: "+1-555-100-1001",
    total: 1247.0,
    status: "Processing",
    orderDate: "Jan 25, 2026",
    shipDate: null,
    deliveryDate: "Feb 5, 2026",
    shippingMethod: "Standard Ground",
    trackingNumber: null,
    billingAddress: "123 Business St, Suite 100, New York, NY 10001",
    shippingAddress: "123 Business St, Suite 100, New York, NY 10001",
    created: "Jan 25, 2026",
    lineItems: [
      {
        id: 1,
        product: "Enterprise Software License",
        description: "Annual enterprise software license",
        quantity: 1,
        unitPrice: 999.0,
        total: 999.0,
        fulfilled: 0,
        status: "Pending",
      },
      {
        id: 2,
        product: "Premium Support Package",
        description: "24/7 premium support for Q1 2026",
        quantity: 1,
        unitPrice: 248.0,
        total: 248.0,
        fulfilled: 0,
        status: "Pending",
      },
    ],
    shippingHistory: [],
    notes: [
      {
        id: 1,
        content: "Order received and being processed. Expected to ship within 2-3 business days.",
        author: "John Smith",
        date: "Jan 25, 2026",
        time: "10:30 AM",
      },
    ],
  },
  {
    id: 2,
    orderNumber: "SO-2026-002",
    customer: "TechStart Inc",
    customerEmail: "purchasing@techstart.io",
    customerPhone: "+1-555-222-3001",
    total: 2495.0,
    status: "Shipped",
    orderDate: "Jan 22, 2026",
    shipDate: "Jan 26, 2026",
    deliveryDate: "Feb 2, 2026",
    shippingMethod: "Express Shipping",
    trackingNumber: "TRK-2026-789456",
    billingAddress: "456 Innovation Ave, San Francisco, CA 94102",
    shippingAddress: "456 Innovation Ave, San Francisco, CA 94102",
    created: "Jan 22, 2026",
    lineItems: [
      {
        id: 1,
        product: "Professional License",
        description: "Quarterly professional software license",
        quantity: 2,
        unitPrice: 1000.0,
        total: 2000.0,
        fulfilled: 2,
        status: "Fulfilled",
      },
      {
        id: 2,
        product: "Setup & Configuration",
        description: "Initial setup and configuration service",
        quantity: 1,
        unitPrice: 495.0,
        total: 495.0,
        fulfilled: 1,
        status: "Fulfilled",
      },
    ],
    shippingHistory: [
      {
        id: 1,
        date: "Jan 26, 2026",
        time: "2:15 PM",
        location: "Warehouse Facility, San Francisco",
        status: "Shipped",
        description: "Package picked up by carrier",
      },
      {
        id: 2,
        date: "Jan 27, 2026",
        time: "8:30 AM",
        location: "Distribution Center, Los Angeles",
        status: "In Transit",
        description: "Package in transit to destination",
      },
      {
        id: 3,
        date: "Jan 28, 2026",
        time: "11:45 AM",
        location: "Local Facility, San Francisco",
        status: "Out for Delivery",
        description: "Package out for delivery",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Order shipped via express shipping. Customer requested expedited delivery.",
        author: "Sarah Johnson",
        date: "Jan 26, 2026",
        time: "2:20 PM",
      },
    ],
  },
  {
    id: 3,
    orderNumber: "SO-2026-003",
    customer: "Global Solutions Ltd",
    customerEmail: "procurement@globalsolutions.com",
    customerPhone: "+1-555-444-5001",
    total: 398.0,
    status: "Pending",
    orderDate: "Jan 27, 2026",
    shipDate: null,
    deliveryDate: "Feb 10, 2026",
    shippingMethod: "Standard Ground",
    trackingNumber: null,
    billingAddress: "789 Corporate Blvd, Chicago, IL 60601",
    shippingAddress: "789 Corporate Blvd, Chicago, IL 60601",
    created: "Jan 27, 2026",
    lineItems: [
      {
        id: 1,
        product: "Basic License",
        description: "Monthly basic software license",
        quantity: 2,
        unitPrice: 199.0,
        total: 398.0,
        fulfilled: 0,
        status: "Pending",
      },
    ],
    shippingHistory: [],
    notes: [],
  },
  {
    id: 4,
    orderNumber: "SO-2026-004",
    customer: "Enterprise Partners",
    customerEmail: "orders@enterprisepartners.com",
    customerPhone: "+1-555-666-7001",
    total: 5992.0,
    status: "Delivered",
    orderDate: "Jan 15, 2026",
    shipDate: "Jan 18, 2026",
    deliveryDate: "Jan 28, 2026",
    shippingMethod: "Standard Ground",
    trackingNumber: "TRK-2026-123456",
    billingAddress: "321 Enterprise Way, Boston, MA 02101",
    shippingAddress: "321 Enterprise Way, Boston, MA 02101",
    created: "Jan 15, 2026",
    lineItems: [
      {
        id: 1,
        product: "Enterprise License",
        description: "Annual enterprise software license",
        quantity: 3,
        unitPrice: 1500.0,
        total: 4500.0,
        fulfilled: 3,
        status: "Fulfilled",
      },
      {
        id: 2,
        product: "Training Sessions",
        description: "On-site training (4 sessions)",
        quantity: 4,
        unitPrice: 373.0,
        total: 1492.0,
        fulfilled: 4,
        status: "Fulfilled",
      },
    ],
    shippingHistory: [
      {
        id: 1,
        date: "Jan 18, 2026",
        time: "9:00 AM",
        location: "Warehouse Facility, Boston",
        status: "Shipped",
        description: "Package picked up by carrier",
      },
      {
        id: 2,
        date: "Jan 20, 2026",
        time: "3:30 PM",
        location: "Distribution Center, Boston",
        status: "In Transit",
        description: "Package in transit to destination",
      },
      {
        id: 3,
        date: "Jan 25, 2026",
        time: "10:15 AM",
        location: "Local Facility, Boston",
        status: "Out for Delivery",
        description: "Package out for delivery",
      },
      {
        id: 4,
        date: "Jan 28, 2026",
        time: "2:45 PM",
        location: "321 Enterprise Way, Boston, MA 02101",
        status: "Delivered",
        description: "Package delivered successfully",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Order delivered successfully. Customer confirmed receipt.",
        author: "Mike Davis",
        date: "Jan 28, 2026",
        time: "3:00 PM",
      },
    ],
  },
];

type TabType = "details" | "lineItems" | "shipping" | "notes";

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingSalesOrder, setEditingSalesOrder] = useState<Partial<SalesOrderType> | null>(null);

  // Find sales order by ID
  const order = useMemo(() => {
    const orderId = parseInt(id);
    return salesOrders.find((o) => o.id === orderId);
  }, [id]);

  // Calculate fulfillment percentage
  const fulfillmentStats = useMemo(() => {
    if (!order) return { fulfilled: 0, total: 0, percentage: 0 };
    const totalItems = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const fulfilledItems = order.lineItems.reduce((sum, item) => sum + item.fulfilled, 0);
    const percentage = totalItems > 0 ? Math.round((fulfilledItems / totalItems) * 100) : 0;
    return { fulfilled: fulfilledItems, total: totalItems, percentage };
  }, [order]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!order) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted sales order:", order.orderNumber);
      router.push("/inventory/sales-orders");
    } catch (error) {
      console.error("Error deleting sales order:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleEditSalesOrder = () => {
    if (!order) return;
    setEditingSalesOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      total: order.total,
      status: order.status as "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled",
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      shippingAddress: order.shippingAddress,
      notes: order.notes?.map(n => n.content).join("\n"),
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<SalesOrderType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      setFormDrawerOpen(false);
      setEditingSalesOrder(null);
    } catch (error) {
      console.error("Error saving sales order:", error);
      throw error;
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  const handleMarkShipped = () => {
    if (!order) return;
    console.log("Marking order as shipped:", order.orderNumber);
    // In a real app, this would make an API call
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Pending: "bg-yellow-500/20 text-yellow-600",
      Processing: "bg-blue-500/20 text-blue-600",
      Shipped: "bg-purple-500/20 text-purple-600",
      Delivered: "bg-green-500/20 text-green-600",
      Cancelled: "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Line item status colors
  const getLineItemStatusColors = (status: string) => {
    const colors = {
      Pending: "bg-yellow-500/20 text-yellow-600",
      Partial: "bg-orange-500/20 text-orange-600",
      Fulfilled: "bg-green-500/20 text-green-600",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // If order not found
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Sales Order Not Found</h2>
        <p className="text-gray-600">The sales order you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/inventory/sales-orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales Orders
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "lineItems" as TabType, label: "Line Items", icon: Package },
    { id: "shipping" as TabType, label: "Shipping History", icon: Truck },
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
              onClick={() => router.push("/inventory/sales-orders")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sales Orders
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{order.orderNumber}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{order.customer}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    order.status
                  )}`}>
                    {order.status}
                  </span>
                  <span className="text-sm text-muted-foreground">Total: ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-sm text-muted-foreground">Created {order.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => console.log("Download PDF", order.id)}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              {order.status !== "Shipped" && order.status !== "Delivered" && order.status !== "Cancelled" && (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkShipped}>
                  <Truck className="h-4 w-4" />
                  Mark Shipped
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditSalesOrder}>
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
                  ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <p className="text-2xl font-bold text-foreground">
                  {order.lineItems.length}
                </p>
                <p className="text-xs text-muted-foreground">line items</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Order Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{order.orderDate}</p>
                <p className="text-xs text-muted-foreground">Delivery: {order.deliveryDate}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Fulfillment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">
                  {fulfillmentStats.fulfilled} / {fulfillmentStats.total} items
                </p>
                <div className="mt-2 relative">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fulfillmentStats.percentage}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-brand-teal to-brand-purple"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{fulfillmentStats.percentage}% fulfilled</p>
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
                            <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                                <p className="text-base font-medium">{order.orderNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Customer</p>
                                <p className="text-base font-medium">{order.customer}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                                <p className="text-base font-medium">{order.orderDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Delivery Date</p>
                                <p className="text-base font-medium">{order.deliveryDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Shipping Method</p>
                                <p className="text-base font-medium">{order.shippingMethod}</p>
                              </div>
                              {order.trackingNumber && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                                  <p className="text-base font-medium">{order.trackingNumber}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Addresses</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Billing Address</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{order.billingAddress}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">{order.shippingAddress}</p>
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
                                <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Fulfillment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.lineItems.map((item) => (
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
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLineItemStatusColors(item.status)}`}>
                                        {item.status}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {item.fulfilled} / {item.quantity}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-border">
                                <td colSpan={4} className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                                  Total:
                                </td>
                                <td className="py-3 px-4 text-right text-lg font-bold text-foreground" colSpan={2}>
                                  ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "shipping" && (
                      <motion.div
                        key="shipping"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {order.shippingHistory.length > 0 ? (
                          order.shippingHistory.map((event, index) => (
                            <div key={event.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Truck className="h-5 w-5 text-primary" />
                                </div>
                                {index < order.shippingHistory.length - 1 && (
                                  <div className="w-0.5 h-full bg-border mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <p className="font-medium">{event.status}</p>
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                  </div>
                                  <span className="text-sm text-muted-foreground">{event.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.location}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Truck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No shipping history available</p>
                            <p className="text-sm text-muted-foreground mt-1">Shipping information will appear here once the order is shipped.</p>
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
                            placeholder="Add a note about this sales order..."
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
                          {order.notes.length > 0 ? (
                            order.notes.map((note) => (
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Download PDF", order.id)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                {order.status !== "Shipped" && order.status !== "Delivered" && order.status !== "Cancelled" && (
                  <Button className="w-full justify-start gap-2" variant="outline" onClick={handleMarkShipped}>
                    <Truck className="h-4 w-4" />
                    Ship Order
                  </Button>
                )}
                {order.trackingNumber && (
                  <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Track shipment", order.trackingNumber)}>
                    <Navigation className="h-4 w-4" />
                    Track Shipment
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{order.created}</p>
                </div>
                {order.shipDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ship Date</p>
                    <p className="text-sm font-medium">{order.shipDate}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                    order.status
                  )}`}>
                    {order.status}
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
                  <p className="text-sm font-medium">{order.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <Link
                    href={`mailto:${order.customerEmail}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {order.customerEmail}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <Link
                    href={`tel:${order.customerPhone}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {order.customerPhone}
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
        title="Delete Sales Order"
        description="Are you sure you want to delete this sales order? This will permanently remove it from your records and cannot be undone."
        itemName={order.orderNumber}
        itemType="Sales Order"
        icon={ShoppingCart}
        isDeleting={isDeleting}
      />

      {/* Sales Order Form Drawer */}
      <SalesOrderFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingSalesOrder(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingSalesOrder}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
