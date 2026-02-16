import {
  CheckSquare,
  Flag,
  Calendar,
  User,
  Link2,
  Clock,
} from "lucide-react";
import { taskSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const taskFormConfig: FormDrawerConfig = {
  entity: "Task",
  entityIcon: <CheckSquare className="h-5 w-5 text-primary" />,
  schema: taskSchema,
  
  defaultValues: {
    subject: "",
    description: "",
    priority: undefined,
    status: undefined,
    dueDate: "",
    startTime: "",
    endTime: "",
    durationMinutes: undefined,
    contactId: "",
    companyId: "",
    dealId: "",
    leadId: "",
    assignedTo: "",
    reminderAt: "",
  },

  quickFormSections: [
    {
      label: "Task Details",
      icon: <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["subject", "description", "priority", "status"],
    },
    {
      label: "Schedule",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["dueDate", "reminderAt"],
    },
    {
      label: "Assignment",
      icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["assignedTo"],
    },
  ],

  detailedSections: [
    {
      id: "details",
      label: "Task Details",
      icon: <CheckSquare className="h-4 w-4" />,
      fields: [
        {
          name: "subject",
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
          options: [
            { label: "Urgent", value: "urgent" },
            { label: "High", value: "high" },
            { label: "Normal", value: "normal" },
            { label: "Low", value: "low" },
          ],
          placeholder: "Select priority...",
          icon: <Flag className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { label: "Pending", value: "pending" },
            { label: "In Progress", value: "in_progress" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ],
          placeholder: "Select status...",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "subject" }],
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
      ],
    },
    {
      id: "schedule",
      label: "Schedule & Timing",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "dueDate",
          label: "Due Date",
          type: "date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "startTime",
          label: "Start Time",
          type: "datetime-local",
          icon: <Clock className="h-4 w-4" />,
        },
        {
          name: "endTime",
          label: "End Time",
          type: "datetime-local",
          icon: <Clock className="h-4 w-4" />,
        },
        {
          name: "durationMinutes",
          label: "Duration (minutes)",
          type: "number",
          placeholder: "e.g., 60",
          icon: <Clock className="h-4 w-4" />,
          helperText: "Estimated duration in minutes",
        },
        {
          name: "reminderAt",
          label: "Reminder",
          type: "datetime-local",
          icon: <Clock className="h-4 w-4" />,
          helperText: "Set a reminder notification",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "dueDate" },
            { name: "durationMinutes" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "startTime" },
            { name: "endTime" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "reminderAt" }],
        },
      ],
    },
    {
      id: "related",
      label: "Related Information",
      icon: <Link2 className="h-4 w-4" />,
      fields: [
        {
          name: "contactId",
          label: "Contact",
          type: "select",
          options: [],
          placeholder: "Select contact...",
        },
        {
          name: "companyId",
          label: "Company",
          type: "select",
          options: [],
          placeholder: "Select company...",
        },
        {
          name: "dealId",
          label: "Deal",
          type: "select",
          options: [],
          placeholder: "Select deal...",
        },
        {
          name: "assignedTo",
          label: "Assigned To",
          type: "select",
          options: [],
          placeholder: "Select assignee...",
          icon: <User className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "contactId" },
            { name: "companyId" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "dealId" },
            { name: "assignedTo" },
          ],
        },
      ],
    },
  ],
};
