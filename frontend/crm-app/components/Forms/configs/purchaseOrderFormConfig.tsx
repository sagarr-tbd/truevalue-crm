import {
  Package,
  Store,
  DollarSign,
  Calendar,
  BarChart3,
  Tag,
  FileText,
  MapPin,
} from "lucide-react";
import { purchaseOrderSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const purchaseOrderFormConfig: FormDrawerConfig = {
  entity: "Purchase Order",
  entityIcon: <Package className="h-5 w-5 text-primary" />,
  schema: purchaseOrderSchema,
  
  defaultValues: {
    poNumber: "",
    vendor: "",
    total: undefined,
    status: undefined,
    orderDate: "",
    expectedDate: "",
    shippingAddress: "",
    notes: "",
  },

  quickFormSections: [
    {
      label: "Order Information",
      icon: <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["poNumber", "vendor", "status"],
    },
    {
      label: "Financial Details",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["total", "orderDate"],
    },
  ],

  quickFormFields: ["poNumber", "vendor", "status", "total", "orderDate"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <Package className="h-4 w-4" />,
      fields: [
        {
          name: "poNumber",
          label: "PO Number",
          type: "text",
          placeholder: "PO-2026-001",
          required: true,
          icon: <Package className="h-4 w-4" />,
        },
        {
          name: "vendor",
          label: "Vendor",
          type: "text",
          placeholder: "Enter vendor name",
          required: true,
          icon: <Store className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Draft", "Ordered", "Received", "Cancelled"],
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "financial",
      label: "Financial & Dates",
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
          name: "orderDate",
          label: "Order Date",
          type: "date",
          placeholder: "Select date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "expectedDate",
          label: "Expected Delivery Date",
          type: "date",
          placeholder: "Select date",
          icon: <Calendar className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "shipping",
      label: "Shipping Information",
      icon: <MapPin className="h-4 w-4" />,
      fields: [
        {
          name: "shippingAddress",
          label: "Shipping Address",
          type: "textarea",
          placeholder: "Enter complete shipping address",
          icon: <MapPin className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "notes",
      label: "Additional Notes",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "notes",
          label: "Notes",
          type: "textarea",
          placeholder: "Enter any additional notes or special instructions",
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
            "Urgent",
            "Standard",
            "Bulk Purchase",
            "Recurring",
            "One-Time",
            "High Value",
            "Critical",
          ],
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
