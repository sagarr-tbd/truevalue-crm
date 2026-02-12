"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Bell, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { notificationSettingsSchema } from "@/lib/schemas";
import { z } from "zod";

export default function NotificationsSettings() {
  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      emailFrequency: "Daily Digest",
    },
  });

  const emailNotif = notificationForm.watch("emailNotifications");
  const pushNotif = notificationForm.watch("pushNotifications");

  const handleSaveNotifications = notificationForm.handleSubmit(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccessToast("Notification preferences saved");
    } catch {
      showErrorToast("Failed to save notification preferences");
    }
  });

  return (
    <form onSubmit={handleSaveNotifications} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-foreground">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive updates via email
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => notificationForm.setValue("emailNotifications", !emailNotif)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotif ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotif ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-brand-purple text-white flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-foreground">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive browser notifications
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => notificationForm.setValue("pushNotifications", !pushNotif)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                pushNotif ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pushNotif ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Email Frequency</h3>
        <div className="space-y-3">
          {["Real-time", "Daily Digest", "Weekly Summary", "Never"].map((option) => (
            <label key={option} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                {...notificationForm.register("emailFrequency")}
                value={option}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit" className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90">
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
