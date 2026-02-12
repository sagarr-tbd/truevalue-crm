import {
  FileText,
  User,
  DollarSign,
  Calendar,
  BarChart3,
  Tag,
} from "lucide-react";
import { quoteSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const quoteFormConfig: FormDrawerConfig = {
  entity: "Quote",
  entityIcon: <FileText className="h-5 w-5 text-primary" />,
  schema: quoteSchema,
  
  defaultValues: {
    quoteNumber: "",
    customer: "",
    total: undefined,
    status: undefined,
    validUntil: "",
    notes: "",
    terms: "",
  },

  quickFormSections: [
    {
      label: "Quote Information",
      icon: <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["quoteNumber", "customer", "status"],
    },
    {
      label: "Financial Details",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["total", "validUntil"],
    },
  ],

  quickFormFields: ["quoteNumber", "customer", "status", "total", "validUntil"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "quoteNumber",
          label: "Quote Number",
          type: "text",
          placeholder: "QT-2026-001",
          required: true,
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "customer",
          label: "Customer",
          type: "text",
          placeholder: "Enter customer name",
          required: true,
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Draft", "Sent", "Accepted", "Rejected", "Expired"],
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "financial",
      label: "Financial Details",
      icon: <DollarSign className="h-4 w-4" />,
      fields: [
        {
          name: "total",
          label: "Total Amount",
          type: "number",
          placeholder: "0.00",
          required: true,
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "validUntil",
          label: "Valid Until",
          type: "date",
          placeholder: "Select date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "notes",
      label: "Notes & Terms",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "notes",
          label: "Notes",
          type: "textarea",
          placeholder: "Enter any additional notes",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "terms",
          label: "Terms & Conditions",
          type: "textarea",
          placeholder: "Enter terms and conditions",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "tags",
      label: "Tags",
      icon: <Tag className="h-4 w-4" />,
      fields: [
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          placeholder: "Add tags...",
          options: [
            "High Value",
            "Urgent",
            "Standard",
            "Custom",
            "Renewal",
            "New Customer",
            "Enterprise",
          ],
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
