import {
  Package,
  FileText,
  DollarSign,
  Tag,
  BarChart3,
  Building2,
} from "lucide-react";
import { productSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const productFormConfig: FormDrawerConfig = {
  entity: "Product",
  entityIcon: <Package className="h-5 w-5 text-primary" />,
  schema: productSchema,
  
  defaultValues: {
    name: "",
    sku: "",
    category: "",
    description: "",
    price: undefined,
    cost: undefined,
    quantity: undefined,
    status: undefined,
    vendor: "",
  },

  quickFormSections: [
    {
      label: "Product Information",
      icon: <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["name", "sku", "category", "status"],
    },
    {
      label: "Pricing",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["price", "cost", "quantity"],
    },
  ],

  quickFormFields: ["name", "sku", "category", "status", "price", "cost", "quantity"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <Package className="h-4 w-4" />,
      fields: [
        {
          name: "name",
          label: "Product Name",
          type: "text",
          placeholder: "Enter product name",
          required: true,
          icon: <Package className="h-4 w-4" />,
        },
        {
          name: "sku",
          label: "SKU",
          type: "text",
          placeholder: "Enter SKU code",
          required: true,
          icon: <Tag className="h-4 w-4" />,
        },
        {
          name: "category",
          label: "Category",
          type: "select",
          placeholder: "Select category",
          options: ["Software", "Hardware", "Services", "Training", "Licensing"],
          icon: <Tag className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Active", "Inactive", "Out of Stock", "Discontinued"],
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "description",
      label: "Description",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Product Description",
          type: "textarea",
          placeholder: "Enter detailed product description",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "pricing",
      label: "Pricing & Inventory",
      icon: <DollarSign className="h-4 w-4" />,
      fields: [
        {
          name: "price",
          label: "Sale Price",
          type: "number",
          placeholder: "0.00",
          required: true,
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "cost",
          label: "Cost Price",
          type: "number",
          placeholder: "0.00",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "quantity",
          label: "Available Quantity",
          type: "number",
          placeholder: "0",
          icon: <Package className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "vendor",
      label: "Vendor Information",
      icon: <Building2 className="h-4 w-4" />,
      fields: [
        {
          name: "vendor",
          label: "Vendor Name",
          type: "text",
          placeholder: "Enter vendor name",
          icon: <Building2 className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "tags",
      label: "Tags & Categories",
      icon: <Tag className="h-4 w-4" />,
      fields: [
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          placeholder: "Add tags...",
          options: [
            "New Arrival",
            "Best Seller",
            "Clearance",
            "Limited Edition",
            "Premium",
            "Enterprise",
            "SMB",
            "Seasonal",
          ],
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
