"use client";

import { useMemo } from "react";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { getActivityV2FormConfig, mapFormDataToApi } from "@/components/Forms/configs/activityV2FormConfigs";
import { useContactV2Options } from "@/lib/queries/useContactsV2";
import { useCompanyV2Options } from "@/lib/queries/useCompaniesV2";
import { useDealV2Options } from "@/lib/queries/useDealsV2";
import { useLeadV2Options } from "@/lib/queries/useLeadsV2";
import { useMemberOptions } from "@/lib/queries/useMembers";
import type { ActivityV2, CreateActivityV2Input } from "@/lib/api/activitiesV2";

export interface ActivityV2FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActivityV2Input) => Promise<void>;
  initialData?: Partial<ActivityV2> | null;
  mode?: "add" | "edit";
  activityType: ActivityV2["activity_type"];
}

const SNAKE_TO_CAMEL: Record<string, string> = {
  due_date: "dueDate",
  start_time: "startTime",
  end_time: "endTime",
  duration_minutes: "durationMinutes",
  call_direction: "callDirection",
  call_outcome: "callOutcome",
  email_direction: "emailDirection",
  contact_id: "contactId",
  company_id: "companyId",
  deal_id: "dealId",
  lead_id: "leadId",
  assigned_to_id: "assignedTo",
  reminder_at: "reminderAt",
};

function snakeToCamel(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const camelKey = SNAKE_TO_CAMEL[key] || key;
    result[camelKey] = value === null ? undefined : value;
  }
  return result;
}

export function ActivityV2FormDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
  activityType,
}: ActivityV2FormDrawerProps) {
  const { data: contactOptions = [] } = useContactV2Options();
  const { data: companyOptions = [] } = useCompanyV2Options();
  const { data: dealOptions = [] } = useDealV2Options();
  const { data: leadOptions = [] } = useLeadV2Options();
  const { data: memberOptions = [] } = useMemberOptions();

  const config = useMemo(
    () =>
      getActivityV2FormConfig(activityType, {
        contactOptions,
        companyOptions,
        dealOptions,
        leadOptions,
        memberOptions,
      }),
    [activityType, contactOptions, companyOptions, dealOptions, leadOptions, memberOptions]
  );

  const camelInitialData = useMemo(() => {
    if (!initialData) return null;
    return snakeToCamel(initialData as Record<string, unknown>);
  }, [initialData]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const apiData = mapFormDataToApi(formData, activityType);
    await onSubmit(apiData as unknown as CreateActivityV2Input);
  };

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      initialData={camelInitialData}
      mode={mode}
      config={config}
    />
  );
}
