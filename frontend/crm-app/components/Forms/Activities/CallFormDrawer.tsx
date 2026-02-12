"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { callFormConfig } from "@/components/Forms/configs";
import type { Call } from "@/lib/types";

export interface CallFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Call>) => Promise<void>;
  initialData?: Partial<Call> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function CallFormDrawer(props: CallFormDrawerProps) {
  return <FormDrawer<Call> {...props} config={callFormConfig} />;
}
