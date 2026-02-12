import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Target,
  MapPin,
  FileText,
} from "lucide-react";
import { leadSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

/**
 * Lead form configuration - aligned with backend API
 * 
 * Backend fields supported:
 * - firstName, lastName (required)
 * - email (required)
 * - phone, mobile (optional)
 * - companyName, title, website (optional)
 * - status (new, contacted, qualified, unqualified, converted)
 * - source (required), sourceDetail (optional)
 * - score (0-100, replaces rating)
 * - addressLine1, city, state, postalCode, country (optional)
 * - description (optional)
 * - tagIds (optional)
 * - ownerId (optional)
 */
export const leadFormConfig: FormDrawerConfig = {
  entity: "Lead",
  entityIcon: <Target className="h-5 w-5 text-primary" />,
  schema: leadSchema,
  
  defaultValues: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
    companyName: "",
    title: "",
    website: "",
    source: "",
    sourceDetail: "",
    status: "new",
    score: undefined,
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    description: "",
    tagIds: [],
    ownerId: "",
  },

  quickFormSections: [
    {
      label: "Personal Information",
      icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["firstName", "lastName"],
    },
    {
      label: "Contact Information",
      icon: <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["email", "phone"],
    },
    {
      label: "Company Details",
      icon: <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["companyName", "title"],
    },
    {
      label: "Lead Information",
      icon: <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["source", "status"],
    },
  ],

  detailedSections: [
    {
      id: "lead",
      label: "Lead Details",
      icon: <User className="h-4 w-4" />,
      fields: [
        {
          name: "firstName",
          label: "First Name",
          type: "text",
          required: true,
          placeholder: "John",
        },
        {
          name: "lastName",
          label: "Last Name",
          type: "text",
          required: true,
          placeholder: "Doe",
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "john.doe@company.com",
          icon: <Mail className="h-4 w-4" />,
        },
        {
          name: "phone",
          label: "Phone",
          type: "tel",
          placeholder: "+1 (555) 123-4567",
          icon: <Phone className="h-4 w-4" />,
        },
        {
          name: "mobile",
          label: "Mobile",
          type: "tel",
          placeholder: "+1 (555) 987-6543",
          icon: <Phone className="h-4 w-4" />,
        },
        {
          name: "companyName",
          label: "Company",
          type: "text",
          placeholder: "Enter company name",
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          name: "title",
          label: "Job Title",
          type: "text",
          placeholder: "e.g., Sales Manager",
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          name: "website",
          label: "Website",
          type: "text",
          placeholder: "https://example.com",
        },
        {
          name: "source",
          label: "Lead Source",
          type: "select",
          required: true,
          // Options loaded dynamically in LeadFormDrawer
          options: [],
          placeholder: "Select source...",
        },
        {
          name: "sourceDetail",
          label: "Source Details",
          type: "text",
          placeholder: "Additional source info (optional)",
          helperText: "E.g., specific campaign name, referrer info",
        },
        {
          name: "status",
          label: "Lead Status",
          type: "select",
          required: true,
          options: [
            { value: "new", label: "New" },
            { value: "contacted", label: "Contacted" },
            { value: "qualified", label: "Qualified" },
            { value: "unqualified", label: "Unqualified" },
          ],
          placeholder: "Select status...",
        },
        {
          name: "score",
          label: "Lead Score",
          type: "number",
          placeholder: "0-100",
          helperText: "Quality score from 0-100",
        },
        {
          name: "ownerId",
          label: "Assigned To",
          type: "select",
          // Options loaded dynamically in LeadFormDrawer
          options: [],
          placeholder: "Select team member...",
          icon: <User className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 sm:grid-cols-2 gap-4",
          fields: [
            { name: "firstName" },
            { name: "lastName" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [
            { name: "email" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "phone" },
            { name: "mobile" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "companyName" },
            { name: "title" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [
            { name: "website" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "source" },
            { name: "sourceDetail" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-3 gap-4",
          fields: [
            { name: "status" },
            { name: "score" },
            { name: "ownerId" },
          ],
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
          placeholder: "123 Business Ave, Suite 100",
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
      id: "description",
      label: "Description & Notes",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Add any additional notes about this lead...",
          helperText: "Notes are only visible to your team",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "tagIds",
          label: "Tags",
          type: "tags",
          // Options loaded dynamically in LeadFormDrawer
          options: [],
        },
      ],
    },
  ],
};
