"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { salesOrderFormConfig } from "@/components/Forms/configs";
import type { SalesOrder } from "@/lib/types";

export interface SalesOrderFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<SalesOrder>) => Promise<void>;
  initialData?: Partial<SalesOrder> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function SalesOrderFormDrawer(props: SalesOrderFormDrawerProps) {
  return <FormDrawer<SalesOrder> {...props} config={salesOrderFormConfig} />;
}
