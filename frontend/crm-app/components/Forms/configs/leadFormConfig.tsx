import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Target,
  MapPin,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { leadSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const leadFormConfig: FormDrawerConfig = {
  entity: "Lead",
  entityIcon: <Target className="h-5 w-5 text-primary" />,
  schema: leadSchema,
  
  defaultValues: {
    salutation: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneType: "",
    company: "",
    title: "",
    source: "",
    status: undefined,
    rating: undefined,
    expectedRevenue: undefined,
    estimatedCloseDate: "",
    website: "",
    industry: "",
    employees: "",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    notes: "",
    assignedTo: "",
    referralSource: "",
    campaign: "",
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
      fields: ["company", "title"],
    },
    {
      label: "Lead Information",
      icon: <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["source", "status", "assignedTo"],
    },
  ],

  detailedSections: [
    {
      id: "lead",
      label: "Lead Details",
      icon: <User className="h-4 w-4" />,
      fields: [
        {
          name: "salutation",
          label: "Salutation",
          type: "select",
          options: ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."],
          placeholder: "Select...",
        },
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
          name: "phoneType",
          label: "Phone Type",
          type: "select",
          options: ["Office Phone", "Mobile", "Home", "Fax"],
          placeholder: "Select...",
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
          required: true,
          placeholder: "john.doe@company.com",
          icon: <Mail className="h-4 w-4" />,
        },
        {
          name: "company",
          label: "Company",
          type: "select",
          required: true,
          options: [
            "TechVision Inc",
            "Global Solutions Ltd",
            "Innovate Labs",
            "Strategic Partners",
            "NextGen Systems",
          ],
          placeholder: "Select company...",
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          name: "title",
          label: "Job Title",
          type: "select",
          options: [
            "CEO",
            "CTO",
            "CFO",
            "Manager",
            "Director",
            "VP",
            "Engineer",
            "Designer",
            "Sales Rep",
            "Other",
          ],
          placeholder: "Select title...",
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          name: "source",
          label: "Lead Source",
          type: "select",
          options: [
            "Website",
            "Referral",
            "LinkedIn",
            "Trade Show",
            "Cold Call",
            "Email Campaign",
            "Social Media",
          ],
          placeholder: "Select source...",
        },
        {
          name: "expectedRevenue",
          label: "Estimated Budget",
          type: "number",
          placeholder: "50000",
          helperText: "Enter amount in USD",
        },
        {
          name: "estimatedCloseDate",
          label: "Estimated Close Date",
          type: "date",
        },
        {
          name: "assignedTo",
          label: "Assigned To",
          type: "select",
          options: [
            "John Smith",
            "Sarah Johnson",
            "Mike Brown",
            "Emily Davis",
            "Robert Wilson",
          ],
          placeholder: "Select team member...",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "campaign",
          label: "Campaign",
          type: "text",
          placeholder: "Q1 Marketing Campaign",
        },
        {
          name: "status",
          label: "Lead Status",
          type: "select",
          required: true,
          options: ["New", "Contacted", "Qualified", "Unqualified"],
          placeholder: "Select status...",
        },
        {
          name: "rating",
          label: "Lead Rating",
          type: "select",
          options: ["Hot", "Warm", "Cold"],
          placeholder: "Select rating...",
        },
        {
          name: "referralSource",
          label: "Referral Source",
          type: "text",
          placeholder: "Partner name or referral code",
        },
        {
          name: "website",
          label: "Website",
          type: "text",
          placeholder: "https://example.com",
        },
        {
          name: "industry",
          label: "Industry",
          type: "text",
          placeholder: "Technology",
        },
        {
          name: "employees",
          label: "Number of Employees",
          type: "text",
          placeholder: "50-100",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
          fields: [
            { name: "salutation" },
            { name: "firstName" },
            { name: "lastName" },
            { name: "_placeholder", isPlaceholder: true },
          ],
        },
        {
          gridClass: "grid-cols-1 sm:grid-cols-3 gap-4",
          fields: [
            { name: "phoneType" },
            { name: "phone", colSpan: "sm:col-span-2" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "email" },
            { name: "company" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "title" },
            { name: "source" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "expectedRevenue" },
            { name: "assignedTo" },
          ],
        },
        {
          gridClass: "grid-cols-2 gap-4",
          fields: [
            { name: "estimatedCloseDate" },
            { name: "campaign" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "status" },
            { name: "rating" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "referralSource" },
            { name: "website" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "industry" },
            { name: "employees" },
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
          name: "address",
          label: "Street Address",
          type: "text",
          placeholder: "123 Business Ave, Suite 100",
        },
        {
          name: "addressLine2",
          label: "Address Line 2",
          type: "text",
          placeholder: "Apartment, suite, etc.",
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
          name: "notes",
          label: "Internal Notes",
          type: "textarea",
          placeholder: "Add any additional notes about this lead...",
          helperText: "Notes are only visible to your team",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          options: [
            "Priority",
            "Follow Up",
            "VIP",
            "Hot Lead",
            "Qualified",
            "Unqualified",
            "Interested",
            "Budget Approved",
          ],
        },
      ],
    },
    {
      id: "profile",
      label: "Profile Picture",
      icon: <ImageIcon className="h-4 w-4" />,
      fields: [
        {
          name: "profilePicture",
          label: "Profile Picture",
          type: "profile",
        },
      ],
    },
  ],
};
