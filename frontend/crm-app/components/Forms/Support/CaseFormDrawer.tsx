"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { caseFormConfig } from "@/components/Forms/configs";
import type { Case } from "@/lib/types";

export interface CaseFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Case>) => Promise<void>;
  initialData?: Partial<Case> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function CaseFormDrawer(props: CaseFormDrawerProps) {
  return <FormDrawer<Case> {...props} config={caseFormConfig} />;
}
