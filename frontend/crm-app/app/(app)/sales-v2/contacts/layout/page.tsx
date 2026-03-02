"use client";

import FormLayoutEditor from "@/components/FormLayoutEditor/FormLayoutEditor";

export default function ContactFormLayoutEditorPage() {
  return (
    <FormLayoutEditor
      entityType="contact"
      entityLabel="Contact"
      entityLabelPlural="Contacts"
      backUrl="/sales-v2/contacts"
    />
  );
}
