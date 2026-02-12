"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { leadFormConfig } from "@/components/Forms/configs";
import type { Lead } from "@/lib/types";

export interface LeadFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Lead>) => Promise<void>;
  initialData?: Partial<Lead> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function LeadFormDrawer(props: LeadFormDrawerProps) {
  return <FormDrawer<Lead> {...props} config={leadFormConfig} />;
}
