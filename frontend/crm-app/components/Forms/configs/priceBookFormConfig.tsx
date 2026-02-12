import {
  Book,
  DollarSign,
  Calendar,
  FileText,
  Tag,
  BarChart3,
} from "lucide-react";
import { priceBookSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const priceBookFormConfig: FormDrawerConfig = {
  entity: "Price Book",
  entityIcon: <Book className="h-5 w-5 text-primary" />,
  schema: priceBookSchema,
  
  defaultValues: {
    name: "",
    description: "",
    currency: undefined,
    status: undefined,
    validFrom: "",
    validTo: "",
  },

  quickFormSections: [
    {
      label: "Price Book Information",
      icon: <Book className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["name", "currency", "status"],
    },
    {
      label: "Validity Period",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["validFrom", "validTo"],
    },
  ],

  quickFormFields: ["name", "currency", "status", "validFrom", "validTo"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <Book className="h-4 w-4" />,
      fields: [
        {
          name: "name",
          label: "Price Book Name",
          type: "text",
          placeholder: "Enter price book name",
          required: true,
          icon: <Book className="h-4 w-4" />,
        },
        {
          name: "currency",
          label: "Currency",
          type: "select",
          placeholder: "Select currency",
          options: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"],
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Active", "Inactive", "Draft"],
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
          label: "Description",
          type: "textarea",
          placeholder: "Enter price book description and purpose",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "validity",
      label: "Validity Period",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "validFrom",
          label: "Valid From",
          type: "date",
          placeholder: "Select start date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "validTo",
          label: "Valid To",
          type: "date",
          placeholder: "Select end date",
          icon: <Calendar className="h-4 w-4" />,
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
            "Enterprise",
            "Standard",
            "Promotional",
            "Partner",
            "SMB",
            "Regional",
            "Seasonal",
            "Volume Discount",
          ],
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
