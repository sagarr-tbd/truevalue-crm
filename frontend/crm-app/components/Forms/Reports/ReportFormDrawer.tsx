"use client";
import { FormDrawer } from "@/components/Forms/FormDrawer";
import { reportFormConfig } from "@/components/Forms/configs/reportFormConfig";

export interface Report {
  id?: number;
  name: string;
  type: string;
  category: string;
  description?: string;
  frequency: string;
  status: "Active" | "Scheduled" | "Inactive";
  recipients?: string;
  scheduleEnabled?: boolean;
  nextRunDate?: string;
  assignedTo?: string;
  createdBy?: string;
  lastRun?: string;
  views?: number;
  created?: string;
}

export interface ReportFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Report>) => Promise<void>;
  initialData?: Partial<Report> | null;
  mode?: "add" | "edit";
  defaultView?: "quick" | "detailed";
}

export function ReportFormDrawer(props: ReportFormDrawerProps) {
  return <FormDrawer<Report> {...props} config={reportFormConfig} />;
}
