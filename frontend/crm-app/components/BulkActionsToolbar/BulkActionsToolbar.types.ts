export interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onUpdateStatus?: () => void;
  statusLabel?: string; // Custom label for status button (defaults to "Status")
  onUpdateOwner?: () => void;
  onUpdateTags?: () => void;
  customActions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: "default" | "danger" | "success";
  }>;
  className?: string;
  isProcessing?: boolean;
}
