import {
  Phone,
  PhoneOutgoing,
  Calendar,
  Clock,
  User,
  Link2,
  Tag,
} from "lucide-react";
import { callSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const callFormConfig: FormDrawerConfig = {
  entity: "Call",
  entityIcon: <Phone className="h-5 w-5 text-primary" />,
  schema: callSchema,
  
  defaultValues: {
    subject: "",
    description: "",
    direction: undefined,
    status: undefined,
    date: "",
    time: "",
    duration: "",
    contactName: "",
    contactPhone: "",
    relatedTo: "",
    relatedToType: "",
    outcome: "",
    callBy: "",
  },

  quickFormSections: [
    {
      label: "Call Information",
      icon: <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["subject", "description", "direction", "status"],
    },
    {
      label: "Schedule",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["date", "time", "duration"],
    },
    {
      label: "Contact Details",
      icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["contactName", "contactPhone"],
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
          name: "direction",
          label: "Direction",
          type: "select",
          required: true,
          options: ["Incoming", "Outgoing"],
          placeholder: "Select direction...",
          icon: <PhoneOutgoing className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["Scheduled", "Completed", "Missed", "Cancelled"],
          placeholder: "Select status...",
        },
        {
          name: "outcome",
          label: "Call Outcome",
          type: "select",
          options: [
            "Positive",
            "Negative",
            "Neutral",
            "Follow-up Required",
            "Resolved",
            "Quote Sent",
            "Voicemail",
            "No Answer",
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
            { name: "direction" },
            { name: "status" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "outcome" }],
        },
      ],
    },
    {
      id: "schedule",
      label: "Schedule & Duration",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "date",
          label: "Call Date",
          type: "date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "time",
          label: "Call Time",
          type: "time",
          required: true,
          icon: <Clock className="h-4 w-4" />,
        },
        {
          name: "duration",
          label: "Duration",
          type: "text",
          placeholder: "e.g., 30 min",
          icon: <Clock className="h-4 w-4" />,
          helperText: "Estimated or actual call duration",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "date" },
            { name: "time" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "duration" }],
        },
      ],
    },
    {
      id: "contact",
      label: "Contact Information",
      icon: <User className="h-4 w-4" />,
      fields: [
        {
          name: "contactName",
          label: "Contact Name",
          type: "text",
          placeholder: "Enter contact name...",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "contactPhone",
          label: "Phone Number",
          type: "tel",
          placeholder: "+1 (555) 123-4567",
          icon: <Phone className="h-4 w-4" />,
        },
        {
          name: "callBy",
          label: "Call By",
          type: "select",
          options: [
            "John Smith",
            "Jane Doe",
            "Mike Johnson",
            "Sarah Brown",
            "Robert Wilson",
          ],
          placeholder: "Select who made/received the call...",
          icon: <User className="h-4 w-4" />,
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "contactName" },
            { name: "contactPhone" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "callBy" }],
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
            "FutureTech Co",
          ],
          placeholder: "Select related account/contact...",
        },
        {
          name: "relatedToType",
          label: "Related To Type",
          type: "select",
          options: ["Account", "Contact", "Deal", "Lead", "Campaign"],
          placeholder: "Select type...",
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
            "Important",
            "Follow-up",
            "Support",
            "Sales",
            "Customer Success",
            "Urgent",
            "Resolved",
            "Escalation",
          ],
        },
      ],
    },
  ],
};
