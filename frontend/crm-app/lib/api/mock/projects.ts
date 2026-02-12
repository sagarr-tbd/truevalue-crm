import type { Project, ProjectStatus, ProjectPriority, ProjectType } from "@/lib/types";

// Display interface for Projects (reconciles schema differences)
export interface ProjectDisplay extends Omit<Project, "createdAt" | "updatedAt"> {
  id: number;
  projectCode: string;
  projectName: string;
  description?: string;
  client: string;
  projectManager?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  type: ProjectType;
  startDate?: string;
  endDate?: string;
  budget?: string;
  spent?: string;
  progress?: number;
  teamSize?: number;
  tasksCompleted?: number;
  totalTasks?: number;
  created: string;
  lastModified: string;
  initials?: string;
  tags?: string[];
}

// Sample projects data
const initialProjects: ProjectDisplay[] = [
  {
    id: 1,
    projectCode: "PRJ-001",
    projectName: "Enterprise CRM Implementation - Acme Corp",
    description: "Full CRM deployment including data migration, custom workflows, integrations with existing ERP system, and comprehensive training program for 500+ users.",
    client: "Acme Corporation",
    projectManager: "Sarah Wilson",
    status: "In Progress",
    priority: "High",
    type: "Implementation",
    startDate: "2026-01-15",
    endDate: "2026-06-30",
    budget: "$450,000",
    spent: "$225,000",
    progress: 50,
    teamSize: 8,
    tasksCompleted: 45,
    totalTasks: 90,
    created: "2026-01-10",
    lastModified: "2026-02-06",
    initials: "AC",
    tags: ["enterprise", "implementation", "erp-integration"],
  },
  {
    id: 2,
    projectCode: "PRJ-002",
    projectName: "Mobile App Development - TechStart",
    description: "Native iOS and Android apps for field sales team with offline capabilities, real-time sync, and GPS tracking.",
    client: "TechStart Inc",
    projectManager: "Michael Chen",
    status: "In Progress",
    priority: "Critical",
    type: "Development",
    startDate: "2026-02-01",
    endDate: "2026-05-15",
    budget: "$180,000",
    spent: "$45,000",
    progress: 25,
    teamSize: 5,
    tasksCompleted: 15,
    totalTasks: 60,
    created: "2026-01-25",
    lastModified: "2026-02-05",
    initials: "TS",
    tags: ["mobile", "development", "ios", "android"],
  },
  {
    id: 3,
    projectCode: "PRJ-003",
    projectName: "Data Migration - Global Industries",
    description: "Migrate 2M+ records from Salesforce to new CRM platform with data cleansing, deduplication, and validation.",
    client: "Global Industries Ltd",
    projectManager: "Tom Rodriguez",
    status: "Planning",
    priority: "High",
    type: "Migration",
    startDate: "2026-03-01",
    endDate: "2026-04-30",
    budget: "$95,000",
    spent: "$5,000",
    progress: 10,
    teamSize: 4,
    tasksCompleted: 3,
    totalTasks: 30,
    created: "2026-02-01",
    lastModified: "2026-02-06",
    initials: "GI",
    tags: ["migration", "salesforce", "data"],
  },
  {
    id: 4,
    projectCode: "PRJ-004",
    projectName: "AI Analytics Integration",
    description: "Implement ML-powered sales forecasting, lead scoring, and predictive analytics dashboard.",
    client: "DataDriven Corp",
    projectManager: "Lisa Anderson",
    status: "Completed",
    priority: "Medium",
    type: "Development",
    startDate: "2025-10-01",
    endDate: "2026-01-31",
    budget: "$320,000",
    spent: "$315,000",
    progress: 100,
    teamSize: 6,
    tasksCompleted: 75,
    totalTasks: 75,
    created: "2025-09-20",
    lastModified: "2026-02-01",
    initials: "DD",
    tags: ["ai", "analytics", "machine-learning"],
  },
  {
    id: 5,
    projectCode: "PRJ-005",
    projectName: "Security Audit & Compliance",
    description: "SOC 2 Type II audit preparation, penetration testing, and security enhancements for HIPAA compliance.",
    client: "HealthTech Systems",
    projectManager: "Sarah Wilson",
    status: "In Progress",
    priority: "Critical",
    type: "Consulting",
    startDate: "2026-01-20",
    endDate: "2026-04-20",
    budget: "$125,000",
    spent: "$42,000",
    progress: 35,
    teamSize: 3,
    tasksCompleted: 14,
    totalTasks: 40,
    created: "2026-01-15",
    lastModified: "2026-02-04",
    initials: "HT",
    tags: ["security", "compliance", "audit"],
  },
  {
    id: 6,
    projectCode: "PRJ-006",
    projectName: "Sales Training Program - RetailMax",
    description: "Comprehensive CRM training for 200+ retail sales staff including certification program and ongoing support.",
    client: "RetailMax",
    projectManager: "Michael Chen",
    status: "On Hold",
    priority: "Low",
    type: "Training",
    startDate: "2026-02-15",
    endDate: "2026-03-30",
    budget: "$45,000",
    spent: "$8,000",
    progress: 15,
    teamSize: 2,
    tasksCompleted: 3,
    totalTasks: 20,
    created: "2026-02-01",
    lastModified: "2026-02-03",
    initials: "RM",
    tags: ["training", "retail", "certification"],
  },
  {
    id: 7,
    projectCode: "PRJ-007",
    projectName: "Cloud Infrastructure Upgrade",
    description: "Migrate from on-premise to AWS cloud infrastructure with auto-scaling, load balancing, and disaster recovery.",
    client: "Enterprise Solutions Inc",
    projectManager: "Tom Rodriguez",
    status: "In Progress",
    priority: "High",
    type: "Implementation",
    startDate: "2026-01-10",
    endDate: "2026-03-31",
    budget: "$280,000",
    spent: "$168,000",
    progress: 60,
    teamSize: 7,
    tasksCompleted: 30,
    totalTasks: 50,
    created: "2025-12-20",
    lastModified: "2026-02-05",
    initials: "ES",
    tags: ["cloud", "aws", "infrastructure"],
  },
  {
    id: 8,
    projectCode: "PRJ-008",
    projectName: "API Integration Platform",
    description: "Build unified API platform connecting CRM with 50+ third-party services including payment gateways and marketing tools.",
    client: "ConnectHub",
    projectManager: "Lisa Anderson",
    status: "Planning",
    priority: "Medium",
    type: "Development",
    startDate: "2026-03-15",
    endDate: "2026-07-30",
    budget: "$195,000",
    spent: "$0",
    progress: 5,
    teamSize: 5,
    tasksCompleted: 2,
    totalTasks: 65,
    created: "2026-02-10",
    lastModified: "2026-02-06",
    initials: "CH",
    tags: ["api", "integration", "platform"],
  },
  {
    id: 9,
    projectCode: "PRJ-009",
    projectName: "Customer Portal Development",
    description: "Self-service customer portal with ticket management, knowledge base, and live chat integration.",
    client: "ServicePro",
    projectManager: "Sarah Wilson",
    status: "Completed",
    priority: "Medium",
    type: "Development",
    startDate: "2025-11-01",
    endDate: "2026-01-15",
    budget: "$150,000",
    spent: "$148,000",
    progress: 100,
    teamSize: 4,
    tasksCompleted: 55,
    totalTasks: 55,
    created: "2025-10-20",
    lastModified: "2026-01-16",
    initials: "SP",
    tags: ["portal", "customer", "self-service"],
  },
  {
    id: 10,
    projectCode: "PRJ-010",
    projectName: "Legacy System Modernization",
    description: "Modernize 15-year-old CRM with new UI, database optimization, and microservices architecture.",
    client: "OldTech Industries",
    projectManager: "Michael Chen",
    status: "Cancelled",
    priority: "Low",
    type: "Development",
    startDate: "2025-12-01",
    endDate: "2026-02-28",
    budget: "$220,000",
    spent: "$35,000",
    progress: 15,
    teamSize: 6,
    tasksCompleted: 8,
    totalTasks: 80,
    created: "2025-11-15",
    lastModified: "2026-01-20",
    initials: "OT",
    tags: ["legacy", "modernization", "refactor"],
  },
];

// In-memory storage
let projects = [...initialProjects];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API
export const mockProjectsApi = {
  getAll: async (): Promise<ProjectDisplay[]> => {
    await delay(300);
    return [...projects];
  },

  getById: async (id: number): Promise<ProjectDisplay | undefined> => {
    await delay(200);
    return projects.find((p) => p.id === id);
  },

  create: async (data: Partial<ProjectDisplay>): Promise<ProjectDisplay> => {
    await delay(500);
    
    // Generate initials from client name
    const clientInitials = (data.client || "")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    
    const newProject: ProjectDisplay = {
      id: Math.max(0, ...projects.map((p) => p.id || 0)) + 1,
      projectCode: `PRJ-${String(projects.length + 1).padStart(3, "0")}`,
      projectName: data.projectName || "",
      description: data.description,
      client: data.client || "",
      projectManager: data.projectManager,
      status: data.status || "Planning",
      priority: data.priority || "Medium",
      type: data.type || "Implementation",
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      spent: "$0",
      progress: 0,
      teamSize: data.teamSize || 0,
      tasksCompleted: 0,
      totalTasks: 0,
      created: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
      initials: clientInitials,
      tags: data.tags || [],
    };
    projects = [newProject, ...projects];
    return newProject;
  },

  update: async (id: number, data: Partial<ProjectDisplay>): Promise<ProjectDisplay> => {
    await delay(400);
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Project not found");
    
    // Regenerate initials if client changes
    let initials = projects[index].initials;
    if (data.client && data.client !== projects[index].client) {
      initials = data.client
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    
    projects[index] = {
      ...projects[index],
      ...data,
      initials,
      lastModified: new Date().toISOString().split("T")[0],
    };
    return projects[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(400);
    projects = projects.filter((p) => p.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(600);
    projects = projects.filter((p) => !ids.includes(p.id || 0));
  },

  bulkUpdate: async (ids: number[], data: Partial<ProjectDisplay>): Promise<void> => {
    await delay(600);
    projects = projects.map((p) =>
      ids.includes(p.id || 0)
        ? { ...p, ...data, lastModified: new Date().toISOString().split("T")[0] }
        : p
    );
  },
};
