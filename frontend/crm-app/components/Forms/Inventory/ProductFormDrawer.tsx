"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { productFormConfig } from "@/components/Forms/configs";
import type { Product } from "@/lib/types";

export interface ProductFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  initialData?: Partial<Product> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function ProductFormDrawer(props: ProductFormDrawerProps) {
  return <FormDrawer<Product> {...props} config={productFormConfig} />;
}
