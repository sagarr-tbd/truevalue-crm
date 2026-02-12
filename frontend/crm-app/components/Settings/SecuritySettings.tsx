"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { securitySettingsSchema } from "@/lib/schemas";
import { z } from "zod";

export default function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const securityForm = useForm<z.infer<typeof securitySettingsSchema>>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSaveSecurity = securityForm.handleSubmit(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      securityForm.reset();
      showSuccessToast("Password updated successfully");
    } catch {
      showErrorToast("Failed to update password");
    }
  });

  return (
    <form onSubmit={handleSaveSecurity} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Password & Authentication
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Current Password
            </label>
            <input
              type="password"
              {...securityForm.register("currentPassword")}
              placeholder="Enter current password"
              className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                securityForm.formState.errors.currentPassword ? "border-destructive" : "border-border"
              }`}
            />
            {securityForm.formState.errors.currentPassword && (
              <p className="text-sm text-destructive mt-1">
                {securityForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              New Password
            </label>
            <input
              type="password"
              {...securityForm.register("newPassword")}
              placeholder="Enter new password"
              className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                securityForm.formState.errors.newPassword ? "border-destructive" : "border-border"
              }`}
            />
            {securityForm.formState.errors.newPassword && (
              <p className="text-sm text-destructive mt-1">
                {securityForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              {...securityForm.register("confirmPassword")}
              placeholder="Confirm new password"
              className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                securityForm.formState.errors.confirmPassword ? "border-destructive" : "border-border"
              }`}
            />
            {securityForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">
                {securityForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-teal to-primary text-white flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-foreground">Enable 2FA</div>
              <div className="text-sm text-muted-foreground">
                Add an extra layer of security
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              twoFactorEnabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                twoFactorEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h3>
        <div className="space-y-3">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Chrome on Windows</div>
                <div className="text-sm text-muted-foreground">
                  Current session • Last active: Now
                </div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                Active
              </span>
            </div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Safari on iPhone</div>
                <div className="text-sm text-muted-foreground">
                  Last active: 2 hours ago
                </div>
              </div>
              <Button type="button" variant="outline" size="sm">
                Revoke
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => securityForm.reset()}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={securityForm.formState.isSubmitting}
          className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
        >
          <Save className="h-4 w-4 mr-2" />
          {securityForm.formState.isSubmitting ? "Updating..." : "Update Security"}
        </Button>
      </div>
    </form>
  );
}
