// Vendor display data (matches what the page expects)
export interface VendorDisplay {
  id: number;
  vendorName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  status: string;
  rating: string;
  totalOrders: number;
  totalSpent: number;
  created: string;
  initials: string;
}

// Initial mock data
const initialVendors: VendorDisplay[] = [
  {
    id: 1,
    vendorName: "TechSupply Co",
    contactName: "John Davis",
    email: "john@techsupply.com",
    phone: "+1 (555) 100-1000",
    website: "www.techsupply.com",
    category: "Hardware",
    status: "Active",
    rating: "Excellent",
    totalOrders: 45,
    totalSpent: 125000,
    created: "Jan 15, 2026",
    initials: "TS",
  },
  {
    id: 2,
    vendorName: "CloudService Pro",
    contactName: "Sarah Johnson",
    email: "sarah@cloudpro.com",
    phone: "+1 (555) 200-2000",
    website: "www.cloudpro.com",
    category: "Services",
    status: "Active",
    rating: "Excellent",
    totalOrders: 38,
    totalSpent: 89000,
    created: "Jan 10, 2026",
    initials: "CP",
  },
  {
    id: 3,
    vendorName: "Software Solutions Inc",
    contactName: "Mike Chen",
    email: "mike@softsolutions.com",
    phone: "+1 (555) 300-3000",
    website: "www.softsolutions.com",
    category: "Software",
    status: "Active",
    rating: "Good",
    totalOrders: 52,
    totalSpent: 165000,
    created: "Dec 28, 2025",
    initials: "SS",
  },
  {
    id: 4,
    vendorName: "Office Supplies Ltd",
    contactName: "Emma Wilson",
    email: "emma@officesupplies.com",
    phone: "+1 (555) 400-4000",
    website: "www.officesupplies.com",
    category: "Supplies",
    status: "Active",
    rating: "Good",
    totalOrders: 120,
    totalSpent: 45000,
    created: "Dec 15, 2025",
    initials: "OS",
  },
  {
    id: 5,
    vendorName: "Legacy Systems Corp",
    contactName: "David Brown",
    email: "david@legacysys.com",
    phone: "+1 (555) 500-5000",
    website: "www.legacysys.com",
    category: "Software",
    status: "Inactive",
    rating: "Average",
    totalOrders: 12,
    totalSpent: 28000,
    created: "Nov 20, 2025",
    initials: "LS",
  },
];

// In-memory storage
let vendorsStore = [...initialVendors];
let nextId = Math.max(...vendorsStore.map((v) => v.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const vendorsApi = {
  getAll: async (): Promise<VendorDisplay[]> => {
    await delay(300);
    return [...vendorsStore];
  },

  getById: async (id: number): Promise<VendorDisplay | null> => {
    await delay(200);
    return vendorsStore.find((v) => v.id === id) || null;
  },

  create: async (data: Partial<VendorDisplay>): Promise<VendorDisplay> => {
    await delay(400);
    const newVendor: VendorDisplay = {
      id: nextId++,
      vendorName: data.vendorName || "",
      contactName: data.contactName || "",
      email: data.email || "",
      phone: data.phone || "",
      website: data.website || "",
      category: data.category || "Other",
      status: data.status || "Active",
      rating: data.rating || "Good",
      totalOrders: data.totalOrders || 0,
      totalSpent: data.totalSpent || 0,
      created: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      initials:
        data.initials ||
        (data.vendorName
          ? data.vendorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "??"),
    };
    vendorsStore.push(newVendor);
    return newVendor;
  },

  update: async (id: number, data: Partial<VendorDisplay>): Promise<VendorDisplay> => {
    await delay(400);
    const index = vendorsStore.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error("Vendor not found");
    }
    vendorsStore[index] = {
      ...vendorsStore[index],
      ...data,
    };
    return vendorsStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    vendorsStore = vendorsStore.filter((v) => v.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    vendorsStore = vendorsStore.filter((v) => !ids.includes(v.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<VendorDisplay>
  ): Promise<VendorDisplay[]> => {
    await delay(600);
    const updated: VendorDisplay[] = [];
    ids.forEach((id) => {
      const index = vendorsStore.findIndex((v) => v.id === id);
      if (index !== -1) {
        vendorsStore[index] = {
          ...vendorsStore[index],
          ...data,
        };
        updated.push(vendorsStore[index]);
      }
    });
    return updated;
  },
};
