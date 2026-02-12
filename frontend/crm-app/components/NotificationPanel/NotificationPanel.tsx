"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Bell,
  UserPlus,
  CheckCircle2,
  Calendar,
  Settings,
} from "lucide-react";
import type { NotificationPanelProps, Notification } from "./NotificationPanel.types";

const notifications: Notification[] = [
  {
    id: 1,
    type: "lead",
    icon: UserPlus,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "New Lead Added",
    message: (
      <>
        <span className="font-medium text-gray-900">Sarah Johnson</span> from
        Tech Startup Inc has been added to your leads.
      </>
    ),
    time: "2m ago",
    unread: true,
    actions: ["View Lead", "Dismiss"],
  },
  {
    id: 2,
    type: "deal",
    icon: CheckCircle2,
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    title: "Deal Closed Successfully",
    message: (
      <>
        Congratulations! Your deal with{" "}
        <span className="font-medium text-gray-900">Acme Corp</span> worth{" "}
        <span className="font-semibold text-primary">$25,000</span> has been
        closed.
      </>
    ),
    time: "1h ago",
    unread: true,
    actions: ["View Deal", "Dismiss"],
  },
  {
    id: 3,
    type: "meeting",
    icon: Calendar,
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    title: "Meeting Reminder",
    message: (
      <>
        Meeting with <span className="font-medium text-gray-900">John Smith</span>{" "}
        scheduled for today at{" "}
        <span className="font-medium text-gray-900">3:00 PM</span>.
      </>
    ),
    time: "3h ago",
    unread: true,
    actions: ["View Details", "Dismiss"],
  },
  {
    id: 4,
    type: "task",
    icon: CheckCircle2,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    title: "Task Completed",
    message: (
      <>
        You completed the task{" "}
        <span className="font-medium text-gray-700">
          &quot;Follow up with prospect&quot;
        </span>
        .
      </>
    ),
    time: "5h ago",
    unread: false,
    actions: [],
  },
  {
    id: 5,
    type: "system",
    icon: Settings,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    title: "System Update",
    message: (
      <>
        TruevalueCRM has been updated to version 2.1.0 with new features and
        improvements.
      </>
    ),
    time: "1d ago",
    unread: false,
    actions: [],
  },
];

export default function NotificationPanel({
  isOpen,
  onClose,
  onToggle,
  notificationCount = 3,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-gray-100"
        onClick={onToggle}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {notificationCount > 0 && (
          <span className="absolute top-0.5 right-0.5 px-1.5 py-0.5 bg-accent text-white text-[10px] font-bold rounded-full">
            {notificationCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              onClick={onClose}
            />

            {/* Notification Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-3 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-[100] max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    You have {unreadCount} unread message
                    {unreadCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  Mark all read
                </Button>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.map((notification, index) => {
                  const Icon = notification.icon;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * (index + 1) }}
                      className={`p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors relative ${
                        !notification.unread ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${notification.iconBg} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4
                              className={`text-sm ${
                                notification.unread
                                  ? "font-semibold text-gray-900"
                                  : "font-medium text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              {notification.time}
                            </span>
                          </div>
                          <p
                            className={`text-xs mb-2 ${
                              notification.unread
                                ? "text-gray-600"
                                : "text-gray-500"
                            }`}
                          >
                            {notification.message}
                          </p>
                          {notification.actions.length > 0 && (
                            <div className="flex gap-2">
                              {notification.actions.map((action) => (
                                <button
                                  key={action}
                                  className={`text-[11px] font-medium ${
                                    action === notification.actions[0]
                                      ? "text-primary hover:text-primary/80"
                                      : "text-gray-500 hover:text-gray-700"
                                  }`}
                                >
                                  {action}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {notification.unread && (
                          <span className="absolute top-4 right-4 w-2 h-2 bg-accent rounded-full"></span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 py-2 hover:bg-white rounded transition-colors">
                  View All Notifications
                </button>
              </div>

              {/* Arrow pointer */}
              <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
