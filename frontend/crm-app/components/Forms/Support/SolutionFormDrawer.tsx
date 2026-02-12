"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { solutionFormConfig } from "@/components/Forms/configs";
import type { Solution } from "@/lib/types";

export interface SolutionFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Solution>) => Promise<void>;
  initialData?: Partial<Solution> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function SolutionFormDrawer(props: SolutionFormDrawerProps) {
  return <FormDrawer<Solution> {...props} config={solutionFormConfig} />;
}
