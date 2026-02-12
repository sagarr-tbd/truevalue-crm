import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lead, LeadStatus, LeadRating } from '@/lib/types';

// Initial mock data
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

interface LeadStore {
  leads: Lead[];
  isLoading: boolean;
  
  // CRUD operations
  addLead: (lead: Partial<Lead>) => Lead;
  updateLead: (id: number, updates: Partial<Lead>) => void;
  deleteLead: (id: number) => void;
  getLeadById: (id: number) => Lead | undefined;
  
  // Bulk operations
  bulkDelete: (ids: number[]) => void;
  bulkUpdate: (ids: number[], updates: Partial<Lead>) => void;
  
  // Utility
  resetLeads: () => void;
}

export const useLeadStore = create<LeadStore>()(
  persist(
    (set, get) => ({
      leads: initialLeads,
      isLoading: false,

      addLead: (leadData) => {
        const leads = get().leads;
        const newId = Math.max(...leads.map(l => l.id || 0), 0) + 1;
        
        const newLead: Lead = {
          ...leadData,
          id: newId,
          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          lastContact: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          initials: `${leadData.firstName?.[0] || ''}${leadData.lastName?.[0] || ''}`.toUpperCase(),
        } as Lead;
        
        set({ leads: [newLead, ...leads] });
        return newLead;
      },

      updateLead: (id, updates) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id ? { ...lead, ...updates } : lead
          ),
        }));
      },

      deleteLead: (id) => {
        set((state) => ({
          leads: state.leads.filter((lead) => lead.id !== id),
        }));
      },

      getLeadById: (id) => {
        return get().leads.find((lead) => lead.id === id);
      },

      bulkDelete: (ids) => {
        set((state) => ({
          leads: state.leads.filter((lead) => lead.id !== undefined && !ids.includes(lead.id)),
        }));
      },

      bulkUpdate: (ids, updates) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id !== undefined && ids.includes(lead.id)
              ? { ...lead, ...updates }
              : lead
          ),
        }));
      },

      resetLeads: () => {
        set({ leads: initialLeads });
      },
    }),
    {
      name: 'lead-storage',
    }
  )
);
