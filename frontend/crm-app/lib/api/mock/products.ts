// Product display data (matches what the page expects)
export interface ProductDisplay {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  status: string;
  vendor: string;
  created: string;
}

// Initial mock data
const initialProducts: ProductDisplay[] = [
  {
    id: 1,
    name: "CRM Pro License",
    sku: "CRM-PRO-001",
    category: "Software",
    price: 99.00,
    cost: 45.00,
    quantity: 500,
    status: "Active",
    vendor: "Internal",
    created: "Jan 15, 2026",
  },
  {
    id: 2,
    name: "Cloud Storage 1TB",
    sku: "CLOUD-1TB-002",
    category: "Services",
    price: 49.99,
    cost: 25.00,
    quantity: 1000,
    status: "Active",
    vendor: "AWS",
    created: "Jan 10, 2026",
  },
  {
    id: 3,
    name: "Premium Support Package",
    sku: "SUP-PREM-003",
    category: "Services",
    price: 199.00,
    cost: 80.00,
    quantity: 250,
    status: "Active",
    vendor: "Internal",
    created: "Jan 8, 2026",
  },
  {
    id: 4,
    name: "Enterprise Hardware Kit",
    sku: "HW-ENT-004",
    category: "Hardware",
    price: 1299.00,
    cost: 850.00,
    quantity: 45,
    status: "Active",
    vendor: "Dell",
    created: "Jan 5, 2026",
  },
  {
    id: 5,
    name: "Training Module Basic",
    sku: "TRN-BAS-005",
    category: "Training",
    price: 299.00,
    cost: 120.00,
    quantity: 100,
    status: "Active",
    vendor: "Internal",
    created: "Dec 28, 2025",
  },
  {
    id: 6,
    name: "Legacy Software License",
    sku: "LEG-SOFT-006",
    category: "Software",
    price: 79.00,
    cost: 35.00,
    quantity: 0,
    status: "Out of Stock",
    vendor: "Microsoft",
    created: "Dec 20, 2025",
  },
  {
    id: 7,
    name: "Mobile App Subscription",
    sku: "APP-MOB-007",
    category: "Software",
    price: 29.99,
    cost: 12.00,
    quantity: 800,
    status: "Active",
    vendor: "Internal",
    created: "Dec 15, 2025",
  },
  {
    id: 8,
    name: "Discontinued Service Pack",
    sku: "OLD-SVC-008",
    category: "Services",
    price: 149.00,
    cost: 60.00,
    quantity: 10,
    status: "Discontinued",
    vendor: "Internal",
    created: "Nov 10, 2025",
  },
];

// In-memory storage
let productsStore = [...initialProducts];
let nextId = Math.max(...productsStore.map((p) => p.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const productsApi = {
  getAll: async (): Promise<ProductDisplay[]> => {
    await delay(300);
    return [...productsStore];
  },

  getById: async (id: number): Promise<ProductDisplay | null> => {
    await delay(200);
    return productsStore.find((p) => p.id === id) || null;
  },

  create: async (data: Partial<ProductDisplay>): Promise<ProductDisplay> => {
    await delay(400);
    const newProduct: ProductDisplay = {
      id: nextId++,
      name: data.name || "",
      sku: data.sku || "",
      category: data.category || "Other",
      price: data.price || 0,
      cost: data.cost || 0,
      quantity: data.quantity || 0,
      status: data.status || "Active",
      vendor: data.vendor || "Internal",
      created: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    productsStore.push(newProduct);
    return newProduct;
  },

  update: async (id: number, data: Partial<ProductDisplay>): Promise<ProductDisplay> => {
    await delay(400);
    const index = productsStore.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Product not found");
    }
    productsStore[index] = {
      ...productsStore[index],
      ...data,
    };
    return productsStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    productsStore = productsStore.filter((p) => p.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    productsStore = productsStore.filter((p) => !ids.includes(p.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<ProductDisplay>
  ): Promise<ProductDisplay[]> => {
    await delay(600);
    const updated: ProductDisplay[] = [];
    ids.forEach((id) => {
      const index = productsStore.findIndex((p) => p.id === id);
      if (index !== -1) {
        productsStore[index] = {
          ...productsStore[index],
          ...data,
        };
        updated.push(productsStore[index]);
      }
    });
    return updated;
  },
};
