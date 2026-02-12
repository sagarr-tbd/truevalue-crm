"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { meetingFormConfig } from "@/components/Forms/configs";
import type { Meeting } from "@/lib/types";

export interface MeetingFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Meeting>) => Promise<void>;
  initialData?: Partial<Meeting> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function MeetingFormDrawer(props: MeetingFormDrawerProps) {
  return <FormDrawer<Meeting> {...props} config={meetingFormConfig} />;
}
