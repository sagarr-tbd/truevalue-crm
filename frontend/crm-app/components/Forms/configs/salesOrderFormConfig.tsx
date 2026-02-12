import {
  ShoppingCart,
  User,
  DollarSign,
  Calendar,
  BarChart3,
  Tag,
  FileText,
  MapPin,
} from "lucide-react";
import { salesOrderSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const salesOrderFormConfig: FormDrawerConfig = {
  entity: "Sales Order",
  entityIcon: <ShoppingCart className="h-5 w-5 text-primary" />,
  schema: salesOrderSchema,
  
  defaultValues: {
    orderNumber: "",
    customer: "",
    total: undefined,
    status: undefined,
    orderDate: "",
    deliveryDate: "",
    shippingAddress: "",
    notes: "",
  },

  quickFormSections: [
    {
      label: "Order Information",
      icon: <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["orderNumber", "customer", "status"],
    },
    {
      label: "Financial Details",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["total", "orderDate"],
    },
  ],

  quickFormFields: ["orderNumber", "customer", "status", "total", "orderDate"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <ShoppingCart className="h-4 w-4" />,
      fields: [
        {
          name: "orderNumber",
          label: "Order Number",
          type: "text",
          placeholder: "SO-2026-001",
          required: true,
          icon: <ShoppingCart className="h-4 w-4" />,
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
          options: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
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
          name: "deliveryDate",
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
            "Rush Order",
            "Standard",
            "Bulk Order",
            "Recurring",
            "Priority",
            "International",
            "Domestic",
          ],
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
