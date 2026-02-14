import { apiClient } from './client';

// =============================================================================
// TYPES (actual backend response shapes)
// =============================================================================

/** GET /billing/api/v1/services/:code/subscription */
export interface BillingSubscriptionResponse {
  has_subscription: boolean;
  subscription_id: string;
  service_code: string;
  service_name: string;
  plan_code: string;
  plan_name: string;
  status: string;
  is_active: boolean;
  is_trialing: boolean;
  current_period_end: string;
  cancel_at_period_end: boolean;
  days_until_renewal: number;
  scheduled_plan: string | null;
}

/** Each limit entry inside GET /billing/api/v1/services/:code/usage → limits */
export interface BillingUsageLimitNumeric {
  name: string;
  type: 'numeric';
  limit: number;
  current: number;
  remaining: number;
  percentage: number;
  unit: string;
  overage_enabled: boolean;
}

export interface BillingUsageLimitBoolean {
  name: string;
  type: 'boolean';
  enabled: boolean;
}

export type BillingUsageLimit = BillingUsageLimitNumeric | BillingUsageLimitBoolean;

/** GET /billing/api/v1/services/:code/usage */
export interface BillingUsageResponse {
  service: string;
  plan: string;
  plan_name: string;
  limits: Record<string, BillingUsageLimit>;
}

// =============================================================================
// VIEW MODELS (camelCase for frontend)
// =============================================================================

export interface SubscriptionViewModel {
  id: string;
  serviceName: string;
  serviceCode: string;
  planName: string;
  planCode: string;
  status: string;
  isActive: boolean;
  isTrialing: boolean;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  daysUntilRenewal: number;
  scheduledPlan: string | null;
}

export interface UsageViewModel {
  featureCode: string;
  featureName: string;
  limitType: 'numeric' | 'boolean';
  // Numeric fields
  current: number;
  limit: number | null;
  percentage: number | null;
  remaining: number | null;
  unit: string | null;
  // Boolean fields
  enabled: boolean | null;
}

// =============================================================================
// BILLING API (read-only from CRM — management lives on main shell)
// =============================================================================

const BILLING_BASE = '/billing/api/v1';

export const billingApi = {
  /**
   * Get current CRM subscription (read-only)
   */
  getSubscription: async (serviceCode: string): Promise<SubscriptionViewModel | null> => {
    const response = await apiClient.get<BillingSubscriptionResponse>(
      `${BILLING_BASE}/services/${serviceCode}/subscription`
    );
    if (response.error) {
      if (response.status === 404) return null;
      throw new Error(response.error.message);
    }
    const sub = response.data!;
    if (!sub.has_subscription) return null;
    return mapSubscription(sub);
  },

  /**
   * Get usage for a service (read-only)
   */
  getUsage: async (serviceCode: string): Promise<UsageViewModel[]> => {
    const response = await apiClient.get<BillingUsageResponse>(
      `${BILLING_BASE}/services/${serviceCode}/usage`
    );
    if (response.error) throw new Error(response.error.message);
    return mapUsage(response.data!);
  },
};

// =============================================================================
// MAPPERS
// =============================================================================

function mapSubscription(sub: BillingSubscriptionResponse): SubscriptionViewModel {
  return {
    id: sub.subscription_id,
    serviceName: sub.service_name,
    serviceCode: sub.service_code,
    planName: sub.plan_name,
    planCode: sub.plan_code,
    status: sub.status,
    isActive: sub.is_active,
    isTrialing: sub.is_trialing,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    daysUntilRenewal: sub.days_until_renewal,
    scheduledPlan: sub.scheduled_plan,
  };
}

function mapUsage(data: BillingUsageResponse): UsageViewModel[] {
  return Object.entries(data.limits).map(([code, limit]) => {
    if (limit.type === 'numeric') {
      return {
        featureCode: code,
        featureName: limit.name,
        limitType: 'numeric' as const,
        current: limit.current,
        limit: limit.limit,
        percentage: limit.percentage,
        remaining: limit.remaining,
        unit: limit.unit,
        enabled: null,
      };
    }
    // boolean
    return {
      featureCode: code,
      featureName: limit.name,
      limitType: 'boolean' as const,
      current: 0,
      limit: null,
      percentage: null,
      remaining: null,
      unit: null,
      enabled: limit.enabled,
    };
  });
}
