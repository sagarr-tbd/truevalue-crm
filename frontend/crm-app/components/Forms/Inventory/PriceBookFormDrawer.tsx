"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { priceBookFormConfig } from "@/components/Forms/configs";
import type { PriceBook } from "@/lib/types";

export interface PriceBookFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PriceBook>) => Promise<void>;
  initialData?: Partial<PriceBook> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function PriceBookFormDrawer(props: PriceBookFormDrawerProps) {
  return <FormDrawer<PriceBook> {...props} config={priceBookFormConfig} />;
}
