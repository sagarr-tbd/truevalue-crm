// Zod validation schemas for forms
import { z } from "zod";

// Lead validation schema - aligned with backend API
export const leadSchema = z.object({
  // Personal Information (required)
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  
  // Contact Information (optional)
  phone: z.preprocess(
    (val) => (val === null || val === "" ? undefined : val),
    z.string().optional().refine((val) => {
      if (!val) return true;
      return /^[\d\s\-\+\(\)]+$/.test(val);
    }, "Invalid phone format")
  ),
  mobile: z.preprocess(
    (val) => (val === null || val === "" ? undefined : val),
    z.string().optional().refine((val) => {
      if (!val) return true;
      return /^[\d\s\-\+\(\)]+$/.test(val);
    }, "Invalid phone format")
  ),
  
  // Company Information
  companyName: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  title: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  website: z.preprocess(
    (val) => (val === null || val === "" ? undefined : val),
    z.string().optional().refine((val) => {
      if (!val) return true;
      try {
        new URL(val.startsWith('http') ? val : `https://${val}`);
        return true;
      } catch {
        return false;
      }
    }, "Invalid URL format")
  ),
  
  // Lead Status & Source (backend fields)
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["new", "contacted", "qualified", "unqualified", "converted"], {
      required_error: "Status is required",
      invalid_type_error: "Status is required",
    })
  ),
  source: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().min(1, "Source is required")
  ),
  sourceDetail: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  
  // Lead Score (0-100, replaces rating)
  score: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseInt(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().min(0, "Score must be 0-100").max(100, "Score must be 0-100").optional()
  ),
  
  // Address
  addressLine1: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  city: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  state: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  postalCode: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  country: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  
  // Description/Notes
  description: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  
  // Custom Fields (JSON object)
  customFields: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.record(z.any()).optional()
  ),
  
  // Tags & Assignment
  tagIds: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.array(z.string()).optional()
  ),
  ownerId: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
});

// Account validation schema
export const accountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  website: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
      message: "Invalid URL format",
    }),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[\d\s\-\+\(\)]+$/.test(val);
  }, "Invalid phone format"),
  email: z.string().optional().refine((val) => {
    if (!val) return true;
    return z.string().email().safeParse(val).success;
  }, "Invalid email format"),
  industry: z.string().optional(),
  type: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Customer", "Partner", "Prospect", "Vendor", "Other"]).optional()
  ),
  employees: z.string().optional(),
  annualRevenue: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().positive("Must be a positive number").optional()
  ),
  parentAccount: z.string().optional(),
  assignedTo: z.string().optional(),
  address: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  profilePicture: z.string().optional(),
});

// Contact validation schema - aligned with backend API (ALL fields)
// Helper: Convert null to undefined for optional string fields
const optionalString = z.preprocess(
  (val) => (val === null ? undefined : val),
  z.string().optional()
);

// Helper: Convert null to undefined for optional boolean fields
const optionalBoolean = z.preprocess(
  (val) => (val === null ? undefined : val),
  z.boolean().optional()
);

// Helper: Optional email with null handling
const optionalEmail = z.preprocess(
  (val) => (val === null || val === "" ? undefined : val),
  z.string().optional().refine((val) => {
    if (!val) return true;
    return z.string().email().safeParse(val).success;
  }, "Invalid email format")
);

// Helper: Optional phone with null handling
const optionalPhone = z.preprocess(
  (val) => (val === null || val === "" ? undefined : val),
  z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[\d\s\-\+\(\)]+$/.test(val);
  }, "Invalid phone format")
);

// Helper: Optional URL with null handling
const optionalUrl = z.preprocess(
  (val) => (val === null || val === "" ? undefined : val),
  z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      new URL(val);
      return true;
    } catch {
      // Allow partial URLs like linkedin.com/in/user
      return val.includes('linkedin.com') || val.includes('twitter.com') || val.includes('.');
    }
  }, "Invalid URL format")
);

export const contactSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  
  // Contact Information
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  secondaryEmail: optionalEmail,
  phone: optionalPhone,
  mobile: optionalPhone,
  
  // Organization
  primaryCompanyId: optionalString,
  title: optionalString,
  department: optionalString,
  ownerId: optionalString,
  
  // Address
  addressLine1: optionalString,
  addressLine2: optionalString,
  city: optionalString,
  state: optionalString,
  postalCode: optionalString,
  country: optionalString,
  
  // Social
  linkedinUrl: optionalUrl,
  twitterUrl: optionalUrl,
  avatarUrl: optionalString,
  
  // Status & Source
  status: optionalString,
  source: optionalString,
  sourceDetail: optionalString,
  
  // Preferences
  doNotCall: optionalBoolean,
  doNotEmail: optionalBoolean,
  
  // Notes
  description: optionalString,
  tagIds: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.array(z.string()).optional()
  ),
});

// Deal validation schema
export const dealSchema = z.object({
  dealName: z.string().min(1, "Deal name is required"),
  amount: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().positive("Amount must be a positive number").optional()
  ),
  stage: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"], {
      required_error: "Stage is required",
      invalid_type_error: "Stage is required",
    })
  ),
  probability: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().min(0, "Probability must be between 0-100").max(100, "Probability must be between 0-100").optional()
  ),
  closeDate: z.string().optional(),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  nextStep: z.string().optional(),
  description: z.string().optional(),
  competitorInfo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
});

// Forecast validation schema
export const forecastSchema = z.object({
  period: z.string().min(1, "Period is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  targetRevenue: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().positive("Target revenue must be a positive number").optional()
  ),
  committedRevenue: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().min(0, "Committed revenue must be positive").optional()
  ),
  bestCase: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().min(0, "Best case must be positive").optional()
  ),
  worstCase: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().min(0, "Worst case must be positive").optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Planning", "On Track", "At Risk", "Achieved", "Missed"]).optional()
  ),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Campaign validation schema
export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  type: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Email", "Social Media", "LinkedIn", "Webinar", "Event", "Referral", "Content", "Other"]).optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Planned", "Active", "Paused", "Completed", "Cancelled"]).optional()
  ),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().min(0, "Budget must be positive").optional()
  ),
  targetLeads: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseInt(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().int().min(0, "Target leads must be positive").optional()
  ),
  targetRevenue: z.preprocess(
    (val) => {
      if (!val || val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === "number") {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().min(0, "Target revenue must be positive").optional()
  ),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Document validation schema
export const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["PDF", "Word", "Excel", "PowerPoint", "Image", "Other"]).optional()
  ),
  category: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Proposal", "Contract", "Marketing", "Pricing", "Notes", "Report", "Other"]).optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Draft", "Review", "Final", "Archived"]).optional()
  ),
  relatedTo: z.string().optional(),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fileUrl: z.string().optional(),
});

// Task validation schema
export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Urgent", "High", "Medium", "Low"], {
      required_error: "Priority is required",
      invalid_type_error: "Priority is required",
    })
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Not Started", "In Progress", "Completed", "Cancelled"], {
      required_error: "Status is required",
      invalid_type_error: "Status is required",
    })
  ),
  dueDate: z.string().min(1, "Due date is required"),
  startDate: z.string().optional(),
  category: z.string().optional(),
  relatedTo: z.string().optional(),
  relatedToType: z.string().optional(),
  assignedTo: z.string().optional(),
  reminderDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Call validation schema
export const callSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  direction: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Incoming", "Outgoing"], {
      required_error: "Direction is required",
      invalid_type_error: "Direction is required",
    })
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Scheduled", "Completed", "Missed", "Cancelled"]).optional()
  ),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[\d\s\-\+\(\)]+$/.test(val);
  }, "Invalid phone format"),
  relatedTo: z.string().optional(),
  relatedToType: z.string().optional(),
  outcome: z.string().optional(),
  callBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Meeting validation schema
export const meetingSchema = z.object({
  title: z.string().min(1, "Meeting title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().optional(),
  type: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["In Person", "Video Call", "Phone Call"]).optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Scheduled", "Completed", "Cancelled", "Rescheduled"]).optional()
  ),
  location: z.string().optional(),
  meetingLink: z.string().optional().refine((val) => {
    if (!val) return true;
    return z.string().url().safeParse(val).success;
  }, "Invalid URL format"),
  organizer: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  relatedTo: z.string().optional(),
  relatedToType: z.string().optional(),
  agenda: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "Price is required" }).min(0, "Price must be positive")
  ),
  cost: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Cost must be positive").optional()
  ),
  quantity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Quantity must be positive").optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Active", "Inactive", "Out of Stock", "Discontinued"]).optional()
  ),
  vendor: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Vendor validation schema
export const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contact: z.string().optional(),
  email: z.string().optional().refine((val) => {
    if (!val) return true;
    return z.string().email().safeParse(val).success;
  }, "Invalid email format"),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[\d\s\-\+\(\)]+$/.test(val);
  }, "Invalid phone format"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional().refine((val) => {
    if (!val) return true;
    return z.string().url().safeParse(val).success;
  }, "Invalid URL format"),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Active", "Inactive", "Pending"]).optional()
  ),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customer: z.string().min(1, "Customer is required"),
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "Amount is required" }).min(0, "Amount must be positive")
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Draft", "Sent", "Paid", "Overdue", "Cancelled"]).optional()
  ),
  dueDate: z.string().min(1, "Due date is required"),
  paidDate: z.string().optional(),
  items: z.array(z.object({
    product: z.string(),
    quantity: z.number(),
    price: z.number(),
  })).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Quote validation schema
export const quoteSchema = z.object({
  quoteNumber: z.string().min(1, "Quote number is required"),
  customer: z.string().min(1, "Customer is required"),
  total: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "Total is required" }).min(0, "Total must be positive")
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Draft", "Sent", "Accepted", "Rejected", "Expired"]).optional()
  ),
  validUntil: z.string().min(1, "Valid until date is required"),
  items: z.array(z.object({
    product: z.string(),
    quantity: z.number(),
    price: z.number(),
  })).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Sales Order validation schema
export const salesOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  customer: z.string().min(1, "Customer is required"),
  total: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "Total is required" }).min(0, "Total must be positive")
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]).optional()
  ),
  orderDate: z.string().min(1, "Order date is required"),
  deliveryDate: z.string().optional(),
  items: z.array(z.object({
    product: z.string(),
    quantity: z.number(),
    price: z.number(),
  })).optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Purchase Order validation schema
export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  vendor: z.string().min(1, "Vendor is required"),
  total: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "Total is required" }).min(0, "Total must be positive")
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Draft", "Ordered", "Received", "Cancelled"]).optional()
  ),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDate: z.string().optional(),
  items: z.array(z.object({
    product: z.string(),
    quantity: z.number(),
    cost: z.number(),
  })).optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Price Book validation schema
export const priceBookSchema = z.object({
  name: z.string().min(1, "Price book name is required"),
  description: z.string().optional(),
  currency: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]).optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Active", "Inactive", "Draft"]).optional()
  ),
  validFrom: z.string().min(1, "Valid from date is required"),
  validTo: z.string().optional(),
  products: z.array(z.object({
    productId: z.string(),
    price: z.number(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});

// Case validation schema
export const caseSchema = z.object({
  caseNumber: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  customer: z.string().min(1, "Customer is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().optional().refine((val) => {
    if (!val) return true;
    return z.string().email().safeParse(val).success;
  }, "Invalid email format"),
  contactPhone: z.string().optional(),
  priority: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Low", "Medium", "High", "Urgent"]).optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Open", "In Progress", "Resolved", "Closed", "Escalated"]).optional()
  ),
  type: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Technical", "Billing", "Feature Request", "Bug", "General Inquiry"]).optional()
  ),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Solution validation schema
export const solutionSchema = z.object({
  solutionNumber: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  author: z.string().optional(),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Draft", "Published", "Archived"]).optional()
  ),
  tags: z.array(z.string()).optional(),
});

// Service validation schema
export const serviceSchema = z.object({
  serviceCode: z.string().optional(),
  serviceName: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Professional Services", "Subscription", "One-Time", "Managed Services"]).optional()
  ),
  pricing: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Fixed Price", "Hourly", "Monthly", "Annual", "Per User"]).optional()
  ),
  price: z.string().optional(),
  duration: z.string().optional(),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Active", "Inactive", "Coming Soon", "Discontinued"]).optional()
  ),
  assignedTeam: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Project validation schema
export const projectSchema = z.object({
  projectCode: z.string().optional(),
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  client: z.string().min(1, "Client is required"),
  projectManager: z.string().optional(),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]).optional()
  ),
  priority: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Low", "Medium", "High", "Critical"]).optional()
  ),
  type: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["Implementation", "Development", "Migration", "Consulting", "Support", "Training", "Other"]).optional()
  ),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  teamSize: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.number().optional()
  ),
  tags: z.array(z.string()).optional(),
});

// Profile Settings validation schema
export const profileSettingsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional(),
  bio: z.string().optional(),
  joinDate: z.string().optional(),
});

// Notification Settings validation schema
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  emailFrequency: z.enum(["Real-time", "Daily Digest", "Weekly Summary", "Never"]),
});

// Security Settings validation schema
export const securitySettingsSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Appearance Settings validation schema
export const appearanceSettingsSchema = z.object({
  darkMode: z.boolean(),
  density: z.enum(["Comfortable", "Compact", "Spacious"]),
  language: z.string(),
  timezone: z.string(),
});

// Integration Settings validation schema
export const integrationSettingsSchema = z.object({
  webhookUrl: z.string().url("Invalid webhook URL").or(z.string().length(0)).optional(),
});



