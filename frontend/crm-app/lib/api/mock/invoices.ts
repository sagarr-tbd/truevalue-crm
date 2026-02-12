// Invoice display data (matches what the page expects)
export interface InvoiceDisplay {
  id: number;
  invoiceNumber: string;
  customer: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  created: string;
  initials: string;
}

// Initial mock data
const initialInvoices: InvoiceDisplay[] = [
  {
    id: 1,
    invoiceNumber: "INV-2026-001",
    customer: "Acme Corporation",
    amount: 12500.0,
    status: "Paid",
    dueDate: "Jan 15, 2026",
    paidDate: "Jan 12, 2026",
    created: "Jan 1, 2026",
    initials: "AC",
  },
  {
    id: 2,
    invoiceNumber: "INV-2026-002",
    customer: "TechStart Inc.",
    amount: 8500.5,
    status: "Sent",
    dueDate: "Jan 25, 2026",
    paidDate: null,
    created: "Jan 5, 2026",
    initials: "TI",
  },
  {
    id: 3,
    invoiceNumber: "INV-2026-003",
    customer: "Global Solutions Ltd",
    amount: 15200.0,
    status: "Overdue",
    dueDate: "Jan 10, 2026",
    paidDate: null,
    created: "Dec 28, 2025",
    initials: "GS",
  },
  {
    id: 4,
    invoiceNumber: "INV-2026-004",
    customer: "Digital Ventures",
    amount: 6750.25,
    status: "Draft",
    dueDate: "Feb 5, 2026",
    paidDate: null,
    created: "Jan 10, 2026",
    initials: "DV",
  },
  {
    id: 5,
    invoiceNumber: "INV-2026-005",
    customer: "Enterprise Partners",
    amount: 23400.0,
    status: "Paid",
    dueDate: "Jan 20, 2026",
    paidDate: "Jan 18, 2026",
    created: "Jan 8, 2026",
    initials: "EP",
  },
  {
    id: 6,
    invoiceNumber: "INV-2026-006",
    customer: "Innovation Labs",
    amount: 9800.75,
    status: "Sent",
    dueDate: "Feb 1, 2026",
    paidDate: null,
    created: "Jan 12, 2026",
    initials: "IL",
  },
];

// In-memory storage
let invoicesStore = [...initialInvoices];
let nextId = Math.max(...invoicesStore.map((i) => i.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const invoicesApi = {
  getAll: async (): Promise<InvoiceDisplay[]> => {
    await delay(300);
    return [...invoicesStore];
  },

  getById: async (id: number): Promise<InvoiceDisplay | null> => {
    await delay(200);
    return invoicesStore.find((i) => i.id === id) || null;
  },

  create: async (data: Partial<InvoiceDisplay>): Promise<InvoiceDisplay> => {
    await delay(400);
    const newInvoice: InvoiceDisplay = {
      id: nextId++,
      invoiceNumber: data.invoiceNumber || `INV-2026-${String(nextId).padStart(3, "0")}`,
      customer: data.customer || "",
      amount: data.amount || 0,
      status: data.status || "Draft",
      dueDate: data.dueDate || "",
      paidDate: data.paidDate || null,
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
    invoicesStore.push(newInvoice);
    return newInvoice;
  },

  update: async (id: number, data: Partial<InvoiceDisplay>): Promise<InvoiceDisplay> => {
    await delay(400);
    const index = invoicesStore.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error("Invoice not found");
    }
    invoicesStore[index] = {
      ...invoicesStore[index],
      ...data,
    };
    return invoicesStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    invoicesStore = invoicesStore.filter((i) => i.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    invoicesStore = invoicesStore.filter((i) => !ids.includes(i.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<InvoiceDisplay>
  ): Promise<InvoiceDisplay[]> => {
    await delay(600);
    const updated: InvoiceDisplay[] = [];
    ids.forEach((id) => {
      const index = invoicesStore.findIndex((i) => i.id === id);
      if (index !== -1) {
        invoicesStore[index] = {
          ...invoicesStore[index],
          ...data,
        };
        updated.push(invoicesStore[index]);
      }
    });
    return updated;
  },
};
