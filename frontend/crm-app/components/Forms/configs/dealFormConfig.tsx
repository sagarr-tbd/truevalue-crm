import {
  DollarSign,
  Target,
  Calendar,
  Building2,
  User,
  FileText,
  TrendingUp,
  Percent,
  Layers,
  Tag,
  Banknote,
} from "lucide-react";
import { dealSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

/**
 * Currency options for deals
 */
const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "AED", label: "AED - UAE Dirham" },
];

export const dealFormConfig: FormDrawerConfig = {
  entity: "Deal",
  entityIcon: <DollarSign className="h-5 w-5 text-primary" />,
  schema: dealSchema,
  
  defaultValues: {
    name: "",
    pipelineId: "",
    stageId: "",
    value: undefined,
    currency: "INR",
    probability: undefined,
    expectedCloseDate: "",
    contactId: "",
    companyId: "",
    ownerId: "",
    description: "",
    tagIds: [],
  },

  // Quick form - Essential fields only
  quickFormSections: [
    {
      label: "Deal Information",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["name", "stageId", "value"],
    },
    {
      label: "Related Records",
      icon: <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["companyId", "contactId"],
    },
    {
      label: "Timeline",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["expectedCloseDate"],
    },
  ],

  // Detailed form - All fields organized in sections
  detailedSections: [
    {
      id: "deal",
      label: "Deal Details",
      icon: <DollarSign className="h-4 w-4" />,
      fields: [
        {
          name: "name",
          label: "Deal Name",
          type: "text",
          required: true,
          placeholder: "Enterprise CRM Package - Acme Corp",
          icon: <Target className="h-4 w-4" />,
          helperText: "A descriptive name for this deal",
        },
        {
          name: "pipelineId",
          label: "Pipeline",
          type: "select",
          placeholder: "Select pipeline...",
          icon: <Layers className="h-4 w-4" />,
          helperText: "Uses default pipeline if not selected",
          options: [], // Dynamic - populated from API
        },
        {
          name: "stageId",
          label: "Stage",
          type: "select",
          required: true,
          placeholder: "Select stage...",
          icon: <TrendingUp className="h-4 w-4" />,
          options: [], // Dynamic - populated based on selected pipeline
        },
        {
          name: "value",
          label: "Deal Value",
          type: "number",
          placeholder: "100000",
          icon: <DollarSign className="h-4 w-4" />,
          helperText: "Total value of this deal",
        },
        {
          name: "currency",
          label: "Currency",
          type: "select",
          placeholder: "Select currency...",
          icon: <Banknote className="h-4 w-4" />,
          options: CURRENCY_OPTIONS,
        },
        {
          name: "probability",
          label: "Win Probability (%)",
          type: "number",
          placeholder: "Auto-set from stage or enter custom value",
          icon: <Percent className="h-4 w-4" />,
          helperText: "Leave empty to use stage probability (0-100%)",
        },
        {
          name: "expectedCloseDate",
          label: "Expected Close Date",
          type: "date",
          icon: <Calendar className="h-4 w-4" />,
          helperText: "When do you expect to close this deal?",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "name" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "pipelineId" },
            { name: "stageId" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "value" },
            { name: "currency" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "probability" },
            { name: "expectedCloseDate" },
          ],
        },
      ],
    },
    {
      id: "relationships",
      label: "Related Records",
      icon: <Building2 className="h-4 w-4" />,
      fields: [
        {
          name: "companyId",
          label: "Company",
          type: "select",
          placeholder: "Select company...",
          icon: <Building2 className="h-4 w-4" />,
          options: [], // Dynamic - populated from API
          helperText: "The company this deal is associated with",
        },
        {
          name: "contactId",
          label: "Primary Contact",
          type: "select",
          placeholder: "Select contact...",
          icon: <User className="h-4 w-4" />,
          options: [], // Dynamic - populated from API
          helperText: "Main point of contact for this deal",
        },
        {
          name: "ownerId",
          label: "Deal Owner",
          type: "select",
          placeholder: "Select owner...",
          icon: <User className="h-4 w-4" />,
          options: [], // Dynamic - populated from API
          helperText: "Team member responsible for this deal",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "companyId" },
            { name: "contactId" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "ownerId" }],
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
          placeholder: "Add detailed notes about this deal, requirements, or context...",
          helperText: "Internal notes and context for this deal",
        },
        {
          name: "tagIds",
          label: "Tags",
          type: "tags",
          icon: <Tag className="h-4 w-4" />,
          options: [], // Dynamic - populated from API
          helperText: "Categorize this deal with tags",
        },
      ],
    },
    {
      id: "custom_fields",
      label: "Custom Fields",
      icon: <DollarSign className="h-4 w-4" />,
      fields: [],
      isCustomFields: true,
      entityType: "deal",
    },
  ],
};
