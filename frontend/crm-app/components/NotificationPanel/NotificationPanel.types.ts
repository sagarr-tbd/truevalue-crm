export interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  notificationCount?: number;
}

export interface Notification {
  id: number;
  type: "lead" | "deal" | "meeting" | "task" | "system";
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  message: React.ReactNode;
  time: string;
  unread: boolean;
  actions: string[];
}
