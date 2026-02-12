"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { dealFormConfig } from "@/components/Forms/configs";
import type { Deal } from "@/lib/types";

export interface DealFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Deal>) => Promise<void>;
  initialData?: Partial<Deal> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function DealFormDrawer(props: DealFormDrawerProps) {
  return <FormDrawer<Deal> {...props} config={dealFormConfig} />;
}
