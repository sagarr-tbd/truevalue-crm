"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { serviceFormConfig } from "@/components/Forms/configs";
import type { Service } from "@/lib/types";

export interface ServiceFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Service>) => Promise<void>;
  initialData?: Partial<Service> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function ServiceFormDrawer(props: ServiceFormDrawerProps) {
  return <FormDrawer<Service> {...props} config={serviceFormConfig} />;
}
