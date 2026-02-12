import {
  LifeBuoy,
  FileText,
  User,
  Mail,
  Phone,
  AlertCircle,
  Calendar,
  Tag,
  MessageSquare,
} from "lucide-react";
import { caseSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const caseFormConfig: FormDrawerConfig = {
  entity: "Case",
  entityIcon: <LifeBuoy className="h-5 w-5 text-primary" />,
  schema: caseSchema,
  
  defaultValues: {
    caseNumber: "",
    subject: "",
    description: "",
    customer: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    priority: "Medium",
    status: "Open",
    type: "General Inquiry",
    category: "",
    assignedTo: "",
    dueDate: "",
    tags: [],
  },

  quickFormSections: [
    {
      label: "Case Information",
      icon: <LifeBuoy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["subject", "customer", "priority", "status"],
    },
    {
      label: "Contact Details",
      icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["contactName", "contactEmail"],
    },
  ],

  quickFormFields: ["subject", "customer", "priority", "status", "contactName", "contactEmail"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <LifeBuoy className="h-4 w-4" />,
      fields: [
        {
          name: "subject",
          label: "Subject",
          type: "text",
          placeholder: "Brief description of the case",
          required: true,
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "customer",
          label: "Customer",
          type: "text",
          placeholder: "Customer or company name",
          required: true,
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          placeholder: "Select priority",
          options: ["Low", "Medium", "High", "Urgent"],
          icon: <AlertCircle className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Open", "In Progress", "Resolved", "Closed", "Escalated"],
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "type",
          label: "Type",
          type: "select",
          placeholder: "Select case type",
          options: ["Technical", "Billing", "Feature Request", "Bug", "General Inquiry"],
          icon: <Tag className="h-4 w-4" />,
        },
        {
          name: "category",
          label: "Category",
          type: "text",
          placeholder: "e.g., Authentication, Payment",
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "contact",
      label: "Contact Information",
      icon: <User className="h-4 w-4" />,
      fields: [
        {
          name: "contactName",
          label: "Contact Name",
          type: "text",
          placeholder: "Primary contact person",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "contactEmail",
          label: "Contact Email",
          type: "email",
          placeholder: "contact@example.com",
          icon: <Mail className="h-4 w-4" />,
        },
        {
          name: "contactPhone",
          label: "Contact Phone",
          type: "tel",
          placeholder: "+1 (555) 000-0000",
          icon: <Phone className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "details",
      label: "Case Details",
      icon: <MessageSquare className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Detailed description of the case...",
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          name: "assignedTo",
          label: "Assigned To",
          type: "text",
          placeholder: "Team member name",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "dueDate",
          label: "Due Date",
          type: "date",
          placeholder: "Select due date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          placeholder: "Add tags (press Enter after each tag)",
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
