"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { taskFormConfig } from "@/components/Forms/configs";
import type { Task } from "@/lib/types";

export interface TaskFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Task>) => Promise<void>;
  initialData?: Partial<Task> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function TaskFormDrawer(props: TaskFormDrawerProps) {
  return <FormDrawer<Task> {...props} config={taskFormConfig} />;
}
