"use client";

import { EntityV2FormDrawer } from "./EntityV2FormDrawer";
import type { LeadV2, CreateLeadV2Input } from "@/lib/api/leadsV2";

export interface LeadV2FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadV2Input) => Promise<void>;
  initialData?: LeadV2 | null;
  mode?: "add" | "edit";
}

export function LeadV2FormDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
}: LeadV2FormDrawerProps) {
  return (
    <EntityV2FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit as (data: { status?: string; entity_data: Record<string, unknown> }) => Promise<void>}
      initialData={initialData}
      mode={mode}
      entityType="lead"
      entityLabel="Lead"
      defaultStatus="new"
      layoutUrl="/sales-v2/leads/layout"
    />
  );
}
