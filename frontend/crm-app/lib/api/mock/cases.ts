import type { Case, CaseStatus, CasePriority, CaseType } from "@/lib/types";

// Display interface for Cases (reconciles schema differences)
export interface CaseDisplay extends Omit<Case, "createdAt" | "updatedAt"> {
  id: number;
  caseNumber: string;
  subject: string;
  description?: string;
  customer: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  priority: CasePriority;
  status: CaseStatus;
  type: CaseType;
  category?: string;
  assignedTo: string;
  dueDate?: string;
  created: string;
  lastModified: string;
  responseTime?: string;
  resolutionTime?: string;
  comments?: number;
  tags?: string[];
  initials: string;
}

// Sample cases data
const initialCases: CaseDisplay[] = [
  {
    id: 1,
    caseNumber: "CASE-001",
    subject: "Cannot login to account",
    description: "User reporting login issues after password reset. Tried multiple browsers.",
    customer: "Acme Corporation",
    contactName: "John Smith",
    contactEmail: "john.smith@acme.com",
    contactPhone: "+1-555-0123",
    priority: "High",
    status: "In Progress",
    type: "Technical",
    category: "Authentication",
    assignedTo: "Sarah Wilson",
    dueDate: "2026-02-08",
    created: "2026-02-06",
    lastModified: "2026-02-06",
    responseTime: "15 minutes",
    comments: 3,
    tags: ["authentication", "urgent"],
    initials: "JS",
  },
  {
    id: 2,
    caseNumber: "CASE-002",
    subject: "Incorrect billing amount",
    description: "Customer charged twice for the same subscription period.",
    customer: "TechStart Inc",
    contactName: "Emily Davis",
    contactEmail: "emily@techstart.com",
    contactPhone: "+1-555-0124",
    priority: "Urgent",
    status: "Open",
    type: "Billing",
    category: "Payment",
    assignedTo: "Michael Chen",
    dueDate: "2026-02-07",
    created: "2026-02-06",
    lastModified: "2026-02-06",
    responseTime: "5 minutes",
    comments: 1,
    tags: ["billing", "payment"],
    initials: "ED",
  },
  {
    id: 3,
    caseNumber: "CASE-003",
    subject: "Feature request: Dark mode",
    description: "Multiple users requesting dark mode support in the dashboard.",
    customer: "Global Solutions Ltd",
    contactName: "David Park",
    contactEmail: "david@globalsolutions.com",
    contactPhone: "+1-555-0125",
    priority: "Low",
    status: "Open",
    type: "Feature Request",
    category: "UI/UX",
    assignedTo: "Lisa Anderson",
    dueDate: "2026-02-15",
    created: "2026-02-05",
    lastModified: "2026-02-05",
    responseTime: "1 hour",
    comments: 5,
    tags: ["feature", "ui"],
    initials: "DP",
  },
  {
    id: 4,
    caseNumber: "CASE-004",
    subject: "Data export not working",
    description: "CSV export returns empty file when exporting large datasets.",
    customer: "Data Corp",
    contactName: "Rachel Green",
    contactEmail: "rachel@datacorp.com",
    contactPhone: "+1-555-0126",
    priority: "High",
    status: "Escalated",
    type: "Bug",
    category: "Export",
    assignedTo: "Tom Rodriguez",
    dueDate: "2026-02-07",
    created: "2026-02-05",
    lastModified: "2026-02-06",
    responseTime: "30 minutes",
    resolutionTime: "2 hours",
    comments: 8,
    tags: ["bug", "export", "escalated"],
    initials: "RG",
  },
  {
    id: 5,
    caseNumber: "CASE-005",
    subject: "API rate limit questions",
    description: "Need clarification on API rate limits for enterprise plan.",
    customer: "Enterprise Systems",
    contactName: "Alex Thompson",
    contactEmail: "alex@enterprisesys.com",
    contactPhone: "+1-555-0127",
    priority: "Medium",
    status: "Resolved",
    type: "General Inquiry",
    category: "API",
    assignedTo: "Sarah Wilson",
    dueDate: "2026-02-06",
    created: "2026-02-04",
    lastModified: "2026-02-06",
    responseTime: "45 minutes",
    resolutionTime: "4 hours",
    comments: 2,
    tags: ["api", "inquiry"],
    initials: "AT",
  },
  {
    id: 6,
    caseNumber: "CASE-006",
    subject: "Slow dashboard performance",
    description: "Dashboard takes 10+ seconds to load with large datasets.",
    customer: "BigData Analytics",
    contactName: "Chris Martinez",
    contactEmail: "chris@bigdata.com",
    contactPhone: "+1-555-0128",
    priority: "Medium",
    status: "In Progress",
    type: "Technical",
    category: "Performance",
    assignedTo: "Tom Rodriguez",
    dueDate: "2026-02-09",
    created: "2026-02-05",
    lastModified: "2026-02-06",
    responseTime: "20 minutes",
    comments: 4,
    tags: ["performance", "optimization"],
    initials: "CM",
  },
  {
    id: 7,
    caseNumber: "CASE-007",
    subject: "Invoice PDF not generating",
    description: "Error message when trying to download invoice as PDF.",
    customer: "Finance Plus",
    contactName: "Jennifer Lee",
    contactEmail: "jennifer@financeplus.com",
    contactPhone: "+1-555-0129",
    priority: "High",
    status: "Open",
    type: "Bug",
    category: "Invoicing",
    assignedTo: "Michael Chen",
    dueDate: "2026-02-07",
    created: "2026-02-06",
    lastModified: "2026-02-06",
    responseTime: "10 minutes",
    comments: 2,
    tags: ["bug", "invoice", "pdf"],
    initials: "JL",
  },
  {
    id: 8,
    caseNumber: "CASE-008",
    subject: "User role permissions issue",
    description: "Admin users cannot modify team member permissions.",
    customer: "Team Workspace",
    contactName: "Mark Johnson",
    contactEmail: "mark@teamworkspace.com",
    contactPhone: "+1-555-0130",
    priority: "High",
    status: "Resolved",
    type: "Technical",
    category: "Permissions",
    assignedTo: "Lisa Anderson",
    dueDate: "2026-02-05",
    created: "2026-02-03",
    lastModified: "2026-02-05",
    responseTime: "25 minutes",
    resolutionTime: "6 hours",
    comments: 6,
    tags: ["permissions", "admin"],
    initials: "MJ",
  },
];

// In-memory storage
let cases = [...initialCases];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API
export const mockCasesApi = {
  getAll: async (): Promise<CaseDisplay[]> => {
    await delay(300);
    return [...cases];
  },

  getById: async (id: number): Promise<CaseDisplay | undefined> => {
    await delay(200);
    return cases.find((c) => c.id === id);
  },

  create: async (data: Partial<CaseDisplay>): Promise<CaseDisplay> => {
    await delay(500);
    const newCase: CaseDisplay = {
      id: Math.max(0, ...cases.map((c) => c.id || 0)) + 1,
      caseNumber: `CASE-${String(cases.length + 1).padStart(3, "0")}`,
      subject: data.subject || "",
      description: data.description,
      customer: data.customer || "",
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      priority: data.priority || "Medium",
      status: data.status || "Open",
      type: data.type || "General Inquiry",
      category: data.category,
      assignedTo: data.assignedTo || "Unassigned",
      dueDate: data.dueDate,
      created: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
      responseTime: "Just now",
      comments: 0,
      tags: data.tags || [],
      initials:
        data.contactName
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "??",
    };
    cases = [newCase, ...cases];
    return newCase;
  },

  update: async (id: number, data: Partial<CaseDisplay>): Promise<CaseDisplay> => {
    await delay(400);
    const index = cases.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Case not found");
    
    cases[index] = {
      ...cases[index],
      ...data,
      lastModified: new Date().toISOString().split("T")[0],
    };
    return cases[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(400);
    cases = cases.filter((c) => c.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(600);
    cases = cases.filter((c) => !ids.includes(c.id || 0));
  },

  bulkUpdate: async (ids: number[], data: Partial<CaseDisplay>): Promise<void> => {
    await delay(600);
    cases = cases.map((c) =>
      ids.includes(c.id || 0)
        ? { ...c, ...data, lastModified: new Date().toISOString().split("T")[0] }
        : c
    );
  },
};
