import {
  Mail,
  MailOpen,
  Calendar,
  User,
  Link2,
  Flag,
  Bell,
} from "lucide-react";
import { emailSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const emailFormConfig: FormDrawerConfig = {
  entity: "Email",
  entityIcon: <Mail className="h-5 w-5 text-primary" />,
  schema: emailSchema,

  defaultValues: {
    subject: "",
    description: "",
    emailDirection: undefined,
    status: undefined,
    priority: undefined,
    dueDate: "",
    contactId: "",
    companyId: "",
    dealId: "",
    leadId: "",
    assignedTo: "",
    reminderAt: "",
  },

  quickFormSections: [
    {
      label: "Email Information",
      icon: <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["subject", "description", "emailDirection", "status"],
    },
    {
      label: "Schedule",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["dueDate"],
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
      label: "Email Details",
      icon: <Mail className="h-4 w-4" />,
      fields: [
        {
          name: "subject",
          label: "Email Subject",
          type: "text",
          required: true,
          placeholder: "Enter email subject...",
        },
        {
          name: "description",
          label: "Body / Notes",
          type: "textarea",
          placeholder: "Email body or notes...",
        },
        {
          name: "emailDirection",
          label: "Direction",
          type: "select",
          options: [
            { label: "Sent", value: "sent" },
            { label: "Received", value: "received" },
          ],
          placeholder: "Select direction...",
          icon: <MailOpen className="h-4 w-4" />,
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
            { name: "emailDirection" },
            { name: "status" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "priority" }],
        },
      ],
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "dueDate",
          label: "Date",
          type: "date",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "reminderAt",
          label: "Reminder",
          type: "datetime-local",
          icon: <Bell className="h-4 w-4" />,
          helperText: "Must be before the email date",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "dueDate" },
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
