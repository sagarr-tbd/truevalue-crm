"use client";
import { useMemo } from "react";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { emailFormConfig } from "@/components/Forms/configs";
import type { Email } from "@/lib/types";
import { useContactOptions } from "@/lib/queries/useContacts";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useDealOptions } from "@/lib/queries/useDeals";
import { useLeadOptions } from "@/lib/queries/useLeads";
import { useMemberOptions } from "@/lib/queries/useMembers";
import type { FormDrawerConfig } from "@/components/Forms/FormDrawer/types";
import { cloneFormConfig, batchUpdateFieldOptions } from "@/lib/utils/formConfig";

export interface EmailFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Email>) => Promise<void>;
  initialData?: Partial<Email> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function EmailFormDrawer(props: EmailFormDrawerProps) {
  // Fetch dynamic options
  const { data: contactOptions = [], isLoading: loadingContacts } = useContactOptions();
  const { data: companyOptions = [], isLoading: loadingCompanies } = useCompanyOptions();
  const { data: dealOptions = [], isLoading: loadingDeals } = useDealOptions();
  const { data: leadOptions = [], isLoading: loadingLeads } = useLeadOptions();
  const { data: memberOptions = [], isLoading: loadingMembers } = useMemberOptions();

  // Build dynamic config with fetched options
  const dynamicConfig = useMemo<FormDrawerConfig>(() => {
    const config = cloneFormConfig(emailFormConfig);

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
      leadId: leadOptions.length > 0
        ? leadOptions
        : [{ value: "", label: loadingLeads ? "Loading..." : "No leads found" }],
      assignedTo: memberOptions.length > 0
        ? memberOptions
        : [{ value: "", label: loadingMembers ? "Loading..." : "No members found" }],
    });

    return config;
  }, [contactOptions, companyOptions, dealOptions, leadOptions, memberOptions, loadingContacts, loadingCompanies, loadingDeals, loadingLeads, loadingMembers]);

  return <FormDrawer<Email> {...props} config={dynamicConfig} />;
}
