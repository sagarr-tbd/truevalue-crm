"use client";

import { EntityV2FormDrawer } from "./EntityV2FormDrawer";
import type { ContactV2, CreateContactV2Input } from "@/lib/api/contactsV2";

export interface ContactV2FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactV2Input) => Promise<void>;
  initialData?: ContactV2 | null;
  mode?: "add" | "edit";
}

export function ContactV2FormDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
}: ContactV2FormDrawerProps) {
  return (
    <EntityV2FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit as (data: { status?: string; entity_data: Record<string, unknown> }) => Promise<void>}
      initialData={initialData}
      mode={mode}
      entityType="contact"
      entityLabel="Contact"
      defaultStatus="active"
      layoutUrl="/sales-v2/contacts/layout"
    />
  );
}
