import { useQuery } from "@tanstack/react-query";
import {
  billingApi,
  SubscriptionViewModel,
  UsageViewModel,
} from "../api/billing";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const billingKeys = {
  all: ["billing"] as const,
  subscription: (serviceCode: string) => [...billingKeys.all, "subscription", serviceCode] as const,
  usage: (serviceCode: string) => [...billingKeys.all, "usage", serviceCode] as const,
};

// =============================================================================
// READ-ONLY HOOKS (billing is managed on the main shell)
// =============================================================================

/**
 * Fetch CRM subscription for current org (read-only)
 */
export function useSubscription(serviceCode: string = "crm") {
  return useQuery<SubscriptionViewModel | null>({
    queryKey: billingKeys.subscription(serviceCode),
    queryFn: () => billingApi.getSubscription(serviceCode),
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

/**
 * Fetch usage for a service (read-only)
 */
export function useUsage(serviceCode: string = "crm") {
  return useQuery<UsageViewModel[]>({
    queryKey: billingKeys.usage(serviceCode),
    queryFn: () => billingApi.getUsage(serviceCode),
    staleTime: 60 * 1000, // 1 min
  });
}
