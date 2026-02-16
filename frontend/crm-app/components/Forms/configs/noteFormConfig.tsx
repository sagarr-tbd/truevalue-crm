import {
  FileText,
  User,
  Link2,
  Flag,
} from "lucide-react";
import { noteSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const noteFormConfig: FormDrawerConfig = {
  entity: "Note",
  entityIcon: <FileText className="h-5 w-5 text-primary" />,
  schema: noteSchema,

  defaultValues: {
    subject: "",
    description: "",
    status: undefined,
    priority: undefined,
    contactId: "",
    companyId: "",
    dealId: "",
    leadId: "",
    assignedTo: "",
  },

  quickFormSections: [
    {
      label: "Note Information",
      icon: <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["subject", "description"],
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
      label: "Note Details",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "subject",
          label: "Note Title",
          type: "text",
          required: true,
          placeholder: "Enter note title...",
        },
        {
          name: "description",
          label: "Content",
          type: "textarea",
          placeholder: "Write your note here...",
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
