"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Map,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Info,
  Users,
  Building2,
  Save,
  X,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  useTerritories,
  useTerritoryHierarchy,
  useTerritoryDetail,
  useTerritoryUsers,
  useCreateTerritory,
  useUpdateTerritory,
  useDeleteTerritory,
  useAssignTerritoryUser,
  useRemoveTerritoryUser,
} from "@/lib/queries/useTerritories";
import type {
  TerritoryItem,
  TerritoryHierarchy,
  TerritoryUserAssignment,
} from "@/lib/api/territories-api";
import { usePermission, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { TERRITORIES_READ, TERRITORIES_WRITE } from "@/lib/permissions";

interface TerritoryTreeNodeProps {
  node: TerritoryHierarchy;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}

function TerritoryTreeNode({
  node,
  expanded,
  onToggle,
  selectedId,
  onSelect,
  depth = 0,
}: TerritoryTreeNodeProps) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-muted border border-transparent"
        }`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
            hasChildren ? "hover:bg-muted-foreground/10" : "opacity-0"
          }`}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ))}
        </button>

        <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
          <Map className="h-3.5 w-3.5 text-teal-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{node.name}</span>
            {!node.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-500/10 text-red-600">
                Inactive
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{node.code}</span>
        </div>

        {hasChildren && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {node.children.length} sub
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-border"
            style={{ left: `${depth * 24 + 18}px` }}
          />
          {node.children.map((child) => (
            <TerritoryTreeNode
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CreateTerritoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string, name: string, description: string, parentId?: string) => void;
  isLoading: boolean;
  territories: TerritoryItem[];
}

function CreateTerritoryModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  territories,
}: CreateTerritoryModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setName("");
      setDescription("");
      setParentId("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && name.trim()) {
      onSubmit(code.trim(), name.trim(), description.trim(), parentId || undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Territory</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="north_america"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="North America"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="North American sales territory"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Parent Territory</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">None (Top Level)</option>
              {territories.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !code.trim() || !name.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Territory
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TerritoriesSettings() {
  const { roles: userRoles, can } = usePermission();
  const isSuperAdmin = userRoles.includes(ROLE_SUPER_ADMIN);
  const canReadTerritories = can(TERRITORIES_READ) || isSuperAdmin;
  const canWriteTerritories = can(TERRITORIES_WRITE) || isSuperAdmin;

  const { data: allTerritories = [], isLoading: loadingList } = useTerritories(false);
  const { data: hierarchy = [], isLoading: loadingHierarchy } = useTerritoryHierarchy();
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const { data: territoryDetail, isLoading: loadingDetail } = useTerritoryDetail(selectedTerritoryId);
  const { data: territoryUsers = [], isLoading: loadingUsers } = useTerritoryUsers(selectedTerritoryId);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const createTerritoryMutation = useCreateTerritory();
  const updateTerritoryMutation = useUpdateTerritory();
  const deleteTerritoryMutation = useDeleteTerritory();
  const assignUserMutation = useAssignTerritoryUser();
  const removeUserMutation = useRemoveTerritoryUser();

  // Auto-expand first level
  useEffect(() => {
    if (hierarchy.length > 0 && expanded.size === 0) {
      const firstLevel = new Set<string>();
      hierarchy.forEach((node) => firstLevel.add(node.id));
      setExpanded(firstLevel);
    }
  }, [hierarchy, expanded.size]);

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
    const collect = (nodes: TerritoryHierarchy[]) => {
      for (const n of nodes) {
        allIds.add(n.id);
        if (n.children) collect(n.children);
      }
    };
    collect(hierarchy);
    setExpanded(allIds);
  }, [hierarchy]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const handleCreate = async (code: string, name: string, description: string, parentId?: string) => {
    try {
      const newTerritory = await createTerritoryMutation.mutateAsync({
        code,
        name,
        description,
        parent_territory_id: parentId,
      });
      showSuccessToast("Territory created successfully");
      setShowCreateModal(false);
      setSelectedTerritoryId(newTerritory.id);
    } catch {
      showErrorToast("Failed to create territory");
    }
  };

  const handleDelete = async () => {
    if (!selectedTerritoryId) return;
    try {
      await deleteTerritoryMutation.mutateAsync(selectedTerritoryId);
      showSuccessToast("Territory deleted");
      setShowDeleteConfirm(false);
      setSelectedTerritoryId(null);
    } catch {
      showErrorToast("Failed to delete territory");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedTerritoryId) return;
    try {
      await removeUserMutation.mutateAsync({ territoryId: selectedTerritoryId, userId });
      showSuccessToast("User removed from territory");
    } catch {
      showErrorToast("Failed to remove user");
    }
  };

  const selectedTerritory = allTerritories.find((t) => t.id === selectedTerritoryId);
  const isLoading = loadingList || loadingHierarchy;

  // Stats
  const activeTerritories = allTerritories.filter((t) => t.is_active).length;
  const totalUsers = territoryUsers.length;

  if (!canReadTerritories) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Map className="h-10 w-10 opacity-30 mb-3" />
        <p>You don&apos;t have permission to view territories</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading territories...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Territory Management</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Organize your sales regions and assign users
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWriteTerritories && (
            <Button onClick={() => setShowCreateModal(true)} size="sm" variant="outline">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Territory</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Map className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{allTerritories.length}</p>
              <p className="text-xs text-muted-foreground">Total Territories</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Map className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeTerritories}</p>
              <p className="text-xs text-muted-foreground">Active Territories</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Assigned Users</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:flex-1 lg:min-h-0">
        {/* Tree view */}
        <div className="lg:col-span-2">
          <Card className="border border-border p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-foreground">Territory Hierarchy</h4>
              <span className="text-xs text-muted-foreground">
                Click a territory to view details
              </span>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[500px]">
              {hierarchy.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Map className="h-10 w-10 opacity-30 mb-3" />
                  <p className="text-sm">No territories configured</p>
                  {canWriteTerritories && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Territory
                    </Button>
                  )}
                </div>
              ) : (
                hierarchy.map((node) => (
                  <TerritoryTreeNode
                    key={node.id}
                    node={node}
                    expanded={expanded}
                    onToggle={toggleExpand}
                    selectedId={selectedTerritoryId}
                    onSelect={setSelectedTerritoryId}
                  />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Territory detail panel */}
        <div>
          <Card className="border border-border p-4 h-full lg:sticky lg:top-0">
            {!selectedTerritoryId ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                <Map className="h-10 w-10 opacity-30 mb-3" />
                <p className="text-sm">Select a territory to view details</p>
              </div>
            ) : loadingDetail ? (
              <div className="flex items-center justify-center h-full py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : selectedTerritory && territoryDetail ? (
              <div className="space-y-4">
                {/* Territory header */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Map className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{selectedTerritory.name}</h4>
                      {canWriteTerritories && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {territoryDetail.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                        {selectedTerritory.code}
                      </span>
                      {selectedTerritory.is_active ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-600">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-600">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Users section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Assigned Users
                    </p>
                    <span className="text-xs text-muted-foreground">{territoryUsers.length}</span>
                  </div>

                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading users...
                    </div>
                  ) : territoryUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No users assigned to this territory
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {territoryUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {user.user_name || user.user_email}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {user.assignment_type}
                              </p>
                            </div>
                          </div>
                          {canWriteTerritories && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveUser(user.user_id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                              disabled={removeUserMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="border-border" />

                {/* Info box */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Users in this territory can access accounts and records assigned to it.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                <Map className="h-10 w-10 opacity-30 mb-3" />
                <p className="text-sm">Territory not found</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateTerritoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={createTerritoryMutation.isPending}
        territories={allTerritories}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Territory"
        description={`Are you sure you want to delete "${selectedTerritory?.name}"? Users and accounts assigned to this territory will be unassigned.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        icon={Trash2}
        iconBg="bg-red-100"
        iconColor="text-red-600"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        isLoading={deleteTerritoryMutation.isPending}
      />
    </div>
  );
}
