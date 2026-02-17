"use client";

import { type ReactNode } from "react";
import { usePermission } from "@/lib/permissions";

interface PermissionGateProps {
  /** Permission code to check (e.g. 'contacts:write'). */
  permission: string;
  /** Content to show when the user HAS the permission. */
  children: ReactNode;
  /** Optional fallback when the user does NOT have the permission. */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on the current user's permissions.
 *
 * Usage:
 *   <PermissionGate permission={CONTACTS_WRITE}>
 *     <Button>+ New Contact</Button>
 *   </PermissionGate>
 */
export default function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = usePermission();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
