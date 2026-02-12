"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { integrationSettingsSchema } from "@/lib/schemas";
import { z } from "zod";

export default function IntegrationsSettings() {
  const [showApiKey, setShowApiKey] = useState(false);

  const integrationForm = useForm<z.infer<typeof integrationSettingsSchema>>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: {
      webhookUrl: "",
    },
  });

  const handleSaveIntegrations = integrationForm.handleSubmit(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccessToast("Integration settings saved");
    } catch {
      showErrorToast("Failed to save integration settings");
    }
  });

  return (
    <form onSubmit={handleSaveIntegrations} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">API Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? "text" : "password"}
                defaultValue=""
                placeholder="Configure in environment"
                disabled
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep your API key secure. Do not share it publicly.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              {...integrationForm.register("webhookUrl")}
              placeholder="https://your-domain.com/webhook"
              className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                integrationForm.formState.errors.webhookUrl ? "border-destructive" : "border-border"
              }`}
            />
            {integrationForm.formState.errors.webhookUrl && (
              <p className="text-sm text-destructive mt-1">
                {integrationForm.formState.errors.webhookUrl.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">API Usage</h3>
        <div className="p-4 border border-border rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Requests this month</span>
              <span className="text-sm font-medium text-foreground">1,234 / 10,000</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-brand-teal to-brand-purple h-2 rounded-full"
                style={{ width: "12.34%" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Resets on Feb 1, 2026</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">View Documentation</Button>
        <Button type="submit" className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </form>
  );
}
