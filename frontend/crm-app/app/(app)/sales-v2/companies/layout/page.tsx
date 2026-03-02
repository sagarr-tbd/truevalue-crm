"use client";

import FormLayoutEditor from "@/components/FormLayoutEditor/FormLayoutEditor";

export default function CompanyFormLayoutEditorPage() {
  return (
    <FormLayoutEditor
      entityType="company"
      entityLabel="Company"
      entityLabelPlural="Companies"
      backUrl="/sales-v2/companies"
    />
  );
}
