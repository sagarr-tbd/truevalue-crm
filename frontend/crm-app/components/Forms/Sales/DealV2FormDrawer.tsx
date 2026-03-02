"use client";

import { EntityV2FormDrawer } from "./EntityV2FormDrawer";
import type { DealV2, CreateDealV2Input } from "@/lib/api/dealsV2";

export interface DealV2FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDealV2Input) => Promise<void>;
  initialData?: DealV2 | null;
  mode?: "add" | "edit";
}

export function DealV2FormDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
}: DealV2FormDrawerProps) {
  return (
    <EntityV2FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit as (data: { status?: string; entity_data: Record<string, unknown> }) => Promise<void>}
      initialData={initialData}
      mode={mode}
      entityType="deal"
      entityLabel="Deal"
      defaultStatus="open"
      layoutUrl="/sales-v2/deals/layout"
    />
  );
}
