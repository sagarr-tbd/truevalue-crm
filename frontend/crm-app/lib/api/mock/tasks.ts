import { Task } from "@/lib/types";

// Task display data (matches what the page expects)
export interface TaskDisplay extends Omit<Task, "createdAt" | "updatedAt"> {
  id: number;
  created: string;
  completedDate?: string;
  initials: string;
}

// Initial mock data
const initialTasks: TaskDisplay[] = [
  {
    id: 1,
    title: "Follow up with Acme Corp",
    description: "Send proposal and schedule demo",
    priority: "High",
    status: "In Progress",
    dueDate: "Jan 30, 2026",
    assignedTo: "John Smith",
    relatedTo: "Acme Corporation",
    category: "Sales",
    created: "Jan 25, 2026",
    initials: "FA",
  },
  {
    id: 2,
    title: "Prepare Q1 Sales Report",
    description: "Compile quarterly sales data and insights",
    priority: "High",
    status: "Not Started",
    dueDate: "Feb 5, 2026",
    assignedTo: "Jane Doe",
    relatedTo: "Internal",
    category: "Reporting",
    created: "Jan 28, 2026",
    initials: "QR",
  },
  {
    id: 3,
    title: "Update CRM Database",
    description: "Clean up duplicate contacts and accounts",
    priority: "Medium",
    status: "In Progress",
    dueDate: "Feb 1, 2026",
    assignedTo: "Mike Johnson",
    relatedTo: "Internal",
    category: "Maintenance",
    created: "Jan 20, 2026",
    initials: "UD",
  },
  {
    id: 4,
    title: "Call TechVision Inc",
    description: "Discuss renewal terms and contract details",
    priority: "High",
    status: "In Progress",
    dueDate: "Jan 29, 2026",
    assignedTo: "Sarah Brown",
    relatedTo: "TechVision Inc",
    category: "Sales",
    created: "Jan 26, 2026",
    initials: "CT",
  },
  {
    id: 5,
    title: "Send contract to Global Solutions",
    description: "Finalize and send signed agreement",
    priority: "Urgent",
    status: "Not Started",
    dueDate: "Jan 31, 2026",
    assignedTo: "John Smith",
    relatedTo: "Global Solutions",
    category: "Sales",
    created: "Jan 27, 2026",
    initials: "SC",
  },
  {
    id: 6,
    title: "Review marketing campaign",
    description: "Analyze Q4 campaign performance and ROI",
    priority: "Medium",
    status: "Completed",
    dueDate: "Jan 15, 2026",
    assignedTo: "Emma Wilson",
    relatedTo: "Internal",
    category: "Marketing",
    created: "Jan 10, 2026",
    completedDate: "Jan 15, 2026",
    initials: "RC",
  },
  {
    id: 7,
    title: "Schedule product demo",
    description: "Coordinate with Beta Technologies for product walkthrough",
    priority: "Medium",
    status: "Not Started",
    dueDate: "Feb 3, 2026",
    assignedTo: "Mike Johnson",
    relatedTo: "Beta Technologies",
    category: "Sales",
    created: "Jan 28, 2026",
    initials: "SD",
  },
  {
    id: 8,
    title: "Update website content",
    description: "Refresh product pages and pricing information",
    priority: "Low",
    status: "Not Started",
    dueDate: "Feb 10, 2026",
    assignedTo: "Emma Wilson",
    relatedTo: "Internal",
    category: "Marketing",
    created: "Jan 29, 2026",
    initials: "UW",
  },
  {
    id: 9,
    title: "Onboard new sales rep",
    description: "Complete training and system setup",
    priority: "High",
    status: "In Progress",
    dueDate: "Feb 2, 2026",
    assignedTo: "Sarah Brown",
    relatedTo: "Internal",
    category: "HR",
    created: "Jan 25, 2026",
    initials: "ON",
  },
  {
    id: 10,
    title: "Client feedback survey",
    description: "Send satisfaction survey to top 20 clients",
    priority: "Medium",
    status: "Completed",
    dueDate: "Jan 20, 2026",
    assignedTo: "Jane Doe",
    relatedTo: "Internal",
    category: "Customer Success",
    created: "Jan 15, 2026",
    completedDate: "Jan 20, 2026",
    initials: "CF",
  },
];

// In-memory storage
let tasks = [...initialTasks];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockTasksApi = {
  getAll: async (): Promise<TaskDisplay[]> => {
    await delay(300);
    return [...tasks];
  },

  getById: async (id: number): Promise<TaskDisplay> => {
    await delay(200);
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error("Task not found");
    return task;
  },

  create: async (data: Partial<TaskDisplay>): Promise<TaskDisplay> => {
    await delay(500);
    const newTask: TaskDisplay = {
      ...data,
      id: Math.max(...tasks.map(t => t.id || 0), 0) + 1,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      initials: data.title ? data.title.substring(0, 2).toUpperCase() : "",
      completedDate: data.status === "Completed" ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
    } as TaskDisplay;
    tasks = [newTask, ...tasks];
    return newTask;
  },

  update: async (id: number, data: Partial<TaskDisplay>): Promise<TaskDisplay> => {
    await delay(400);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Task not found");
    
    const updated = { ...tasks[index], ...data };
    if (data.status === "Completed" && !updated.completedDate) {
      updated.completedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    tasks[index] = updated;
    return tasks[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(400);
    tasks = tasks.filter(t => t.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(600);
    tasks = tasks.filter(t => t.id !== undefined && !ids.includes(t.id));
  },

  bulkUpdate: async (ids: number[], data: Partial<TaskDisplay>): Promise<void> => {
    await delay(600);
    tasks = tasks.map(t =>
      t.id !== undefined && ids.includes(t.id) ? { ...t, ...data } : t
    );
  },
};
