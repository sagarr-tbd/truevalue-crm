export type ViewMode = "list" | "grid" | "kanban";

export interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
  showLabels?: boolean;
}
