"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { campaignFormConfig } from "@/components/Forms/configs";
import type { Campaign } from "@/lib/types";

export interface CampaignFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Campaign>) => Promise<void>;
  initialData?: Partial<Campaign> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function CampaignFormDrawer(props: CampaignFormDrawerProps) {
  return <FormDrawer<Campaign> {...props} config={campaignFormConfig} />;
}
