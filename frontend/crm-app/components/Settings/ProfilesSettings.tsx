"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  UserCog,
  Check,
  X,
  Loader2,
  ChevronRight,
  Save,
  Info,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  useProfiles,
  useProfileDetail,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
  useCloneProfile,
} from "@/lib/queries/useProfiles";
import type { ProfileItem, ProfileDetail, ModulePermission } from "@/lib/api/profiles-api";
import { usePermission, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { PROFILES_READ, PROFILES_WRITE } from "@/lib/permissions";

// CRM Modules for permission matrix
const CRM_MODULES = [
  { code: "contacts", label: "Contacts" },
  { code: "companies", label: "Companies" },
  { code: "leads", label: "Leads" },
  { code: "deals", label: "Deals" },
  { code: "activities", label: "Activities" },
  { code: "tasks", label: "Tasks" },
  { code: "notes", label: "Notes" },
  { code: "documents", label: "Documents" },
] as const;

const ACTIONS = ["view", "create", "edit", "delete", "export"] as const;
type ActionType = (typeof ACTIONS)[number];

const PROFILE_TYPE_BADGE: Record<string, string> = {
  system: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  custom: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string, name: string, description: string) => void;
  isLoading: boolean;
}

function CreateProfileModal({ isOpen, onClose, onSubmit, isLoading }: CreateProfileModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setName("");
      setDescription("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && name.trim()) {
      onSubmit(code.trim(), name.trim(), description.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="sales_manager"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers, and underscores only</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Manager" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Profile for sales team managers"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !code.trim() || !name.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CloneProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newCode: string, newName: string) => void;
  isLoading: boolean;
  sourceProfile: ProfileItem | null;
}

function CloneProfileModal({ isOpen, onClose, onSubmit, isLoading, sourceProfile }: CloneProfileModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen && sourceProfile) {
      setCode(`${sourceProfile.code}_copy`);
      setName(`${sourceProfile.name} (Copy)`);
    }
  }, [isOpen, sourceProfile]);

  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setName("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && name.trim()) {
      onSubmit(code.trim(), name.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">Clone Profile</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Creating a copy of <strong>{sourceProfile?.name}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">New Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="sales_manager_copy"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">New Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Manager (Copy)" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !code.trim() || !name.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Clone Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilesSettings() {
  const { roles: userRoles, can } = usePermission();
  const isSuperAdmin = userRoles.includes(ROLE_SUPER_ADMIN);
  const canReadProfiles = can(PROFILES_READ) || isSuperAdmin;
  const canWriteProfiles = can(PROFILES_WRITE) || isSuperAdmin;

  const { data: allProfiles = [], isLoading: loadingProfiles } = useProfiles();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { data: profileDetail, isLoading: loadingDetail } = useProfileDetail(selectedProfileId);

  const [localPermissions, setLocalPermissions] = useState<Record<string, ModulePermission>>({});
  const [dirty, setDirty] = useState(false);
  const [permSearch, setPermSearch] = useState("");
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const createProfileMutation = useCreateProfile();
  const updateProfileMutation = useUpdateProfile();
  const deleteProfileMutation = useDeleteProfile();
  const cloneProfileMutation = useCloneProfile();

  // Initialize local permissions from profile detail
  useEffect(() => {
    if (profileDetail) {
      setLocalPermissions(profileDetail.module_permissions || {});
      setDirty(false);
    }
  }, [profileDetail]);

  // Select first profile by default
  useEffect(() => {
    if (allProfiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(allProfiles[0].id);
    }
  }, [allProfiles, selectedProfileId]);

  const filteredModules = useMemo(() => {
    if (!permSearch.trim()) return CRM_MODULES;
    const q = permSearch.toLowerCase();
    return CRM_MODULES.filter((m) => m.label.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [permSearch]);

  const togglePermission = useCallback((module: string, action: ActionType) => {
    setLocalPermissions((prev) => {
      const modulePerms = prev[module] || { view: false, create: false, edit: false, delete: false, export: false };
      return {
        ...prev,
        [module]: { ...modulePerms, [action]: !modulePerms[action] },
      };
    });
    setDirty(true);
  }, []);

  const toggleAllForModule = useCallback((module: string, on: boolean) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [module]: { view: on, create: on, edit: on, delete: on, export: on },
    }));
    setDirty(true);
  }, []);

  const toggleAllForAction = useCallback((action: ActionType, on: boolean) => {
    setLocalPermissions((prev) => {
      const next = { ...prev };
      for (const mod of CRM_MODULES) {
        const modPerms = next[mod.code] || { view: false, create: false, edit: false, delete: false, export: false };
        next[mod.code] = { ...modPerms, [action]: on };
      }
      return next;
    });
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!selectedProfileId) return;
    try {
      await updateProfileMutation.mutateAsync({
        profileId: selectedProfileId,
        data: { module_permissions: localPermissions },
      });
      showSuccessToast("Profile permissions updated");
      setDirty(false);
    } catch {
      showErrorToast("Failed to update profile permissions");
    }
  };

  const handleCreate = async (code: string, name: string, description: string) => {
    try {
      const newProfile = await createProfileMutation.mutateAsync({ code, name, description });
      showSuccessToast("Profile created successfully");
      setShowCreateModal(false);
      setSelectedProfileId(newProfile.id);
    } catch {
      showErrorToast("Failed to create profile");
    }
  };

  const handleClone = async (newCode: string, newName: string) => {
    if (!selectedProfileId) return;
    try {
      const cloned = await cloneProfileMutation.mutateAsync({
        source_profile_id: selectedProfileId,
        new_code: newCode,
        new_name: newName,
      });
      showSuccessToast("Profile cloned successfully");
      setShowCloneModal(false);
      setSelectedProfileId(cloned.id);
    } catch {
      showErrorToast("Failed to clone profile");
    }
  };

  const handleDelete = async () => {
    if (!selectedProfileId) return;
    try {
      await deleteProfileMutation.mutateAsync(selectedProfileId);
      showSuccessToast("Profile deleted");
      setShowDeleteConfirm(false);
      setSelectedProfileId(null);
    } catch {
      showErrorToast("Failed to delete profile");
    }
  };

  const selectedProfile = allProfiles.find((p) => p.id === selectedProfileId);
  const isLocked = selectedProfile?.profile_type === "system" || !canWriteProfiles;
  const isLoading = loadingProfiles;

  // Calculate permission counts
  const totalPerms = CRM_MODULES.length * ACTIONS.length;
  const grantedPerms = Object.values(localPermissions).reduce((sum, mp) => {
    return sum + ACTIONS.filter((a) => mp[a]).length;
  }, 0);
  const permPercent = totalPerms > 0 ? Math.round((grantedPerms / totalPerms) * 100) : 0;

  if (!canReadProfiles) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <UserCog className="h-10 w-10 opacity-30 mb-3" />
        <p>You don&apos;t have permission to view profiles</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading profiles...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Security Profiles</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Define what actions users can perform on each module
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWriteProfiles && (
            <Button onClick={() => setShowCreateModal(true)} size="sm" variant="outline">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Profile</span>
            </Button>
          )}
          {dirty && !isLocked && (
            <Button
              onClick={handleSave}
              size="sm"
              disabled={updateProfileMutation.isPending}
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Save Changes</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:flex-1 lg:min-h-0">
        {/* Profile list */}
        <div>
          <div className="space-y-1.5 lg:sticky lg:top-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Profiles ({allProfiles.length})
            </p>
            {allProfiles.map((profile) => {
              const badgeStyle = PROFILE_TYPE_BADGE[profile.profile_type] || "bg-muted text-muted-foreground border-border";
              return (
                <button
                  key={profile.id}
                  onClick={() => {
                    if (dirty) {
                      setPendingProfileId(profile.id);
                      return;
                    }
                    setSelectedProfileId(profile.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-left transition-all ${
                    selectedProfileId === profile.id
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-foreground hover:bg-muted border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${badgeStyle
                        .split(" ")
                        .slice(0, 2)
                        .join(" ")}`}
                    >
                      <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate">{profile.name}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeStyle}`}>
                        {profile.profile_type}
                      </span>
                    </div>
                  </div>
                  {selectedProfileId === profile.id && <ChevronRight className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Permission matrix */}
        <div className="lg:col-span-3 lg:min-h-0 lg:flex lg:flex-col">
          {!selectedProfileId ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UserCog className="h-10 w-10 opacity-30 mb-3" />
              <p>Select a profile to view its permissions</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <div className="flex flex-col gap-5 lg:flex-1 lg:min-h-0">
              {/* Profile info header */}
              <div className="shrink-0 space-y-5">
                {selectedProfile && (
                  <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 ${
                          (PROFILE_TYPE_BADGE[selectedProfile.profile_type] || "bg-muted text-muted-foreground")
                            .split(" ")
                            .slice(0, 2)
                            .join(" ")
                        }`}
                      >
                        <UserCog className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base">{selectedProfile.name}</h4>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              PROFILE_TYPE_BADGE[selectedProfile.profile_type] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {selectedProfile.profile_type}
                          </span>
                          {selectedProfile.is_default && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-500/10 text-green-600">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                          {profileDetail?.description || `Code: ${selectedProfile.code}`}
                        </p>
                      </div>
                      {canWriteProfiles && selectedProfile.profile_type !== "system" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCloneModal(true)}
                            title="Clone profile"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete profile"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5">
                        <span className="text-muted-foreground">Permission coverage</span>
                        <span className="font-medium text-foreground">
                          {grantedPerms} / {totalPerms} ({permPercent}%)
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
                      {selectedProfile?.profile_type === "system"
                        ? "System profile permissions cannot be edited."
                        : "You don't have permission to edit profiles."}
                    </span>
                  </div>
                )}

                {/* Permission search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search modules..."
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
              </div>

              {/* Permission matrix table */}
              <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-2">
                {filteredModules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Filter className="h-8 w-8 opacity-30 mb-2" />
                    <p className="text-sm">No modules match &ldquo;{permSearch}&rdquo;</p>
                  </div>
                ) : (
                  <Card className="border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-4 py-3 font-semibold text-foreground">Module</th>
                            {ACTIONS.map((action) => {
                              const allOn = CRM_MODULES.every((m) => localPermissions[m.code]?.[action]);
                              return (
                                <th key={action} className="text-center px-3 py-3 font-medium text-muted-foreground">
                                  <div className="flex flex-col items-center gap-1">
                                    <span>{capitalize(action)}</span>
                                    {!isLocked && (
                                      <button
                                        onClick={() => toggleAllForAction(action, !allOn)}
                                        className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                                          allOn
                                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                      >
                                        {allOn ? "All" : "None"}
                                      </button>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">All</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredModules.map((mod) => {
                            const modulePerms = localPermissions[mod.code] || {
                              view: false,
                              create: false,
                              edit: false,
                              delete: false,
                              export: false,
                            };
                            const allOn = ACTIONS.every((a) => modulePerms[a]);
                            const onCount = ACTIONS.filter((a) => modulePerms[a]).length;

                            return (
                              <tr key={mod.code} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{mod.label}</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                        allOn
                                          ? "bg-green-500/10 text-green-600"
                                          : onCount > 0
                                          ? "bg-amber-500/10 text-amber-600"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {onCount}/{ACTIONS.length}
                                    </span>
                                  </div>
                                </td>
                                {ACTIONS.map((action) => {
                                  const isOn = modulePerms[action];
                                  return (
                                    <td key={action} className="text-center px-3 py-3">
                                      <button
                                        onClick={() => !isLocked && togglePermission(mod.code, action)}
                                        disabled={isLocked}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                          isOn
                                            ? "bg-primary text-white"
                                            : "border border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50"
                                        } ${isLocked ? "cursor-default opacity-75" : "cursor-pointer"}`}
                                      >
                                        {isOn && <Check className="h-4 w-4" />}
                                      </button>
                                    </td>
                                  );
                                })}
                                <td className="text-center px-3 py-3">
                                  {!isLocked && (
                                    <button
                                      onClick={() => toggleAllForModule(mod.code, !allOn)}
                                      className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${
                                        allOn
                                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                                      }`}
                                    >
                                      {allOn ? "Revoke" : "Grant"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateProfileModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={createProfileMutation.isPending}
      />

      <CloneProfileModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        onSubmit={handleClone}
        isLoading={cloneProfileMutation.isPending}
        sourceProfile={selectedProfile || null}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Profile"
        description={`Are you sure you want to delete "${selectedProfile?.name}"? Users with this profile will need to be reassigned.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        icon={Trash2}
        iconBg="bg-red-100"
        iconColor="text-red-600"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        isLoading={deleteProfileMutation.isPending}
      />

      <ConfirmationModal
        isOpen={!!pendingProfileId}
        onClose={() => setPendingProfileId(null)}
        onConfirm={() => {
          if (pendingProfileId) {
            setSelectedProfileId(pendingProfileId);
            setDirty(false);
          }
          setPendingProfileId(null);
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
