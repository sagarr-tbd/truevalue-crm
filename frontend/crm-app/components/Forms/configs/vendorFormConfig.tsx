import {
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Tag,
  BarChart3,
} from "lucide-react";
import { vendorSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const vendorFormConfig: FormDrawerConfig = {
  entity: "Vendor",
  entityIcon: <Store className="h-5 w-5 text-primary" />,
  schema: vendorSchema,
  
  defaultValues: {
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    website: "",
    status: undefined,
    notes: "",
  },

  quickFormSections: [
    {
      label: "Vendor Information",
      icon: <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["name", "contact", "status"],
    },
    {
      label: "Contact Details",
      icon: <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["email", "phone"],
    },
  ],

  quickFormFields: ["name", "contact", "status", "email", "phone"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <Store className="h-4 w-4" />,
      fields: [
        {
          name: "name",
          label: "Vendor Name",
          type: "text",
          placeholder: "Enter vendor name",
          required: true,
          icon: <Store className="h-4 w-4" />,
        },
        {
          name: "contact",
          label: "Contact Person",
          type: "text",
          placeholder: "Enter contact person name",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Active", "Inactive", "Pending"],
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "contact",
      label: "Contact Information",
      icon: <Mail className="h-4 w-4" />,
      fields: [
        {
          name: "email",
          label: "Email Address",
          type: "email",
          placeholder: "vendor@example.com",
          icon: <Mail className="h-4 w-4" />,
        },
        {
          name: "phone",
          label: "Phone Number",
          type: "tel",
          placeholder: "+1 (555) 000-0000",
          icon: <Phone className="h-4 w-4" />,
        },
        {
          name: "website",
          label: "Website",
          type: "text",
          placeholder: "https://vendor.com",
          icon: <Globe className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "address",
      label: "Address",
      icon: <MapPin className="h-4 w-4" />,
      fields: [
        {
          name: "address",
          label: "Street Address",
          type: "text",
          placeholder: "Enter street address",
          icon: <MapPin className="h-4 w-4" />,
        },
        {
          name: "city",
          label: "City",
          type: "text",
          placeholder: "Enter city",
          icon: <MapPin className="h-4 w-4" />,
        },
        {
          name: "state",
          label: "State/Province",
          type: "text",
          placeholder: "Enter state",
          icon: <MapPin className="h-4 w-4" />,
        },
        {
          name: "zip",
          label: "ZIP/Postal Code",
          type: "text",
          placeholder: "Enter ZIP code",
          icon: <MapPin className="h-4 w-4" />,
        },
        {
          name: "country",
          label: "Country",
          type: "text",
          placeholder: "Enter country",
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
          placeholder: "Enter any additional notes about this vendor",
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
            "Preferred",
            "International",
            "Local",
            "Certified",
            "Strategic Partner",
            "Enterprise",
            "Small Business",
          ],
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
