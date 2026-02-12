// Campaign display data (matches what the page expects)
export interface CampaignDisplay {
  id: number;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  revenue: number;
  owner: string;
  created: string;
  initials: string;
}

// Initial mock data
const initialCampaigns: CampaignDisplay[] = [
  {
    id: 1,
    name: "Q1 2026 Product Launch",
    type: "Email",
    status: "Active",
    startDate: "Jan 15, 2026",
    endDate: "Mar 31, 2026",
    budget: 50000,
    spent: 32000,
    leads: 245,
    conversions: 68,
    revenue: 485000,
    owner: "John Smith",
    created: "Jan 10, 2026",
    initials: "PL",
  },
  {
    id: 2,
    name: "Winter Promotion Campaign",
    type: "Social Media",
    status: "Active",
    startDate: "Jan 1, 2026",
    endDate: "Feb 28, 2026",
    budget: 35000,
    spent: 28500,
    leads: 189,
    conversions: 42,
    revenue: 325000,
    owner: "Jane Doe",
    created: "Dec 20, 2025",
    initials: "WP",
  },
  {
    id: 3,
    name: "Enterprise Outreach 2026",
    type: "LinkedIn",
    status: "Active",
    startDate: "Jan 20, 2026",
    endDate: "Jun 30, 2026",
    budget: 75000,
    spent: 18000,
    leads: 98,
    conversions: 24,
    revenue: 580000,
    owner: "Mike Johnson",
    created: "Jan 15, 2026",
    initials: "EO",
  },
  {
    id: 4,
    name: "Webinar Series - Cloud Tech",
    type: "Webinar",
    status: "Completed",
    startDate: "Dec 1, 2025",
    endDate: "Dec 31, 2025",
    budget: 25000,
    spent: 24800,
    leads: 312,
    conversions: 89,
    revenue: 680000,
    owner: "Sarah Brown",
    created: "Nov 15, 2025",
    initials: "WS",
  },
  {
    id: 5,
    name: "Trade Show - Tech Summit",
    type: "Event",
    status: "Planned",
    startDate: "Mar 15, 2026",
    endDate: "Mar 18, 2026",
    budget: 120000,
    spent: 45000,
    leads: 0,
    conversions: 0,
    revenue: 0,
    owner: "John Smith",
    created: "Jan 5, 2026",
    initials: "TS",
  },
  {
    id: 6,
    name: "Customer Referral Program",
    type: "Referral",
    status: "Active",
    startDate: "Jan 1, 2026",
    endDate: "Dec 31, 2026",
    budget: 60000,
    spent: 12000,
    leads: 156,
    conversions: 52,
    revenue: 425000,
    owner: "Jane Doe",
    created: "Dec 15, 2025",
    initials: "CR",
  },
  {
    id: 7,
    name: "Content Marketing Q1",
    type: "Content",
    status: "Active",
    startDate: "Jan 1, 2026",
    endDate: "Mar 31, 2026",
    budget: 40000,
    spent: 26000,
    leads: 278,
    conversions: 71,
    revenue: 380000,
    owner: "Mike Johnson",
    created: "Dec 28, 2025",
    initials: "CM",
  },
];

// In-memory storage
let campaignsStore = [...initialCampaigns];
let nextId = Math.max(...campaignsStore.map((c) => c.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const campaignsApi = {
  getAll: async (): Promise<CampaignDisplay[]> => {
    await delay(300);
    return [...campaignsStore];
  },

  getById: async (id: number): Promise<CampaignDisplay | null> => {
    await delay(200);
    return campaignsStore.find((c) => c.id === id) || null;
  },

  create: async (data: Partial<CampaignDisplay>): Promise<CampaignDisplay> => {
    await delay(400);
    const newCampaign: CampaignDisplay = {
      id: nextId++,
      name: data.name || "",
      type: data.type || "Email",
      status: data.status || "Planned",
      startDate: data.startDate || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      endDate: data.endDate || "",
      budget: data.budget || 0,
      spent: data.spent || 0,
      leads: data.leads || 0,
      conversions: data.conversions || 0,
      revenue: data.revenue || 0,
      owner: data.owner || "Unassigned",
      created: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      initials:
        data.initials ||
        (data.name
          ? data.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "??"),
    };
    campaignsStore.push(newCampaign);
    return newCampaign;
  },

  update: async (id: number, data: Partial<CampaignDisplay>): Promise<CampaignDisplay> => {
    await delay(400);
    const index = campaignsStore.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Campaign not found");
    }
    campaignsStore[index] = {
      ...campaignsStore[index],
      ...data,
    };
    return campaignsStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    campaignsStore = campaignsStore.filter((c) => c.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    campaignsStore = campaignsStore.filter((c) => !ids.includes(c.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<CampaignDisplay>
  ): Promise<CampaignDisplay[]> => {
    await delay(600);
    const updated: CampaignDisplay[] = [];
    ids.forEach((id) => {
      const index = campaignsStore.findIndex((c) => c.id === id);
      if (index !== -1) {
        campaignsStore[index] = {
          ...campaignsStore[index],
          ...data,
        };
        updated.push(campaignsStore[index]);
      }
    });
    return updated;
  },
};
