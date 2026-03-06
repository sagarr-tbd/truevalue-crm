import {
  CheckSquare,
  Phone,
  PhoneOutgoing,
  Calendar,
  Clock,
  FileText,
  Mail,
  Flag,
  Bell,
  User,
  Link2,
  Timer,
} from "lucide-react";
import {
  getActivityV2FormSchema,
} from "@/lib/schemas";
import type { FormDrawerConfig, FormFieldConfig } from "../FormDrawer/types";

type OptionItem = { value: string; label: string };

interface ActivityV2ConfigOptions {
  contactOptions?: OptionItem[];
  companyOptions?: OptionItem[];
  dealOptions?: OptionItem[];
  leadOptions?: OptionItem[];
  memberOptions?: OptionItem[];
}

const STATUS_OPTIONS: OptionItem[] = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const PRIORITY_OPTIONS: OptionItem[] = [
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
];

const CALL_DIRECTION_OPTIONS: OptionItem[] = [
  { label: "Inbound", value: "inbound" },
  { label: "Outbound", value: "outbound" },
];

const CALL_OUTCOME_OPTIONS: OptionItem[] = [
  { label: "Answered", value: "answered" },
  { label: "Voicemail", value: "voicemail" },
  { label: "No Answer", value: "no_answer" },
  { label: "Busy", value: "busy" },
  { label: "Failed", value: "failed" },
];

const EMAIL_DIRECTION_OPTIONS: OptionItem[] = [
  { label: "Sent", value: "sent" },
  { label: "Received", value: "received" },
];

function buildRelatedFields(opts: ActivityV2ConfigOptions): FormFieldConfig[] {
  return [
    { name: "contactId", label: "Contact", type: "select", options: opts.contactOptions || [], placeholder: "Select contact..." },
    { name: "companyId", label: "Company", type: "select", options: opts.companyOptions || [], placeholder: "Select company..." },
    { name: "dealId", label: "Deal", type: "select", options: opts.dealOptions || [], placeholder: "Select deal..." },
    { name: "leadId", label: "Lead", type: "select", options: opts.leadOptions || [], placeholder: "Select lead..." },
    { name: "assignedTo", label: "Assigned To", type: "select", options: opts.memberOptions || [], placeholder: "Select assignee...", icon: <User className="h-4 w-4" /> },
  ];
}

const RELATED_LAYOUT = [
  { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "contactId" }, { name: "companyId" }] },
  { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "dealId" }, { name: "leadId" }] },
  { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "assignedTo" }] },
];

function computeDuration(values: Record<string, unknown>): number | undefined {
  if (!values.startTime || !values.endTime) return undefined;
  const start = new Date(values.startTime as string);
  const end = new Date(values.endTime as string);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return undefined;
  const diffMs = end.getTime() - start.getTime();
  return diffMs > 0 ? Math.round(diffMs / 60000) : undefined;
}

export function getActivityV2FormConfig(
  activityType: string,
  opts: ActivityV2ConfigOptions = {}
): FormDrawerConfig {
  switch (activityType) {
    case "call":
      return buildCallConfig(opts);
    case "meeting":
      return buildMeetingConfig(opts);
    case "note":
      return buildNoteConfig(opts);
    case "email":
      return buildEmailConfig(opts);
    default:
      return buildTaskConfig(opts);
  }
}

function buildTaskConfig(opts: ActivityV2ConfigOptions): FormDrawerConfig {
  return {
    entity: "Task",
    entityIcon: <CheckSquare className="h-5 w-5 text-primary" />,
    schema: getActivityV2FormSchema("task"),
    defaultValues: {
      subject: "", description: "", priority: undefined, status: undefined,
      dueDate: "", contactId: "", companyId: "", dealId: "", leadId: "",
      assignedTo: "", reminderAt: "",
    },
    quickFormSections: [
      { label: "Task Details", icon: <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["subject", "description", "priority", "status"] },
      { label: "Schedule", icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["dueDate", "reminderAt"] },
      { label: "Assignment", icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["assignedTo"] },
    ],
    detailedSections: [
      {
        id: "details", label: "Task Details", icon: <CheckSquare className="h-4 w-4" />,
        fields: [
          { name: "subject", label: "Task Title", type: "text", required: true, placeholder: "Enter task title..." },
          { name: "description", label: "Description", type: "textarea", placeholder: "Describe the task..." },
          { name: "priority", label: "Priority", type: "select", required: true, options: PRIORITY_OPTIONS, placeholder: "Select priority...", icon: <Flag className="h-4 w-4" /> },
          { name: "status", label: "Status", type: "select", required: true, options: STATUS_OPTIONS, placeholder: "Select status..." },
        ],
        layout: [
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "subject" }] },
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "description" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "priority" }, { name: "status" }] },
        ],
      },
      {
        id: "schedule", label: "Schedule & Reminder", icon: <Calendar className="h-4 w-4" />,
        fields: [
          { name: "dueDate", label: "Due Date", type: "date", icon: <Calendar className="h-4 w-4" /> },
          { name: "reminderAt", label: "Reminder", type: "datetime-local", icon: <Bell className="h-4 w-4" />, helperText: "Must be before the due date" },
        ],
        layout: [
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "dueDate" }, { name: "reminderAt" }] },
        ],
      },
      {
        id: "related", label: "Related Information", icon: <Link2 className="h-4 w-4" />,
        fields: buildRelatedFields(opts),
        layout: RELATED_LAYOUT,
      },
    ],
  };
}

function buildCallConfig(opts: ActivityV2ConfigOptions): FormDrawerConfig {
  return {
    entity: "Call",
    entityIcon: <Phone className="h-5 w-5 text-primary" />,
    schema: getActivityV2FormSchema("call"),
    defaultValues: {
      subject: "", description: "", callDirection: undefined, callOutcome: undefined,
      status: undefined, priority: undefined, dueDate: "", startTime: "", endTime: "",
      durationMinutes: undefined, contactId: "", companyId: "", dealId: "", leadId: "",
      assignedTo: "", reminderAt: "",
    },
    computedFields: {
      durationMinutes: { dependsOn: ["startTime", "endTime"], compute: computeDuration },
    },
    quickFormSections: [
      { label: "Call Information", icon: <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["subject", "description", "callDirection", "status"] },
      { label: "Schedule", icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["dueDate", "startTime", "endTime"] },
      { label: "Assignment", icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["assignedTo"] },
    ],
    detailedSections: [
      {
        id: "details", label: "Call Details", icon: <Phone className="h-4 w-4" />,
        fields: [
          { name: "subject", label: "Call Subject", type: "text", required: true, placeholder: "Enter call subject..." },
          { name: "description", label: "Description", type: "textarea", placeholder: "Call notes and details..." },
          { name: "callDirection", label: "Direction", type: "select", required: true, options: CALL_DIRECTION_OPTIONS, placeholder: "Select direction...", icon: <PhoneOutgoing className="h-4 w-4" /> },
          { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, placeholder: "Select status..." },
          { name: "priority", label: "Priority", type: "select", options: PRIORITY_OPTIONS, placeholder: "Select priority...", icon: <Flag className="h-4 w-4" /> },
          { name: "callOutcome", label: "Call Outcome", type: "select", options: CALL_OUTCOME_OPTIONS, placeholder: "Select outcome..." },
        ],
        layout: [
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "subject" }] },
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "description" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "callDirection" }, { name: "status" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "priority" }, { name: "callOutcome" }] },
        ],
      },
      {
        id: "schedule", label: "Schedule & Duration", icon: <Calendar className="h-4 w-4" />,
        fields: [
          { name: "dueDate", label: "Call Date", type: "date", icon: <Calendar className="h-4 w-4" /> },
          { name: "startTime", label: "Start Time", type: "datetime-local", icon: <Clock className="h-4 w-4" /> },
          { name: "endTime", label: "End Time", type: "datetime-local", icon: <Clock className="h-4 w-4" /> },
          { name: "durationMinutes", label: "Duration (minutes)", type: "number", disabled: true, placeholder: "Auto-calculated", icon: <Timer className="h-4 w-4" />, helperText: "Auto-calculated from start and end times" },
          { name: "reminderAt", label: "Reminder", type: "datetime-local", icon: <Bell className="h-4 w-4" />, helperText: "Must be before the call date" },
        ],
        layout: [
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "dueDate" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "startTime" }, { name: "endTime" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "durationMinutes" }, { name: "reminderAt" }] },
        ],
      },
      {
        id: "related", label: "Related Information", icon: <Link2 className="h-4 w-4" />,
        fields: buildRelatedFields(opts),
        layout: RELATED_LAYOUT,
      },
    ],
  };
}

function buildMeetingConfig(opts: ActivityV2ConfigOptions): FormDrawerConfig {
  return {
    entity: "Meeting",
    entityIcon: <Calendar className="h-5 w-5 text-primary" />,
    schema: getActivityV2FormSchema("meeting"),
    defaultValues: {
      subject: "", description: "", status: undefined, priority: undefined,
      dueDate: "", startTime: "", endTime: "", durationMinutes: undefined,
      contactId: "", companyId: "", dealId: "", leadId: "", assignedTo: "", reminderAt: "",
    },
    computedFields: {
      durationMinutes: { dependsOn: ["startTime", "endTime"], compute: computeDuration },
    },
    quickFormSections: [
      { label: "Meeting Details", icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["subject", "description", "priority", "status"] },
      { label: "Schedule", icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["dueDate", "startTime", "endTime"] },
      { label: "Assignment", icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["assignedTo"] },
    ],
    detailedSections: [
      {
        id: "details", label: "Meeting Details", icon: <Calendar className="h-4 w-4" />,
        fields: [
          { name: "subject", label: "Meeting Title", type: "text", required: true, placeholder: "Enter meeting title..." },
          { name: "description", label: "Description", type: "textarea", placeholder: "Meeting agenda and details..." },
          { name: "priority", label: "Priority", type: "select", required: true, options: PRIORITY_OPTIONS, placeholder: "Select priority...", icon: <Flag className="h-4 w-4" /> },
          { name: "status", label: "Status", type: "select", required: true, options: STATUS_OPTIONS, placeholder: "Select status..." },
        ],
        layout: [
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "subject" }] },
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "description" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "priority" }, { name: "status" }] },
        ],
      },
      {
        id: "schedule", label: "Schedule & Duration", icon: <Clock className="h-4 w-4" />,
        fields: [
          { name: "dueDate", label: "Meeting Date", type: "date", icon: <Calendar className="h-4 w-4" /> },
          { name: "startTime", label: "Start Time", type: "datetime-local", icon: <Clock className="h-4 w-4" /> },
          { name: "endTime", label: "End Time", type: "datetime-local", icon: <Clock className="h-4 w-4" /> },
          { name: "durationMinutes", label: "Duration (minutes)", type: "number", disabled: true, placeholder: "Auto-calculated", icon: <Timer className="h-4 w-4" />, helperText: "Auto-calculated from start and end times" },
          { name: "reminderAt", label: "Reminder", type: "datetime-local", icon: <Bell className="h-4 w-4" />, helperText: "Must be before the meeting date" },
        ],
        layout: [
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "dueDate" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "startTime" }, { name: "endTime" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "durationMinutes" }, { name: "reminderAt" }] },
        ],
      },
      {
        id: "related", label: "Related Information", icon: <Link2 className="h-4 w-4" />,
        fields: buildRelatedFields(opts),
        layout: RELATED_LAYOUT,
      },
    ],
  };
}

function buildNoteConfig(opts: ActivityV2ConfigOptions): FormDrawerConfig {
  return {
    entity: "Note",
    entityIcon: <FileText className="h-5 w-5 text-primary" />,
    schema: getActivityV2FormSchema("note"),
    defaultValues: {
      subject: "", description: "", status: undefined,
      contactId: "", companyId: "", dealId: "", leadId: "",
    },
    quickFormSections: [
      { label: "Note Information", icon: <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["subject", "description"] },
    ],
    detailedSections: [
      {
        id: "details", label: "Note Details", icon: <FileText className="h-4 w-4" />,
        fields: [
          { name: "subject", label: "Note Title", type: "text", required: true, placeholder: "Enter note title..." },
          { name: "description", label: "Content", type: "textarea", placeholder: "Write your note here..." },
          { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, placeholder: "Select status..." },
        ],
        layout: [
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "subject" }] },
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "description" }] },
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "status" }] },
        ],
      },
      {
        id: "related", label: "Related Information", icon: <Link2 className="h-4 w-4" />,
        fields: [
          { name: "contactId", label: "Contact", type: "select", options: opts.contactOptions || [], placeholder: "Select contact..." },
          { name: "companyId", label: "Company", type: "select", options: opts.companyOptions || [], placeholder: "Select company..." },
          { name: "dealId", label: "Deal", type: "select", options: opts.dealOptions || [], placeholder: "Select deal..." },
          { name: "leadId", label: "Lead", type: "select", options: opts.leadOptions || [], placeholder: "Select lead..." },
        ],
        layout: [
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "contactId" }, { name: "companyId" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "dealId" }, { name: "leadId" }] },
        ],
      },
    ],
  };
}

function buildEmailConfig(opts: ActivityV2ConfigOptions): FormDrawerConfig {
  return {
    entity: "Email",
    entityIcon: <Mail className="h-5 w-5 text-primary" />,
    schema: getActivityV2FormSchema("email"),
    defaultValues: {
      subject: "", description: "", emailDirection: undefined, status: undefined,
      priority: undefined, dueDate: "", contactId: "", companyId: "", dealId: "",
      leadId: "", assignedTo: "", reminderAt: "",
    },
    quickFormSections: [
      { label: "Email Information", icon: <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["subject", "description", "emailDirection", "status"] },
      { label: "Schedule", icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["dueDate", "reminderAt"] },
      { label: "Assignment", icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />, fields: ["assignedTo"] },
    ],
    detailedSections: [
      {
        id: "details", label: "Email Details", icon: <Mail className="h-4 w-4" />,
        fields: [
          { name: "subject", label: "Email Subject", type: "text", required: true, placeholder: "Enter email subject..." },
          { name: "description", label: "Description", type: "textarea", placeholder: "Email content and details..." },
          { name: "emailDirection", label: "Direction", type: "select", options: EMAIL_DIRECTION_OPTIONS, placeholder: "Select direction...", icon: <Mail className="h-4 w-4" /> },
          { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, placeholder: "Select status..." },
          { name: "priority", label: "Priority", type: "select", options: PRIORITY_OPTIONS, placeholder: "Select priority...", icon: <Flag className="h-4 w-4" /> },
        ],
        layout: [
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "subject" }] },
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "description" }] },
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "emailDirection" }, { name: "status" }] },
          { gridClass: "grid-cols-1 gap-4", fields: [{ name: "priority" }] },
        ],
      },
      {
        id: "schedule", label: "Schedule & Reminder", icon: <Calendar className="h-4 w-4" />,
        fields: [
          { name: "dueDate", label: "Due Date", type: "date", icon: <Calendar className="h-4 w-4" /> },
          { name: "reminderAt", label: "Reminder", type: "datetime-local", icon: <Bell className="h-4 w-4" />, helperText: "Must be before the due date" },
        ],
        layout: [
          { gridClass: "grid-cols-1 lg:grid-cols-2 gap-4", fields: [{ name: "dueDate" }, { name: "reminderAt" }] },
        ],
      },
      {
        id: "related", label: "Related Information", icon: <Link2 className="h-4 w-4" />,
        fields: buildRelatedFields(opts),
        layout: RELATED_LAYOUT,
      },
    ],
  };
}

const CAMEL_TO_SNAKE: Record<string, string> = {
  dueDate: "due_date",
  startTime: "start_time",
  endTime: "end_time",
  durationMinutes: "duration_minutes",
  callDirection: "call_direction",
  callOutcome: "call_outcome",
  emailDirection: "email_direction",
  contactId: "contact_id",
  companyId: "company_id",
  dealId: "deal_id",
  leadId: "lead_id",
  assignedTo: "assigned_to_id",
  reminderAt: "reminder_at",
};

export function mapFormDataToApi(
  formData: Record<string, unknown>,
  activityType: string
): Record<string, unknown> {
  const result: Record<string, unknown> = { activity_type: activityType };

  for (const [key, value] of Object.entries(formData)) {
    if (value === undefined || value === "" || value === null) continue;
    const apiKey = CAMEL_TO_SNAKE[key] || key;
    result[apiKey] = value;
  }

  return result;
}
