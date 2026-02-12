import {
  LineChart,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  FileText,
  User,
} from "lucide-react";
import { forecastSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const forecastFormConfig: FormDrawerConfig = {
  entity: "Forecast",
  entityIcon: <LineChart className="h-5 w-5 text-primary" />,
  schema: forecastSchema,
  
  defaultValues: {
    period: "",
    startDate: "",
    endDate: "",
    targetRevenue: undefined,
    committedRevenue: undefined,
    bestCase: undefined,
    worstCase: undefined,
    status: "",
    assignedTo: "",
    description: "",
  },

  quickFormSections: [
    {
      label: "Forecast Period",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["period", "startDate", "endDate"],
    },
    {
      label: "Revenue Targets",
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["targetRevenue", "committedRevenue"],
    },
    {
      label: "Ownership & Status",
      icon: <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["status", "assignedTo"],
    },
  ],

  detailedSections: [
    {
      id: "forecast",
      label: "Forecast Details",
      icon: <LineChart className="h-4 w-4" />,
      fields: [
        {
          name: "period",
          label: "Forecast Period",
          type: "text",
          required: true,
          placeholder: "Q1 2026",
          icon: <Calendar className="h-4 w-4" />,
          helperText: "e.g., Q1 2026, Jan 2026, FY 2026",
        },
        {
          name: "startDate",
          label: "Start Date",
          type: "date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "endDate",
          label: "End Date",
          type: "date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            "Planning",
            "On Track",
            "At Risk",
            "Achieved",
            "Missed",
          ],
          placeholder: "Select status...",
          icon: <Target className="h-4 w-4" />,
        },
        {
          name: "assignedTo",
          label: "Forecast Owner",
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
          fields: [{ name: "period" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "startDate" },
            { name: "endDate" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "status" },
            { name: "assignedTo" },
          ],
        },
      ],
    },
    {
      id: "revenue",
      label: "Revenue Projections",
      icon: <DollarSign className="h-4 w-4" />,
      fields: [
        {
          name: "targetRevenue",
          label: "Target Revenue",
          type: "number",
          placeholder: "2500000",
          icon: <Target className="h-4 w-4" />,
          helperText: "Expected revenue goal for this period",
        },
        {
          name: "committedRevenue",
          label: "Committed Revenue",
          type: "number",
          placeholder: "1850000",
          icon: <DollarSign className="h-4 w-4" />,
          helperText: "Revenue from committed deals",
        },
        {
          name: "bestCase",
          label: "Best Case Scenario",
          type: "number",
          placeholder: "2200000",
          icon: <TrendingUp className="h-4 w-4" />,
          helperText: "Maximum expected revenue",
        },
        {
          name: "worstCase",
          label: "Worst Case Scenario",
          type: "number",
          placeholder: "1650000",
          icon: <TrendingUp className="h-4 w-4" />,
          helperText: "Minimum expected revenue",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "targetRevenue" },
            { name: "committedRevenue" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "bestCase" },
            { name: "worstCase" },
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
          placeholder: "Add notes about this forecast period...",
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          options: [
            "Q1",
            "Q2",
            "Q3",
            "Q4",
            "High Priority",
            "Stretch Goal",
            "Conservative",
            "Aggressive",
          ],
        },
      ],
    },
  ],
};
