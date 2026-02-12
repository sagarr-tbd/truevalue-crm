// Quote display data (matches what the page expects)
export interface QuoteDisplay {
  id: number;
  quoteNumber: string;
  customer: string;
  items: number;
  total: number;
  status: string;
  validUntil: string;
  created: string;
  initials: string;
}

// Initial mock data
const initialQuotes: QuoteDisplay[] = [
  {
    id: 1,
    quoteNumber: "QT-2026-001",
    customer: "Acme Corporation",
    items: 3,
    total: 1247.0,
    status: "Sent",
    validUntil: "Feb 15, 2026",
    created: "Jan 20, 2026",
    initials: "AC",
  },
  {
    id: 2,
    quoteNumber: "QT-2026-002",
    customer: "TechStart Inc",
    items: 5,
    total: 2899.99,
    status: "Draft",
    validUntil: "Feb 20, 2026",
    created: "Jan 22, 2026",
    initials: "TI",
  },
  {
    id: 3,
    quoteNumber: "QT-2026-003",
    customer: "Global Solutions Ltd",
    items: 2,
    total: 549.0,
    status: "Accepted",
    validUntil: "Feb 10, 2026",
    created: "Jan 18, 2026",
    initials: "GS",
  },
  {
    id: 4,
    quoteNumber: "QT-2026-004",
    customer: "Innovate Co",
    items: 4,
    total: 1899.0,
    status: "Sent",
    validUntil: "Feb 25, 2026",
    created: "Jan 25, 2026",
    initials: "IC",
  },
  {
    id: 5,
    quoteNumber: "QT-2026-005",
    customer: "Enterprise Systems",
    items: 6,
    total: 4599.0,
    status: "Rejected",
    validUntil: "Feb 5, 2026",
    created: "Jan 15, 2026",
    initials: "ES",
  },
  {
    id: 6,
    quoteNumber: "QT-2026-006",
    customer: "Digital Ventures",
    items: 3,
    total: 1299.0,
    status: "Draft",
    validUntil: "Mar 1, 2026",
    created: "Jan 26, 2026",
    initials: "DV",
  },
];

// In-memory storage
let quotesStore = [...initialQuotes];
let nextId = Math.max(...quotesStore.map((q) => q.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const quotesApi = {
  getAll: async (): Promise<QuoteDisplay[]> => {
    await delay(300);
    return [...quotesStore];
  },

  getById: async (id: number): Promise<QuoteDisplay | null> => {
    await delay(200);
    return quotesStore.find((q) => q.id === id) || null;
  },

  create: async (data: Partial<QuoteDisplay>): Promise<QuoteDisplay> => {
    await delay(400);
    const newQuote: QuoteDisplay = {
      id: nextId++,
      quoteNumber: data.quoteNumber || `QT-2026-${String(nextId).padStart(3, "0")}`,
      customer: data.customer || "",
      items: data.items || 0,
      total: data.total || 0,
      status: data.status || "Draft",
      validUntil: data.validUntil || "",
      created: data.created || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      initials:
        data.initials ||
        (data.customer
          ? data.customer
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "??"),
    };
    quotesStore.push(newQuote);
    return newQuote;
  },

  update: async (id: number, data: Partial<QuoteDisplay>): Promise<QuoteDisplay> => {
    await delay(400);
    const index = quotesStore.findIndex((q) => q.id === id);
    if (index === -1) {
      throw new Error("Quote not found");
    }
    quotesStore[index] = {
      ...quotesStore[index],
      ...data,
    };
    return quotesStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    quotesStore = quotesStore.filter((q) => q.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    quotesStore = quotesStore.filter((q) => !ids.includes(q.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<QuoteDisplay>
  ): Promise<QuoteDisplay[]> => {
    await delay(600);
    const updated: QuoteDisplay[] = [];
    ids.forEach((id) => {
      const index = quotesStore.findIndex((q) => q.id === id);
      if (index !== -1) {
        quotesStore[index] = {
          ...quotesStore[index],
          ...data,
        };
        updated.push(quotesStore[index]);
      }
    });
    return updated;
  },
};
