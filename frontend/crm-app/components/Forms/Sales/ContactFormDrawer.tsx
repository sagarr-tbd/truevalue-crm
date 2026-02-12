"use client";
import { useMemo } from "react";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { contactFormConfig } from "@/components/Forms/configs";
import type { Contact } from "@/lib/types";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useContactTagOptions } from "@/lib/queries/useTags";
import { useMemberOptions } from "@/lib/queries/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import type { FormDrawerConfig } from "@/components/Forms/FormDrawer/types";

export interface ContactFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Contact>) => Promise<void>;
  initialData?: Partial<Contact> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

/**
 * Backend status options (matching Contact.Status enum)
 */
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "bounced", label: "Bounced" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "archived", label: "Archived" },
];

/**
 * ContactFormDrawer with dynamic options
 * Fetches companies and tags from the API
 */
export function ContactFormDrawer(props: ContactFormDrawerProps) {
  const { user } = useAuth();
  
  // Fetch dynamic options
  const { data: companyOptions = [], isLoading: loadingCompanies } = useCompanyOptions();
  const { data: tagOptions = [], isLoading: loadingTags } = useContactTagOptions();
  const { data: memberOptions = [], isLoading: loadingMembers } = useMemberOptions();

  // Set default owner to current user when creating new contact
  const initialDataWithDefaults = useMemo(() => {
    if (props.mode === "edit" && props.initialData) {
      // Edit mode: use provided data as-is
      return props.initialData;
    }
    // Add mode: set current user as default owner
    return {
      ownerId: user?.id || "",
      status: "active", // Default status
      ...props.initialData,
    };
  }, [props.mode, props.initialData, user?.id]);

  // Build dynamic config with fetched options
  const dynamicConfig = useMemo<FormDrawerConfig>(() => {
    // Deep clone the base config
    const config = JSON.parse(JSON.stringify(contactFormConfig));
    
    // Re-add icons (they can't be cloned via JSON)
    config.entityIcon = contactFormConfig.entityIcon;
    config.schema = contactFormConfig.schema;
    
    // Update detailed sections with dynamic options
    config.detailedSections = config.detailedSections.map((section: any) => {
      // Re-add section icon
      const originalSection = contactFormConfig.detailedSections.find(
        (s: any) => s.id === section.id
      );
      if (originalSection) {
        section.icon = originalSection.icon;
      }

      // Update fields with dynamic options
      section.fields = section.fields.map((field: any) => {
        // Re-add field icon
        const originalField = originalSection?.fields.find(
          (f: any) => f.name === field.name
        );
        if (originalField?.icon) {
          field.icon = originalField.icon;
        }

        // Inject dynamic options based on field name
        switch (field.name) {
          case "primaryCompanyId":
            field.options = companyOptions.length > 0 
              ? companyOptions 
              : [{ value: "", label: loadingCompanies ? "Loading..." : "No companies found" }];
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
      config.quickFormSections = config.quickFormSections.map((section: any, index: number) => {
        const originalSection = contactFormConfig.quickFormSections?.[index];
        if (originalSection) {
          section.icon = originalSection.icon;
        }
        return section;
      });
    }

    return config;
  }, [companyOptions, tagOptions, memberOptions, loadingCompanies, loadingTags, loadingMembers]);

  return (
    <FormDrawer<Contact>
      {...props}
      initialData={initialDataWithDefaults}
      config={dynamicConfig}
    />
  );
}
