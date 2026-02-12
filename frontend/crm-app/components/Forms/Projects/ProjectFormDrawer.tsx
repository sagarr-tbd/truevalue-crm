"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { projectFormConfig } from "@/components/Forms/configs";
import type { Project } from "@/lib/types";

export interface ProjectFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Project>) => Promise<void>;
  initialData?: Partial<Project> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function ProjectFormDrawer(props: ProjectFormDrawerProps) {
  return <FormDrawer<Project> {...props} config={projectFormConfig} />;
}
