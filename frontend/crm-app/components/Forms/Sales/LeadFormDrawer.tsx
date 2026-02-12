"use client";
import { useMemo } from "react";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { leadFormConfig } from "@/components/Forms/configs";
import type { Lead, LeadStatus } from "@/lib/types";
import { useLeadSources } from "@/lib/queries/useLeads";
import { useTagOptions } from "@/lib/queries/useTags";
import { useMemberOptions } from "@/lib/queries/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import type { FormDrawerConfig, FormSection, FormFieldConfig } from "@/components/Forms/FormDrawer/types";

export interface LeadFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Lead>) => Promise<void>;
  initialData?: Partial<Lead> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

/**
 * Backend status options (matching Lead.Status enum)
 */
const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
];

/**
 * Default source options (fallback if API returns empty)
 */
const DEFAULT_SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "trade_show", label: "Trade Show" },
  { value: "cold_call", label: "Cold Call" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "social_media", label: "Social Media" },
  { value: "advertisement", label: "Advertisement" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

/**
 * LeadFormDrawer with dynamic options
 * Fetches sources, tags, and team members from the API
 */
export function LeadFormDrawer(props: LeadFormDrawerProps) {
  const { user } = useAuth();

  // Fetch dynamic options
  const { data: sources = [], isLoading: loadingSources } = useLeadSources();
  const { data: tagOptions = [], isLoading: loadingTags } = useTagOptions("lead");
  const { data: memberOptions = [], isLoading: loadingMembers } = useMemberOptions();

  // Convert sources array to options format
  const sourceOptions = useMemo(() => {
    if (sources.length > 0) {
      return sources.map((source: string) => ({
        value: source,
        label: source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      }));
    }
    return DEFAULT_SOURCE_OPTIONS;
  }, [sources]);

  // Set default owner to current user when creating new lead
  const initialDataWithDefaults = useMemo((): Partial<Lead> => {
    if (props.mode === "edit" && props.initialData) {
      // Edit mode: use provided data as-is
      return props.initialData;
    }
    // Add mode: set current user as default owner and default status
    return {
      ownerId: user?.id || "",
      status: "new" as LeadStatus, // Default status for new leads
      ...props.initialData,
    };
  }, [props.mode, props.initialData, user?.id]);

  // Build dynamic config with fetched options
  const dynamicConfig = useMemo<FormDrawerConfig>(() => {
    // Deep clone the base config
    const config: FormDrawerConfig = JSON.parse(JSON.stringify(leadFormConfig));

    // Re-add icons (they can't be cloned via JSON)
    config.entityIcon = leadFormConfig.entityIcon;
    config.schema = leadFormConfig.schema;

    // Update detailed sections with dynamic options
    config.detailedSections = config.detailedSections.map((section: FormSection) => {
      // Re-add section icon
      const originalSection = leadFormConfig.detailedSections.find(
        (s: FormSection) => s.id === section.id
      );
      if (originalSection) {
        section.icon = originalSection.icon;
      }

      // Update fields with dynamic options
      section.fields = section.fields.map((field: FormFieldConfig) => {
        // Re-add field icon
        const originalField = originalSection?.fields.find(
          (f: FormFieldConfig) => f.name === field.name
        );
        if (originalField?.icon) {
          field.icon = originalField.icon;
        }

        // Inject dynamic options based on field name
        switch (field.name) {
          case "source":
            field.options = sourceOptions.length > 0
              ? sourceOptions
              : (loadingSources ? [{ value: "", label: "Loading..." }] : DEFAULT_SOURCE_OPTIONS);
            break;
          case "ownerId":
            field.options = memberOptions.length > 0
              ? memberOptions
              : [{ value: "", label: loadingMembers ? "Loading..." : "No members found" }];
            break;
          case "status":
            field.options = STATUS_OPTIONS;
            break;
          case "tagIds":
            field.options = tagOptions.length > 0
              ? tagOptions
              : (loadingTags ? [] : []);
            break;
        }

        return field;
      });

      return section;
    });

    // Update quick form sections icons
    if (config.quickFormSections) {
      config.quickFormSections = config.quickFormSections.map((section, index: number) => {
        const originalSection = leadFormConfig.quickFormSections?.[index];
        if (originalSection) {
          section.icon = originalSection.icon;
        }
        return section;
      });
    }

    return config;
  }, [sourceOptions, tagOptions, memberOptions, loadingSources, loadingTags, loadingMembers]);

  return (
    <FormDrawer<Lead>
      {...props}
      initialData={initialDataWithDefaults}
      config={dynamicConfig}
    />
  );
}
