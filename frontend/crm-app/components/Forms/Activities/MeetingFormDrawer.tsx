"use client";
import { useMemo } from "react";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { meetingFormConfig } from "@/components/Forms/configs";
import type { Meeting } from "@/lib/types";
import { useContactOptions } from "@/lib/queries/useContacts";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useDealOptions } from "@/lib/queries/useDeals";
import { useMemberOptions } from "@/lib/queries/useMembers";
import type { FormDrawerConfig } from "@/components/Forms/FormDrawer/types";
import { cloneFormConfig, batchUpdateFieldOptions } from "@/lib/utils/formConfig";

export interface MeetingFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Meeting>) => Promise<void>;
  initialData?: Partial<Meeting> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function MeetingFormDrawer(props: MeetingFormDrawerProps) {
  const { data: contactOptions = [], isLoading: loadingContacts } = useContactOptions();
  const { data: companyOptions = [], isLoading: loadingCompanies } = useCompanyOptions();
  const { data: dealOptions = [], isLoading: loadingDeals } = useDealOptions();
  const { data: memberOptions = [], isLoading: loadingMembers } = useMemberOptions();

  const dynamicConfig = useMemo<FormDrawerConfig>(() => {
    const config = cloneFormConfig(meetingFormConfig);

    batchUpdateFieldOptions(config, {
      contactId: contactOptions.length > 0
        ? contactOptions
        : [{ value: "", label: loadingContacts ? "Loading..." : "No contacts found" }],
      companyId: companyOptions.length > 0
        ? companyOptions
        : [{ value: "", label: loadingCompanies ? "Loading..." : "No companies found" }],
      dealId: dealOptions.length > 0
        ? dealOptions
        : [{ value: "", label: loadingDeals ? "Loading..." : "No deals found" }],
      assignedTo: memberOptions.length > 0
        ? memberOptions
        : [{ value: "", label: loadingMembers ? "Loading..." : "No members found" }],
    });

    return config;
  }, [contactOptions, companyOptions, dealOptions, memberOptions, loadingContacts, loadingCompanies, loadingDeals, loadingMembers]);

  return <FormDrawer<Meeting> {...props} config={dynamicConfig} />;
}
