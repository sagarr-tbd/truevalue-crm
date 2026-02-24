import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  FileText,
  Image as ImageIcon,
  Linkedin,
  Twitter,
  Globe,
  PhoneOff,
  Sliders,
} from "lucide-react";
import { contactSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const contactFormConfig: FormDrawerConfig = {
  entity: "Contact",
  entityIcon: <User className="h-5 w-5 text-primary" />,
  schema: contactSchema,
  
  defaultValues: {
    firstName: "",
    lastName: "",
    email: "",
    secondaryEmail: "",
    phone: "",
    mobile: "",
    primaryCompanyId: "",
    title: "",
    department: "",
    ownerId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    linkedinUrl: "",
    twitterUrl: "",
    avatarUrl: "",
    status: "",
    source: "",
    sourceDetail: "",
    doNotCall: false,
    doNotEmail: false,
    description: "",
    tagIds: [],
    customFields: {},
  },

  // Quick Form - minimal fields for fast creation
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
  ],

  // Detail Form - ALL backend fields
  detailedSections: [
    {
      id: "contact",
      label: "Contact Details",
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
          label: "Primary Email",
          type: "email",
          required: true,
          placeholder: "john.doe@company.com",
          icon: <Mail className="h-4 w-4" />,
        },
        {
          name: "secondaryEmail",
          label: "Secondary Email",
          type: "email",
          placeholder: "john.personal@email.com",
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
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "email" },
            { name: "secondaryEmail" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "phone" },
            { name: "mobile" },
          ],
        },
      ],
    },
    {
      id: "organization",
      label: "Organization",
      icon: <Building2 className="h-4 w-4" />,
      fields: [
        {
          name: "primaryCompanyId",
          label: "Company",
          type: "select",
          options: [],
          placeholder: "Select company...",
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          name: "title",
          label: "Job Title",
          type: "text",
          placeholder: "VP of Sales",
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          name: "department",
          label: "Department",
          type: "select",
          options: [
            "Sales",
            "Marketing",
            "Engineering",
            "Product",
            "Finance",
            "HR",
            "Operations",
            "Customer Success",
            "Executive",
          ],
          placeholder: "Select department...",
        },
        {
          name: "ownerId",
          label: "Contact Owner",
          type: "select",
          options: [],
          placeholder: "Select owner...",
          icon: <User className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [
            { name: "primaryCompanyId" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "title" },
            { name: "department" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [
            { name: "ownerId" },
          ],
        },
      ],
    },
    {
      id: "status",
      label: "Status & Source",
      icon: <Globe className="h-4 w-4" />,
      fields: [
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [],
          placeholder: "Select status...",
        },
        {
          name: "source",
          label: "Source",
          type: "select",
          options: [
            "Website",
            "Referral",
            "LinkedIn",
            "Trade Show",
            "Cold Call",
            "Email Campaign",
            "Partner",
            "Other",
          ],
          placeholder: "Select source...",
        },
        {
          name: "sourceDetail",
          label: "Source Detail",
          type: "text",
          placeholder: "e.g., Q1 Webinar, John's referral",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "status" },
            { name: "source" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "sourceDetail" }],
        },
      ],
    },
    {
      id: "address",
      label: "Address",
      icon: <MapPin className="h-4 w-4" />,
      fields: [
        {
          name: "addressLine1",
          label: "Street Address",
          type: "text",
          placeholder: "123 Main Street",
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
          name: "postalCode",
          label: "Postal / ZIP Code",
          type: "text",
          placeholder: "94105",
        },
        {
          name: "country",
          label: "Country",
          type: "text",
          placeholder: "United States",
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
            { name: "postalCode" },
            { name: "country" },
          ],
        },
      ],
    },
    {
      id: "social",
      label: "Social Profiles",
      icon: <Linkedin className="h-4 w-4" />,
      fields: [
        {
          name: "linkedinUrl",
          label: "LinkedIn Profile",
          type: "text",
          placeholder: "https://linkedin.com/in/username",
          icon: <Linkedin className="h-4 w-4" />,
        },
        {
          name: "twitterUrl",
          label: "Twitter Profile",
          type: "text",
          placeholder: "https://twitter.com/username",
          icon: <Twitter className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "linkedinUrl" },
            { name: "twitterUrl" },
          ],
        },
      ],
    },
    {
      id: "preferences",
      label: "Communication Preferences",
      icon: <PhoneOff className="h-4 w-4" />,
      fields: [
        {
          name: "doNotCall",
          label: "Do Not Call",
          type: "checkbox",
        },
        {
          name: "doNotEmail",
          label: "Do Not Email",
          type: "checkbox",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 sm:grid-cols-2 gap-4",
          fields: [
            { name: "doNotCall" },
            { name: "doNotEmail" },
          ],
        },
      ],
    },
    {
      id: "description",
      label: "Notes",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Add any relevant notes about this contact...",
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
      id: "profile",
      label: "Profile Picture",
      icon: <ImageIcon className="h-4 w-4" />,
      fields: [
        {
          name: "avatarUrl",
          label: "Profile Picture",
          type: "profile",
        },
      ],
    },
    {
      id: "customFields",
      label: "Custom Fields",
      icon: <Sliders className="h-4 w-4" />,
      entityType: "contact",
      isCustomFields: true,
      fields: [],
    },
  ],
};
