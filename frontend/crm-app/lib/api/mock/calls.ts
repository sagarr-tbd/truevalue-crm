import { Call } from "@/lib/types";

// Call display data (matches what the page expects)
export interface CallDisplay extends Omit<Call, "createdAt" | "updatedAt"> {
  id: number;
  created: string;
  initials: string;
}

// Initial mock data
const initialCalls: CallDisplay[] = [
  {
    id: 1,
    subject: "Follow-up Call - Acme Corp",
    description: "Discuss proposal feedback and next steps",
    direction: "Outgoing",
    status: "Completed",
    duration: "25 min",
    date: "Jan 28, 2026",
    time: "10:30 AM",
    contactName: "Sarah Williams",
    contactPhone: "+1 (555) 123-4567",
    relatedTo: "Acme Corporation",
    callBy: "John Smith",
    outcome: "Positive",
    created: "Jan 28, 2026",
    initials: "AC",
  },
  {
    id: 2,
    subject: "Discovery Call - TechVision Inc",
    description: "Initial consultation to understand requirements",
    direction: "Outgoing",
    status: "Scheduled",
    duration: "30 min",
    date: "Jan 30, 2026",
    time: "2:00 PM",
    contactName: "Michael Chen",
    contactPhone: "+1 (555) 234-5678",
    relatedTo: "TechVision Inc",
    callBy: "Jane Doe",
    created: "Jan 27, 2026",
    initials: "TV",
  },
  {
    id: 3,
    subject: "Contract Negotiation",
    description: "Discuss pricing and terms",
    direction: "Outgoing",
    status: "Completed",
    duration: "45 min",
    date: "Jan 27, 2026",
    time: "11:00 AM",
    contactName: "Jessica Lee",
    contactPhone: "+1 (555) 345-6789",
    relatedTo: "Global Solutions Ltd",
    callBy: "Mike Johnson",
    outcome: "Positive",
    created: "Jan 27, 2026",
    initials: "GS",
  },
  {
    id: 4,
    subject: "Support Request - CloudFirst Inc",
    description: "Technical issue escalation",
    direction: "Incoming",
    status: "Completed",
    duration: "15 min",
    date: "Jan 28, 2026",
    time: "3:45 PM",
    contactName: "Rachel Green",
    contactPhone: "+1 (555) 456-7890",
    relatedTo: "CloudFirst Inc",
    callBy: "Sarah Brown",
    outcome: "Resolved",
    created: "Jan 28, 2026",
    initials: "CF",
  },
  {
    id: 5,
    subject: "Check-in Call - NextGen Systems",
    description: "Monthly account review",
    direction: "Outgoing",
    status: "Completed",
    duration: "20 min",
    date: "Jan 26, 2026",
    time: "9:00 AM",
    contactName: "David Park",
    contactPhone: "+1 (555) 567-8901",
    relatedTo: "NextGen Systems",
    callBy: "John Smith",
    outcome: "Positive",
    created: "Jan 26, 2026",
    initials: "NS",
  },
  {
    id: 6,
    subject: "Urgent Inquiry - Prime Industries",
    description: "Request for immediate assistance",
    direction: "Incoming",
    status: "Missed",
    date: "Jan 28, 2026",
    time: "4:30 PM",
    contactName: "Lisa Anderson",
    contactPhone: "+1 (555) 678-9012",
    relatedTo: "Prime Industries",
    created: "Jan 28, 2026",
    initials: "PI",
  },
  {
    id: 7,
    subject: "Renewal Discussion",
    description: "Discuss contract renewal options",
    direction: "Outgoing",
    status: "Completed",
    duration: "35 min",
    date: "Jan 25, 2026",
    time: "1:30 PM",
    contactName: "James Wilson",
    contactPhone: "+1 (555) 789-0123",
    relatedTo: "Innovation Labs",
    callBy: "Emma Davis",
    outcome: "Positive",
    created: "Jan 25, 2026",
    initials: "IL",
  },
  {
    id: 8,
    subject: "Product Demo Call",
    description: "Showcase new features to potential client",
    direction: "Outgoing",
    status: "Scheduled",
    duration: "45 min",
    date: "Feb 1, 2026",
    time: "10:00 AM",
    contactName: "Amanda Roberts",
    contactPhone: "+1 (555) 890-1234",
    relatedTo: "Summit Partners",
    callBy: "Mike Johnson",
    created: "Jan 29, 2026",
    initials: "SP",
  },
  {
    id: 9,
    subject: "Pricing Inquiry",
    description: "Customer requesting enterprise pricing details",
    direction: "Incoming",
    status: "Completed",
    duration: "10 min",
    date: "Jan 29, 2026",
    time: "11:15 AM",
    contactName: "Tom Harris",
    contactPhone: "+1 (555) 901-2345",
    relatedTo: "Phoenix Corp",
    callBy: "Sarah Brown",
    outcome: "Follow-up Required",
    created: "Jan 29, 2026",
    initials: "PC",
  },
  {
    id: 10,
    subject: "Partnership Discussion",
    description: "Explore strategic partnership opportunities",
    direction: "Outgoing",
    status: "Scheduled",
    duration: "60 min",
    date: "Feb 3, 2026",
    time: "3:00 PM",
    contactName: "Patricia Moore",
    contactPhone: "+1 (555) 012-3456",
    relatedTo: "Synergy Solutions",
    callBy: "John Smith",
    created: "Jan 28, 2026",
    initials: "SS",
  },
];

// In-memory storage
let calls = [...initialCalls];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockCallsApi = {
  getAll: async (): Promise<CallDisplay[]> => {
    await delay(300);
    return [...calls];
  },

  getById: async (id: number): Promise<CallDisplay> => {
    await delay(200);
    const call = calls.find(c => c.id === id);
    if (!call) throw new Error("Call not found");
    return call;
  },

  create: async (data: Partial<CallDisplay>): Promise<CallDisplay> => {
    await delay(500);
    const newCall: CallDisplay = {
      ...data,
      id: Math.max(...calls.map(c => c.id || 0), 0) + 1,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      initials: data.subject ? data.subject.substring(0, 2).toUpperCase() : "",
    } as CallDisplay;
    calls = [newCall, ...calls];
    return newCall;
  },

  update: async (id: number, data: Partial<CallDisplay>): Promise<CallDisplay> => {
    await delay(400);
    const index = calls.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Call not found");
    
    const updated = { ...calls[index], ...data };
    calls[index] = updated;
    return calls[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(400);
    calls = calls.filter(c => c.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(600);
    calls = calls.filter(c => c.id !== undefined && !ids.includes(c.id));
  },

  bulkUpdate: async (ids: number[], data: Partial<CallDisplay>): Promise<void> => {
    await delay(600);
    calls = calls.map(c =>
      c.id !== undefined && ids.includes(c.id) ? { ...c, ...data } : c
    );
  },
};
