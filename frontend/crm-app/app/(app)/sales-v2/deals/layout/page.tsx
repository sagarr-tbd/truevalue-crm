"use client";

import FormLayoutEditor from "@/components/FormLayoutEditor/FormLayoutEditor";

export default function DealFormLayoutEditorPage() {
  return (
    <FormLayoutEditor
      entityType="deal"
      entityLabel="Deal"
      entityLabelPlural="Deals"
      backUrl="/sales-v2/deals"
    />
  );
}
