"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { forecastFormConfig } from "@/components/Forms/configs";
import type { Forecast } from "@/lib/types";

export interface ForecastFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Forecast>) => Promise<void>;
  initialData?: Partial<Forecast> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function ForecastFormDrawer(props: ForecastFormDrawerProps) {
  return <FormDrawer<Forecast> {...props} config={forecastFormConfig} />;
}
