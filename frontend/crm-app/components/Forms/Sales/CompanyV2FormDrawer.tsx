"use client";

import { EntityV2FormDrawer } from "./EntityV2FormDrawer";
import type { CompanyV2, CreateCompanyV2Input } from "@/lib/api/companiesV2";

export interface CompanyV2FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCompanyV2Input) => Promise<void>;
  initialData?: CompanyV2 | null;
  mode?: "add" | "edit";
}

export function CompanyV2FormDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
}: CompanyV2FormDrawerProps) {
  return (
    <EntityV2FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit as (data: { status?: string; entity_data: Record<string, unknown> }) => Promise<void>}
      initialData={initialData}
      mode={mode}
      entityType="company"
      entityLabel="Company"
      defaultStatus="active"
      layoutUrl="/sales-v2/companies/layout"
    />
  );
}
