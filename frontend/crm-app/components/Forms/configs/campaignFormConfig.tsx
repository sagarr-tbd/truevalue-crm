import {
  Megaphone,
  Calendar,
  DollarSign,
  Target,
  Users,
  TrendingUp,
  FileText,
  User,
} from "lucide-react";
import { campaignSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const campaignFormConfig: FormDrawerConfig = {
  entity: "Campaign",
  entityIcon: <Megaphone className="h-5 w-5 text-primary" />,
  schema: campaignSchema,
  
  defaultValues: {
    name: "",
    type: "",
    status: "",
    startDate: "",
    endDate: "",
    budget: undefined,
    targetLeads: undefined,
    targetRevenue: undefined,
    description: "",
    assignedTo: "",
  },

  quickFormSections: [
    {
      label: "Campaign Information",
      icon: <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["name", "type", "status"],
    },
    {
      label: "Timeline",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["startDate", "endDate"],
    },
    {
      label: "Goals & Budget",
      icon: <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["budget", "targetLeads", "assignedTo"],
    },
  ],

  detailedSections: [
    {
      id: "campaign",
      label: "Campaign Details",
      icon: <Megaphone className="h-4 w-4" />,
      fields: [
        {
          name: "name",
          label: "Campaign Name",
          type: "text",
          required: true,
          placeholder: "Q1 2026 Product Launch",
          icon: <Target className="h-4 w-4" />,
        },
        {
          name: "type",
          label: "Campaign Type",
          type: "select",
          options: [
            "Email",
            "Social Media",
            "LinkedIn",
            "Webinar",
            "Event",
            "Referral",
            "Content",
            "Other",
          ],
          placeholder: "Select type...",
          icon: <Megaphone className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            "Planned",
            "Active",
            "Paused",
            "Completed",
            "Cancelled",
          ],
          placeholder: "Select status...",
          icon: <TrendingUp className="h-4 w-4" />,
        },
        {
          name: "startDate",
          label: "Start Date",
          type: "date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "endDate",
          label: "End Date",
          type: "date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "assignedTo",
          label: "Campaign Owner",
          type: "select",
          options: [
            "John Smith",
            "Sarah Johnson",
            "Mike Brown",
            "Emily Davis",
            "Robert Wilson",
          ],
          placeholder: "Select owner...",
          icon: <User className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "name" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-3 gap-4",
          fields: [
            { name: "type" },
            { name: "status" },
            { name: "assignedTo" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "startDate" },
            { name: "endDate" },
          ],
        },
      ],
    },
    {
      id: "goals",
      label: "Campaign Goals",
      icon: <Target className="h-4 w-4" />,
      fields: [
        {
          name: "budget",
          label: "Budget",
          type: "number",
          placeholder: "50000",
          icon: <DollarSign className="h-4 w-4" />,
          helperText: "Campaign budget in USD",
        },
        {
          name: "targetLeads",
          label: "Target Leads",
          type: "number",
          placeholder: "250",
          icon: <Users className="h-4 w-4" />,
          helperText: "Expected number of leads",
        },
        {
          name: "targetRevenue",
          label: "Target Revenue",
          type: "number",
          placeholder: "500000",
          icon: <TrendingUp className="h-4 w-4" />,
          helperText: "Expected revenue from campaign",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-3 gap-4",
          fields: [
            { name: "budget" },
            { name: "targetLeads" },
            { name: "targetRevenue" },
          ],
        },
      ],
    },
    {
      id: "additional",
      label: "Additional Information",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Describe the campaign objectives and strategy...",
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          options: [
            "Product Launch",
            "Brand Awareness",
            "Lead Generation",
            "Customer Retention",
            "Seasonal",
            "Promotional",
            "Educational",
            "Enterprise",
          ],
        },
      ],
    },
  ],
};
