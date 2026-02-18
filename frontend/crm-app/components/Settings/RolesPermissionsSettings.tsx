"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Shield, Check, X, Loader2, ChevronRight, Save, Info, AlertTriangle, Search, Filter } from "lucide-react";
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
import type { PermissionItem } from "@/lib/api/permissions-api";
import { usePermission, ROLE_SUPER_ADMIN, ROLES_WRITE } from "@/lib/permissions";

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
  super_admin: "bg-red-500/10 text-red-600 border-red-500/20",
  org_admin: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  admin: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  owner: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  member: "bg-green-500/10 text-green-600 border-green-500/20",
  viewer: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const HIDDEN_ROLE_CODES = new Set(["super_admin"]);

export default function RolesPermissionsSettings() {
  const { roles: userRoles, can } = usePermission();
  const isSuperAdmin = userRoles.includes(ROLE_SUPER_ADMIN);
  const canEditRoles = can(ROLES_WRITE);

  const { data: allPermissions = [], isLoading: loadingPerms } = usePermissions();
  const { data: allRoles = [], isLoading: loadingRoles } = useRoles();

  const roles = useMemo(() => {
    return allRoles.filter((r) => {
      if (r.code === "super_admin") return isSuperAdmin;
      if (HIDDEN_ROLE_CODES.has(r.code)) return false;
      return true;
    });
  }, [allRoles, isSuperAdmin]);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const { data: roleDetail, isLoading: loadingDetail } = useRoleDetail(selectedRoleId);

  const [localCodes, setLocalCodes] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [permSearch, setPermSearch] = useState("");
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  const setRolePermissionsMutation = useSetRolePermissions();

  useEffect(() => {
    if (roleDetail) {
      setLocalCodes(new Set(roleDetail.permissions));
      setDirty(false);
    }
  }, [roleDetail]);

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const groups = useMemo(() => groupPermissions(allPermissions), [allPermissions]);

  const categorizedGroups = useMemo(() => {
    const catMap = new Map<string, PermissionGroup[]>();
    for (const g of groups) {
      if (!catMap.has(g.category)) catMap.set(g.category, []);
      catMap.get(g.category)!.push(g);
    }
    return Array.from(catMap.entries());
  }, [groups]);

  const filteredCategorizedGroups = useMemo(() => {
    if (!permSearch.trim()) return categorizedGroups;
    const q = permSearch.toLowerCase();
    const result: [string, PermissionGroup[]][] = [];
    for (const [category, catGroups] of categorizedGroups) {
      const filtered = catGroups
        .map((g) => ({
          ...g,
          permissions: g.permissions.filter(
            (p) =>
              p.action.toLowerCase().includes(q) ||
              p.resource.toLowerCase().includes(q) ||
              p.code.toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.permissions.length > 0);
      if (filtered.length > 0) result.push([category, filtered]);
    }
    return result;
  }, [categorizedGroups, permSearch]);

  const toggle = useCallback((code: string) => {
    setLocalCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setDirty(true);
  }, []);

  const toggleAll = useCallback((codes: string[], on: boolean) => {
    setLocalCodes((prev) => {
      const next = new Set(prev);
      for (const c of codes) {
        if (on) next.add(c);
        else next.delete(c);
      }
      return next;
    });
    setDirty(true);
  }, []);

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
  const permPercent = allPermissions.length > 0 ? Math.round((localCodes.size / allPermissions.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading roles and permissions...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Roles & Permissions</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Select a role to view and edit its permissions
          </p>
        </div>
        {dirty && !isLocked && (
          <Button
            onClick={handleSave}
            size="sm"
            disabled={setRolePermissionsMutation.isPending}
            className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90 shrink-0"
          >
            {setRolePermissionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Save Changes</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:flex-1 lg:min-h-0">
        {/* Role list — outer div stretches to row height, inner div sticks */}
        <div>
          <div className="space-y-1.5 lg:sticky lg:top-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Roles ({roles.length})
            </p>
            {roles.map((role) => {
              const badgeStyle = ROLE_LEVEL_BADGE[role.code] || "bg-muted text-muted-foreground border-border";
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    if (dirty) {
                      setPendingRoleId(role.id);
                      return;
                    }
                    setSelectedRoleId(role.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-left transition-all ${
                    selectedRoleId === role.id
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-foreground hover:bg-muted border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${badgeStyle.split(" ").slice(0, 2).join(" ")}`}>
                      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate">{role.name}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeStyle}`}>
                        {role.role_type}
                      </span>
                    </div>
                  </div>
                  {selectedRoleId === role.id && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Permission matrix */}
        <div className="lg:col-span-3 lg:min-h-0 lg:flex lg:flex-col">
          {!selectedRoleId ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Shield className="h-10 w-10 opacity-30 mb-3" />
              <p>Select a role to view its permissions</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <div className="flex flex-col gap-5 lg:flex-1 lg:min-h-0">
              {/* Pinned section: role info + search */}
              <div className="shrink-0 space-y-5">
                {/* Role info header */}
                {selectedRole && (
                  <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 ${
                          (ROLE_LEVEL_BADGE[selectedRole.code] || "bg-muted text-muted-foreground").split(" ").slice(0, 2).join(" ")
                        }`}
                      >
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base">{selectedRole.name}</h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            ROLE_LEVEL_BADGE[selectedRole.code] || "bg-muted text-muted-foreground"
                          }`}>
                            Level {selectedRole.level}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                          {selectedRole.role_type === "system" ? "System role" : "Custom role"}
                          {roleDetail?.description && ` — ${roleDetail.description}`}
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5">
                        <span className="text-muted-foreground">Permission coverage</span>
                        <span className="font-medium text-foreground">
                          {localCodes.size} / {allPermissions.length} ({permPercent}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-teal to-brand-purple rounded-full transition-all duration-300"
                          style={{ width: `${permPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isLocked && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      {selectedRole?.code === "super_admin"
                        ? "Super Admin permissions cannot be edited."
                        : "You don't have permission to edit role permissions."}
                    </span>
                  </div>
                )}

                {/* Permission search */}
                {allPermissions.length > 10 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search permissions (e.g. contacts, write, delete)..."
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                    />
                    {permSearch && (
                      <button
                        onClick={() => setPermSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Scrollable permission groups */}
              <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-2">
                {filteredCategorizedGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Filter className="h-8 w-8 opacity-30 mb-2" />
                    <p className="text-sm">No permissions match &ldquo;{permSearch}&rdquo;</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredCategorizedGroups.map(([category, categoryGroups]) => (
                      <div key={category}>
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          {CATEGORY_LABELS[category] || capitalize(category)}
                        </h5>
                        <div className="space-y-3">
                          {categoryGroups.map((group) => {
                            const allCodes = group.permissions.map((p) => p.code);
                            const allOn = allCodes.every((c) => localCodes.has(c));
                            const someOn = allCodes.some((c) => localCodes.has(c));
                            const onCount = allCodes.filter((c) => localCodes.has(c)).length;

                            return (
                              <Card key={`${group.category}::${group.resource}`} className="border border-border p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-3 gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground text-sm">
                                      {group.label}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                      allOn
                                        ? "bg-green-500/10 text-green-600"
                                        : someOn
                                        ? "bg-amber-500/10 text-amber-600"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {onCount}/{allCodes.length}
                                    </span>
                                  </div>
                                  {!isLocked && (
                                    <button
                                      onClick={() => toggleAll(allCodes, !allOn)}
                                      className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${
                                        allOn
                                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                                          : someOn
                                          ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                                      }`}
                                    >
                                      {allOn ? "Revoke All" : "Grant All"}
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
                                  {group.permissions.map((perm) => {
                                    const isOn = localCodes.has(perm.code);
                                    return (
                                      <button
                                        key={perm.code}
                                        onClick={() => !isLocked && toggle(perm.code)}
                                        disabled={isLocked}
                                        title={perm.code}
                                        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all border ${
                                          isOn
                                            ? "bg-primary/10 border-primary/30 text-primary"
                                            : "bg-background border-border text-muted-foreground hover:border-muted-foreground/30"
                                        } ${isLocked ? "cursor-default opacity-75" : "cursor-pointer"}`}
                                      >
                                        <div
                                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                                            isOn
                                              ? "bg-primary text-white"
                                              : "border border-muted-foreground/30"
                                          }`}
                                        >
                                          {isOn && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
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
        iconBg="bg-yellow-100"
        iconColor="text-yellow-600"
        confirmClassName="bg-yellow-600 hover:bg-yellow-700 text-white"
      />
    </div>
  );
}
