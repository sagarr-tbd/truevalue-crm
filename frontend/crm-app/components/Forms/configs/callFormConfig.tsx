import {
  Phone,
  PhoneOutgoing,
  Calendar,
  Clock,
  User,
  Link2,
  Flag,
  Bell,
  Timer,
} from "lucide-react";
import { callSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

function computeDuration(values: Record<string, any>): number | undefined {
  if (!values.startTime || !values.endTime) return undefined;
  const start = new Date(values.startTime);
  const end = new Date(values.endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return undefined;
  const diffMs = end.getTime() - start.getTime();
  return diffMs > 0 ? Math.round(diffMs / 60000) : undefined;
}

export const callFormConfig: FormDrawerConfig = {
  entity: "Call",
  entityIcon: <Phone className="h-5 w-5 text-primary" />,
  schema: callSchema,
  
  defaultValues: {
    subject: "",
    description: "",
    callDirection: undefined,
    callOutcome: undefined,
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

  computedFields: {
    durationMinutes: {
      dependsOn: ["startTime", "endTime"],
      compute: computeDuration,
    },
  },

  quickFormSections: [
    {
      label: "Call Information",
      icon: <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["subject", "description", "callDirection", "status"],
    },
    {
      label: "Schedule",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["dueDate", "startTime", "endTime"],
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
      label: "Call Details",
      icon: <Phone className="h-4 w-4" />,
      fields: [
        {
          name: "subject",
          label: "Call Subject",
          type: "text",
          required: true,
          placeholder: "Enter call subject...",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Call notes and details...",
        },
        {
          name: "callDirection",
          label: "Direction",
          type: "select",
          required: true,
          options: [
            { label: "Inbound", value: "inbound" },
            { label: "Outbound", value: "outbound" },
          ],
          placeholder: "Select direction...",
          icon: <PhoneOutgoing className="h-4 w-4" />,
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
        {
          name: "callOutcome",
          label: "Call Outcome",
          type: "select",
          options: [
            { label: "Answered", value: "answered" },
            { label: "Voicemail", value: "voicemail" },
            { label: "No Answer", value: "no_answer" },
            { label: "Busy", value: "busy" },
            { label: "Failed", value: "failed" },
          ],
          placeholder: "Select outcome...",
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
            { name: "callDirection" },
            { name: "status" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "priority" },
            { name: "callOutcome" },
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
          label: "Call Date",
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
          disabled: true,
          placeholder: "Auto-calculated",
          icon: <Timer className="h-4 w-4" />,
          helperText: "Auto-calculated from start and end times",
        },
        {
          name: "reminderAt",
          label: "Reminder",
          type: "datetime-local",
          icon: <Bell className="h-4 w-4" />,
          helperText: "Must be before the call date",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "dueDate" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "startTime" },
            { name: "endTime" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "durationMinutes" },
            { name: "reminderAt" },
          ],
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
          name: "leadId",
          label: "Lead",
          type: "select",
          options: [],
          placeholder: "Select lead...",
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
            { name: "leadId" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "assignedTo" },
          ],
        },
      ],
    },
  ],
};
