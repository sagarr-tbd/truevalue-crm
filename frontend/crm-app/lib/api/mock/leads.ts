import type { Lead, LeadStatus, LeadRating } from '@/lib/types';

// Mock data (same as before)
const initialLeads: Lead[] = [
  {
    id: 1,
    firstName: "Michael",
    lastName: "Anderson",
    company: "TechVision Inc",
    email: "michael.a@techvision.com",
    phone: "+1 (555) 123-4567",
    source: "Website",
    status: "New" as LeadStatus,
    rating: "Hot" as LeadRating,
    industry: "Technology",
    expectedRevenue: 75000,
    createdAt: "Jan 25, 2026",
    lastContact: "Jan 28, 2026",
    initials: "MA",
  },
  {
    id: 2,
    firstName: "Jennifer",
    lastName: "Martinez",
    company: "Global Solutions Ltd",
    email: "j.martinez@globalsol.com",
    phone: "+1 (555) 234-5678",
    source: "Referral",
    status: "Contacted" as LeadStatus,
    rating: "Hot" as LeadRating,
    industry: "Finance",
    expectedRevenue: 125000,
    createdAt: "Jan 20, 2026",
    lastContact: "Jan 27, 2026",
    initials: "JM",
  },
  {
    id: 3,
    firstName: "Robert",
    lastName: "Thompson",
    company: "Innovate Labs",
    email: "r.thompson@innovatelabs.io",
    phone: "+1 (555) 345-6789",
    source: "LinkedIn",
    status: "Qualified" as LeadStatus,
    rating: "Warm" as LeadRating,
    industry: "Software",
    expectedRevenue: 95000,
    createdAt: "Jan 18, 2026",
    lastContact: "Jan 26, 2026",
    initials: "RT",
  },
  {
    id: 4,
    firstName: "Emily",
    lastName: "White",
    company: "Strategic Partners",
    email: "emily.white@stratpartners.com",
    phone: "+1 (555) 456-7890",
    source: "Trade Show",
    status: "New" as LeadStatus,
    rating: "Cold" as LeadRating,
    industry: "Consulting",
    expectedRevenue: 45000,
    createdAt: "Jan 27, 2026",
    lastContact: "Jan 27, 2026",
    initials: "EW",
  },
  {
    id: 5,
    firstName: "David",
    lastName: "Brown",
    company: "NextGen Systems",
    email: "d.brown@nextgensys.com",
    phone: "+1 (555) 567-8901",
    source: "Email Campaign",
    status: "Contacted" as LeadStatus,
    rating: "Hot" as LeadRating,
    industry: "Technology",
    expectedRevenue: 180000,
    createdAt: "Jan 15, 2026",
    lastContact: "Jan 28, 2026",
    initials: "DB",
  },
  {
    id: 6,
    firstName: "Amanda",
    lastName: "Garcia",
    company: "Digital Dynamics",
    email: "a.garcia@digitaldyn.com",
    phone: "+1 (555) 678-9012",
    source: "Website",
    status: "Qualified" as LeadStatus,
    rating: "Warm" as LeadRating,
    industry: "Marketing",
    expectedRevenue: 62000,
    createdAt: "Jan 22, 2026",
    lastContact: "Jan 26, 2026",
    initials: "AG",
  },
  {
    id: 7,
    firstName: "Christopher",
    lastName: "Lee",
    company: "Apex Solutions",
    email: "c.lee@apexsol.com",
    phone: "+1 (555) 789-0123",
    source: "Referral",
    status: "Contacted" as LeadStatus,
    rating: "Warm" as LeadRating,
    industry: "Healthcare",
    expectedRevenue: 88000,
    createdAt: "Jan 10, 2026",
    lastContact: "Jan 24, 2026",
    initials: "CL",
  },
  {
    id: 8,
    firstName: "Nicole",
    lastName: "Taylor",
    company: "Prime Industries",
    email: "nicole.t@primeindustries.com",
    phone: "+1 (555) 890-1234",
    source: "Cold Call",
    status: "New" as LeadStatus,
    rating: "Cold" as LeadRating,
    industry: "Manufacturing",
    expectedRevenue: 52000,
    createdAt: "Jan 28, 2026",
    lastContact: "Jan 28, 2026",
    initials: "NT",
  },
  {
    id: 9,
    firstName: "James",
    lastName: "Wilson",
    company: "FutureTech Co",
    email: "j.wilson@futuretech.io",
    phone: "+1 (555) 901-2345",
    source: "LinkedIn",
    status: "Qualified" as LeadStatus,
    rating: "Hot" as LeadRating,
    industry: "Technology",
    expectedRevenue: 145000,
    createdAt: "Jan 12, 2026",
    lastContact: "Jan 27, 2026",
    initials: "JW",
  },
  {
    id: 10,
    firstName: "Sophia",
    lastName: "Davis",
    company: "CloudFirst Inc",
    email: "sophia.d@cloudfirst.com",
    phone: "+1 (555) 012-3456",
    source: "Website",
    status: "Contacted" as LeadStatus,
    rating: "Warm" as LeadRating,
    industry: "Cloud Services",
    expectedRevenue: 72000,
    createdAt: "Jan 19, 2026",
    lastContact: "Jan 25, 2026",
    initials: "SD",
  },
];

// In-memory storage (simulates database)
let leads = [...initialLeads];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions (same interface as real Django API will have)
export const mockLeadsApi = {
  getAll: async (): Promise<Lead[]> => {
    await delay(300); // Simulate network latency
    return [...leads];
  },

  getById: async (id: number): Promise<Lead> => {
    await delay(200);
    const lead = leads.find(l => l.id === id);
    if (!lead) throw new Error('Lead not found');
    return lead;
  },

  create: async (data: Partial<Lead>): Promise<Lead> => {
    await delay(500);
    const newLead: Lead = {
      ...data,
      id: Math.max(...leads.map(l => l.id || 0), 0) + 1,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastContact: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      initials: `${data.firstName?.[0] || ''}${data.lastName?.[0] || ''}`.toUpperCase(),
    } as Lead;
    leads = [newLead, ...leads];
    return newLead;
  },

  update: async (id: number, data: Partial<Lead>): Promise<Lead> => {
    await delay(400);
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Lead not found');
    leads[index] = { ...leads[index], ...data };
    return leads[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(400);
    leads = leads.filter(l => l.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(600);
    leads = leads.filter(l => l.id !== undefined && !ids.includes(l.id));
  },

  bulkUpdate: async (ids: number[], data: Partial<Lead>): Promise<void> => {
    await delay(600);
    leads = leads.map(l =>
      l.id !== undefined && ids.includes(l.id) ? { ...l, ...data } : l
    );
  },
};
