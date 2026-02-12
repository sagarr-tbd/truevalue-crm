import {
  Receipt,
  User,
  DollarSign,
  Calendar,
  BarChart3,
  Tag,
  FileText,
} from "lucide-react";
import { invoiceSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const invoiceFormConfig: FormDrawerConfig = {
  entity: "Invoice",
  entityIcon: <Receipt className="h-5 w-5 text-primary" />,
  schema: invoiceSchema,
  
  defaultValues: {
    invoiceNumber: "",
    customer: "",
    amount: undefined,
    status: undefined,
    dueDate: "",
    paidDate: "",
    notes: "",
    terms: "",
  },

  quickFormSections: [
    {
      label: "Invoice Information",
      icon: <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["invoiceNumber", "customer", "status"],
    },
    {
      label: "Financial Details",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["amount", "dueDate"],
    },
  ],

  quickFormFields: ["invoiceNumber", "customer", "status", "amount", "dueDate"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <Receipt className="h-4 w-4" />,
      fields: [
        {
          name: "invoiceNumber",
          label: "Invoice Number",
          type: "text",
          placeholder: "INV-2026-001",
          required: true,
          icon: <Receipt className="h-4 w-4" />,
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
          options: ["Draft", "Sent", "Paid", "Overdue", "Cancelled"],
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
          name: "amount",
          label: "Total Amount",
          type: "number",
          placeholder: "0.00",
          required: true,
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "dueDate",
          label: "Due Date",
          type: "date",
          placeholder: "Select date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "paidDate",
          label: "Paid Date",
          type: "date",
          placeholder: "Select date",
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
          label: "Payment Terms",
          type: "textarea",
          placeholder: "Enter payment terms",
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
            "Recurring",
            "One-Time",
            "Urgent",
            "High Value",
            "Standard",
            "Net 30",
            "Net 60",
          ],
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
