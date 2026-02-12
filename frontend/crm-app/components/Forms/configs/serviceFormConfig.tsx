import {
  Briefcase,
  Tag,
  DollarSign,
  Clock,
  Users,
  BarChart3,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { serviceSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const serviceFormConfig: FormDrawerConfig = {
  entity: "Service",
  entityIcon: <Briefcase className="h-5 w-5 text-primary" />,
  schema: serviceSchema,
  
  defaultValues: {
    serviceCode: "",
    serviceName: "",
    description: "",
    category: "",
    type: "Professional Services",
    pricing: "Fixed Price",
    price: "",
    duration: "",
    status: "Active",
    assignedTeam: "",
    tags: [],
  },

  quickFormSections: [
    {
      label: "Service Information",
      icon: <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["serviceName", "category", "type", "status"],
    },
    {
      label: "Pricing",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["pricing", "price"],
    },
  ],

  quickFormFields: ["serviceName", "category", "type", "status", "pricing", "price"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <Briefcase className="h-4 w-4" />,
      fields: [
        {
          name: "serviceName",
          label: "Service Name",
          type: "text",
          placeholder: "Enter service name",
          required: true,
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          name: "category",
          label: "Category",
          type: "text",
          placeholder: "e.g., Consulting, Support",
          required: true,
          icon: <Tag className="h-4 w-4" />,
        },
        {
          name: "type",
          label: "Service Type",
          type: "select",
          placeholder: "Select type",
          options: ["Professional Services", "Subscription", "One-Time", "Managed Services"],
          icon: <Wrench className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Active", "Inactive", "Coming Soon", "Discontinued"],
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "pricing",
      label: "Pricing & Duration",
      icon: <DollarSign className="h-4 w-4" />,
      fields: [
        {
          name: "pricing",
          label: "Pricing Model",
          type: "select",
          placeholder: "Select pricing model",
          options: ["Fixed Price", "Hourly", "Monthly", "Annual", "Per User"],
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "price",
          label: "Price",
          type: "text",
          placeholder: "$10,000 or $500/mo",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "duration",
          label: "Duration",
          type: "text",
          placeholder: "e.g., 3 months, Ongoing",
          icon: <Clock className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "details",
      label: "Service Details",
      icon: <MessageSquare className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Detailed description of the service...",
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          name: "assignedTeam",
          label: "Assigned Team",
          type: "text",
          placeholder: "Team responsible for this service",
          icon: <Users className="h-4 w-4" />,
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          placeholder: "Add tags (press Enter after each tag)",
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
