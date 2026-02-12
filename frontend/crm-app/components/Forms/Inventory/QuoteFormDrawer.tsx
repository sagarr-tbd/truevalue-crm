"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { quoteFormConfig } from "@/components/Forms/configs";
import type { Quote } from "@/lib/types";

export interface QuoteFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Quote>) => Promise<void>;
  initialData?: Partial<Quote> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function QuoteFormDrawer(props: QuoteFormDrawerProps) {
  return <FormDrawer<Quote> {...props} config={quoteFormConfig} />;
}
