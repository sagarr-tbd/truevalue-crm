"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Network,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Info,
  Users,
  Shield,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useRoles, useRoleDetail } from "@/lib/queries/useRolesPermissions";
import type { RoleItem } from "@/lib/api/permissions-api";
import { usePermission, ROLE_SUPER_ADMIN, ROLES_WRITE, ROLES_READ } from "@/lib/permissions";

interface RoleHierarchyNode extends RoleItem {
  children: RoleHierarchyNode[];
  depth: number;
}

function buildHierarchy(roles: RoleItem[]): RoleHierarchyNode[] {
  const roleMap = new Map<string, RoleHierarchyNode>();
  const roots: RoleHierarchyNode[] = [];

  // Create nodes
  for (const role of roles) {
    roleMap.set(role.id, { ...role, children: [], depth: 0 });
  }

  // Build tree based on level (simple level-based hierarchy for now)
  // Roles with lower level numbers are higher in hierarchy
  const sortedRoles = [...roleMap.values()].sort((a, b) => a.level - b.level);

  for (const role of sortedRoles) {
    // Find parent: first role with lower level
    let parent: RoleHierarchyNode | null = null;
    for (const potential of sortedRoles) {
      if (potential.level < role.level && potential.id !== role.id) {
        parent = roleMap.get(potential.id) || null;
      }
    }

    if (parent) {
      role.depth = parent.depth + 1;
      parent.children.push(role);
    } else {
      roots.push(role);
    }
  }

  return roots;
}

const ROLE_LEVEL_COLORS: Record<number, string> = {
  0: "bg-red-500/10 text-red-600 border-red-500/20",
  1: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  2: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  3: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  4: "bg-green-500/10 text-green-600 border-green-500/20",
  5: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

function getRoleLevelColor(level: number): string {
  return ROLE_LEVEL_COLORS[level] || ROLE_LEVEL_COLORS[5];
}

interface TreeNodeProps {
  node: RoleHierarchyNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  canEdit: boolean;
}

function TreeNode({ node, expanded, onToggle, selectedId, onSelect, canEdit }: TreeNodeProps) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const levelColor = getRoleLevelColor(node.level);

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-muted border border-transparent"
        }`}
        style={{ paddingLeft: `${node.depth * 24 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
            hasChildren ? "hover:bg-muted-foreground/10" : "opacity-0"
          }`}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          )}
        </button>

        {/* Role icon */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${levelColor
            .split(" ")
            .slice(0, 2)
            .join(" ")}`}
        >
          <Shield className="h-3.5 w-3.5" />
        </div>

        {/* Role info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{node.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${levelColor}`}>
              Level {node.level}
            </span>
            {node.role_type === "system" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                System
              </span>
            )}
          </div>
          {hasChildren && (
            <span className="text-[10px] text-muted-foreground">
              {node.children.length} subordinate{node.children.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-border"
            style={{ left: `${node.depth * 24 + 18}px` }}
          />
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoleHierarchySettings() {
  const { roles: userRoles, can } = usePermission();
  const isSuperAdmin = userRoles.includes(ROLE_SUPER_ADMIN);
  const canReadRoles = can(ROLES_READ) || isSuperAdmin;
  const canEditRoles = can(ROLES_WRITE) || isSuperAdmin;

  const { data: allRoles = [], isLoading } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const { data: roleDetail, isLoading: loadingDetail } = useRoleDetail(selectedRoleId);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Build hierarchy
  const hierarchy = useMemo(() => {
    // Filter out super_admin for non-super-admin users
    const filteredRoles = allRoles.filter((r) => {
      if (r.code === "super_admin" && !isSuperAdmin) return false;
      return true;
    });
    return buildHierarchy(filteredRoles);
  }, [allRoles, isSuperAdmin]);

  // Auto-expand first level
  useMemo(() => {
    const firstLevel = new Set<string>();
    hierarchy.forEach((node) => firstLevel.add(node.id));
    setExpanded(firstLevel);
  }, [hierarchy]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collect = (nodes: RoleHierarchyNode[]) => {
      for (const n of nodes) {
        allIds.add(n.id);
        collect(n.children);
      }
    };
    collect(hierarchy);
    setExpanded(allIds);
  }, [hierarchy]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const selectedRole = allRoles.find((r) => r.id === selectedRoleId);

  // Calculate stats
  const totalRoles = allRoles.filter((r) => r.code !== "super_admin" || isSuperAdmin).length;
  const maxDepth = useMemo(() => {
    let max = 0;
    const findMax = (nodes: RoleHierarchyNode[]) => {
      for (const n of nodes) {
        if (n.depth > max) max = n.depth;
        findMax(n.children);
      }
    };
    findMax(hierarchy);
    return max;
  }, [hierarchy]);

  if (!canReadRoles) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Network className="h-10 w-10 opacity-30 mb-3" />
        <p>You don&apos;t have permission to view role hierarchy</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading roles...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Role Hierarchy</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Visualize and manage the organizational role structure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalRoles}</p>
              <p className="text-xs text-muted-foreground">Total Roles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Network className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{maxDepth + 1}</p>
              <p className="text-xs text-muted-foreground">Hierarchy Levels</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {allRoles.filter((r) => r.role_type === "custom").length}
              </p>
              <p className="text-xs text-muted-foreground">Custom Roles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {allRoles.filter((r) => r.role_type === "system").length}
              </p>
              <p className="text-xs text-muted-foreground">System Roles</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:flex-1 lg:min-h-0">
        {/* Tree view */}
        <div className="lg:col-span-2">
          <Card className="border border-border p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-foreground">Organization Structure</h4>
              <span className="text-xs text-muted-foreground">
                Click a role to view details
              </span>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[500px]">
              {hierarchy.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Network className="h-10 w-10 opacity-30 mb-3" />
                  <p className="text-sm">No roles configured</p>
                </div>
              ) : (
                hierarchy.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    expanded={expanded}
                    onToggle={toggleExpand}
                    selectedId={selectedRoleId}
                    onSelect={setSelectedRoleId}
                    canEdit={canEditRoles}
                  />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Role detail panel */}
        <div>
          <Card className="border border-border p-4 h-full lg:sticky lg:top-0">
            {!selectedRoleId ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                <Shield className="h-10 w-10 opacity-30 mb-3" />
                <p className="text-sm">Select a role to view details</p>
              </div>
            ) : loadingDetail ? (
              <div className="flex items-center justify-center h-full py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : selectedRole && roleDetail ? (
              <div className="space-y-4">
                {/* Role header */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${getRoleLevelColor(
                      selectedRole.level
                    )
                      .split(" ")
                      .slice(0, 2)
                      .join(" ")}`}
                  >
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{selectedRole.name}</h4>
                    <p className="text-sm text-muted-foreground">{roleDetail.description || "No description"}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleLevelColor(
                          selectedRole.level
                        )}`}
                      >
                        Level {selectedRole.level}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                        {selectedRole.role_type}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Role info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Code</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedRole.code}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Permissions
                    </p>
                    <p className="text-sm text-foreground">
                      {roleDetail.permissions.length} permission{roleDetail.permissions.length !== 1 ? "s" : ""} granted
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Data Visibility
                    </p>
                    <p className="text-sm text-foreground">
                      Can view records from subordinate roles
                    </p>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Info box */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Users with this role can see data owned by users in subordinate roles below them in the hierarchy.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                <Shield className="h-10 w-10 opacity-30 mb-3" />
                <p className="text-sm">Role not found</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
