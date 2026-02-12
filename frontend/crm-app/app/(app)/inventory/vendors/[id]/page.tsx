"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Mail,
  Trash2,
  Phone,
  Building2,
  Star,
  FileText,
  DollarSign,
  MessageSquare,
  Plus,
  Package,
  Truck,
  AlertCircle,
  ClipboardList,
  User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { VendorFormDrawer } from "@/components/Forms/Inventory";
import type { Vendor as VendorType } from "@/lib/types";

// Vendor type definition
type Vendor = {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string;
  taxId: string;
  paymentTerms: string;
  category: string;
  status: "Active" | "Inactive" | "Preferred";
  rating: number;
  since: string;
  created: string;
  initials: string;
};

// Mock vendor data
const vendors: Vendor[] = [
  {
    id: 1,
    name: "Dell Technologies",
    contactPerson: "John Smith",
    email: "john.smith@dell.com",
    phone: "+1-555-0101",
    address: "1 Dell Way",
    city: "Round Rock",
    state: "TX",
    country: "USA",
    website: "www.dell.com",
    taxId: "TX-123456789",
    paymentTerms: "Net 30",
    category: "Technology Hardware",
    status: "Preferred",
    rating: 4.8,
    since: "Jan 1, 2025",
    created: "Jan 1, 2025",
    initials: "DT",
  },
  {
    id: 2,
    name: "Microsoft Corporation",
    contactPerson: "Sarah Johnson",
    email: "sarah.j@microsoft.com",
    phone: "+1-555-0102",
    address: "One Microsoft Way",
    city: "Redmond",
    state: "WA",
    country: "USA",
    website: "www.microsoft.com",
    taxId: "WA-987654321",
    paymentTerms: "Net 45",
    category: "Software & Services",
    status: "Active",
    rating: 4.7,
    since: "Jan 5, 2025",
    created: "Jan 5, 2025",
    initials: "MC",
  },
  {
    id: 3,
    name: "AWS Cloud Services",
    contactPerson: "Mike Davis",
    email: "mike.davis@aws.com",
    phone: "+1-555-0103",
    address: "410 Terry Avenue North",
    city: "Seattle",
    state: "WA",
    country: "USA",
    website: "www.aws.amazon.com",
    taxId: "WA-456789123",
    paymentTerms: "Net 30",
    category: "Cloud Services",
    status: "Active",
    rating: 4.9,
    since: "Feb 1, 2025",
    created: "Feb 1, 2025",
    initials: "AW",
  },
  {
    id: 4,
    name: "HP Inc.",
    contactPerson: "Lisa Chen",
    email: "lisa.chen@hp.com",
    phone: "+1-555-0104",
    address: "1501 Page Mill Road",
    city: "Palo Alto",
    state: "CA",
    country: "USA",
    website: "www.hp.com",
    taxId: "CA-789123456",
    paymentTerms: "Net 30",
    category: "Technology Hardware",
    status: "Inactive",
    rating: 4.2,
    since: "Mar 10, 2025",
    created: "Mar 10, 2025",
    initials: "HP",
  },
  {
    id: 5,
    name: "Cisco Systems",
    contactPerson: "Robert Brown",
    email: "robert.brown@cisco.com",
    phone: "+1-555-0105",
    address: "170 West Tasman Drive",
    city: "San Jose",
    state: "CA",
    country: "USA",
    website: "www.cisco.com",
    taxId: "CA-321654987",
    paymentTerms: "Net 30",
    category: "Networking Equipment",
    status: "Active",
    rating: 4.6,
    since: "Apr 5, 2025",
    created: "Apr 5, 2025",
    initials: "CS",
  },
];

// Mock purchase orders for vendors
const purchaseOrders = [
  {
    id: 1,
    vendorId: 1,
    poNumber: "PO-2026-001",
    items: 5,
    total: 6495.0,
    status: "Ordered",
    orderDate: "Jan 15, 2026",
    expectedDate: "Jan 25, 2026",
  },
  {
    id: 2,
    vendorId: 1,
    poNumber: "PO-2025-098",
    items: 8,
    total: 12450.0,
    status: "Received",
    orderDate: "Dec 28, 2025",
    expectedDate: "Jan 8, 2026",
  },
  {
    id: 3,
    vendorId: 1,
    poNumber: "PO-2025-095",
    items: 3,
    total: 2997.0,
    status: "Ordered",
    orderDate: "Jan 20, 2026",
    expectedDate: "Feb 1, 2026",
  },
  {
    id: 4,
    vendorId: 2,
    poNumber: "PO-2026-002",
    items: 12,
    total: 948.0,
    status: "Received",
    orderDate: "Jan 10, 2026",
    expectedDate: "Jan 20, 2026",
  },
  {
    id: 5,
    vendorId: 3,
    poNumber: "PO-2026-003",
    items: 3,
    total: 2997.0,
    status: "Draft",
    orderDate: "Jan 20, 2026",
    expectedDate: "Feb 1, 2026",
  },
];

// Mock products supplied by vendors
const productsSupplied = [
  {
    id: 1,
    vendorId: 1,
    name: "Dell OptiPlex 7090 Desktop",
    sku: "DELL-OPT-7090",
    category: "Desktops",
    price: 1299.0,
    stock: 45,
  },
  {
    id: 2,
    vendorId: 1,
    name: "Dell Latitude 7420 Laptop",
    sku: "DELL-LAT-7420",
    category: "Laptops",
    price: 1499.0,
    stock: 32,
  },
  {
    id: 3,
    vendorId: 1,
    name: "Dell UltraSharp U2720Q Monitor",
    sku: "DELL-U2720Q",
    category: "Monitors",
    price: 599.0,
    stock: 28,
  },
  {
    id: 4,
    vendorId: 2,
    name: "Microsoft Surface Pro 9",
    sku: "MS-SURF-PRO9",
    category: "Tablets",
    price: 999.0,
    stock: 15,
  },
  {
    id: 5,
    vendorId: 2,
    name: "Microsoft 365 Business Premium",
    sku: "MS-365-BP",
    category: "Software",
    price: 22.0,
    stock: 999,
  },
  {
    id: 6,
    vendorId: 3,
    name: "AWS EC2 Instance Credits",
    sku: "AWS-EC2-CRED",
    category: "Cloud Services",
    price: 0.1,
    stock: 999999,
  },
];

// Mock notes
const mockNotes = [
  {
    id: 1,
    content: "Excellent vendor with fast delivery times. Always meets deadlines and provides quality products.",
    author: "John Doe",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Negotiated better pricing for bulk orders. Payment terms are flexible and vendor is responsive.",
    author: "Jane Smith",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
];

type TabType = "details" | "purchaseOrders" | "products" | "notes";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");
  
  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Partial<VendorType> | null>(null);

  // Find vendor by ID
  const vendor = useMemo(() => {
    const vendorId = parseInt(id);
    return vendors.find((v) => v.id === vendorId);
  }, [id]);

  // Get vendor purchase orders
  const vendorPOs = useMemo(() => {
    if (!vendor) return [];
    return purchaseOrders.filter((po) => po.vendorId === vendor.id);
  }, [vendor]);

  // Get vendor products
  const vendorProducts = useMemo(() => {
    if (!vendor) return [];
    return productsSupplied.filter((p) => p.vendorId === vendor.id);
  }, [vendor]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!vendor) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        activeOrders: 0,
        averageDelivery: 0,
      };
    }

    const totalOrders = vendorPOs.length;
    const totalSpent = vendorPOs.reduce((sum, po) => sum + po.total, 0);
    const activeOrders = vendorPOs.filter(
      (po) => po.status === "Ordered" || po.status === "Draft"
    ).length;
    
    // Calculate average delivery time (mock calculation)
    const averageDelivery = 7; // days

    return {
      totalOrders,
      totalSpent,
      activeOrders,
      averageDelivery,
    };
  }, [vendor, vendorPOs]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vendor) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted vendor:", vendor.name);
      router.push("/inventory/vendors");
    } catch (error) {
      console.error("Error deleting vendor:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleEditVendor = () => {
    if (!vendor) return;
    setEditingVendor({
      id: vendor.id,
      name: vendor.name,
      contact: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      country: vendor.country,
      website: vendor.website,
      status: vendor.status as "Active" | "Inactive" | "Pending",
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<VendorType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      setFormDrawerOpen(false);
      setEditingVendor(null);
    } catch (error) {
      console.error("Error saving vendor:", error);
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
      Active: "bg-primary/10 text-primary",
      Inactive: "bg-muted text-muted-foreground",
      Preferred: "bg-accent/10 text-accent",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  // PO Status badge colors
  const getPOStatusColors = (status: string) => {
    const colors = {
      Draft: "bg-muted text-muted-foreground",
      Ordered: "bg-primary/20 text-primary",
      Received: "bg-accent/20 text-accent",
      Cancelled: "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : star <= rating
                ? "fill-yellow-200 text-yellow-200"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-foreground">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // If vendor not found
  if (!vendor) {
    return (
      <div className="min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="h-16 w-16 text-gray-400" />
          <h2 className="text-2xl font-semibold text-gray-900">Vendor Not Found</h2>
          <p className="text-gray-600">The vendor you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/inventory/vendors")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "purchaseOrders" as TabType, label: "Purchase Orders", icon: ClipboardList },
    { id: "products" as TabType, label: "Products Supplied", icon: Package },
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
              onClick={() => router.push("/inventory/vendors")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Vendors
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {vendor.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{vendor.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{vendor.category}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                      vendor.status
                    )}`}
                  >
                    {vendor.status}
                  </span>
                  {renderRating(vendor.rating)}
                  <span className="text-sm text-muted-foreground">Created {vendor.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleEditVendor}
              >
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
                <ClipboardList className="h-4 w-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
              <p className="text-xs text-muted-foreground mt-1">Purchase orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                ${stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.activeOrders}</p>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Average Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.averageDelivery}</p>
              <p className="text-xs text-muted-foreground mt-1">Days</p>
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
                            <h3 className="text-lg font-semibold mb-4">Vendor Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                                <p className="text-base font-medium">{vendor.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                                <p className="text-base font-medium">{vendor.contactPerson}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Email</p>
                                <p className="text-base font-medium">{vendor.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                <p className="text-base font-medium">{vendor.phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Address</p>
                                <p className="text-base font-medium">
                                  {vendor.address}, {vendor.city}, {vendor.state} {vendor.country}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Business Details</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Website</p>
                                <a
                                  href={`https://${vendor.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-base font-medium text-primary hover:underline"
                                >
                                  {vendor.website}
                                </a>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Tax ID</p>
                                <p className="text-base font-medium">{vendor.taxId}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Payment Terms</p>
                                <p className="text-base font-medium">{vendor.paymentTerms}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Category</p>
                                <p className="text-base font-medium">{vendor.category}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                    vendor.status
                                  )}`}
                                >
                                  {vendor.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "purchaseOrders" && (
                      <motion.div
                        key="purchaseOrders"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {vendorPOs.length > 0 ? (
                          vendorPOs.map((po) => (
                            <Card key={po.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-sm font-semibold text-foreground">
                                        {po.poNumber}
                                      </h4>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPOStatusColors(
                                          po.status
                                        )}`}
                                      >
                                        {po.status}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span>{po.items} items</span>
                                      <span>•</span>
                                      <span className="font-medium text-foreground">
                                        ${po.total.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      <span>•</span>
                                      <span>Order: {po.orderDate}</span>
                                      <span>•</span>
                                      <span>Expected: {po.expectedDate}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(`/inventory/purchase-orders/${po.id}`)
                                    }
                                  >
                                    View
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-3" />
                            <p>No purchase orders found</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "products" && (
                      <motion.div
                        key="products"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {vendorProducts.length > 0 ? (
                          vendorProducts.map((product) => (
                            <Card key={product.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-foreground mb-1">
                                      {product.name}
                                    </h4>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span>SKU: {product.sku}</span>
                                      <span>•</span>
                                      <span>{product.category}</span>
                                      <span>•</span>
                                      <span className="font-medium text-foreground">
                                        ${product.price.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      <span>•</span>
                                      <span>Stock: {product.stock}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(`/inventory/products/${product.id}`)
                                    }
                                  >
                                    View
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-3" />
                            <p>No products found</p>
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
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Add Note</label>
                          <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Enter your note here..."
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end">
                            <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim()}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          </div>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-foreground">Previous Notes</h3>
                          {mockNotes.map((note) => (
                            <div
                              key={note.id}
                              className="p-4 bg-muted/50 rounded-lg border border-border"
                            >
                              <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                                {note.content}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{note.author}</span>
                                <span>
                                  {note.date} at {note.time}
                                </span>
                              </div>
                            </div>
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
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => (window.location.href = `mailto:${vendor.email}`)}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => (window.location.href = `tel:${vendor.phone}`)}
                >
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
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
                  <p className="text-xs text-muted-foreground mb-1">Since</p>
                  <p className="text-sm font-medium text-foreground">{vendor.since}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  {renderRating(vendor.rating)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium text-foreground">{vendor.category}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Primary Contact</p>
                  <p className="text-sm font-medium text-foreground">{vendor.contactPerson}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a
                    href={`mailto:${vendor.email}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {vendor.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <a
                    href={`tel:${vendor.phone}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {vendor.phone}
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
        title="Delete Vendor"
        description="Are you sure you want to delete this vendor? This will permanently remove it from your CRM and cannot be undone."
        itemName={vendor.name}
        itemType="Vendor"
        icon={Building2}
        isDeleting={isDeleting}
      />

      {/* Vendor Form Drawer */}
      <VendorFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingVendor(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingVendor}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
