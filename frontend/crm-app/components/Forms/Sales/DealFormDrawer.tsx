"use client";
import { useMemo, useState, useEffect } from "react";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { dealFormConfig } from "@/components/Forms/configs";
import type { Deal } from "@/lib/types";
import { usePipelines, useDefaultPipeline, usePipeline } from "@/lib/queries/usePipelines";
import { useCompanyOptions } from "@/lib/queries/useCompanies";
import { useContactOptions } from "@/lib/queries/useContacts";
import { useMemberOptions } from "@/lib/queries/useMembers";
import { useTagOptions } from "@/lib/queries/useTags";
import { useAuth } from "@/contexts/AuthContext";
import type { FormDrawerConfig } from "@/components/Forms/FormDrawer/types";
import { cloneFormConfig, batchUpdateFieldOptions, updateField } from "@/lib/utils/formConfig";

export interface DealFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Deal>) => Promise<void>;
  initialData?: Partial<Deal> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

/**
 * DealFormDrawer with dynamic options
 * Fetches pipelines, stages, companies, contacts, members, and tags from the API
 */
export function DealFormDrawer(props: DealFormDrawerProps) {
  const { user } = useAuth();
  
  // Track selected pipeline for stage options
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");

  // Fetch dynamic options
  const { data: pipelines = [], isLoading: loadingPipelines } = usePipelines();
  const { data: defaultPipeline, isLoading: loadingDefaultPipeline } = useDefaultPipeline();
  // Fetch selected pipeline details (with stages) when a non-default pipeline is selected
  const { data: selectedPipelineDetails } = usePipeline(
    selectedPipelineId && selectedPipelineId !== defaultPipeline?.id ? selectedPipelineId : ""
  );
  const { data: companyOptions = [], isLoading: loadingCompanies } = useCompanyOptions();
  const { data: contactOptions = [], isLoading: loadingContacts } = useContactOptions();
  const { data: memberOptions = [], isLoading: loadingMembers } = useMemberOptions();
  const { data: tagOptions = [], isLoading: loadingTags } = useTagOptions("deal");

  // Convert pipelines to options
  const pipelineOptions = useMemo(() => {
    if (pipelines.length > 0) {
      return pipelines.map((p) => ({
        value: p.id,
        label: p.name,
      }));
    }
    return loadingPipelines ? [{ value: "", label: "Loading pipelines..." }] : [];
  }, [pipelines, loadingPipelines]);

  // Get stages for the selected pipeline
  const stageOptions = useMemo(() => {
    // Determine which pipeline to use for stages
    const targetPipelineId = selectedPipelineId || defaultPipeline?.id;
    
    if (!targetPipelineId) {
      return loadingDefaultPipeline ? [{ value: "", label: "Loading stages..." }] : [];
    }

    // If using default pipeline, get stages from defaultPipeline (which has full details)
    if (targetPipelineId === defaultPipeline?.id && defaultPipeline?.stages?.length > 0) {
      return defaultPipeline.stages.map((stage) => ({
        value: stage.id,
        label: stage.name,
      }));
    }

    // If a different pipeline is selected, get stages from selectedPipelineDetails
    const stages = selectedPipelineDetails?.stages;
    if (stages && stages.length > 0) {
      return stages.map((stage) => ({
        value: stage.id,
        label: stage.name,
      }));
    }

    // Fallback - still loading or no stages
    if (loadingDefaultPipeline) {
      return [{ value: "", label: "Loading stages..." }];
    }

    return [{ value: "", label: "No stages available" }];
  }, [selectedPipelineId, defaultPipeline, selectedPipelineDetails, loadingDefaultPipeline]);

  // Update selected pipeline when data changes (for stage dependency)
  useEffect(() => {
    if (props.mode === "edit" && props.initialData?.pipelineId) {
      setSelectedPipelineId(props.initialData.pipelineId);
    } else if (defaultPipeline?.id) {
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [props.mode, props.initialData?.pipelineId, defaultPipeline?.id]);

  // Set default pipeline and owner when creating new deal
  const initialDataWithDefaults = useMemo((): Partial<Deal> => {
    if (props.mode === "edit" && props.initialData) {
      // Edit mode: use provided data as-is
      return props.initialData;
    }
    
    // Add mode: set defaults
    const defaults: Partial<Deal> = {
      ownerId: user?.id || "",
      currency: "INR",
      ...props.initialData,
    };

    // Set default pipeline if available
    if (defaultPipeline && !defaults.pipelineId) {
      defaults.pipelineId = defaultPipeline.id;
      
      // Set first stage as default
      if (defaultPipeline.stages && defaultPipeline.stages.length > 0 && !defaults.stageId) {
        defaults.stageId = defaultPipeline.stages[0].id;
      }
    }

    return defaults;
  }, [props.mode, props.initialData, user?.id, defaultPipeline]);

  // Build dynamic config with fetched options
  const dynamicConfig = useMemo<FormDrawerConfig>(() => {
    // Clone the config properly (preserves React elements and schema)
    const config = cloneFormConfig(dealFormConfig);
    
    // Batch update field options
    batchUpdateFieldOptions(config, {
      pipelineId: pipelineOptions.length > 0
        ? pipelineOptions
        : (loadingPipelines ? [{ value: "", label: "Loading..." }] : []),
      stageId: stageOptions.length > 0
        ? stageOptions
        : [{ value: "", label: "Select a pipeline first" }],
      companyId: companyOptions.length > 0
        ? companyOptions
        : (loadingCompanies ? [{ value: "", label: "Loading..." }] : []),
      contactId: contactOptions.length > 0
        ? contactOptions
        : (loadingContacts ? [{ value: "", label: "Loading..." }] : []),
      ownerId: memberOptions.length > 0
        ? memberOptions
        : (loadingMembers ? [{ value: "", label: "Loading..." }] : []),
      tagIds: tagOptions.length > 0 ? tagOptions : (loadingTags ? [] : []),
    });

    // Add pipeline onChange handler for stage options
    updateField(config, "pipelineId", {
      onChange: (value: string) => setSelectedPipelineId(value),
    });

    return config;
  }, [
    pipelineOptions,
    stageOptions,
    companyOptions,
    contactOptions,
    memberOptions,
    tagOptions,
    loadingPipelines,
    loadingCompanies,
    loadingContacts,
    loadingMembers,
    loadingTags,
  ]);

  return (
    <FormDrawer<Deal>
      {...props}
      initialData={initialDataWithDefaults}
      config={dynamicConfig}
    />
  );
}
