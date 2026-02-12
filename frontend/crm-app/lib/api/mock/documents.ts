// Document display data (matches what the page expects)
export interface DocumentDisplay {
  id: number;
  name: string;
  type: string;
  category: string;
  size: string;
  owner: string;
  relatedTo: string;
  created: string;
  modified: string;
  status: string;
  initials: string;
}

// Initial mock data
const initialDocuments: DocumentDisplay[] = [
  {
    id: 1,
    name: "Q1 Sales Proposal - Acme Corp.pdf",
    type: "PDF",
    category: "Proposal",
    size: "2.4 MB",
    owner: "John Smith",
    relatedTo: "Acme Corporation",
    created: "Jan 20, 2026",
    modified: "Jan 25, 2026",
    status: "Final",
    initials: "JS",
  },
  {
    id: 2,
    name: "Contract Agreement - TechVision.docx",
    type: "Word",
    category: "Contract",
    size: "1.2 MB",
    owner: "Jane Doe",
    relatedTo: "TechVision Inc",
    created: "Jan 18, 2026",
    modified: "Jan 27, 2026",
    status: "Draft",
    initials: "JD",
  },
  {
    id: 3,
    name: "Product Catalog 2026.pdf",
    type: "PDF",
    category: "Marketing",
    size: "8.5 MB",
    owner: "Mike Johnson",
    relatedTo: "General",
    created: "Jan 1, 2026",
    modified: "Jan 15, 2026",
    status: "Final",
    initials: "MJ",
  },
  {
    id: 4,
    name: "Pricing Sheet - Enterprise.xlsx",
    type: "Excel",
    category: "Pricing",
    size: "456 KB",
    owner: "Sarah Brown",
    relatedTo: "Global Solutions Ltd",
    created: "Jan 22, 2026",
    modified: "Jan 28, 2026",
    status: "Final",
    initials: "SB",
  },
  {
    id: 5,
    name: "Meeting Notes - NextGen Systems.docx",
    type: "Word",
    category: "Notes",
    size: "89 KB",
    owner: "John Smith",
    relatedTo: "NextGen Systems",
    created: "Jan 25, 2026",
    modified: "Jan 26, 2026",
    status: "Draft",
    initials: "JS",
  },
  {
    id: 6,
    name: "Sales Report Q4 2025.pdf",
    type: "PDF",
    category: "Report",
    size: "1.8 MB",
    owner: "Mike Johnson",
    relatedTo: "General",
    created: "Jan 5, 2026",
    modified: "Jan 8, 2026",
    status: "Final",
    initials: "MJ",
  },
];

// In-memory storage
let documentsStore = [...initialDocuments];
let nextId = Math.max(...documentsStore.map((d) => d.id)) + 1;

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const documentsApi = {
  getAll: async (): Promise<DocumentDisplay[]> => {
    await delay(300);
    return [...documentsStore];
  },

  getById: async (id: number): Promise<DocumentDisplay | null> => {
    await delay(200);
    return documentsStore.find((d) => d.id === id) || null;
  },

  create: async (data: Partial<DocumentDisplay>): Promise<DocumentDisplay> => {
    await delay(400);
    const newDocument: DocumentDisplay = {
      id: nextId++,
      name: data.name || "",
      type: data.type || "Other",
      category: data.category || "Other",
      size: data.size || "0 KB",
      owner: data.owner || "Unknown",
      relatedTo: data.relatedTo || "General",
      created: data.created || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      modified: data.modified || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: data.status || "Draft",
      initials:
        data.initials ||
        (data.owner
          ? data.owner
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "??"),
    };
    documentsStore.push(newDocument);
    return newDocument;
  },

  update: async (id: number, data: Partial<DocumentDisplay>): Promise<DocumentDisplay> => {
    await delay(400);
    const index = documentsStore.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error("Document not found");
    }
    documentsStore[index] = {
      ...documentsStore[index],
      ...data,
      modified: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    return documentsStore[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    documentsStore = documentsStore.filter((d) => d.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(500);
    documentsStore = documentsStore.filter((d) => !ids.includes(d.id));
  },

  bulkUpdate: async (
    ids: number[],
    data: Partial<DocumentDisplay>
  ): Promise<DocumentDisplay[]> => {
    await delay(600);
    const updated: DocumentDisplay[] = [];
    ids.forEach((id) => {
      const index = documentsStore.findIndex((d) => d.id === id);
      if (index !== -1) {
        documentsStore[index] = {
          ...documentsStore[index],
          ...data,
          modified: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
        updated.push(documentsStore[index]);
      }
    });
    return updated;
  },
};
