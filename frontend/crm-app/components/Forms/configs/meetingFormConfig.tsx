import {
  Calendar,
  Clock,
  User,
  Link2,
  Flag,
  Users,
} from "lucide-react";
import { meetingSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const meetingFormConfig: FormDrawerConfig = {
  entity: "Meeting",
  entityIcon: <Users className="h-5 w-5 text-primary" />,
  schema: meetingSchema,
  
  defaultValues: {
    subject: "",
    description: "",
    status: undefined,
    priority: undefined,
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
      label: "Meeting Details",
      icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["subject", "description", "status", "priority"],
    },
    {
      label: "Schedule",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["dueDate", "durationMinutes"],
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
      label: "Meeting Details",
      icon: <Users className="h-4 w-4" />,
      fields: [
        {
          name: "subject",
          label: "Meeting Title",
          type: "text",
          required: true,
          placeholder: "Enter meeting title...",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Meeting description and agenda...",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Pending", value: "pending" },
            { label: "In Progress", value: "in_progress" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ],
          placeholder: "Select status...",
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { label: "Urgent", value: "urgent" },
            { label: "High", value: "high" },
            { label: "Normal", value: "normal" },
            { label: "Low", value: "low" },
          ],
          placeholder: "Select priority...",
          icon: <Flag className="h-4 w-4" />,
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
            { name: "status" },
            { name: "priority" },
          ],
        },
      ],
    },
    {
      id: "schedule",
      label: "Schedule & Duration",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "dueDate",
          label: "Meeting Date",
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
          helperText: "Meeting duration in minutes",
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
