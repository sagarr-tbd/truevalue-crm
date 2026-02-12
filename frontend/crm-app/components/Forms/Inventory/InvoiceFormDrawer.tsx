"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { invoiceFormConfig } from "@/components/Forms/configs";
import type { Invoice } from "@/lib/types";

export interface InvoiceFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Invoice>) => Promise<void>;
  initialData?: Partial<Invoice> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function InvoiceFormDrawer(props: InvoiceFormDrawerProps) {
  return <FormDrawer<Invoice> {...props} config={invoiceFormConfig} />;
}
