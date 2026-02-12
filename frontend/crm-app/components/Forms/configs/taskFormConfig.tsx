import {
  CheckSquare,
  Flag,
  Calendar,
  User,
  Link2,
  Clock,
  Tag,
} from "lucide-react";
import { taskSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const taskFormConfig: FormDrawerConfig = {
  entity: "Task",
  entityIcon: <CheckSquare className="h-5 w-5 text-primary" />,
  schema: taskSchema,
  
  defaultValues: {
    title: "",
    description: "",
    priority: undefined,
    status: undefined,
    dueDate: "",
    startDate: "",
    category: "",
    relatedTo: "",
    relatedToType: "",
    assignedTo: "",
    reminderDate: "",
  },

  quickFormSections: [
    {
      label: "Task Details",
      icon: <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["title", "description", "priority", "status"],
    },
    {
      label: "Schedule",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["dueDate", "startDate", "reminderDate"],
    },
    {
      label: "Assignment",
      icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["assignedTo", "category"],
    },
  ],

  detailedSections: [
    {
      id: "details",
      label: "Task Details",
      icon: <CheckSquare className="h-4 w-4" />,
      fields: [
        {
          name: "title",
          label: "Task Title",
          type: "text",
          required: true,
          placeholder: "Enter task title...",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Describe the task...",
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          required: true,
          options: ["Urgent", "High", "Medium", "Low"],
          placeholder: "Select priority...",
          icon: <Flag className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: ["Not Started", "In Progress", "Completed", "Cancelled"],
          placeholder: "Select status...",
        },
        {
          name: "category",
          label: "Category",
          type: "select",
          options: [
            "Sales",
            "Marketing",
            "Customer Success",
            "Administrative",
            "Onboarding",
            "Maintenance",
            "Reporting",
            "Documentation",
            "Legal",
            "Other",
          ],
          placeholder: "Select category...",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "title" }],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "description" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "priority" },
            { name: "status" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "category" }],
        },
      ],
    },
    {
      id: "schedule",
      label: "Schedule & Timing",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "startDate",
          label: "Start Date",
          type: "date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "dueDate",
          label: "Due Date",
          type: "date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "reminderDate",
          label: "Reminder Date",
          type: "datetime-local",
          icon: <Clock className="h-4 w-4" />,
          helperText: "Set a reminder notification",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "startDate" },
            { name: "dueDate" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "reminderDate" }],
        },
      ],
    },
    {
      id: "related",
      label: "Related Information",
      icon: <Link2 className="h-4 w-4" />,
      fields: [
        {
          name: "relatedTo",
          label: "Related To",
          type: "select",
          options: [
            "Acme Corporation",
            "TechVision Inc",
            "Global Solutions Ltd",
            "Innovate Labs",
            "NextGen Systems",
            "CloudFirst Inc",
            "Prime Industries",
            "Apex Solutions",
            "Strategic Partners",
            "Internal",
          ],
          placeholder: "Select related account/contact...",
        },
        {
          name: "relatedToType",
          label: "Related To Type",
          type: "select",
          options: ["Account", "Contact", "Deal", "Lead", "Campaign", "Internal"],
          placeholder: "Select type...",
        },
        {
          name: "assignedTo",
          label: "Assigned To",
          type: "select",
          options: [
            "John Smith",
            "Jane Doe",
            "Mike Johnson",
            "Sarah Brown",
            "Robert Wilson",
          ],
          placeholder: "Select assignee...",
          icon: <User className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "relatedTo" },
            { name: "relatedToType" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "assignedTo" }],
        },
      ],
    },
    {
      id: "tags",
      label: "Tags",
      icon: <Tag className="h-4 w-4" />,
      fields: [
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          options: [
            "Urgent",
            "Follow-up",
            "Important",
            "Client Request",
            "Internal",
            "Revenue Related",
            "Quick Win",
            "Long Term",
          ],
        },
      ],
    },
  ],
};
