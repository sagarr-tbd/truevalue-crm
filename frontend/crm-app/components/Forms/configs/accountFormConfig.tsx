import {
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  DollarSign,
  MapPin,
  FileText,
  Image as ImageIcon,
  User,
} from "lucide-react";
import { accountSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const accountFormConfig: FormDrawerConfig = {
  entity: "Account",
  entityIcon: <Building2 className="h-5 w-5 text-primary" />,
  schema: accountSchema,
  
  defaultValues: {
    accountName: "",
    website: "",
    phone: "",
    email: "",
    industry: "",
    type: undefined,
    employees: "",
    annualRevenue: undefined,
    parentAccount: "",
    assignedTo: "",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    description: "",
  },

  quickFormSections: [
    {
      label: "Account Information",
      icon: <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["accountName", "website", "phone", "email"],
    },
    {
      label: "Business Details",
      icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["industry", "type", "employees", "annualRevenue"],
    },
    {
      label: "Management",
      icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["parentAccount", "assignedTo"],
    },
  ],

  detailedSections: [
    {
      id: "account",
      label: "Account Details",
      icon: <Building2 className="h-4 w-4" />,
      fields: [
        {
          name: "accountName",
          label: "Account Name",
          type: "text",
          required: true,
          placeholder: "Acme Corporation",
        },
        {
          name: "website",
          label: "Website",
          type: "text",
          placeholder: "https://example.com",
          icon: <Globe className="h-4 w-4" />,
        },
        {
          name: "phone",
          label: "Phone",
          type: "tel",
          placeholder: "+1 (555) 123-4567",
          icon: <Phone className="h-4 w-4" />,
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          placeholder: "info@company.com",
          icon: <Mail className="h-4 w-4" />,
        },
        {
          name: "industry",
          label: "Industry",
          type: "select",
          options: [
            "Technology",
            "Healthcare",
            "Finance",
            "Retail",
            "Manufacturing",
            "Education",
            "Real Estate",
            "Consulting",
            "Other",
          ],
          placeholder: "Select industry...",
        },
        {
          name: "type",
          label: "Account Type",
          type: "select",
          options: ["Customer", "Partner", "Prospect", "Vendor", "Other"],
          placeholder: "Select type...",
        },
        {
          name: "employees",
          label: "Number of Employees",
          type: "text",
          placeholder: "50-100",
          icon: <Users className="h-4 w-4" />,
        },
        {
          name: "annualRevenue",
          label: "Annual Revenue",
          type: "number",
          placeholder: "1000000",
          helperText: "Enter amount in USD",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "parentAccount",
          label: "Parent Account",
          type: "select",
          options: [
            "TechVision Inc",
            "Global Solutions Ltd",
            "Innovate Labs",
            "Strategic Partners",
            "NextGen Systems",
          ],
          placeholder: "Select parent account...",
        },
        {
          name: "assignedTo",
          label: "Account Owner",
          type: "select",
          options: [
            "John Smith",
            "Sarah Johnson",
            "Mike Brown",
            "Emily Davis",
            "Robert Wilson",
          ],
          placeholder: "Select account owner...",
          icon: <User className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "accountName" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "website" },
            { name: "phone" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "email" },
            { name: "industry" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "type" },
            { name: "employees" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "annualRevenue" },
            { name: "parentAccount" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "assignedTo" }],
        },
      ],
    },
    {
      id: "address",
      label: "Address Details",
      icon: <MapPin className="h-4 w-4" />,
      fields: [
        {
          name: "address",
          label: "Street Address",
          type: "text",
          placeholder: "123 Business Ave",
        },
        {
          name: "addressLine2",
          label: "Address Line 2",
          type: "text",
          placeholder: "Suite 100",
        },
        {
          name: "city",
          label: "City",
          type: "text",
          placeholder: "San Francisco",
        },
        {
          name: "state",
          label: "State / Province",
          type: "text",
          placeholder: "California",
        },
        {
          name: "country",
          label: "Country",
          type: "text",
          placeholder: "United States",
        },
        {
          name: "zipCode",
          label: "Postal / ZIP Code",
          type: "text",
          placeholder: "94105",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "address" }],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "addressLine2" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "city" },
            { name: "state" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "country" },
            { name: "zipCode" },
          ],
        },
      ],
    },
    {
      id: "description",
      label: "Description & Notes",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Add any relevant notes about this account...",
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          options: [
            "VIP",
            "Enterprise",
            "SMB",
            "Startup",
            "Growth",
            "Strategic",
            "Key Account",
            "High Value",
            "Long-term",
          ],
        },
      ],
    },
    {
      id: "profile",
      label: "Company Logo",
      icon: <ImageIcon className="h-4 w-4" />,
      fields: [
        {
          name: "profilePicture",
          label: "Company Logo",
          type: "profile",
        },
      ],
    },
  ],
};
