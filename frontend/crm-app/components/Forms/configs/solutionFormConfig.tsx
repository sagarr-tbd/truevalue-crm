import {
  BookOpen,
  FileText,
  Tag,
  User,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { solutionSchema } from "@/lib/schemas";
import type { FormDrawerConfig } from "../FormDrawer/types";

export const solutionFormConfig: FormDrawerConfig = {
  entity: "Solution",
  entityIcon: <BookOpen className="h-5 w-5 text-primary" />,
  schema: solutionSchema,
  
  defaultValues: {
    solutionNumber: "",
    title: "",
    description: "",
    category: "",
    subcategory: "",
    author: "",
    status: "Draft",
    tags: [],
  },

  quickFormSections: [
    {
      label: "Solution Information",
      icon: <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["title", "category", "status"],
    },
    {
      label: "Content",
      icon: <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />,
      fields: ["description"],
    },
  ],

  quickFormFields: ["title", "category", "status", "description"],

  detailedSections: [
    {
      id: "basic",
      label: "Basic Information",
      icon: <BookOpen className="h-4 w-4" />,
      fields: [
        {
          name: "title",
          label: "Title",
          type: "text",
          placeholder: "Solution title",
          required: true,
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "category",
          label: "Category",
          type: "text",
          placeholder: "e.g., Authentication, Integration",
          required: true,
          icon: <Tag className="h-4 w-4" />,
        },
        {
          name: "subcategory",
          label: "Subcategory",
          type: "text",
          placeholder: "More specific category",
          icon: <Tag className="h-4 w-4" />,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: ["Draft", "Published", "Archived"],
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          name: "author",
          label: "Author",
          type: "text",
          placeholder: "Author name",
          icon: <User className="h-4 w-4" />,
        },
      ],
    },
    {
      id: "content",
      label: "Solution Content",
      icon: <MessageSquare className="h-4 w-4" />,
      fields: [
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Detailed solution content...",
          required: true,
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          placeholder: "Add tags (press Enter after each tag)",
          icon: <Tag className="h-4 w-4" />,
        },
      ],
    },
  ],
};
