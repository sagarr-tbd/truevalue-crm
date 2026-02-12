import { LucideIcon } from "lucide-react";

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  divider?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  triggerIcon?: LucideIcon;
  triggerLabel?: string;
  align?: "start" | "end" | "center";
  className?: string;
}
