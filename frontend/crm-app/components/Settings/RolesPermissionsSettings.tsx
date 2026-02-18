"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Shield, Check, X, Loader2, ChevronRight, Save, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  usePermissions,
  useRoles,
  useRoleDetail,
  useSetRolePermissions,
} from "@/lib/queries/useRolesPermissions";
import type { PermissionItem, RoleItem } from "@/lib/api/permissions-api";
import { usePermission, ROLE_SUPER_ADMIN, ROLES_WRITE } from "@/lib/permissions";

// Group permissions by category + resource for a clear matrix layout
interface PermissionGroup {
  category: string;
  resource: string;
  label: string;
  permissions: PermissionItem[];
}

function groupPermissions(permissions: PermissionItem[]): PermissionGroup[] {
  const map = new Map<string, PermissionGroup>();

  for (const p of permissions) {
    const key = `${p.category}::${p.resource}`;
    if (!map.has(key)) {
      map.set(key, {
        category: p.category,
        resource: p.resource,
        label: capitalize(p.resource),
        permissions: [],
      });
    }
    map.get(key)!.permissions.push(p);
  }

  // Sort: platform first, then crm, then rest. Within each, sort by resource.
  const order: Record<string, number> = { platform: 0, crm: 1, analytics: 2, admin: 3 };
  return Array.from(map.values()).sort((a, b) => {
    const oa = order[a.category] ?? 99;
    const ob = order[b.category] ?? 99;
    if (oa !== ob) return oa - ob;
    return a.resource.localeCompare(b.resource);
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CATEGORY_LABELS: Record<string, string> = {
  platform: "Platform",
  crm: "CRM",
  analytics: "Analytics",
  admin: "Administration",
};

const ROLE_LEVEL_BADGE: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-600",
  org_admin: "bg-orange-500/10 text-orange-600",
  admin: "bg-orange-500/10 text-orange-600",
  owner: "bg-purple-500/10 text-purple-600",
  manager: "bg-blue-500/10 text-blue-600",
  member: "bg-green-500/10 text-green-600",
  viewer: "bg-gray-500/10 text-gray-600",
};

// Roles that should be hidden from the CRM Roles & Permissions UI
// super_admin: platform-level only, not relevant to org admins
// manager: exists in Permission Service but not in Org Service (can't be assigned)
const HIDDEN_ROLE_CODES = new Set(["super_admin"]);

export default function RolesPermissionsSettings() {
  const { roles: userRoles, can } = usePermission();
  const isSuperAdmin = userRoles.includes(ROLE_SUPER_ADMIN);
  const canEditRoles = can(ROLES_WRITE);

  // API data
  const { data: allPermissions = [], isLoading: loadingPerms } = usePermissions();
  const { data: allRoles = [], isLoading: loadingRoles } = useRoles();

  // Filter roles: hide super_admin unless user is super_admin
  const roles = useMemo(() => {
    return allRoles.filter((r) => {
      if (r.code === "super_admin") return isSuperAdmin;
      if (HIDDEN_ROLE_CODES.has(r.code)) return false;
      return true;
    });
  }, [allRoles, isSuperAdmin]);

  // Selected role
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const { data: roleDetail, isLoading: loadingDetail } = useRoleDetail(selectedRoleId);

  // Local state: set of permission codes currently toggled on
  const [localCodes, setLocalCodes] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  // Discard-changes confirmation
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  const setRolePermissionsMutation = useSetRolePermissions();

  // Sync local state when roleDetail loads
  useEffect(() => {
    if (roleDetail) {
      setLocalCodes(new Set(roleDetail.permissions));
      setDirty(false);
    }
  }, [roleDetail]);

  // Auto-select first role
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const groups = useMemo(() => groupPermissions(allPermissions), [allPermissions]);

  // Group the groups by category
  const categorizedGroups = useMemo(() => {
    const catMap = new Map<string, PermissionGroup[]>();
    for (const g of groups) {
      if (!catMap.has(g.category)) catMap.set(g.category, []);
      catMap.get(g.category)!.push(g);
    }
    return Array.from(catMap.entries());
  }, [groups]);

  const toggle = useCallback(
    (code: string) => {
      setLocalCodes((prev) => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        return next;
      });
      setDirty(true);
    },
    [],
  );

  const toggleAll = useCallback(
    (codes: string[], on: boolean) => {
      setLocalCodes((prev) => {
        const next = new Set(prev);
        for (const c of codes) {
          if (on) next.add(c);
          else next.delete(c);
        }
        return next;
      });
      setDirty(true);
    },
    [],
  );

  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      await setRolePermissionsMutation.mutateAsync({
        roleId: selectedRoleId,
        codes: Array.from(localCodes),
      });
      showSuccessToast("Permissions updated successfully");
      setDirty(false);
    } catch {
      showErrorToast("Failed to update permissions");
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isLocked = selectedRole?.code === "super_admin" || !canEditRoles;
  const isLoading = loadingPerms || loadingRoles;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading roles and permissions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Roles & Permissions</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select a role to view and edit its permissions
          </p>
        </div>
        {dirty && !isLocked && (
          <Button
            onClick={handleSave}
            disabled={setRolePermissionsMutation.isPending}
            className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
          >
            {setRolePermissionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role list */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Roles
          </p>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => {
                if (dirty) {
                  setPendingRoleId(role.id);
                  return;
                }
                setSelectedRoleId(role.id);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedRoleId === role.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-foreground hover:bg-muted border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Shield className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{role.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        ROLE_LEVEL_BADGE[role.code] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {role.role_type}
                    </span>
                  </div>
                </div>
              </div>
              {selectedRoleId === role.id && (
                <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="lg:col-span-3">
          {!selectedRoleId ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              Select a role to view its permissions
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Role info */}
              {selectedRole && (
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ROLE_LEVEL_BADGE[selectedRole.code]?.replace("text-", "bg-").split(" ")[0] ||
                      "bg-muted"
                    }`}
                  >
                    <Shield className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{selectedRole.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedRole.role_type === "system" ? "System role" : "Custom role"} &middot;
                      Level {selectedRole.level}
                      {roleDetail?.description && ` — ${roleDetail.description}`}
                    </p>
                  </div>
                  <div className="ml-auto text-sm text-muted-foreground">
                    {localCodes.size} / {allPermissions.length} permissions
                  </div>
                </div>
              )}

              {isLocked && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-sm">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {selectedRole?.code === "super_admin"
                      ? "Super Admin permissions cannot be edited."
                      : "You don't have permission to edit role permissions."}
                  </span>
                </div>
              )}

              {/* Permission groups by category */}
              {categorizedGroups.map(([category, categoryGroups]) => (
                <div key={category}>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {CATEGORY_LABELS[category] || capitalize(category)}
                  </h5>
                  <div className="space-y-3">
                    {categoryGroups.map((group) => {
                      const allCodes = group.permissions.map((p) => p.code);
                      const allOn = allCodes.every((c) => localCodes.has(c));
                      const someOn = allCodes.some((c) => localCodes.has(c));

                      return (
                        <Card key={`${group.category}::${group.resource}`} className="border border-border p-4">
                          {/* Resource header with toggle-all */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">
                                {group.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({allCodes.filter((c) => localCodes.has(c)).length}/
                                {allCodes.length})
                              </span>
                            </div>
                            {!isLocked && (
                              <button
                                onClick={() => toggleAll(allCodes, !allOn)}
                                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                                  allOn
                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                    : someOn
                                    ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                {allOn ? "Revoke All" : "Grant All"}
                              </button>
                            )}
                          </div>

                          {/* Individual permissions */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {group.permissions.map((perm) => {
                              const isOn = localCodes.has(perm.code);
                              return (
                                <button
                                  key={perm.code}
                                  onClick={() => !isLocked && toggle(perm.code)}
                                  disabled={isLocked}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
                                    isOn
                                      ? "bg-primary/10 border-primary/30 text-primary"
                                      : "bg-background border-border text-muted-foreground hover:border-muted-foreground/30"
                                  } ${isLocked ? "cursor-default opacity-75" : ""}`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                      isOn
                                        ? "bg-primary text-white"
                                        : "border border-muted-foreground/30"
                                    }`}
                                  >
                                    {isOn && <Check className="h-3 w-3" />}
                                  </div>
                                  <span className="truncate">{capitalize(perm.action)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discard unsaved changes confirmation */}
      <ConfirmationModal
        isOpen={!!pendingRoleId}
        onClose={() => setPendingRoleId(null)}
        onConfirm={() => {
          if (pendingRoleId) {
            setSelectedRoleId(pendingRoleId);
            setDirty(false);
          }
          setPendingRoleId(null);
        }}
        title="Unsaved Changes"
        description="You have unsaved permission changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        icon={AlertTriangle}
        iconBg="bg-yellow-100 dark:bg-yellow-900/20"
        iconColor="text-yellow-600 dark:text-yellow-500"
        confirmClassName="bg-yellow-600 hover:bg-yellow-700 text-white"
      />
    </div>
  );
}
