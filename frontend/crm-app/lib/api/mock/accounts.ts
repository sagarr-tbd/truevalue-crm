// Account display data (matches what the page expects)
export interface AccountDisplay {
  id: number;
  accountName: string;
  industry: string;
  type: string;
  website: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  country: string;
  employees: number;
  annualRevenue: number;
  status: string;
  owner: string;
  created: string;
  lastActivity: string;
  initials: string;
}

// Initial mock data
const initialAccounts: AccountDisplay[] = [
  {
    id: 1,
    accountName: "Acme Corporation",
    industry: "Technology",
    type: "Enterprise",
    website: "www.acmecorp.com",
    phone: "+1 (555) 100-2000",
    email: "contact@acmecorp.com",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    employees: 5000,
    annualRevenue: 2500000,
    status: "Active",
    owner: "John Smith",
    created: "Nov 15, 2025",
    lastActivity: "Jan 28, 2026",
    initials: "AC",
  },
  {
    id: 2,
    accountName: "TechVision Inc",
    industry: "Software",
    type: "Mid-Market",
    website: "www.techvision.io",
    phone: "+1 (555) 200-3000",
    email: "info@techvision.io",
    city: "Austin",
    state: "TX",
    country: "USA",
    employees: 1200,
    annualRevenue: 850000,
    status: "Active",
    owner: "Jane Doe",
    created: "Dec 1, 2025",
    lastActivity: "Jan 27, 2026",
    initials: "TV",
  },
  {
    id: 3,
    accountName: "Global Solutions Ltd",
    industry: "Consulting",
    type: "Enterprise",
    website: "www.globalsolutions.com",
    phone: "+1 (555) 300-4000",
    email: "contact@globalsolutions.com",
    city: "New York",
    state: "NY",
    country: "USA",
    employees: 8500,
    annualRevenue: 4200000,
    status: "Active",
    owner: "Mike Johnson",
    created: "Oct 20, 2025",
    lastActivity: "Jan 26, 2026",
    initials: "GS",
  },
  {
    id: 4,
    accountName: "Innovate Labs",
    industry: "Research",
    type: "SMB",
    website: "www.innovatelabs.io",
    phone: "+1 (555) 400-5000",
    email: "hello@innovatelabs.io",
    city: "Seattle",
    state: "WA",
    country: "USA",
    employees: 450,
    annualRevenue: 320000,
    status: "Active",
    owner: "Sarah Williams",
    created: "Nov 5, 2025",
    lastActivity: "Jan 25, 2026",
    initials: "IL",
  },
  {
    id: 5,
    accountName: "Digital Dynamics",
    industry: "Marketing",
    type: "Mid-Market",
    website: "www.digitaldynamics.com",
    phone: "+1 (555) 500-6000",
    email: "info@digitaldynamics.com",
    city: "Chicago",
    state: "IL",
    country: "USA",
    employees: 800,
    annualRevenue: 650000,
    status: "Active",
    owner: "David Chen",
    created: "Dec 10, 2025",
    lastActivity: "Jan 24, 2026",
    initials: "DD",
  },
  {
    id: 6,
    accountName: "CloudFirst Solutions",
    industry: "Cloud Services",
    type: "Enterprise",
    website: "www.cloudfirst.io",
    phone: "+1 (555) 600-7000",
    email: "contact@cloudfirst.io",
    city: "Boston",
    state: "MA",
    country: "USA",
    employees: 3200,
    annualRevenue: 1800000,
    status: "Active",
    owner: "Emily Rodriguez",
    created: "Oct 30, 2025",
    lastActivity: "Jan 23, 2026",
    initials: "CF",
  },
  {
    id: 7,
    accountName: "NextGen Industries",
    industry: "Manufacturing",
    type: "Enterprise",
    website: "www.nextgenind.com",
    phone: "+1 (555) 700-8000",
    email: "sales@nextgenind.com",
    city: "Detroit",
    state: "MI",
    country: "USA",
    employees: 12000,
    annualRevenue: 5500000,
    status: "Inactive",
    owner: "Robert Taylor",
    created: "Sep 15, 2025",
    lastActivity: "Dec 10, 2025",
    initials: "NG",
  },
  {
    id: 8,
    accountName: "Startup Ventures",
    industry: "Venture Capital",
    type: "SMB",
    website: "www.startupventures.vc",
    phone: "+1 (555) 800-9000",
    email: "invest@startupventures.vc",
    city: "San Jose",
    state: "CA",
    country: "USA",
    employees: 25,
    annualRevenue: 180000,
    status: "Active",
    owner: "Lisa Park",
    created: "Dec 20, 2025",
    lastActivity: "Jan 22, 2026",
    initials: "SV",
  },
];

// In-memory storage
let accountsStore = [...initialAccounts];
let nextId = Math.max(...accountsStore.map((a) => a.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const accountsApi = {
  getAll: async (): Promise<AccountDisplay[]> => {
    await delay(300);
    return [...accountsStore];
  },

  getById: async (id: number): Promise<AccountDisplay | null> => {
    await delay(200);
    return accountsStore.find((a) => a.id === id) || null;
  },

  create: async (data: Partial<AccountDisplay>): Promise<AccountDisplay> => {
    await delay(400);
    const newAccount: AccountDisplay = {
      id: nextId++,
      accountName: data.accountName || "",
      industry: data.industry || "",
      type: data.type || "Prospect",
      website: data.website || "",
      phone: data.phone || "",
      email: data.email || "",
      city: data.city || "",
      state: data.state || "",
      country: data.country || "",
      employees: data.employees || 0,
      annualRevenue: data.annualRevenue || 0,
      status: data.status || "Active",
      owner: data.owner || "Unassigned",
      created: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      lastActivity: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      initials:
        data.initials ||
        (data.accountName
          ? data.accountName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "??"),
    };
    accountsStore.push(newAccount);
    return newAccount;
  },

  update: async (id: number, data: Partial<AccountDisplay>): Promise<AccountDisplay> => {
    await delay(400);
    const index = accountsStore.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error("Account not found");
    }
    accountsStore[index] = {
      ...accountsStore[index],
      ...data,
      lastActivity: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    return accountsStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    accountsStore = accountsStore.filter((a) => a.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    accountsStore = accountsStore.filter((a) => !ids.includes(a.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<AccountDisplay>
  ): Promise<AccountDisplay[]> => {
    await delay(600);
    const updated: AccountDisplay[] = [];
    ids.forEach((id) => {
      const index = accountsStore.findIndex((a) => a.id === id);
      if (index !== -1) {
        accountsStore[index] = {
          ...accountsStore[index],
          ...data,
          lastActivity: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
        updated.push(accountsStore[index]);
      }
    });
    return updated;
  },
};
