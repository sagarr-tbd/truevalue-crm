// Sales Order display data (matches what the page expects)
export interface SalesOrderDisplay {
  id: number;
  orderNumber: string;
  customer: string;
  items: number;
  total: number;
  status: string;
  orderDate: string;
  deliveryDate: string;
  initials: string;
}

// Initial mock data
const initialSalesOrders: SalesOrderDisplay[] = [
  {
    id: 1,
    orderNumber: "SO-2026-001",
    customer: "Acme Corporation",
    items: 3,
    total: 1247.0,
    status: "Processing",
    orderDate: "Jan 25, 2026",
    deliveryDate: "Feb 5, 2026",
    initials: "AC",
  },
  {
    id: 2,
    orderNumber: "SO-2026-002",
    customer: "TechStart Inc",
    items: 5,
    total: 2495.0,
    status: "Shipped",
    orderDate: "Jan 22, 2026",
    deliveryDate: "Feb 2, 2026",
    initials: "TI",
  },
  {
    id: 3,
    orderNumber: "SO-2026-003",
    customer: "Global Solutions Ltd",
    items: 2,
    total: 398.0,
    status: "Pending",
    orderDate: "Jan 27, 2026",
    deliveryDate: "Feb 10, 2026",
    initials: "GS",
  },
  {
    id: 4,
    orderNumber: "SO-2026-004",
    customer: "Enterprise Partners",
    items: 8,
    total: 5992.0,
    status: "Delivered",
    orderDate: "Jan 15, 2026",
    deliveryDate: "Jan 28, 2026",
    initials: "EP",
  },
  {
    id: 5,
    orderNumber: "SO-2026-005",
    customer: "Digital Ventures",
    items: 4,
    total: 1196.0,
    status: "Processing",
    orderDate: "Jan 24, 2026",
    deliveryDate: "Feb 8, 2026",
    initials: "DV",
  },
  {
    id: 6,
    orderNumber: "SO-2026-006",
    customer: "Innovation Labs",
    items: 1,
    total: 299.0,
    status: "Cancelled",
    orderDate: "Jan 20, 2026",
    deliveryDate: "Feb 3, 2026",
    initials: "IL",
  },
];

// In-memory storage
let salesOrdersStore = [...initialSalesOrders];
let nextId = Math.max(...salesOrdersStore.map((so) => so.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const salesOrdersApi = {
  getAll: async (): Promise<SalesOrderDisplay[]> => {
    await delay(300);
    return [...salesOrdersStore];
  },

  getById: async (id: number): Promise<SalesOrderDisplay | null> => {
    await delay(200);
    return salesOrdersStore.find((so) => so.id === id) || null;
  },

  create: async (data: Partial<SalesOrderDisplay>): Promise<SalesOrderDisplay> => {
    await delay(400);
    const newSalesOrder: SalesOrderDisplay = {
      id: nextId++,
      orderNumber: data.orderNumber || `SO-2026-${String(nextId).padStart(3, "0")}`,
      customer: data.customer || "",
      items: data.items || 0,
      total: data.total || 0,
      status: data.status || "Pending",
      orderDate: data.orderDate || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      deliveryDate: data.deliveryDate || "",
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
    salesOrdersStore.push(newSalesOrder);
    return newSalesOrder;
  },

  update: async (
    id: number,
    data: Partial<SalesOrderDisplay>
  ): Promise<SalesOrderDisplay> => {
    await delay(400);
    const index = salesOrdersStore.findIndex((so) => so.id === id);
    if (index === -1) {
      throw new Error("Sales order not found");
    }
    salesOrdersStore[index] = {
      ...salesOrdersStore[index],
      ...data,
    };
    return salesOrdersStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    salesOrdersStore = salesOrdersStore.filter((so) => so.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    salesOrdersStore = salesOrdersStore.filter((so) => !ids.includes(so.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<SalesOrderDisplay>
  ): Promise<SalesOrderDisplay[]> => {
    await delay(600);
    const updated: SalesOrderDisplay[] = [];
    ids.forEach((id) => {
      const index = salesOrdersStore.findIndex((so) => so.id === id);
      if (index !== -1) {
        salesOrdersStore[index] = {
          ...salesOrdersStore[index],
          ...data,
        };
        updated.push(salesOrdersStore[index]);
      }
    });
    return updated;
  },
};
