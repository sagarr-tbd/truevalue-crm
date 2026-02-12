import {
  Calendar,
  Video,
  MapPin,
  Clock,
  User,
  Users,
  Link2,
  Tag,
  ListChecks,
} from "lucide-react";
import { meetingSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const meetingFormConfig: FormDrawerConfig = {
  entity: "Meeting",
  entityIcon: <Calendar className="h-5 w-5 text-primary" />,
  schema: meetingSchema,
  
  defaultValues: {
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "",
    type: undefined,
    status: undefined,
    location: "",
    meetingLink: "",
    organizer: "",
    attendees: [],
    relatedTo: "",
    relatedToType: "",
    agenda: "",
    notes: "",
  },

  quickFormSections: [
    {
      label: "Meeting Details",
      icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["title", "description", "type", "status"],
    },
    {
      label: "Schedule",
      icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["date", "time", "duration"],
    },
    {
      label: "Location",
      icon: <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["location", "meetingLink"],
    },
  ],

  detailedSections: [
    {
      id: "details",
      label: "Meeting Details",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        {
          name: "title",
          label: "Meeting Title",
          type: "text",
          required: true,
          placeholder: "Enter meeting title...",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Meeting description and purpose...",
        },
        {
          name: "type",
          label: "Meeting Type",
          type: "select",
          options: ["In Person", "Video Call", "Phone Call"],
          placeholder: "Select meeting type...",
          icon: <Video className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["Scheduled", "Completed", "Cancelled", "Rescheduled"],
          placeholder: "Select status...",
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
            { name: "type" },
            { name: "status" },
          ],
        },
      ],
    },
    {
      id: "schedule",
      label: "Schedule & Duration",
      icon: <Clock className="h-4 w-4" />,
      fields: [
        {
          name: "date",
          label: "Meeting Date",
          type: "date",
          required: true,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: "time",
          label: "Meeting Time",
          type: "time",
          required: true,
          icon: <Clock className="h-4 w-4" />,
        },
        {
          name: "duration",
          label: "Duration",
          type: "text",
          placeholder: "e.g., 60 min",
          icon: <Clock className="h-4 w-4" />,
          helperText: "Estimated meeting duration",
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
      id: "location",
      label: "Location & Access",
      icon: <MapPin className="h-4 w-4" />,
      fields: [
        {
          name: "location",
          label: "Location",
          type: "text",
          placeholder: "Conference Room A, Office, or Platform name...",
          icon: <MapPin className="h-4 w-4" />,
        },
        {
          name: "meetingLink",
          label: "Meeting Link",
          type: "text",
          placeholder: "https://zoom.us/j/...",
          icon: <Link2 className="h-4 w-4" />,
          helperText: "Video conference link (Zoom, Teams, Meet, etc.)",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "location" }],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "meetingLink" }],
        },
      ],
    },
    {
      id: "attendees",
      label: "Organizer & Attendees",
      icon: <Users className="h-4 w-4" />,
      fields: [
        {
          name: "organizer",
          label: "Organizer",
          type: "select",
          options: [
            "John Smith",
            "Jane Doe",
            "Mike Johnson",
            "Sarah Brown",
            "Robert Wilson",
          ],
          placeholder: "Select meeting organizer...",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "attendees",
          label: "Attendees",
          type: "tags",
          options: [
            "John Smith",
            "Jane Doe",
            "Mike Johnson",
            "Sarah Brown",
            "Robert Wilson",
            "Sarah Williams",
            "Michael Chen",
            "Jessica Lee",
            "Rachel Green",
            "David Park",
            "Lisa Anderson",
            "James Wilson",
            "Emma Johnson",
            "Sophie Martinez",
            "Robert Chen",
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
      id: "agenda",
      label: "Agenda & Notes",
      icon: <ListChecks className="h-4 w-4" />,
      fields: [
        {
          name: "agenda",
          label: "Meeting Agenda",
          type: "textarea",
          placeholder: "List agenda items and topics to discuss...",
        },
        {
          name: "notes",
          label: "Meeting Notes",
          type: "textarea",
          placeholder: "Meeting notes, action items, and outcomes...",
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
            "Recurring",
            "Client Meeting",
            "Internal",
            "Sales",
            "Strategy",
            "Review",
            "Planning",
            "One-on-One",
          ],
        },
      ],
    },
  ],
};
