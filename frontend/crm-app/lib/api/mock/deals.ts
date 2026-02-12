// Deal display data (matches what the page expects)
export interface DealDisplay {
  id: number;
  dealName: string;
  company: string;
  contactName: string;
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
  created: string;
  initials: string;
}

// Initial mock data
const initialDeals: DealDisplay[] = [
  {
    id: 1,
    dealName: "Enterprise CRM Package",
    company: "Acme Corporation",
    contactName: "Sarah Williams",
    amount: 125000,
    stage: "Negotiation",
    probability: 80,
    closeDate: "Feb 15, 2026",
    owner: "John Smith",
    created: "Dec 10, 2025",
    initials: "AC",
  },
  {
    id: 2,
    dealName: "Marketing Automation Suite",
    company: "CloudNine Solutions",
    contactName: "Robert Chen",
    amount: 85000,
    stage: "Proposal",
    probability: 60,
    closeDate: "Feb 28, 2026",
    owner: "Jane Doe",
    created: "Dec 15, 2025",
    initials: "CS",
  },
  {
    id: 3,
    dealName: "Sales Analytics Platform",
    company: "TechStart Inc",
    contactName: "Jessica Lee",
    amount: 45000,
    stage: "Qualification",
    probability: 40,
    closeDate: "Mar 10, 2026",
    owner: "Mike Johnson",
    created: "Dec 18, 2025",
    initials: "TS",
  },
  {
    id: 4,
    dealName: "Customer Support System",
    company: "GlobalTech Systems",
    contactName: "Emma Johnson",
    amount: 95000,
    stage: "Prospecting",
    probability: 20,
    closeDate: "Mar 25, 2026",
    owner: "Sarah Brown",
    created: "Dec 20, 2025",
    initials: "GT",
  },
  {
    id: 5,
    dealName: "API Integration Package",
    company: "Innovate Labs",
    contactName: "Michael Chen",
    amount: 35000,
    stage: "Closed Won",
    probability: 100,
    closeDate: "Jan 15, 2026",
    owner: "John Smith",
    created: "Nov 28, 2025",
    initials: "IL",
  },
  {
    id: 6,
    dealName: "Mobile App Development",
    company: "Nexus Solutions",
    contactName: "Sophie Martinez",
    amount: 150000,
    stage: "Negotiation",
    probability: 75,
    closeDate: "Feb 20, 2026",
    owner: "Jane Doe",
    created: "Dec 5, 2025",
    initials: "NS",
  },
  {
    id: 7,
    dealName: "Data Warehouse Solution",
    company: "Zenith Corp",
    contactName: "James Wilson",
    amount: 200000,
    stage: "Proposal",
    probability: 55,
    closeDate: "Mar 5, 2026",
    owner: "Mike Johnson",
    created: "Dec 12, 2025",
    initials: "ZC",
  },
  {
    id: 8,
    dealName: "Security Audit Service",
    company: "DataFlow Inc",
    contactName: "Lisa Anderson",
    amount: 25000,
    stage: "Closed Lost",
    probability: 0,
    closeDate: "Jan 10, 2026",
    owner: "Sarah Brown",
    created: "Nov 15, 2025",
    initials: "DF",
  },
];

// In-memory storage
let dealsStore = [...initialDeals];
let nextId = Math.max(...dealsStore.map((d) => d.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const dealsApi = {
  getAll: async (): Promise<DealDisplay[]> => {
    await delay(300);
    return [...dealsStore];
  },

  getById: async (id: number): Promise<DealDisplay | null> => {
    await delay(200);
    return dealsStore.find((d) => d.id === id) || null;
  },

  create: async (data: Partial<DealDisplay>): Promise<DealDisplay> => {
    await delay(400);
    const newDeal: DealDisplay = {
      id: nextId++,
      dealName: data.dealName || "",
      company: data.company || "",
      contactName: data.contactName || "",
      amount: data.amount || 0,
      stage: data.stage || "Prospecting",
      probability: data.probability || 10,
      closeDate: data.closeDate || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      owner: data.owner || "Unassigned",
      created: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      initials:
        data.initials ||
        (data.company
          ? data.company
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "??"),
    };
    dealsStore.push(newDeal);
    return newDeal;
  },

  update: async (id: number, data: Partial<DealDisplay>): Promise<DealDisplay> => {
    await delay(400);
    const index = dealsStore.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error("Deal not found");
    }
    dealsStore[index] = {
      ...dealsStore[index],
      ...data,
    };
    return dealsStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    dealsStore = dealsStore.filter((d) => d.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    dealsStore = dealsStore.filter((d) => !ids.includes(d.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<DealDisplay>
  ): Promise<DealDisplay[]> => {
    await delay(600);
    const updated: DealDisplay[] = [];
    ids.forEach((id) => {
      const index = dealsStore.findIndex((d) => d.id === id);
      if (index !== -1) {
        dealsStore[index] = {
          ...dealsStore[index],
          ...data,
        };
        updated.push(dealsStore[index]);
      }
    });
    return updated;
  },
};
