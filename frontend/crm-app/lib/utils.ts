import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert camelCase operator to snake_case for API
 * Used for advanced filters in list pages
 */
export const toSnakeCaseOperator = (op: string): string => {
  const operatorMap: Record<string, string> = {
    'equals': 'equals',
    'notEquals': 'not_equals',
    'contains': 'contains',
    'notContains': 'not_contains',
    'startsWith': 'starts_with',
    'endsWith': 'ends_with',
    'isEmpty': 'is_empty',
    'isNotEmpty': 'is_not_empty',
    'greaterThan': 'greater_than',
    'lessThan': 'less_than',
    'greaterThanOrEqual': 'greater_than_or_equal',
    'lessThanOrEqual': 'less_than_or_equal',
  };
  return operatorMap[op] || op;
};

/**
 * Status color mapping for badges
 * Returns Tailwind CSS classes for status badges
 */
export type StatusColorType = 'contact' | 'lead' | 'deal' | 'generic';

const STATUS_COLORS: Record<StatusColorType, Record<string, string>> = {
  contact: {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    bounced: "bg-red-100 text-red-700",
    unsubscribed: "bg-yellow-100 text-yellow-700",
    archived: "bg-purple-100 text-purple-700",
  },
  lead: {
    new: "bg-secondary/10 text-secondary",
    contacted: "bg-accent/10 text-accent",
    qualified: "bg-primary/10 text-primary",
    unqualified: "bg-muted text-muted-foreground",
    converted: "bg-green-100 text-green-700",
  },
  deal: {
    open: "bg-blue-100 text-blue-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
  },
  generic: {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  },
};

export const getStatusColor = (
  status: string,
  type: StatusColorType = 'generic'
): string => {
  const normalizedStatus = status?.toLowerCase() || '';
  const colors = STATUS_COLORS[type];
  return colors[normalizedStatus] || "bg-muted text-muted-foreground";
};

// =============================================================================
// FORMAT UTILITIES
// =============================================================================

/**
 * Format a number as currency
 * @param value - The numeric value to format
 * @param currency - Currency code (default: 'USD')
 * @param compact - Use compact notation for large numbers (e.g., $1.2M)
 */
export const formatCurrency = (
  value: number | undefined | null,
  currency: string = 'USD',
  compact: boolean = false
): string => {
  if (value === undefined || value === null) return '$0';
  
  if (compact) {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a date string for display
 * @param dateString - ISO date string or Date
 * @param options - Intl.DateTimeFormat options
 */
export const formatDate = (
  dateString: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(date);
};

/**
 * Format a date with time
 * @param dateString - ISO date string or Date
 */
export const formatDateTime = (
  dateString: string | Date | undefined | null
): string => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Calculate days since a date
 * @param dateString - ISO date string or Date
 */
export const daysSince = (
  dateString: string | Date | undefined | null
): number => {
  if (!dateString) return 0;
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return 0;
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get initials from a name
 * @param name - Full name
 * @param fallback - Fallback if name is empty
 */
export const getInitials = (
  name: string | undefined | null,
  fallback: string = '??'
): string => {
  if (!name) return fallback;
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Format a number with locale-specific formatting
 * @param value - The number to format
 * @param decimals - Number of decimal places
 */
export const formatNumber = (
  value: number | undefined | null,
  decimals: number = 0
): string => {
  if (value === undefined || value === null) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a percentage
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places
 */
export const formatPercent = (
  value: number | undefined | null,
  decimals: number = 0
): string => {
  if (value === undefined || value === null) return '0%';
  return `${formatNumber(value, decimals)}%`;
};

// =============================================================================
// SCORE COLOR UTILITIES
// =============================================================================

/**
 * Get color classes for a score value
 * @param score - Score value (0-100)
 */
export const getScoreColor = (score: number | undefined | null): string => {
  if (!score) return "bg-muted text-muted-foreground";
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

/**
 * Get background color class for a score value
 * @param score - Score value (0-100)
 */
export const getScoreBgColor = (score: number | undefined | null): string => {
  if (!score) return "bg-muted";
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};
