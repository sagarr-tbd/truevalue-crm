import {
  Folder,
  User,
  Calendar,
  DollarSign,
  Users,
  Target,
  AlertCircle,
  Briefcase,
  MessageSquare,
  Tag,
} from "lucide-react";
import { projectSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const projectFormConfig: FormDrawerConfig = {
  entity: "Project",
  entityIcon: <Folder className="h-5 w-5 text-primary" />,
  schema: projectSchema,
  
  defaultValues: {
    projectCode: "",
    projectName: "",
    description: "",
    client: "",
    projectManager: "",
    status: "Planning",
    priority: "Medium",
    type: "Implementation",
    startDate: "",
    endDate: "",
    budget: "",
    teamSize: undefined,
    tags: [],
  },

  quickFormSections: [
    {
      label: "Project Information",
      icon: <Folder className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["projectName", "client", "projectManager", "status"],
    },
    {
      label: "Timeline & Budget",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["startDate", "endDate", "budget"],
    },
  ],

  quickFormFields: ["projectName", "client", "projectManager", "status", "startDate", "endDate", "budget"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <Folder className="h-4 w-4" />,
      fields: [
        {
          name: "projectName",
          label: "Project Name",
          type: "text",
          placeholder: "Enter project name",
          required: true,
          icon: <Folder className="h-4 w-4" />,
        },
        {
          name: "client",
          label: "Client",
          type: "text",
          placeholder: "Client or company name",
          required: true,
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          name: "projectManager",
          label: "Project Manager",
          type: "text",
          placeholder: "Assigned project manager",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "type",
          label: "Project Type",
          type: "select",
          placeholder: "Select project type",
          options: ["Implementation", "Development", "Migration", "Consulting", "Support", "Training", "Other"],
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "status",
      label: "Status & Priority",
      icon: <Target className="h-4 w-4" />,
      fields: [
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"],
          icon: <Target className="h-4 w-4" />,
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          placeholder: "Select priority",
          options: ["Low", "Medium", "High", "Critical"],
          icon: <AlertCircle className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "timeline",
      label: "Timeline & Budget",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "startDate",
          label: "Start Date",
          type: "date",
          placeholder: "Select start date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "endDate",
          label: "End Date",
          type: "date",
          placeholder: "Select end date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "budget",
          label: "Budget",
          type: "text",
          placeholder: "$100,000",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          name: "teamSize",
          label: "Team Size",
          type: "number",
          placeholder: "Number of team members",
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "description",
      label: "Description",
      icon: <MessageSquare className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Project Description",
          type: "textarea",
          placeholder: "Detailed project description...",
          icon: <MessageSquare className="h-4 w-4" />,
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
