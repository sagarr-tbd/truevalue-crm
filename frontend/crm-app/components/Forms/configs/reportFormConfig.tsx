import {
  FileText,
  Clock,
  Mail,
  Calendar,
} from "lucide-react";
import { z } from "zod";
import type { FormDrawerConfig } from "../FormDrawer/types";

// Report schema
export const reportSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  type: z.string().min(1, "Report type is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  frequency: z.string().min(1, "Frequency is required"),
  status: z.enum(["Active", "Scheduled", "Inactive"], {
    required_error: "Status is required",
  }),
  recipients: z.string().optional(),
  scheduleEnabled: z.boolean().optional(),
  nextRunDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const reportFormConfig: FormDrawerConfig = {
  entity: "Report",
  entityIcon: <FileText className="h-5 w-5 text-primary" />,
  schema: reportSchema,
  
  defaultValues: {
    name: "",
    type: "",
    category: "",
    description: "",
    frequency: "Monthly",
    status: "Active",
    recipients: "",
    scheduleEnabled: true,
    nextRunDate: "",
    assignedTo: "",
  },

  quickFormSections: [
    {
      label: "Report Information",
      icon: <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["name", "type", "category"],
    },
    {
      label: "Schedule",
      icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["frequency", "status"],
    },
  ],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "name",
          label: "Report Name",
          type: "text",
          required: true,
          placeholder: "Monthly Sales Summary",
        },
        {
          name: "type",
          label: "Report Type",
          type: "select",
          required: true,
          options: ["Sales", "Customer", "Financial", "Marketing", "Product", "Executive"],
          placeholder: "Select type...",
        },
        {
          name: "category",
          label: "Category",
          type: "select",
          required: true,
          options: ["Performance", "Conversion", "Engagement", "Forecasting", "ROI", "Retention", "Overview"],
          placeholder: "Select category...",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Describe what this report tracks...",
        },
      ],
    },
    {
      id: "schedule",
      label: "Schedule Settings",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "frequency",
          label: "Frequency",
          type: "select",
          required: true,
          options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
          placeholder: "Select frequency...",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: ["Active", "Scheduled", "Inactive"],
          placeholder: "Select status...",
        },
        {
          name: "scheduleEnabled",
          label: "Enable Automatic Scheduling",
          type: "checkbox",
        },
        {
          name: "nextRunDate",
          label: "Next Run Date",
          type: "date",
          placeholder: "Select date...",
        },
      ],
    },
    {
      id: "recipients",
      label: "Recipients & Sharing",
      icon: <Mail className="h-4 w-4" />,
      fields: [
        {
          name: "recipients",
          label: "Email Recipients",
          type: "textarea",
          placeholder: "Enter email addresses (comma separated):\nexample1@company.com, example2@company.com",
        },
        {
          name: "assignedTo",
          label: "Report Owner",
          type: "select",
          options: ["John Smith", "Jane Doe", "Mike Johnson", "Sarah Brown"],
          placeholder: "Select owner...",
        },
      ],
    },
  ],
};
