"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  MessageSquare,
  Plus,
  ShoppingCart,
  Warehouse,
  BarChart3,
  Calendar,
  Tag,
  User,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormDrawer } from "@/components/Forms/Inventory";
import type { Product as ProductType } from "@/lib/types";

// Product data structure (matching products list page)
type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  status: "Active" | "Inactive" | "Out of Stock";
  vendor: string;
  created: string;
  description?: string;
  reorderLevel?: number;
  supplier?: string;
  lastUpdated?: string;
};

// Mock products data
const products: Product[] = [
  {
    id: 1,
    name: "CRM Pro License",
    sku: "CRM-PRO-001",
    category: "Software",
    price: 99.0,
    cost: 45.0,
    quantity: 500,
    status: "Active",
    vendor: "Internal",
    created: "Jan 15, 2026",
    description: "Professional CRM software license for small to medium businesses. Includes all core features, email integration, and 24/7 support.",
    reorderLevel: 50,
    supplier: "Internal Development Team",
    lastUpdated: "Jan 28, 2026",
  },
  {
    id: 2,
    name: "Cloud Storage 1TB",
    sku: "CLOUD-1TB-002",
    category: "Services",
    price: 49.99,
    cost: 25.0,
    quantity: 1000,
    status: "Active",
    vendor: "AWS",
    created: "Jan 10, 2026",
    description: "Cloud storage service with 1TB capacity. Includes backup, sync, and sharing features.",
    reorderLevel: 100,
    supplier: "Amazon Web Services",
    lastUpdated: "Jan 27, 2026",
  },
  {
    id: 3,
    name: "Premium Support Package",
    sku: "SUP-PREM-003",
    category: "Services",
    price: 199.0,
    cost: 80.0,
    quantity: 250,
    status: "Active",
    vendor: "Internal",
    created: "Jan 8, 2026",
    description: "Premium support package with 24/7 phone support, priority ticket handling, and dedicated account manager.",
    reorderLevel: 25,
    supplier: "Internal Support Team",
    lastUpdated: "Jan 26, 2026",
  },
  {
    id: 4,
    name: "Enterprise Hardware Kit",
    sku: "HW-ENT-004",
    category: "Hardware",
    price: 1299.0,
    cost: 850.0,
    quantity: 45,
    status: "Active",
    vendor: "Dell",
    created: "Jan 5, 2026",
    description: "Complete enterprise hardware kit including servers, networking equipment, and storage solutions.",
    reorderLevel: 10,
    supplier: "Dell Technologies",
    lastUpdated: "Jan 25, 2026",
  },
  {
    id: 5,
    name: "Training Module Basic",
    sku: "TRN-BAS-005",
    category: "Training",
    price: 299.0,
    cost: 120.0,
    quantity: 100,
    status: "Active",
    vendor: "Internal",
    created: "Dec 28, 2025",
    description: "Basic training module covering essential features and best practices. Includes video tutorials and documentation.",
    reorderLevel: 20,
    supplier: "Internal Training Team",
    lastUpdated: "Jan 24, 2026",
  },
  {
    id: 6,
    name: "Legacy Software License",
    sku: "LEG-SOFT-006",
    category: "Software",
    price: 79.0,
    cost: 35.0,
    quantity: 0,
    status: "Out of Stock",
    vendor: "Microsoft",
    created: "Dec 20, 2025",
    description: "Legacy software license for older systems. Limited availability.",
    reorderLevel: 5,
    supplier: "Microsoft Corporation",
    lastUpdated: "Jan 20, 2026",
  },
  {
    id: 7,
    name: "Mobile App Subscription",
    sku: "APP-MOB-007",
    category: "Software",
    price: 29.99,
    cost: 12.0,
    quantity: 800,
    status: "Active",
    vendor: "Internal",
    created: "Dec 15, 2025",
    description: "Mobile app subscription with cross-platform support, offline mode, and cloud sync.",
    reorderLevel: 100,
    supplier: "Internal Development Team",
    lastUpdated: "Jan 23, 2026",
  },
  {
    id: 8,
    name: "Discontinued Service Pack",
    sku: "OLD-SVC-008",
    category: "Services",
    price: 149.0,
    cost: 60.0,
    quantity: 10,
    status: "Inactive",
    vendor: "Internal",
    created: "Nov 10, 2025",
    description: "Discontinued service pack. No longer available for new purchases.",
    reorderLevel: 0,
    supplier: "Internal Support Team",
    lastUpdated: "Jan 15, 2026",
  },
];

// Mock pricing tiers data
const mockPricingTiers = [
  {
    id: 1,
    quantity: "1-10",
    price: 99.0,
    discount: 0,
  },
  {
    id: 2,
    quantity: "11-50",
    price: 89.1,
    discount: 10,
  },
  {
    id: 3,
    quantity: "51-100",
    price: 79.2,
    discount: 20,
  },
  {
    id: 4,
    quantity: "100+",
    price: 69.3,
    discount: 30,
  },
];

// Mock stock movements data
const mockStockMovements = [
  {
    id: 1,
    type: "in",
    quantity: 100,
    reason: "Purchase Order #PO-2026-001",
    date: "Jan 28, 2026",
    time: "2:30 PM",
    user: "John Smith",
  },
  {
    id: 2,
    type: "out",
    quantity: 25,
    reason: "Sales Order #SO-2026-045",
    date: "Jan 27, 2026",
    time: "10:15 AM",
    user: "Jane Doe",
  },
  {
    id: 3,
    type: "in",
    quantity: 50,
    reason: "Purchase Order #PO-2026-002",
    date: "Jan 25, 2026",
    time: "4:45 PM",
    user: "Mike Johnson",
  },
  {
    id: 4,
    type: "out",
    quantity: 15,
    reason: "Sales Order #SO-2026-038",
    date: "Jan 24, 2026",
    time: "11:20 AM",
    user: "Sarah Brown",
  },
];

// Mock warehouse locations data
const mockWarehouseLocations = [
  {
    id: 1,
    name: "Main Warehouse",
    location: "A-12-B-5",
    quantity: 300,
  },
  {
    id: 2,
    name: "East Coast Distribution",
    location: "C-8-D-2",
    quantity: 150,
  },
  {
    id: 3,
    name: "West Coast Distribution",
    location: "E-4-F-1",
    quantity: 50,
  },
];

// Mock sales history data
const mockSalesHistory = [
  {
    id: 1,
    orderNumber: "SO-2026-045",
    customer: "Acme Corporation",
    quantity: 25,
    revenue: 2475.0,
    date: "Jan 27, 2026",
  },
  {
    id: 2,
    orderNumber: "SO-2026-038",
    customer: "CloudNine Solutions",
    quantity: 15,
    revenue: 1485.0,
    date: "Jan 24, 2026",
  },
  {
    id: 3,
    orderNumber: "SO-2026-032",
    customer: "TechStart Inc",
    quantity: 50,
    revenue: 4950.0,
    date: "Jan 20, 2026",
  },
  {
    id: 4,
    orderNumber: "SO-2026-028",
    customer: "GlobalTech Systems",
    quantity: 10,
    revenue: 990.0,
    date: "Jan 18, 2026",
  },
];

// Mock notes data
const mockNotes = [
  {
    id: 1,
    content: "Product is performing well in the market. Customer feedback has been positive. Consider increasing stock levels.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Received request for bulk pricing from enterprise client. Need to review pricing tiers and update if necessary.",
    author: "Jane Doe",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
];

// Mock related invoices
const mockRelatedInvoices = [
  {
    id: 1,
    invoiceNumber: "INV-2026-001",
    amount: 2475.0,
    date: "Jan 27, 2026",
    status: "Paid",
  },
  {
    id: 2,
    invoiceNumber: "INV-2026-002",
    amount: 1485.0,
    date: "Jan 24, 2026",
    status: "Paid",
  },
];

// Mock related purchase orders
const mockRelatedPurchaseOrders = [
  {
    id: 1,
    orderNumber: "PO-2026-001",
    quantity: 100,
    date: "Jan 28, 2026",
    status: "Received",
  },
  {
    id: 2,
    orderNumber: "PO-2026-002",
    quantity: 50,
    date: "Jan 25, 2026",
    status: "Received",
  },
];

type TabType = "details" | "pricing" | "sales" | "notes";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductType> | null>(null);

  // Find product by ID
  const product = useMemo(() => {
    const productId = parseInt(id);
    return products.find((p) => p.id === productId);
  }, [id]);

  // Calculate total value (stock × price)
  const totalValue = useMemo(() => {
    if (!product) return 0;
    return product.quantity * product.price;
  }, [product]);

  // Calculate total revenue from sales history
  const totalRevenue = useMemo(() => {
    return mockSalesHistory.reduce((sum, sale) => sum + sale.revenue, 0);
  }, []);

  // Calculate total units sold
  const totalUnitsSold = useMemo(() => {
    return mockSalesHistory.reduce((sum, sale) => sum + sale.quantity, 0);
  }, []);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!product) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted product:", product.name);
      router.push("/inventory/products");
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleEditProduct = () => {
    if (!product) return;
    setEditingProduct({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description,
      price: product.price,
      cost: product.cost,
      quantity: product.quantity,
      status: product.status as "Active" | "Inactive" | "Out of Stock" | "Discontinued",
      vendor: product.vendor,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<ProductType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      setFormDrawerOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      throw error;
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  const handleDuplicate = () => {
    if (!product) return;
    console.log("Duplicating product:", product.name);
    // In a real app, this would create a duplicate product
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Active: "bg-primary/20 text-primary",
      Inactive: "bg-muted text-muted-foreground",
      "Out of Stock": "bg-destructive/10 text-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    if (status === "Active") return CheckCircle2;
    if (status === "Inactive") return XCircle;
    return AlertTriangle;
  };

  // If product not found
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Product Not Found</h2>
        <p className="text-gray-600">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/inventory/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "pricing" as TabType, label: "Pricing & Inventory", icon: DollarSign },
    { id: "sales" as TabType, label: "Sales History", icon: BarChart3 },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  const StatusIcon = getStatusIcon(product.status);
  const reorderLevel = product.reorderLevel || 0;
  const isLowStock = product.quantity <= reorderLevel;

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
              onClick={() => router.push("/inventory/products")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">SKU: {product.sku}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    product.status
                  )}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {product.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary`}>
                    <Tag className="h-3 w-3 inline mr-1" />
                    {product.category}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {product.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditProduct}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
                Duplicate
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
                <Package className="h-4 w-4" />
                Stock Quantity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className={`text-2xl font-bold text-foreground font-tabular ${isLowStock ? "text-destructive" : ""}`}>
                  {product.quantity}
                </p>
                <p className={`text-xs ${isLowStock ? "text-destructive" : "text-muted-foreground"}`}>
                  {isLowStock ? "Low stock warning" : "units in stock"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Unit Price
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  ${product.price.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cost: ${product.cost.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stock × Price
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Reorder Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {reorderLevel}
                </p>
                <p className={`text-xs ${isLowStock ? "text-destructive" : "text-muted-foreground"}`}>
                  {isLowStock ? "Reorder needed" : "Minimum stock level"}
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
                            <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Product Name</p>
                                <p className="text-base font-medium">{product.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">SKU</p>
                                <p className="text-base font-medium">{product.sku}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">
                                  {product.description || "No description available."}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Category</p>
                                <p className="text-base font-medium">{product.category}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                  product.status
                                )}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {product.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Pricing & Inventory</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Unit Price</p>
                                <p className="text-base font-medium font-tabular">
                                  ${product.price.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Cost Price</p>
                                <p className="text-base font-medium font-tabular">
                                  ${product.cost.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Stock Quantity</p>
                                <p className={`text-base font-medium ${isLowStock ? "text-destructive" : ""}`}>
                                  {product.quantity} units
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Reorder Level</p>
                                <p className="text-base font-medium">{reorderLevel} units</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Supplier</p>
                                <p className="text-base font-medium">{product.supplier || product.vendor}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "pricing" && (
                      <motion.div
                        key="pricing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {/* Pricing Tiers */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Pricing Tiers</h3>
                          <div className="space-y-3">
                            {mockPricingTiers.map((tier) => (
                              <Card key={tier.id} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">
                                        Quantity: {tier.quantity} units
                                      </p>
                                      {tier.discount > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {tier.discount}% discount
                                        </p>
                                      )}
                                    </div>
                                    <p className="text-lg font-semibold text-foreground font-tabular">
                                      ${tier.price.toFixed(2)}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Stock Movements */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Stock Movements</h3>
                          <div className="space-y-4">
                            {mockStockMovements.map((movement, index) => (
                              <div key={movement.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    movement.type === "in" ? "bg-green-100" : "bg-red-100"
                                  }`}>
                                    {movement.type === "in" ? (
                                      <TrendingUp className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                                    )}
                                  </div>
                                  {index < mockStockMovements.length - 1 && (
                                    <div className="w-0.5 h-full bg-border mt-2" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="font-medium">
                                      {movement.type === "in" ? "+" : "-"}{movement.quantity} units - {movement.reason}
                                    </p>
                                    <span className="text-sm text-muted-foreground">{movement.date}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{movement.user}</span>
                                    <span>•</span>
                                    <span>{movement.time}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Warehouse Locations */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Warehouse Locations</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {mockWarehouseLocations.map((location) => (
                              <Card key={location.id} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-medium text-foreground">{location.name}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1">Location: {location.location}</p>
                                  <p className="text-lg font-semibold text-foreground">{location.quantity} units</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "sales" && (
                      <motion.div
                        key="sales"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {/* Sales Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                              <p className="text-2xl font-bold text-foreground font-tabular">
                                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Units Sold</p>
                              <p className="text-2xl font-bold text-foreground font-tabular">
                                {totalUnitsSold}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Average Order Value</p>
                              <p className="text-2xl font-bold text-foreground font-tabular">
                                ${totalUnitsSold > 0 ? (totalRevenue / totalUnitsSold).toFixed(2) : "0.00"}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Sales History */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
                          <div className="space-y-3">
                            {mockSalesHistory.map((sale) => (
                              <Card key={sale.id} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-foreground">{sale.orderNumber}</p>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-1">{sale.customer}</p>
                                      <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                          <Package className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-foreground">{sale.quantity} units</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-foreground font-semibold font-tabular">
                                            ${sale.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <Calendar className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">{sale.date}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
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
                            placeholder="Add a note about this product..."
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
                          {mockNotes.map((note) => (
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Add stock")}>
                  <Package className="h-4 w-4" />
                  Add Stock
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Create order")}>
                  <ShoppingCart className="h-4 w-4" />
                  Create Order
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("View reports")}>
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Button>
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{product.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{product.lastUpdated || product.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Supplier</p>
                  <Link
                    href="#"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {product.supplier || product.vendor}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Related Items */}
            {(mockRelatedInvoices.length > 0 || mockRelatedPurchaseOrders.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockRelatedInvoices.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Invoices</p>
                      <div className="space-y-2">
                        {mockRelatedInvoices.map((invoice) => (
                          <Link
                            key={invoice.id}
                            href={`/inventory/invoices/${invoice.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {invoice.invoiceNumber}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                ${invoice.amount.toFixed(2)} • {invoice.status}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {mockRelatedPurchaseOrders.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Purchase Orders</p>
                      <div className="space-y-2">
                        {mockRelatedPurchaseOrders.map((po) => (
                          <Link
                            key={po.id}
                            href={`/inventory/purchase-orders/${po.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xs font-semibold">
                              <ShoppingCart className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {po.orderNumber}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {po.quantity} units • {po.status}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description="Are you sure you want to delete this product? This will permanently remove it from your inventory and cannot be undone."
        itemName={product.name}
        itemType="Product"
        icon={Package}
        isDeleting={isDeleting}
      />

      {/* Product Form Drawer */}
      <ProductFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingProduct}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
