"use client";

import { useMemo } from "react";
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useSubscription, useUsage } from "@/lib/queries/useBilling";
import type { UsageViewModel } from "@/lib/api/billing";

const SHELL_URL = process.env.NEXT_PUBLIC_SHELL_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function CardSkeleton() {
  return (
    <Card className="p-6 border border-border animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page — Read-only, billing managed on main shell
// ---------------------------------------------------------------------------
export default function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription("crm");
  const { data: usage, isLoading: usageLoading } = useUsage("crm");

  // Derived
  const currentPlanName = subscription?.planName || "No Plan";
  const nextBillingDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const daysUntilRenewal = subscription?.daysUntilRenewal ?? null;

  const statusLabel = subscription?.status
    ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
    : null;

  const statusColor = (() => {
    if (!subscription?.status) return "";
    switch (subscription.status) {
      case "active":
        return "bg-secondary/20 text-secondary";
      case "trialing":
        return "bg-blue-100 text-blue-700";
      case "past_due":
        return "bg-red-100 text-red-700";
      case "canceled":
        return "bg-gray-200 text-gray-600";
      default:
        return "bg-accent/20 text-accent";
    }
  })();

  // Usage: numeric limits only
  const usageLimits = useMemo(
    () => (usage || []).filter((u) => u.limitType === "numeric"),
    [usage]
  );

  // Boolean features
  const enabledFeatures = useMemo(
    () => (usage || []).filter((u) => u.limitType === "boolean"),
    [usage]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Billing & Subscription"
        icon={CreditCard}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle="View your current plan and usage"
        actions={
          <Button
            className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
            size="sm"
            onClick={() => window.open(`${SHELL_URL}/onboarding/products`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        }
      />

      {/* Top Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        {subLoading ? (
          <CardSkeleton />
        ) : (
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Current Plan</h3>
                <p className="text-sm text-muted-foreground">{subscription?.serviceName || "CRM"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-bold text-foreground">{currentPlanName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription?.planCode || "—"}
                </p>
              </div>
              {statusLabel && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                  {subscription?.isTrialing && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Trial
                    </span>
                  )}
                  {subscription?.cancelAtPeriodEnd && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Cancels at period end
                    </span>
                  )}
                </div>
              )}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Renews on {nextBillingDate}
                    {daysUntilRenewal !== null && ` (${daysUntilRenewal} days)`}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Usage Summary */}
        {usageLoading ? (
          <CardSkeleton />
        ) : (
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Usage</h3>
                <p className="text-sm text-muted-foreground">Current Period</p>
              </div>
            </div>
            <div className="space-y-3">
              {usageLimits.length > 0 ? (
                usageLimits.slice(0, 4).map((u) => <UsageBar key={u.featureCode} usage={u} />)
              ) : (
                <p className="text-sm text-muted-foreground">No usage data available</p>
              )}
            </div>
          </Card>
        )}

        {/* Plan Features (boolean) */}
        {usageLoading ? (
          <CardSkeleton />
        ) : (
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Features</h3>
                <p className="text-sm text-muted-foreground">{currentPlanName} Plan</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {enabledFeatures.length > 0 ? (
                enabledFeatures.map((f) => (
                  <div key={f.featureCode} className="flex items-center gap-2">
                    {f.enabled ? (
                      <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${f.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {f.featureName}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No feature data available</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Manage Billing CTA */}
      <Card className="p-6 border border-border">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Need to change your plan?</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade, downgrade, manage payment methods, and view invoices from the main dashboard.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="sm:w-auto w-full"
            onClick={() => window.open(`${SHELL_URL}/onboarding/products`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Billing Portal
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Usage Bar
// ---------------------------------------------------------------------------
function UsageBar({ usage }: { usage: UsageViewModel }) {
  const pct = usage.percentage ?? 0;
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-accent";
  const limitDisplay = usage.limit != null ? usage.limit.toLocaleString() : "∞";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{usage.featureName}</span>
        <span className="text-foreground font-medium">
          {usage.current.toLocaleString()} / {limitDisplay}
        </span>
      </div>
      {usage.limit != null && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`${barColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
