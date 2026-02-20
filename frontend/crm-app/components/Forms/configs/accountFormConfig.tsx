import {
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  DollarSign,
  MapPin,
  FileText,
  Linkedin,
  Twitter,
  Facebook,
  Sliders,
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
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    description: "",
    linkedinUrl: "",
    twitterUrl: "",
    facebookUrl: "",
    tagIds: [],
    customFields: {},
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
      label: "Location",
      icon: <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["city", "country"],
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
          label: "Company Size",
          type: "select",
          options: [
            { value: "1", label: "1 (Solo)" },
            { value: "2-10", label: "2-10 (Micro)" },
            { value: "11-50", label: "11-50 (Small)" },
            { value: "51-200", label: "51-200 (Medium)" },
            { value: "201-500", label: "201-500 (Large)" },
            { value: "501-1000", label: "501-1000 (Enterprise)" },
            { value: "1000+", label: "1000+ (Corporate)" },
          ],
          placeholder: "Select company size...",
        },
        {
          name: "employees",
          label: "Number of Employees",
          type: "number",
          placeholder: "150",
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
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "annualRevenue" }],
        },
      ],
    },
    {
      id: "address",
      label: "Address Details",
      icon: <MapPin className="h-4 w-4" />,
      fields: [
        {
          name: "addressLine1",
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
          name: "postalCode",
          label: "Postal / ZIP Code",
          type: "text",
          placeholder: "94105",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "addressLine1" }],
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
            { name: "postalCode" },
          ],
        },
      ],
    },
    {
      id: "social",
      label: "Social Links",
      icon: <Globe className="h-4 w-4" />,
      fields: [
        {
          name: "linkedinUrl",
          label: "LinkedIn URL",
          type: "text",
          placeholder: "https://linkedin.com/company/...",
          icon: <Linkedin className="h-4 w-4" />,
        },
        {
          name: "twitterUrl",
          label: "Twitter URL",
          type: "text",
          placeholder: "https://twitter.com/...",
          icon: <Twitter className="h-4 w-4" />,
        },
        {
          name: "facebookUrl",
          label: "Facebook URL",
          type: "text",
          placeholder: "https://facebook.com/...",
          icon: <Facebook className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "linkedinUrl" }],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "twitterUrl" }],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "facebookUrl" }],
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
          name: "tagIds",
          label: "Tags",
          type: "tags",
          options: [],
        },
      ],
    },
    {
      id: "customFields",
      label: "Custom Fields",
      icon: <Sliders className="h-4 w-4" />,
      entityType: "company",
      isCustomFields: true,
      fields: [],
    },
  ],
};
