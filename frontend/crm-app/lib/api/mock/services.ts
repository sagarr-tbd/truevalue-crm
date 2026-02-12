import type { Service, ServiceType, ServicePricing, ServiceStatus } from "@/lib/types";

// Display interface for Services (reconciles schema differences)
export interface ServiceDisplay extends Omit<Service, "createdAt" | "updatedAt"> {
  id: number;
  serviceCode: string;
  serviceName: string;
  description?: string;
  category: string;
  type: ServiceType;
  pricing: ServicePricing;
  price?: string;
  duration?: string;
  status: ServiceStatus;
  assignedTeam?: string;
  customersUsing?: number;
  revenue?: string;
  rating?: number;
  created: string;
  lastModified: string;
  tags?: string[];
}

// Sample services data
const initialServices: ServiceDisplay[] = [
  {
    id: 1,
    serviceCode: "SRV-001",
    serviceName: "CRM Implementation",
    description: "Complete CRM setup and customization including data migration, user training, and integration with existing systems.",
    category: "Consulting",
    type: "Professional Services",
    pricing: "Fixed Price",
    price: "$15,000",
    duration: "6 weeks",
    status: "Active",
    assignedTeam: "Implementation Team",
    customersUsing: 45,
    revenue: "$675,000",
    rating: 4.8,
    created: "2025-01-15",
    lastModified: "2026-02-01",
    tags: ["implementation", "consulting", "training"],
  },
  {
    id: 2,
    serviceCode: "SRV-002",
    serviceName: "Enterprise Support Plan",
    description: "24/7 premium support with dedicated account manager, priority response times, and quarterly business reviews.",
    category: "Support",
    type: "Subscription",
    pricing: "Monthly",
    price: "$999/month",
    duration: "12 months minimum",
    status: "Active",
    assignedTeam: "Enterprise Support",
    customersUsing: 123,
    revenue: "$147,000",
    rating: 4.9,
    created: "2025-02-01",
    lastModified: "2026-02-04",
    tags: ["support", "enterprise", "premium"],
  },
  {
    id: 3,
    serviceCode: "SRV-003",
    serviceName: "Data Migration Service",
    description: "Migrate your existing customer data from any CRM or spreadsheet. Includes data cleansing, deduplication, and validation.",
    category: "Migration",
    type: "One-Time",
    pricing: "Per User",
    price: "$50 per user",
    duration: "2-4 weeks",
    status: "Active",
    assignedTeam: "Data Team",
    customersUsing: 67,
    revenue: "$201,000",
    rating: 4.6,
    created: "2025-01-20",
    lastModified: "2026-02-03",
    tags: ["migration", "data", "integration"],
  },
  {
    id: 4,
    serviceCode: "SRV-004",
    serviceName: "Custom Development",
    description: "Bespoke feature development, custom integrations, and API extensions tailored to your business needs.",
    category: "Development",
    type: "Professional Services",
    pricing: "Hourly",
    price: "$150/hour",
    duration: "Variable",
    status: "Active",
    assignedTeam: "Development Team",
    customersUsing: 28,
    revenue: "$420,000",
    rating: 4.7,
    created: "2025-02-10",
    lastModified: "2026-02-05",
    tags: ["development", "custom", "api"],
  },
  {
    id: 5,
    serviceCode: "SRV-005",
    serviceName: "AI Analytics Add-on",
    description: "Advanced AI-powered analytics, predictive forecasting, and automated insights to optimize your sales pipeline.",
    category: "Analytics",
    type: "Subscription",
    pricing: "Monthly",
    price: "$499/month",
    duration: "Monthly",
    status: "Active",
    assignedTeam: "AI Team",
    customersUsing: 89,
    revenue: "$53,328",
    rating: 4.5,
    created: "2025-03-01",
    lastModified: "2026-02-02",
    tags: ["ai", "analytics", "forecasting"],
  },
  {
    id: 6,
    serviceCode: "SRV-006",
    serviceName: "Managed Security Services",
    description: "Comprehensive security management including SOC 2 compliance, penetration testing, and security audits.",
    category: "Security",
    type: "Managed Services",
    pricing: "Annual",
    price: "$24,000/year",
    duration: "12 months",
    status: "Active",
    assignedTeam: "Security Team",
    customersUsing: 34,
    revenue: "$816,000",
    rating: 4.9,
    created: "2025-02-15",
    lastModified: "2026-02-01",
    tags: ["security", "compliance", "audit"],
  },
  {
    id: 7,
    serviceCode: "SRV-007",
    serviceName: "API Integration Package",
    description: "Connect your CRM with 100+ third-party applications including Slack, Salesforce, HubSpot, and more.",
    category: "Integration",
    type: "Subscription",
    pricing: "Monthly",
    price: "$199/month",
    duration: "Monthly",
    status: "Active",
    assignedTeam: "Integration Team",
    customersUsing: 156,
    revenue: "$37,248",
    rating: 4.4,
    created: "2025-01-25",
    lastModified: "2026-02-04",
    tags: ["integration", "api", "automation"],
  },
  {
    id: 8,
    serviceCode: "SRV-008",
    serviceName: "White Label Solution",
    description: "Fully customizable white-label CRM platform with your branding, custom domain, and dedicated infrastructure.",
    category: "Enterprise",
    type: "Managed Services",
    pricing: "Annual",
    price: "$50,000/year",
    duration: "24 months minimum",
    status: "Coming Soon",
    assignedTeam: "Enterprise Team",
    customersUsing: 5,
    revenue: "$250,000",
    rating: 5.0,
    created: "2026-01-10",
    lastModified: "2026-02-05",
    tags: ["whitelabel", "enterprise", "custom"],
  },
  {
    id: 9,
    serviceCode: "SRV-009",
    serviceName: "Training & Certification",
    description: "Comprehensive training program with certification for your team. Includes online courses, workshops, and exams.",
    category: "Training",
    type: "One-Time",
    pricing: "Per User",
    price: "$299 per user",
    duration: "4 weeks",
    status: "Active",
    assignedTeam: "Training Team",
    customersUsing: 234,
    revenue: "$69,966",
    rating: 4.7,
    created: "2025-02-20",
    lastModified: "2026-02-03",
    tags: ["training", "certification", "education"],
  },
  {
    id: 10,
    serviceCode: "SRV-010",
    serviceName: "Legacy System Connector",
    description: "Bridge your old legacy systems with modern CRM. Custom connectors for mainframe, AS/400, and legacy databases.",
    category: "Integration",
    type: "Professional Services",
    pricing: "Fixed Price",
    price: "$8,000",
    duration: "3-5 weeks",
    status: "Inactive",
    assignedTeam: "Integration Team",
    customersUsing: 12,
    revenue: "$96,000",
    rating: 4.2,
    created: "2025-01-05",
    lastModified: "2025-12-15",
    tags: ["legacy", "integration", "migration"],
  },
];

// In-memory storage
let services = [...initialServices];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API
export const mockServicesApi = {
  getAll: async (): Promise<ServiceDisplay[]> => {
    await delay(300);
    return [...services];
  },

  getById: async (id: number): Promise<ServiceDisplay | undefined> => {
    await delay(200);
    return services.find((s) => s.id === id);
  },

  create: async (data: Partial<ServiceDisplay>): Promise<ServiceDisplay> => {
    await delay(500);
    const newService: ServiceDisplay = {
      id: Math.max(0, ...services.map((s) => s.id || 0)) + 1,
      serviceCode: `SRV-${String(services.length + 1).padStart(3, "0")}`,
      serviceName: data.serviceName || "",
      description: data.description,
      category: data.category || "",
      type: data.type || "Professional Services",
      pricing: data.pricing || "Fixed Price",
      price: data.price,
      duration: data.duration,
      status: data.status || "Active",
      assignedTeam: data.assignedTeam,
      customersUsing: 0,
      revenue: "$0",
      rating: 0,
      created: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
      tags: data.tags || [],
    };
    services = [newService, ...services];
    return newService;
  },

  update: async (id: number, data: Partial<ServiceDisplay>): Promise<ServiceDisplay> => {
    await delay(400);
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Service not found");
    
    services[index] = {
      ...services[index],
      ...data,
      lastModified: new Date().toISOString().split("T")[0],
    };
    return services[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(400);
    services = services.filter((s) => s.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(600);
    services = services.filter((s) => !ids.includes(s.id || 0));
  },

  bulkUpdate: async (ids: number[], data: Partial<ServiceDisplay>): Promise<void> => {
    await delay(600);
    services = services.map((s) =>
      ids.includes(s.id || 0)
        ? { ...s, ...data, lastModified: new Date().toISOString().split("T")[0] }
        : s
    );
  },
};
