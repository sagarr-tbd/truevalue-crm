"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Briefcase,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  AlertCircle,
  FileText,
  MessageSquare,
  Plus,
  BarChart3,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Textarea } from "@/components/ui/textarea";
import { ServiceFormDrawer } from "@/components/Forms/Services";
import type { Service as ServiceType } from "@/lib/types";

// Service data structure (matching services list page)
type Service = {
  id: number;
  serviceCode: string;
  serviceName: string;
  description: string;
  category: string;
  type: string;
  pricing: string;
  price: string;
  duration: string;
  status: "Active" | "Inactive" | "Coming Soon";
  assignedTeam: string;
  customersUsing: number;
  revenue: string;
  rating: number;
  created: string;
  lastModified: string;
  features?: string[];
  terms?: string;
  sla?: string;
};

// Mock services data
const services: Service[] = [
  {
    id: 1,
    serviceCode: "SRV-001",
    serviceName: "CRM Implementation",
    description: "Complete CRM system setup and customization for enterprise clients. Includes configuration, data migration, user training, and 3 months of support.",
    category: "Consulting",
    type: "Professional Services",
    pricing: "Fixed Price",
    price: "$15,000",
    duration: "3 months",
    status: "Active",
    assignedTeam: "Implementation Team",
    customersUsing: 12,
    revenue: "$180,000",
    rating: 4.8,
    created: "Jan 15, 2026",
    lastModified: "Jan 28, 2026",
    features: [
      "System configuration and customization",
      "Data migration from legacy systems",
      "User training and onboarding",
      "3 months of post-implementation support",
      "Custom workflow setup",
    ],
    terms: "Payment terms: 50% upfront, 50% upon completion. Includes 3 months warranty period.",
    sla: "99.9% uptime guarantee. Response time: 4 hours for critical issues, 24 hours for standard support.",
  },
  {
    id: 2,
    serviceCode: "SRV-002",
    serviceName: "Technical Support - Premium",
    description: "24/7 priority technical support with dedicated account manager. Includes phone, email, and chat support with guaranteed response times.",
    category: "Support",
    type: "Subscription",
    pricing: "Monthly",
    price: "$500/mo",
    duration: "Ongoing",
    status: "Active",
    assignedTeam: "Support Team",
    customersUsing: 45,
    revenue: "$22,500",
    rating: 4.9,
    created: "Jan 10, 2026",
    lastModified: "Jan 27, 2026",
    features: [
      "24/7 phone, email, and chat support",
      "Dedicated account manager",
      "Priority ticket handling",
      "Remote assistance",
      "Monthly health check reports",
    ],
    terms: "Monthly subscription, billed in advance. Cancel anytime with 30 days notice.",
    sla: "Response time: 1 hour for critical issues, 4 hours for high priority, 24 hours for standard requests.",
  },
  {
    id: 3,
    serviceCode: "SRV-003",
    serviceName: "Data Migration Service",
    description: "Seamless data migration from legacy systems to CRM platform. Includes data mapping, validation, and testing.",
    category: "Implementation",
    type: "Professional Services",
    pricing: "Fixed Price",
    price: "$8,000",
    duration: "1 month",
    status: "Active",
    assignedTeam: "Data Team",
    customersUsing: 8,
    revenue: "$64,000",
    rating: 4.7,
    created: "Dec 20, 2025",
    lastModified: "Jan 25, 2026",
    features: [
      "Data mapping and transformation",
      "Data validation and cleaning",
      "Test migration and validation",
      "Production migration",
      "Post-migration verification",
    ],
    terms: "Payment terms: 50% upfront, 50% upon completion. Includes 30 days of post-migration support.",
    sla: "Data accuracy guarantee: 99.9%. Migration downtime: Maximum 4 hours.",
  },
  {
    id: 4,
    serviceCode: "SRV-004",
    serviceName: "Custom Integration Development",
    description: "Build custom integrations with third-party applications. Includes API development, testing, and deployment.",
    category: "Development",
    type: "Professional Services",
    pricing: "Hourly",
    price: "$150/hr",
    duration: "Variable",
    status: "Active",
    assignedTeam: "Dev Team",
    customersUsing: 15,
    revenue: "$90,000",
    rating: 4.6,
    created: "Dec 15, 2025",
    lastModified: "Jan 28, 2026",
    features: [
      "Custom API development",
      "Third-party application integration",
      "Testing and quality assurance",
      "Documentation and training",
      "6 months of maintenance included",
    ],
    terms: "Billed hourly. Minimum 20 hours. Payment terms: Net 30.",
    sla: "Integration uptime: 99.5%. Support response: 8 business hours.",
  },
  {
    id: 5,
    serviceCode: "SRV-005",
    serviceName: "Training & Onboarding",
    description: "Comprehensive training program for new and existing users. Includes hands-on workshops and documentation.",
    category: "Training",
    type: "Professional Services",
    pricing: "Per Session",
    price: "$1,200",
    duration: "2 days",
    status: "Active",
    assignedTeam: "Training Team",
    customersUsing: 28,
    revenue: "$33,600",
    rating: 4.9,
    created: "Nov 30, 2025",
    lastModified: "Jan 26, 2026",
    features: [
      "2-day intensive training workshop",
      "Hands-on exercises and practice",
      "Training materials and documentation",
      "Follow-up Q&A session",
      "30 days of email support",
    ],
    terms: "Per session pricing. Can be customized for larger groups. Travel expenses may apply.",
    sla: "Training satisfaction guarantee: 95% or money back.",
  },
];

// Mock customers data
const mockCustomers = [
  {
    id: 1,
    name: "Acme Corporation",
    contact: "Sarah Williams",
    email: "sarah.williams@acme.com",
    subscriptionDate: "Jan 15, 2026",
    status: "Active",
    plan: "Enterprise",
    renewalDate: "Apr 15, 2026",
  },
  {
    id: 2,
    name: "CloudNine Solutions",
    contact: "Robert Chen",
    email: "robert.chen@cloudnine.com",
    subscriptionDate: "Jan 20, 2026",
    status: "Active",
    plan: "Professional",
    renewalDate: "Apr 20, 2026",
  },
  {
    id: 3,
    name: "TechStart Inc",
    contact: "Jessica Lee",
    email: "jessica.lee@techstart.io",
    subscriptionDate: "Dec 10, 2025",
    status: "Active",
    plan: "Enterprise",
    renewalDate: "Mar 10, 2026",
  },
  {
    id: 4,
    name: "GlobalTech Systems",
    contact: "Emma Johnson",
    email: "emma.johnson@globaltech.com",
    subscriptionDate: "Jan 5, 2026",
    status: "Active",
    plan: "Professional",
    renewalDate: "Apr 5, 2026",
  },
  {
    id: 5,
    name: "Innovate Labs",
    contact: "Michael Chen",
    email: "michael.chen@innovate.io",
    subscriptionDate: "Dec 28, 2025",
    status: "Active",
    plan: "Enterprise",
    renewalDate: "Mar 28, 2026",
  },
];

// Mock revenue data
const mockRevenueData = [
  {
    month: "Oct 2025",
    revenue: 45000,
    customers: 8,
  },
  {
    month: "Nov 2025",
    revenue: 52000,
    customers: 10,
  },
  {
    month: "Dec 2025",
    revenue: 48000,
    customers: 11,
  },
  {
    month: "Jan 2026",
    revenue: 60000,
    customers: 12,
  },
];

// Mock analytics metrics
const mockAnalytics = {
  totalRevenue: 205000,
  monthlyRecurringRevenue: 60000,
  averageRevenuePerCustomer: 17083,
  churnRate: 2.5,
  customerLifetimeValue: 85000,
  growthRate: 25,
};

// Mock notes
const mockNotes = [
  {
    id: 1,
    content: "Service is performing exceptionally well. Customer satisfaction scores are consistently high. Consider expanding the team to handle increased demand.",
    author: "John Smith",
    date: "Jan 28, 2026",
    time: "2:30 PM",
  },
  {
    id: 2,
    content: "Received positive feedback from Acme Corporation. They mentioned the implementation was smooth and the support team was very responsive. Potential for upselling additional services.",
    author: "Jane Doe",
    date: "Jan 25, 2026",
    time: "10:15 AM",
  },
  {
    id: 3,
    content: "Training materials need to be updated with the latest features. Schedule review session with the training team next week.",
    author: "Mike Johnson",
    date: "Jan 22, 2026",
    time: "4:45 PM",
  },
];

type TabType = "details" | "customers" | "revenue" | "notes";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Form drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceType> | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("edit");

  // Find service by ID
  const service = useMemo(() => {
    const serviceId = parseInt(id);
    return services.find((s) => s.id === serviceId);
  }, [id]);

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!service) return;

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Successfully deleted service:", service.serviceName);
      router.push("/services");
    } catch (error) {
      console.error("Error deleting service:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  const handleDuplicate = () => {
    if (!service) return;
    console.log("Duplicating service:", service.serviceName);
    // In a real app, this would create a duplicate service
  };

  // Form drawer handlers
  const handleEditService = () => {
    if (!service) return;
    
    setEditingService({
      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      description: service.description,
      category: service.category,
      type: service.type as ServiceType["type"],
      pricing: service.pricing as ServiceType["pricing"],
      price: service.price,
      duration: service.duration,
      status: service.status as ServiceType["status"],
      assignedTeam: service.assignedTeam,
    });
    setFormMode("edit");
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (data: Partial<ServiceType>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data, "Mode:", formMode);
      setFormDrawerOpen(false);
      setEditingService(null);
      // In a real app, you would refresh the service data here
    } catch (error) {
      console.error("Error saving service:", error);
      throw error;
    }
  };

  // Status badge colors
  const getStatusColors = (status: string) => {
    const colors = {
      Active: "bg-primary/20 text-primary",
      Inactive: "bg-muted text-muted-foreground",
      "Coming Soon": "bg-accent/10 text-accent",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    if (status === "Active") return CheckCircle2;
    if (status === "Inactive") return XCircle;
    return AlertTriangle;
  };

  // If service not found
  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">Service Not Found</h2>
        <p className="text-gray-600">The service you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/services")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "customers" as TabType, label: "Customers", icon: Users },
    { id: "revenue" as TabType, label: "Revenue & Analytics", icon: BarChart3 },
    { id: "notes" as TabType, label: "Notes", icon: MessageSquare },
  ];

  const StatusIcon = getStatusIcon(service.status);

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
              onClick={() => router.push("/services")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Services
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-xl font-bold shadow-lg">
                <Briefcase className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{service.serviceName}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-muted-foreground">{service.serviceCode}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    service.status
                  )}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {service.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary`}>
                    <Tag className="h-3 w-3 inline mr-1" />
                    {service.category}
                  </span>
                  <span className="text-lg font-semibold text-foreground font-tabular">
                    {service.price}
                  </span>
                  <span className="text-sm text-muted-foreground">Created {service.created}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEditService}>
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
                <DollarSign className="h-4 w-4" />
                Price
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {service.price}
                </p>
                <p className="text-xs text-muted-foreground">
                  {service.pricing} pricing
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {service.customersUsing}
                </p>
                <p className="text-xs text-muted-foreground">
                  customers using this service
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {service.revenue}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total revenue generated
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-foreground font-tabular">
                  {service.rating.toFixed(1)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(service.rating)
                          ? "text-accent fill-accent"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
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
                            <h3 className="text-lg font-semibold mb-4">Service Information</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Service Name</p>
                                <p className="text-base font-medium">{service.serviceName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Service Code</p>
                                <p className="text-base font-medium">{service.serviceCode}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">
                                  {service.description}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Category</p>
                                <p className="text-base font-medium">{service.category}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Type</p>
                                <p className="text-base font-medium">{service.type}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(
                                  service.status
                                )}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {service.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-4">Pricing & Terms</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Pricing Model</p>
                                <p className="text-base font-medium">{service.pricing}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Price</p>
                                <p className="text-base font-medium font-tabular">
                                  {service.price}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                                <p className="text-base font-medium">{service.duration}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Terms</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">
                                  {service.terms || "No terms specified."}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">SLA</p>
                                <p className="text-base text-foreground whitespace-pre-wrap">
                                  {service.sla || "No SLA specified."}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {service.features && service.features.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Features</h3>
                            <ul className="space-y-2">
                              {service.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-base text-foreground">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "customers" && (
                      <motion.div
                        key="customers"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {mockCustomers.length > 0 ? (
                          mockCustomers.map((customer) => (
                            <Card key={customer.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center text-sm font-semibold">
                                        {customer.name.charAt(0)}
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-900">
                                          {customer.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">{customer.contact}</p>
                                      </div>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{customer.email}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">
                                          Subscribed: {customer.subscriptionDate}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">
                                          Renewal: {customer.renewalDate}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Tag className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{customer.plan} Plan</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      customer.status === "Active"
                                        ? "bg-primary/20 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {customer.status}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => router.push(`/sales/accounts/${customer.id}`)}
                                    >
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No customers found</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "revenue" && (
                      <motion.div
                        key="revenue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {/* Revenue Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                              <p className="text-2xl font-bold text-foreground font-tabular">
                                ${mockAnalytics.totalRevenue.toLocaleString()}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Monthly Recurring Revenue</p>
                              <p className="text-2xl font-bold text-foreground font-tabular">
                                ${mockAnalytics.monthlyRecurringRevenue.toLocaleString()}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Avg Revenue per Customer</p>
                              <p className="text-2xl font-bold text-foreground font-tabular">
                                ${mockAnalytics.averageRevenuePerCustomer.toLocaleString()}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Performance Metrics */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground mb-1">Churn Rate</p>
                                <p className="text-2xl font-bold text-foreground font-tabular">
                                  {mockAnalytics.churnRate}%
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground mb-1">Customer Lifetime Value</p>
                                <p className="text-2xl font-bold text-foreground font-tabular">
                                  ${mockAnalytics.customerLifetimeValue.toLocaleString()}
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground mb-1">Growth Rate</p>
                                <p className="text-2xl font-bold font-tabular text-primary">
                                  +{mockAnalytics.growthRate}%
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Revenue Trend */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                          <div className="space-y-3">
                            {mockRevenueData.map((data, index) => (
                              <Card key={index} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{data.month}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {data.customers} customers
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-semibold text-foreground font-tabular">
                                        ${data.revenue.toLocaleString()}
                                      </p>
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
                            placeholder="Add a note about this service..."
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
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Add customer")}>
                  <UserPlus className="h-4 w-4" />
                  Add Customer
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("View reports")}>
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => console.log("Export")}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </CardContent>
            </Card>

            {/* Service Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{service.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Modified</p>
                  <p className="text-sm font-medium">{service.lastModified}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium">{service.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColors(
                    service.status
                  )}`}>
                    {service.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned Team</p>
                  <p className="text-sm font-medium">{service.assignedTeam}</p>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Active Subscriptions</p>
                  <p className="text-lg font-semibold text-foreground font-tabular">
                    {service.customersUsing}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-lg font-semibold text-foreground font-tabular">
                    {service.revenue}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-accent fill-accent" />
                    <p className="text-lg font-semibold text-foreground font-tabular">
                      {service.rating.toFixed(1)}
                    </p>
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
        title="Delete Service"
        description="Are you sure you want to delete this service? This will permanently remove it from your system and cannot be undone."
        itemName={service.serviceName}
        itemType="Service"
        icon={Briefcase}
        isDeleting={isDeleting}
      />

      {/* Service Form Drawer */}
      <ServiceFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => {
          setFormDrawerOpen(false);
          setEditingService(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingService}
        mode={formMode}
      />
    </div>
  );
}
