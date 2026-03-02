"use client";

import FormLayoutEditor from "@/components/FormLayoutEditor/FormLayoutEditor";

export default function LeadFormLayoutEditorPage() {
  return (
    <FormLayoutEditor
      entityType="lead"
      entityLabel="Lead"
      entityLabelPlural="Leads"
      backUrl="/sales-v2/leads"
    />
  );
}
