"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { purchaseOrderFormConfig } from "@/components/Forms/configs";
import type { PurchaseOrder } from "@/lib/types";

export interface PurchaseOrderFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PurchaseOrder>) => Promise<void>;
  initialData?: Partial<PurchaseOrder> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function PurchaseOrderFormDrawer(props: PurchaseOrderFormDrawerProps) {
  return <FormDrawer<PurchaseOrder> {...props} config={purchaseOrderFormConfig} />;
}
