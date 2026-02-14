"use client";
import { useMemo } from "react";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { accountFormConfig } from "@/components/Forms/configs";
import type { Account } from "@/lib/types";
import { useCompanyTagOptions } from "@/lib/queries/useTags";
import type { FormDrawerConfig } from "@/components/Forms/FormDrawer/types";
import { cloneFormConfig, batchUpdateFieldOptions } from "@/lib/utils/formConfig";

export interface AccountFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Account>) => Promise<void>;
  initialData?: Partial<Account> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

/**
 * AccountFormDrawer with dynamic tag options
 * Fetches company/account tags from the API
 */
export function AccountFormDrawer(props: AccountFormDrawerProps) {
  // Fetch dynamic tag options
  const { data: tagOptions = [], isLoading: loadingTags } = useCompanyTagOptions();

  // Build dynamic config with fetched options
  const dynamicConfig = useMemo<FormDrawerConfig>(() => {
    // Clone the config properly (preserves React elements and schema)
    const config = cloneFormConfig(accountFormConfig);
    
    // Update tagIds field with dynamic options
    batchUpdateFieldOptions(config, {
      tagIds: tagOptions.length > 0 ? tagOptions : (loadingTags ? [] : []),
    });

    return config;
  }, [tagOptions, loadingTags]);

  return (
    <FormDrawer<Account>
      {...props}
      config={dynamicConfig}
    />
  );
}
