import {
  DollarSign,
  Target,
  Calendar,
  Building2,
  User,
  FileText,
  TrendingUp,
  Percent,
} from "lucide-react";
import { dealSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const dealFormConfig: FormDrawerConfig = {
  entity: "Deal",
  entityIcon: <DollarSign className="h-5 w-5 text-primary" />,
  schema: dealSchema,
  
  defaultValues: {
    dealName: "",
    amount: undefined,
    stage: "",
    probability: undefined,
    closeDate: "",
    accountId: "",
    contactId: "",
    type: "",
    source: "",
    nextStep: "",
    description: "",
    competitorInfo: "",
    assignedTo: "",
  },

  quickFormSections: [
    {
      label: "Deal Information",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["dealName", "amount", "stage"],
    },
    {
      label: "Related Records",
      icon: <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["accountId", "contactId"],
    },
    {
      label: "Timeline & Ownership",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["closeDate", "probability", "assignedTo"],
    },
  ],

  detailedSections: [
    {
      id: "deal",
      label: "Deal Details",
      icon: <DollarSign className="h-4 w-4" />,
      fields: [
        {
          name: "dealName",
          label: "Deal Name",
          type: "text",
          required: true,
          placeholder: "Enterprise CRM Package",
          icon: <Target className="h-4 w-4" />,
        },
        {
          name: "amount",
          label: "Amount",
          type: "number",
          placeholder: "125000",
          icon: <DollarSign className="h-4 w-4" />,
          helperText: "Deal value in USD",
        },
        {
          name: "stage",
          label: "Stage",
          type: "select",
          required: true,
          options: [
            "Prospecting",
            "Qualification",
            "Proposal",
            "Negotiation",
            "Closed Won",
            "Closed Lost",
          ],
          placeholder: "Select stage...",
          icon: <TrendingUp className="h-4 w-4" />,
        },
        {
          name: "probability",
          label: "Probability (%)",
          type: "number",
          placeholder: "75",
          icon: <Percent className="h-4 w-4" />,
          helperText: "Win probability (0-100%)",
        },
        {
          name: "closeDate",
          label: "Expected Close Date",
          type: "date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "type",
          label: "Deal Type",
          type: "select",
          options: [
            "New Business",
            "Existing Business",
            "Renewal",
            "Upgrade",
            "Add-on",
          ],
          placeholder: "Select type...",
        },
        {
          name: "source",
          label: "Lead Source",
          type: "select",
          options: [
            "Website",
            "Referral",
            "Partner",
            "Campaign",
            "Cold Call",
            "Event",
            "Social Media",
            "Other",
          ],
          placeholder: "Select source...",
        },
        {
          name: "accountId",
          label: "Account",
          type: "select",
          options: [
            "Acme Corporation",
            "CloudNine Solutions",
            "TechStart Inc",
            "GlobalTech Systems",
            "Innovate Labs",
            "Nexus Solutions",
            "Zenith Corp",
          ],
          placeholder: "Select account...",
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          name: "contactId",
          label: "Primary Contact",
          type: "select",
          options: [
            "Sarah Williams",
            "Robert Chen",
            "Jessica Lee",
            "Emma Johnson",
            "Michael Chen",
            "Sophie Martinez",
            "James Wilson",
          ],
          placeholder: "Select contact...",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "assignedTo",
          label: "Deal Owner",
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
          fields: [{ name: "dealName" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "amount" },
            { name: "stage" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "probability" },
            { name: "closeDate" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "type" },
            { name: "source" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "accountId" },
            { name: "contactId" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "assignedTo" }],
        },
      ],
    },
    {
      id: "additional",
      label: "Additional Information",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "nextStep",
          label: "Next Step",
          type: "text",
          placeholder: "Schedule demo with decision makers",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Add detailed notes about this deal...",
        },
        {
          name: "competitorInfo",
          label: "Competitor Information",
          type: "textarea",
          placeholder: "Information about competitors involved in this deal...",
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          options: [
            "High Priority",
            "Strategic",
            "Enterprise",
            "Renewal",
            "Upsell",
            "Cross-sell",
            "Partner Deal",
            "Competitive",
          ],
        },
      ],
    },
  ],
};
