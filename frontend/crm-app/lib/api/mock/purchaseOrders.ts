// Purchase Order display data (matches what the page expects)
export interface PurchaseOrderDisplay {
  id: number;
  poNumber: string;
  vendor: string;
  items: number;
  total: number;
  status: string;
  orderDate: string;
  expectedDate: string;
  initials: string;
}

// Initial mock data
const initialPurchaseOrders: PurchaseOrderDisplay[] = [
  {
    id: 1,
    poNumber: "PO-2026-001",
    vendor: "Dell Technologies",
    items: 5,
    total: 6495.0,
    status: "Ordered",
    orderDate: "Jan 15, 2026",
    expectedDate: "Jan 25, 2026",
    initials: "DT",
  },
  {
    id: 2,
    poNumber: "PO-2026-002",
    vendor: "Microsoft Corporation",
    items: 12,
    total: 948.0,
    status: "Received",
    orderDate: "Jan 10, 2026",
    expectedDate: "Jan 20, 2026",
    initials: "MC",
  },
  {
    id: 3,
    poNumber: "PO-2026-003",
    vendor: "AWS Cloud Services",
    items: 3,
    total: 2997.0,
    status: "Draft",
    orderDate: "Jan 20, 2026",
    expectedDate: "Feb 1, 2026",
    initials: "AC",
  },
  {
    id: 4,
    poNumber: "PO-2025-098",
    vendor: "HP Inc.",
    items: 8,
    total: 5192.0,
    status: "Received",
    orderDate: "Dec 28, 2025",
    expectedDate: "Jan 8, 2026",
    initials: "HI",
  },
  {
    id: 5,
    poNumber: "PO-2026-004",
    vendor: "Cisco Systems",
    items: 15,
    total: 12450.0,
    status: "Ordered",
    orderDate: "Jan 18, 2026",
    expectedDate: "Jan 30, 2026",
    initials: "CS",
  },
  {
    id: 6,
    poNumber: "PO-2025-095",
    vendor: "Oracle Corporation",
    items: 2,
    total: 1598.0,
    status: "Cancelled",
    orderDate: "Dec 15, 2025",
    expectedDate: "Dec 25, 2025",
    initials: "OC",
  },
];

// In-memory storage
let purchaseOrdersStore = [...initialPurchaseOrders];
let nextId = Math.max(...purchaseOrdersStore.map((po) => po.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const purchaseOrdersApi = {
  getAll: async (): Promise<PurchaseOrderDisplay[]> => {
    await delay(300);
    return [...purchaseOrdersStore];
  },

  getById: async (id: number): Promise<PurchaseOrderDisplay | null> => {
    await delay(200);
    return purchaseOrdersStore.find((po) => po.id === id) || null;
  },

  create: async (data: Partial<PurchaseOrderDisplay>): Promise<PurchaseOrderDisplay> => {
    await delay(400);
    const newPurchaseOrder: PurchaseOrderDisplay = {
      id: nextId++,
      poNumber: data.poNumber || `PO-2026-${String(nextId).padStart(3, "0")}`,
      vendor: data.vendor || "",
      items: data.items || 0,
      total: data.total || 0,
      status: data.status || "Draft",
      orderDate: data.orderDate || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      expectedDate: data.expectedDate || "",
      initials:
        data.initials ||
        (data.vendor
          ? data.vendor
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "??"),
    };
    purchaseOrdersStore.push(newPurchaseOrder);
    return newPurchaseOrder;
  },

  update: async (
    id: number,
    data: Partial<PurchaseOrderDisplay>
  ): Promise<PurchaseOrderDisplay> => {
    await delay(400);
    const index = purchaseOrdersStore.findIndex((po) => po.id === id);
    if (index === -1) {
      throw new Error("Purchase order not found");
    }
    purchaseOrdersStore[index] = {
      ...purchaseOrdersStore[index],
      ...data,
    };
    return purchaseOrdersStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    purchaseOrdersStore = purchaseOrdersStore.filter((po) => po.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    purchaseOrdersStore = purchaseOrdersStore.filter((po) => !ids.includes(po.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<PurchaseOrderDisplay>
  ): Promise<PurchaseOrderDisplay[]> => {
    await delay(600);
    const updated: PurchaseOrderDisplay[] = [];
    ids.forEach((id) => {
      const index = purchaseOrdersStore.findIndex((po) => po.id === id);
      if (index !== -1) {
        purchaseOrdersStore[index] = {
          ...purchaseOrdersStore[index],
          ...data,
        };
        updated.push(purchaseOrdersStore[index]);
      }
    });
    return updated;
  },
};
