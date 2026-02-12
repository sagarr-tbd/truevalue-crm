"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DataManagementSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Export</h3>
        <div className="p-4 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">
            Export all your CRM data in a standard format for backup or migration.
          </p>
          <Button className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90">
            <Download className="h-4 w-4 mr-2" />
            Request Data Export
          </Button>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Storage Usage</h3>
        <div className="p-4 border border-border rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Storage used</span>
              <span className="text-sm font-medium text-foreground">4.2 GB / 50 GB</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-brand-teal to-brand-purple h-2 rounded-full"
                style={{ width: "8.4%" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">1.8 GB</div>
                <div className="text-xs text-muted-foreground">Contacts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">1.2 GB</div>
                <div className="text-xs text-muted-foreground">Files</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">1.2 GB</div>
                <div className="text-xs text-muted-foreground">Other</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Retention</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Auto-delete inactive records after
            </label>
            <select 
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              defaultValue="1 year"
            >
              <option>Never</option>
              <option>6 months</option>
              <option>1 year</option>
              <option>2 years</option>
              <option>5 years</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border bg-destructive/10 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete all your data. This action cannot be undone.
        </p>
        <Button variant="destructive">Delete All Data</Button>
      </div>
    </div>
  );
}
