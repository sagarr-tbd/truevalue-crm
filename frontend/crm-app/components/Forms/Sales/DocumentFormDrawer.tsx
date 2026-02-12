"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { documentFormConfig } from "@/components/Forms/configs";
import type { Document } from "@/lib/types";

export interface DocumentFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Document>) => Promise<void>;
  initialData?: Partial<Document> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function DocumentFormDrawer(props: DocumentFormDrawerProps) {
  return <FormDrawer<Document> {...props} config={documentFormConfig} />;
}
