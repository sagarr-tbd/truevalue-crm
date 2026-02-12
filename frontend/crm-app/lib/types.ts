// Type definitions for the CRM application
import type { leadSchema, accountSchema, contactSchema, dealSchema, forecastSchema, campaignSchema, documentSchema, taskSchema, callSchema, meetingSchema, productSchema, vendorSchema, invoiceSchema, quoteSchema, salesOrderSchema, purchaseOrderSchema, priceBookSchema, caseSchema, solutionSchema, serviceSchema, projectSchema } from "./schemas";
import type { z } from "zod";

// Infer types from Zod schemas
export type Lead = z.infer<typeof leadSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  lastContact?: string;
  initials?: string;
  fullName?: string;
};

export type Account = z.infer<typeof accountSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
};

export type Contact = z.infer<typeof contactSchema> & {
  id?: string; // UUID from backend
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
  fullName?: string;
};

export type Deal = z.infer<typeof dealSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  company?: string;
  contactName?: string;
  owner?: string;
  initials?: string;
};

export type Forecast = z.infer<typeof forecastSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  actualRevenue?: number;
  progress?: number;
  dealsCount?: number;
  owner?: string;
  initials?: string;
};

export type Campaign = z.infer<typeof campaignSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  spent?: number;
  leads?: number;
  conversions?: number;
  revenue?: number;
  owner?: string;
  initials?: string;
};

export type Document = z.infer<typeof documentSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  size?: string;
  owner?: string;
  modified?: string;
};

export type Task = z.infer<typeof taskSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  completedDate?: string;
  initials?: string;
};

export type Call = z.infer<typeof callSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
};

export type Meeting = z.infer<typeof meetingSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
};

// Status types
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Unqualified";
export type LeadRating = "Hot" | "Warm" | "Cold";
export type AccountType = "Customer" | "Partner" | "Prospect" | "Vendor" | "Other";
export type DealStage = "Prospecting" | "Qualification" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
export type ForecastStatus = "Planning" | "On Track" | "At Risk" | "Achieved" | "Missed";
export type CampaignType = "Email" | "Social Media" | "LinkedIn" | "Webinar" | "Event" | "Referral" | "Content" | "Other";
export type CampaignStatus = "Planned" | "Active" | "Paused" | "Completed" | "Cancelled";
export type DocumentType = "PDF" | "Word" | "Excel" | "PowerPoint" | "Image" | "Other";
export type DocumentCategory = "Proposal" | "Contract" | "Marketing" | "Pricing" | "Notes" | "Report" | "Other";
export type DocumentStatus = "Draft" | "Review" | "Final" | "Archived";
export type TaskPriority = "Urgent" | "High" | "Medium" | "Low";
export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Cancelled";
export type CallDirection = "Incoming" | "Outgoing";
export type CallStatus = "Scheduled" | "Completed" | "Missed" | "Cancelled";
export type MeetingType = "In Person" | "Video Call" | "Phone Call";
export type MeetingStatus = "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";

// Inventory types
export type Product = z.infer<typeof productSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
};

export type Vendor = z.infer<typeof vendorSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  products?: number;
  totalOrders?: number;
  lastOrder?: string;
  initials?: string;
};

export type Invoice = z.infer<typeof invoiceSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
};

export type Quote = z.infer<typeof quoteSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  items?: number;
  initials?: string;
};

export type SalesOrder = z.infer<typeof salesOrderSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  items?: number;
  initials?: string;
};

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  items?: number;
  initials?: string;
};

export type PriceBook = z.infer<typeof priceBookSchema> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  products?: number;
  initials?: string;
};

// Inventory status types
export type ProductStatus = "Active" | "Inactive" | "Out of Stock" | "Discontinued";
export type VendorStatus = "Active" | "Inactive" | "Pending";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";
export type SalesOrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type PurchaseOrderStatus = "Draft" | "Ordered" | "Received" | "Cancelled";
export type PriceBookStatus = "Active" | "Inactive" | "Draft";
export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD";

// Support types
export type Case = z.infer<typeof caseSchema> & {
  id?: number;
  caseNumber?: string;
  created?: string;
  lastModified?: string;
  responseTime?: string;
  resolutionTime?: string | null;
  comments?: number;
  initials?: string;
};

export type Solution = z.infer<typeof solutionSchema> & {
  id?: number;
  solutionNumber?: string;
  views?: number;
  likes?: number;
  dislikes?: number;
  helpful?: number;
  rating?: number;
  comments?: number;
  created?: string;
  lastModified?: string;
  relatedCases?: number;
  initials?: string;
};

// Support status types
export type CasePriority = "Low" | "Medium" | "High" | "Urgent";
export type CaseStatus = "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated";
export type CaseType = "Technical" | "Billing" | "Feature Request" | "Bug" | "General Inquiry";
export type SolutionStatus = "Draft" | "Published" | "Archived";

// Service types
export type Service = z.infer<typeof serviceSchema> & {
  id?: number;
  serviceCode?: string;
  customersUsing?: number;
  revenue?: string;
  rating?: number;
  created?: string;
  lastModified?: string;
};

// Service status types
export type ServiceType = "Professional Services" | "Subscription" | "One-Time" | "Managed Services";
export type ServicePricing = "Fixed Price" | "Hourly" | "Monthly" | "Annual" | "Per User";
export type ServiceStatus = "Active" | "Inactive" | "Coming Soon" | "Discontinued";

// Project types
export type Project = z.infer<typeof projectSchema> & {
  id?: number;
  projectCode?: string;
  progress?: number;
  spent?: string;
  tasksCompleted?: number;
  totalTasks?: number;
  created?: string;
  lastModified?: string;
  initials?: string;
};

// Project status types
export type ProjectStatus = "Planning" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
export type ProjectPriority = "Low" | "Medium" | "High" | "Critical";
export type ProjectType = "Implementation" | "Development" | "Migration" | "Consulting" | "Support" | "Training" | "Other";



