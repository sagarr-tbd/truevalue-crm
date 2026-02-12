import { Meeting } from "@/lib/types";

// Meeting display data (matches what the page expects)
export interface MeetingDisplay extends Omit<Meeting, "createdAt" | "updatedAt"> {
  id: number;
  created: string;
  initials: string;
}

// Initial mock data
const initialMeetings: MeetingDisplay[] = [
  {
    id: 1,
    title: "Quarterly Business Review - Acme Corp",
    description: "Review Q4 performance and discuss 2026 goals",
    date: "Jan 30, 2026",
    time: "10:00 AM",
    duration: "60 min",
    type: "In Person",
    status: "Scheduled",
    location: "Conference Room A",
    organizer: "John Smith",
    attendees: ["Sarah Williams", "Robert Chen", "Mike Johnson"],
    relatedTo: "Acme Corporation",
    created: "Jan 20, 2026",
    initials: "QBR",
  },
  {
    id: 2,
    title: "Product Demo - TechVision Inc",
    description: "Demonstrate new features and capabilities",
    date: "Feb 1, 2026",
    time: "2:00 PM",
    duration: "45 min",
    type: "Video Call",
    status: "Scheduled",
    location: "Zoom",
    organizer: "Jane Doe",
    attendees: ["Michael Chen", "Lisa Anderson"],
    relatedTo: "TechVision Inc",
    created: "Jan 25, 2026",
    initials: "PD",
  },
  {
    id: 3,
    title: "Sales Team Sync",
    description: "Weekly team standup and pipeline review",
    date: "Jan 29, 2026",
    time: "9:00 AM",
    duration: "30 min",
    type: "Video Call",
    status: "Scheduled",
    location: "Microsoft Teams",
    organizer: "Mike Johnson",
    attendees: ["John Smith", "Jane Doe", "Sarah Brown"],
    relatedTo: "Internal",
    created: "Jan 22, 2026",
    initials: "STS",
  },
  {
    id: 4,
    title: "Contract Negotiation - Global Solutions",
    description: "Discuss terms and finalize agreement",
    date: "Feb 3, 2026",
    time: "11:00 AM",
    duration: "90 min",
    type: "In Person",
    status: "Scheduled",
    location: "Their Office",
    organizer: "Sarah Brown",
    attendees: ["Jessica Lee", "David Park"],
    relatedTo: "Global Solutions Ltd",
    created: "Jan 28, 2026",
    initials: "CN",
  },
  {
    id: 5,
    title: "Training Session - CRM Best Practices",
    description: "Team training on advanced CRM features",
    date: "Jan 28, 2026",
    time: "3:00 PM",
    duration: "120 min",
    type: "Video Call",
    status: "Completed",
    location: "Zoom",
    organizer: "John Smith",
    attendees: ["All Team Members"],
    relatedTo: "Internal",
    created: "Jan 15, 2026",
    initials: "TS",
  },
  {
    id: 6,
    title: "Discovery Call - NextGen Systems",
    description: "Initial consultation and needs assessment",
    date: "Jan 27, 2026",
    time: "1:00 PM",
    duration: "30 min",
    type: "Phone Call",
    status: "Completed",
    location: "Phone",
    organizer: "Jane Doe",
    attendees: ["Emma Johnson"],
    relatedTo: "NextGen Systems",
    created: "Jan 24, 2026",
    initials: "DC",
  },
  {
    id: 7,
    title: "Board Meeting Q1 Planning",
    description: "Strategic planning for Q1 2026",
    date: "Feb 5, 2026",
    time: "9:00 AM",
    duration: "180 min",
    type: "In Person",
    status: "Scheduled",
    location: "Boardroom",
    organizer: "Mike Johnson",
    attendees: ["Executive Team"],
    relatedTo: "Internal",
    created: "Jan 10, 2026",
    initials: "BM",
  },
  {
    id: 8,
    title: "Customer Success Check-in",
    description: "Monthly review with key accounts",
    date: "Jan 26, 2026",
    time: "4:00 PM",
    duration: "45 min",
    type: "Video Call",
    status: "Completed",
    location: "Google Meet",
    organizer: "Emma Davis",
    attendees: ["James Wilson", "Patricia Moore"],
    relatedTo: "CloudFirst Inc",
    created: "Jan 19, 2026",
    initials: "CS",
  },
  {
    id: 9,
    title: "Partnership Discussion - Synergy Solutions",
    description: "Explore strategic partnership opportunities",
    date: "Feb 4, 2026",
    time: "10:30 AM",
    duration: "60 min",
    type: "In Person",
    status: "Scheduled",
    location: "Coffee Shop Downtown",
    organizer: "John Smith",
    attendees: ["Amanda Roberts", "Tom Harris"],
    relatedTo: "Synergy Solutions",
    created: "Jan 29, 2026",
    initials: "PD",
  },
  {
    id: 10,
    title: "All Hands Meeting",
    description: "Company-wide quarterly update",
    date: "Feb 2, 2026",
    time: "11:00 AM",
    duration: "90 min",
    type: "In Person",
    status: "Scheduled",
    location: "Main Auditorium",
    organizer: "Sarah Brown",
    attendees: ["All Employees"],
    relatedTo: "Internal",
    created: "Jan 12, 2026",
    initials: "AH",
  },
];

// In-memory storage
let meetings = [...initialMeetings];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockMeetingsApi = {
  getAll: async (): Promise<MeetingDisplay[]> => {
    await delay(300);
    return [...meetings];
  },

  getById: async (id: number): Promise<MeetingDisplay> => {
    await delay(200);
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) throw new Error("Meeting not found");
    return meeting;
  },

  create: async (data: Partial<MeetingDisplay>): Promise<MeetingDisplay> => {
    await delay(500);
    const newMeeting: MeetingDisplay = {
      ...data,
      id: Math.max(...meetings.map(m => m.id || 0), 0) + 1,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      initials: data.title ? data.title.substring(0, 2).toUpperCase() : "",
    } as MeetingDisplay;
    meetings = [newMeeting, ...meetings];
    return newMeeting;
  },

  update: async (id: number, data: Partial<MeetingDisplay>): Promise<MeetingDisplay> => {
    await delay(400);
    const index = meetings.findIndex(m => m.id === id);
    if (index === -1) throw new Error("Meeting not found");
    
    const updated = { ...meetings[index], ...data };
    meetings[index] = updated;
    return meetings[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(400);
    meetings = meetings.filter(m => m.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(600);
    meetings = meetings.filter(m => m.id !== undefined && !ids.includes(m.id));
  },

  bulkUpdate: async (ids: number[], data: Partial<MeetingDisplay>): Promise<void> => {
    await delay(600);
    meetings = meetings.map(m =>
      m.id !== undefined && ids.includes(m.id) ? { ...m, ...data } : m
    );
  },
};
