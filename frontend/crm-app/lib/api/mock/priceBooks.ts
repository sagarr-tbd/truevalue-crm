// Price Book display data (matches what the page expects)
export interface PriceBookDisplay {
  id: number;
  name: string;
  description: string;
  products: number;
  currency: string;
  status: string;
  validFrom: string;
  validTo: string;
  created: string;
  initials: string;
}

// Initial mock data
const initialPriceBooks: PriceBookDisplay[] = [
  {
    id: 1,
    name: "Standard Price Book",
    description: "Default pricing for all standard products and services",
    products: 45,
    currency: "USD",
    status: "Active",
    validFrom: "Jan 1, 2026",
    validTo: "Dec 31, 2026",
    created: "Jan 1, 2026",
    initials: "SP",
  },
  {
    id: 2,
    name: "Enterprise Price Book",
    description: "Volume pricing for enterprise customers with tiered discounts",
    products: 38,
    currency: "USD",
    status: "Active",
    validFrom: "Jan 1, 2026",
    validTo: "Dec 31, 2026",
    created: "Jan 2, 2026",
    initials: "EP",
  },
  {
    id: 3,
    name: "SMB Price Book",
    description: "Special pricing for small and medium businesses",
    products: 32,
    currency: "USD",
    status: "Active",
    validFrom: "Jan 1, 2026",
    validTo: "Jun 30, 2026",
    created: "Jan 3, 2026",
    initials: "SB",
  },
  {
    id: 4,
    name: "Q1 2026 Promotional",
    description: "Limited-time promotional pricing for Q1 2026 campaigns",
    products: 28,
    currency: "USD",
    status: "Active",
    validFrom: "Jan 1, 2026",
    validTo: "Mar 31, 2026",
    created: "Dec 28, 2025",
    initials: "Q1",
  },
  {
    id: 5,
    name: "Partner Price Book",
    description: "Exclusive pricing for authorized partners and resellers",
    products: 40,
    currency: "USD",
    status: "Active",
    validFrom: "Jan 1, 2026",
    validTo: "Dec 31, 2026",
    created: "Jan 5, 2026",
    initials: "PP",
  },
  {
    id: 6,
    name: "Legacy Price Book",
    description: "Historical pricing for discontinued products and services",
    products: 15,
    currency: "USD",
    status: "Inactive",
    validFrom: "Jan 1, 2025",
    validTo: "Dec 31, 2025",
    created: "Jan 1, 2025",
    initials: "LP",
  },
];

// In-memory storage
let priceBooksStore = [...initialPriceBooks];
let nextId = Math.max(...priceBooksStore.map((pb) => pb.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const priceBooksApi = {
  getAll: async (): Promise<PriceBookDisplay[]> => {
    await delay(300);
    return [...priceBooksStore];
  },

  getById: async (id: number): Promise<PriceBookDisplay | null> => {
    await delay(200);
    return priceBooksStore.find((pb) => pb.id === id) || null;
  },

  create: async (data: Partial<PriceBookDisplay>): Promise<PriceBookDisplay> => {
    await delay(400);
    const newPriceBook: PriceBookDisplay = {
      id: nextId++,
      name: data.name || "",
      description: data.description || "",
      products: data.products || 0,
      currency: data.currency || "USD",
      status: data.status || "Draft",
      validFrom: data.validFrom || "",
      validTo: data.validTo || "",
      created: data.created || new Date().toLocaleDateString("en-US", {
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
    priceBooksStore.push(newPriceBook);
    return newPriceBook;
  },

  update: async (id: number, data: Partial<PriceBookDisplay>): Promise<PriceBookDisplay> => {
    await delay(400);
    const index = priceBooksStore.findIndex((pb) => pb.id === id);
    if (index === -1) {
      throw new Error("Price book not found");
    }
    priceBooksStore[index] = {
      ...priceBooksStore[index],
      ...data,
    };
    return priceBooksStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    priceBooksStore = priceBooksStore.filter((pb) => pb.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    priceBooksStore = priceBooksStore.filter((pb) => !ids.includes(pb.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<PriceBookDisplay>
  ): Promise<PriceBookDisplay[]> => {
    await delay(600);
    const updated: PriceBookDisplay[] = [];
    ids.forEach((id) => {
      const index = priceBooksStore.findIndex((pb) => pb.id === id);
      if (index !== -1) {
        priceBooksStore[index] = {
          ...priceBooksStore[index],
          ...data,
        };
        updated.push(priceBooksStore[index]);
      }
    });
    return updated;
  },
};
