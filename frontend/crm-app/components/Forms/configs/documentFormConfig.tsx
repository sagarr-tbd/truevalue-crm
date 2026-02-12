import {
  FolderOpen,
  FileText,
  File,
  Tag,
  Target,
  User,
  Upload,
} from "lucide-react";
import { documentSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const documentFormConfig: FormDrawerConfig = {
  entity: "Document",
  entityIcon: <FolderOpen className="h-5 w-5 text-primary" />,
  schema: documentSchema,
  
  defaultValues: {
    name: "",
    type: "",
    category: "",
    status: "",
    relatedTo: "",
    description: "",
    assignedTo: "",
    fileUrl: "",
  },

  quickFormSections: [
    {
      label: "Document Information",
      icon: <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["name", "type", "category"],
    },
    {
      label: "Classification",
      icon: <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["status", "relatedTo"],
    },
    {
      label: "Ownership",
      icon: <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["assignedTo"],
    },
  ],

  detailedSections: [
    {
      id: "document",
      label: "Document Details",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "name",
          label: "Document Name",
          type: "text",
          required: true,
          placeholder: "Q1 Sales Proposal - Acme Corp.pdf",
          icon: <File className="h-4 w-4" />,
        },
        {
          name: "type",
          label: "Document Type",
          type: "select",
          options: [
            "PDF",
            "Word",
            "Excel",
            "PowerPoint",
            "Image",
            "Other",
          ],
          placeholder: "Select type...",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "category",
          label: "Category",
          type: "select",
          options: [
            "Proposal",
            "Contract",
            "Marketing",
            "Pricing",
            "Notes",
            "Report",
            "Other",
          ],
          placeholder: "Select category...",
          icon: <Tag className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            "Draft",
            "Review",
            "Final",
            "Archived",
          ],
          placeholder: "Select status...",
          icon: <Target className="h-4 w-4" />,
        },
        {
          name: "relatedTo",
          label: "Related To",
          type: "select",
          options: [
            "General",
            "Acme Corporation",
            "TechVision Inc",
            "Global Solutions Ltd",
            "CloudFirst Inc",
            "NextGen Systems",
            "Prime Industries",
          ],
          placeholder: "Select related entity...",
          helperText: "Account, deal, or contact this document is related to",
        },
        {
          name: "assignedTo",
          label: "Document Owner",
          type: "select",
          options: [
            "John Smith",
            "Sarah Johnson",
            "Mike Brown",
            "Emily Davis",
            "Robert Wilson",
          ],
          placeholder: "Select owner...",
          icon: <User className="h-4 w-4" />,
        },
        {
          name: "fileUrl",
          label: "File URL",
          type: "text",
          placeholder: "https://...",
          icon: <Upload className="h-4 w-4" />,
          helperText: "Link to the document file",
        },
      ],
      layout: [
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "name" }],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-3 gap-4",
          fields: [
            { name: "type" },
            { name: "category" },
            { name: "status" },
          ],
        },
        {
          gridClass: "grid-cols-1 lg:grid-cols-2 gap-4",
          fields: [
            { name: "relatedTo" },
            { name: "assignedTo" },
          ],
        },
        {
          gridClass: "grid-cols-1 gap-4",
          fields: [{ name: "fileUrl" }],
        },
      ],
    },
    {
      id: "additional",
      label: "Additional Information",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Add notes about this document...",
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          options: [
            "Important",
            "Client-Facing",
            "Internal",
            "Legal",
            "Financial",
            "Template",
            "Archive",
            "Confidential",
          ],
        },
      ],
    },
  ],
};
