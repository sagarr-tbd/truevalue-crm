"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { vendorFormConfig } from "@/components/Forms/configs";
import type { Vendor } from "@/lib/types";

export interface VendorFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Vendor>) => Promise<void>;
  initialData?: Partial<Vendor> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function VendorFormDrawer(props: VendorFormDrawerProps) {
  return <FormDrawer<Vendor> {...props} config={vendorFormConfig} />;
}
