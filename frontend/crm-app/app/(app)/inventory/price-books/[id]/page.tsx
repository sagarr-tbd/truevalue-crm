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
  Book,
  DollarSign,
  Percent,
  Users,
  AlertCircle,
  FileText,
  MessageSquare,
  Plus,
  Package,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  BarChart3,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { PriceBookFormDrawer } from "@/components/Forms/Inventory";
import type { PriceBook as PriceBookEntityType } from "@/lib/types";

// Price Book data structure
type PriceBookType = "Standard" | "Wholesale" | "Retail" | "VIP";
type PriceBookStatus = "Active" | "Inactive";

type PriceBook = {
  id: number;
  name: string;
  description: string;
  type: PriceBookType;
  status: PriceBookStatus;
  currency: string;
  products: number;
  averageMargin: number;
  activeCustomers: number;
  lastUpdated: string;
  created: string;
  validFrom: string;
  validTo: string;
  discountRules?: string;
};

// Mock price books data
const priceBooks: PriceBook[] = [
  {
    id: 1,
    name: "Standard Price Book",
    description: "Default pricing for all standard products and services",
    type: "Standard",
    status: "Active",
    currency: "USD",
    products: 45,
    averageMargin: 35.5,
    activeCustomers: 127,
    lastUpdated: "Jan 28, 2026",
    created: "Jan 1, 2026",
    validFrom: "Jan 1, 2026",
    validTo: "Dec 31, 2026",
    discountRules: "Standard pricing with no discounts. Base prices apply to all customers.",
  },
  {
    id: 2,
    name: "Enterprise Price Book",
    description: "Volume pricing for enterprise customers with tiered discounts",
    type: "Wholesale",
    status: "Active",
    currency: "USD",
    products: 38,
    averageMargin: 42.3,
    activeCustomers: 45,
    lastUpdated: "Jan 27, 2026",
    created: "Jan 2, 2026",
    validFrom: "Jan 1, 2026",
    validTo: "Dec 31, 2026",
    discountRules: "Tiered discounts: 10% for orders over $10k, 15% for orders over $50k, 20% for orders over $100k",
  },
  {
    id: 3,
    name: "SMB Price Book",
    description: "Special pricing for small and medium businesses",
    type: "Retail",
    status: "Active",
    currency: "USD",
    products: 32,
    averageMargin: 28.7,
    activeCustomers: 89,
    lastUpdated: "Jan 26, 2026",
    created: "Jan 3, 2026",
    validFrom: "Jan 1, 2026",
    validTo: "Jun 30, 2026",
    discountRules: "5% discount for SMB customers. Minimum order value of $1,000 required.",
  },
  {
    id: 4,
    name: "VIP Price Book",
    description: "Exclusive pricing for VIP customers and partners",
    type: "VIP",
    status: "Active",
    currency: "USD",
    products: 40,
    averageMargin: 38.9,
    activeCustomers: 23,
    lastUpdated: "Jan 25, 2026",
    created: "Jan 5, 2026",
    validFrom: "Jan 1, 2026",
    validTo: "Dec 31, 2026",
    discountRules: "VIP customers receive 25% discount on all products. Exclusive access to premium features.",
  },
];

// Mock products & pricing data
const mockProductsPricing = [
  {
    id: 1,
    productName: "CRM Pro License",
    sku: "CRM-PRO-001",
    listPrice: 99.0,
    priceBookPrice: 99.0,
    discount: 0,
  },
  {
    id: 2,
    productName: "Cloud Storage 1TB",
    sku: "CLOUD-1TB-002",
    listPrice: 49.99,
    priceBookPrice: 44.99,
    discount: 10,
  },
  {
    id: 3,
    productName: "Premium Support Package",
    sku: "SUP-PREM-003",
    listPrice: 199.0,
    priceBookPrice: 179.1,
    discount: 10,
  },
  {
    id: 4,
    productName: "Enterprise Hardware Kit",
    sku: "HW-ENT-004",
    listPrice: 1299.0,
    priceBookPrice: 1039.2,
    discount: 20,
  },
  {
    id: 5,
    productName: "Training Module Basic",
    sku: "TRN-BAS-005",
    listPrice: 299.0,
    priceBookPrice: 269.1,
    discount: 10,
  },
];

// Mock usage statistics data
const mockUsageStatistics = [
  {
    id: 1,
    customerName: "Acme Corporation",
    accountId: 1,
    ordersCount: 12,
    totalRevenue: 125000,
    lastOrderDate: "Jan 27, 2026",
  },
  {
    id: 2,
    customerName: "CloudNine Solutions",
    accountId: 2,
    ordersCount: 8,
    totalRevenue: 89000,
    lastOrderDate: "Jan 24, 2026",
  },
  {
    id: 3,
    customerName: "TechStart Inc",
    accountId: 3,
    ordersCount: 15,
    totalRevenue: 156000,
    lastOrderDate: "Jan 28, 2026",
  },
  {
    id: 4,
    customerName: "GlobalTech Systems",
    accountId: 4,
    ordersCount: 5,
    totalRevenue: 45000,
    lastOrderDate: "Jan 20, 2026",
  },
  {
    id: 5,
    customerName: "Innovate Labs",
    accountId: 5,
    ordersCount: 9,
    totalRevenue: 98000,
    lastOrderDate: "Jan 25, 2026",
  },
];

// Mock notes data
const mockNotes = [
  {
    id: 1,
    content: "Price book is performing well. Customer feedback indicates competitive pricing. Consider reviewing discount tiers for Q2 2026.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Received request from enterprise client to add additional products to this price book. Review and approve by end of week.",
    author: "Jane Doe",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
  {
    id: 3,
    content: "Updated pricing for 5 products based on market analysis. Changes effective immediately.",
    author: "Mike Johnson",
    date: "Jan 22, 2026",
    time: "4:45 PM",
  },
];

type TabType = "details" | "products" | "usage" | "notes";

export default function PriceBookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingPriceBook, setEditingPriceBook] = useState<Partial<PriceBookEntityType> | null>(null);

  // Find price book by ID
  const priceBook = useMemo(() => {
    const priceBookId = parseInt(id);
    return priceBooks.find((pb) => pb.id === priceBookId);
  }, [id]);

  // Calculate total value (sum of all products in price book)
  const totalValue = useMemo(() => {
    return mockProductsPricing.reduce((sum, product) => sum + product.priceBookPrice, 0);
  }, []);

  // Calculate average discount
  const averageDiscount = useMemo(() => {
    if (mockProductsPricing.length === 0) return 0;
    const totalDiscount = mockProductsPricing.reduce((sum, product) => sum + product.discount, 0);
    return totalDiscount / mockProductsPricing.length;
  }, []);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!priceBook) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted price book:", priceBook.name);
      router.push("/inventory/price-books");
    } catch (error) {
      console.error("Error deleting price book:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleEditPriceBook = () => {
    if (!priceBook) return;
    setEditingPriceBook({
      id: priceBook.id,
      name: priceBook.name,
      description: priceBook.description,
      currency: priceBook.currency as "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD",
      status: priceBook.status as "Active" | "Inactive" | "Draft",
      validFrom: priceBook.validFrom,
      validTo: priceBook.validTo,
    });
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<PriceBookEntityType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      setFormDrawerOpen(false);
      setEditingPriceBook(null);
    } catch (error) {
      console.error("Error saving price book:", error);
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
    if (!priceBook) return;
    console.log("Duplicating price book:", priceBook.name);
    // In a real app, this would create a duplicate price book
  };

  // Type badge colors
  const getTypeColors = (type: PriceBookType) => {
    const colors = {
      Standard: "bg-secondary/10 text-secondary",
      Wholesale: "bg-primary/20 text-primary",
      Retail: "bg-accent/10 text-accent",
      VIP: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    };
    return colors[type] || "bg-gray-100 text-gray-600";
  };

  // Status badge colors
  const getStatusColors = (status: PriceBookStatus) => {
    const colors = {
      Active: "bg-primary/20 text-primary",
      Inactive: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  // Status icon
  const getStatusIcon = (status: PriceBookStatus) => {
    return status === "Active" ? CheckCircle2 : XCircle;
  };

  // If price book not found
  if (!priceBook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Price Book Not Found</h2>
        <p className="text-gray-600">The price book you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/inventory/price-books")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Price Books
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "products" as TabType, label: "Products & Pricing", icon: Package },
    { id: "usage" as TabType, label: "Usage Statistics", icon: BarChart3 },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  const StatusIcon = getStatusIcon(priceBook.status);

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
              onClick={() => router.push("/inventory/price-books")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Price Books
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <Book className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{priceBook.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColors(
                    priceBook.type
                  )}`}>
                    <Tag className="h-3 w-3 inline mr-1" />
                    {priceBook.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    priceBook.status
                  )}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {priceBook.status}
                  </span>
                  <span className="text-lg text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {priceBook.currency}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {priceBook.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditPriceBook}>
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
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {priceBook.products}
                </p>
                <p className="text-xs text-muted-foreground">
                  products in price book
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Average Margin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {priceBook.averageMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  profit margin
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {priceBook.activeCustomers}
                </p>
                <p className="text-xs text-muted-foreground">
                  customers using this price book
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {priceBook.lastUpdated.split(" ")[0]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {priceBook.lastUpdated}
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
                            <h3 className="text-lg font-semibold mb-4">Price Book Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Name</p>
                                <p className="text-base font-medium">{priceBook.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">
                                  {priceBook.description}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Type</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColors(
                                  priceBook.type
                                )}`}>
                                  <Tag className="h-3 w-3 inline mr-1" />
                                  {priceBook.type}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                  priceBook.status
                                )}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {priceBook.status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Currency</p>
                                <p className="text-base font-medium flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {priceBook.currency}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Pricing Rules & Dates</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Discount Rules</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">
                                  {priceBook.discountRules || "No specific discount rules defined."}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Valid From</p>
                                <p className="text-base font-medium flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {priceBook.validFrom}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Valid To</p>
                                <p className="text-base font-medium flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {priceBook.validTo}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Created</p>
                                <p className="text-base font-medium">{priceBook.created}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                                <p className="text-base font-medium">{priceBook.lastUpdated}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "products" && (
                      <motion.div
                        key="products"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Products & Pricing</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product Name</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SKU</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">List Price</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Price Book Price</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Discount %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {mockProductsPricing.map((product) => (
                                  <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                    <td className="py-3 px-4 text-sm font-medium text-foreground">{product.productName}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{product.sku}</td>
                                    <td className="py-3 px-4 text-sm text-right font-tabular text-foreground">
                                      ${product.listPrice.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right font-tabular font-medium text-foreground">
                                      ${product.priceBookPrice.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right font-tabular">
                                      {product.discount > 0 ? (
                                        <span className="text-green-600 dark:text-green-400">
                                          {product.discount}%
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "usage" && (
                      <motion.div
                        key="usage"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Customers and orders using this price book
                          </p>
                          <div className="space-y-3">
                            {mockUsageStatistics.map((stat) => (
                              <Card key={stat.id} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <Link
                                          href={`/sales/accounts/${stat.accountId}`}
                                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                                        >
                                          {stat.customerName}
                                        </Link>
                                      </div>
                                      <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-foreground">{stat.ordersCount} orders</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-foreground font-semibold font-tabular">
                                            ${stat.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <Calendar className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">Last: {stat.lastOrderDate}</span>
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
                            placeholder="Add a note about this price book..."
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Add products")}>
                  <Package className="h-4 w-4" />
                  Add Products
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Apply to customers")}>
                  <Users className="h-4 w-4" />
                  Apply to Customers
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Export")}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </CardContent>
            </Card>

            {/* Price Book Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Price Book Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{priceBook.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getTypeColors(
                    priceBook.type
                  )}`}>
                    {priceBook.type}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusColors(
                    priceBook.status
                  )}`}>
                    {priceBook.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Currency</p>
                  <p className="text-sm font-medium">{priceBook.currency}</p>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Products</p>
                  <p className="text-sm font-medium font-tabular">{priceBook.products}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                  <p className="text-sm font-medium font-tabular">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average Discount</p>
                  <p className="text-sm font-medium font-tabular">
                    {averageDiscount.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Active Customers</p>
                  <p className="text-sm font-medium font-tabular">{priceBook.activeCustomers}</p>
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
        title="Delete Price Book"
        description="Are you sure you want to delete this price book? This will permanently remove it from your records and cannot be undone."
        itemName={priceBook.name}
        itemType="Price Book"
        icon={Book}
        isDeleting={isDeleting}
      />

      {/* Price Book Form Drawer */}
      <PriceBookFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingPriceBook(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingPriceBook}
        mode="edit"
        defaultView="quick"
      />
    </div>
  );
}
