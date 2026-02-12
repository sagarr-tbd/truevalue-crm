export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status: 'active' | 'inactive' | 'lead';
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  notes?: string;
}

export interface Lead {
  id: string;
  contactId: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  value?: number;
  notes?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  contactId: string;
  title: string;
  value: number;
  stage: 'prospecting' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate?: Date;
  closedDate?: Date;
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  contactId: string;
  subject: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
}

export interface DashboardStats {
  totalContacts: number;
  activeLeads: number;
  totalDeals: number;
  dealValue: number;
  recentActivities: Activity[];
}
