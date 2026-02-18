"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Edit, Trash2, X, Mail, UserPlus, Shield, Save,
  AlertTriangle, Loader2, Search, UserCheck, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ActionMenu from "@/components/ActionMenu";
import ConfirmationModal from "@/components/ConfirmationModal";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { membersApi, type OrganizationMember } from "@/lib/api/members";
import { useRoles } from "@/lib/queries/useRolesPermissions";
import { usePermission, ORG_MANAGE_INVITES, ORG_MANAGE_MEMBERS, ROLES_ASSIGN } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";

const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
});

const editRoleSchema = z.object({
  role: z.string().min(1, "Please select a role"),
});

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  roleCode: string;
  status: string;
}

const PERM_TO_ORG_ROLE: Record<string, string> = {
  org_admin: "admin",
  manager: "manager",
  member: "member",
  viewer: "viewer",
};

const ROLE_DISPLAY_FALLBACK: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
};

const FALLBACK_ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer" },
  { value: "member", label: "Member" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Administrator" },
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  owner: "bg-purple-500/10 text-purple-600",
  admin: "bg-orange-500/10 text-orange-600",
  administrator: "bg-orange-500/10 text-orange-600",
  manager: "bg-blue-500/10 text-blue-600",
  member: "bg-green-500/10 text-green-600",
  viewer: "bg-gray-500/10 text-gray-600",
};

function getRoleBadgeStyle(role: string): string {
  return ROLE_BADGE_STYLES[role.toLowerCase()] || "bg-muted text-muted-foreground";
}

export default function TeamManagementSettings() {
  const { can, roles: myRoles } = usePermission();
  const { user } = useAuth();
  const canInvite = can(ORG_MANAGE_INVITES);
  const canAssignRole = can(ROLES_ASSIGN);
  const canRemoveMember = can(ORG_MANAGE_MEMBERS);

  const { data: permRoles = [] } = useRoles();

  const { roleOptions, roleDisplay, roleLevelMap } = useMemo(() => {
    const levels: Record<string, number> = { owner: 0 };

    if (permRoles.length === 0) {
      return { roleOptions: FALLBACK_ROLE_OPTIONS, roleDisplay: ROLE_DISPLAY_FALLBACK, roleLevelMap: levels };
    }

    const display: Record<string, string> = { owner: "Owner" };
    const opts: { value: string; label: string; level: number }[] = [];

    for (const r of permRoles) {
      if (r.code === "super_admin") continue;
      const orgCode = PERM_TO_ORG_ROLE[r.code] ?? r.code;
      display[orgCode] = r.name;
      levels[orgCode] = r.level;
      if (orgCode !== "owner") {
        opts.push({ value: orgCode, label: r.name, level: r.level });
      }
    }

    opts.sort((a, b) => b.level - a.level);
    return {
      roleOptions: opts.map(({ value, label }) => ({ value, label })),
      roleDisplay: display,
      roleLevelMap: levels,
    };
  }, [permRoles]);

  function mapMemberToTeamMember(m: OrganizationMember): TeamMember {
    const name =
      `${m.first_name || ""} ${m.last_name || ""}`.trim() ||
      m.display_name ||
      "Unknown";
    return {
      id: m.id,
      userId: m.user_id,
      name,
      email: m.display_name?.includes("@") ? m.display_name : "",
      role: roleDisplay[m.role] || m.role,
      roleCode: m.role,
      status: m.status === "active" ? "Active" : m.status === "pending" ? "Pending" : m.status,
    };
  }

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const inviteForm = useForm<z.infer<typeof inviteMemberSchema>>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "member" },
  });

  const editRoleForm = useForm<z.infer<typeof editRoleSchema>>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: { role: "" },
  });

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const members = await membersApi.getAll({ page_size: 100 });
      setTeamMembers(members.map(mapMemberToTeamMember));
    } catch {
      showErrorToast("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;
    const q = searchQuery.toLowerCase();
    return teamMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    );
  }, [teamMembers, searchQuery]);

  const activeCount = teamMembers.filter((m) => m.status === "Active").length;
  const pendingCount = teamMembers.filter((m) => m.status === "Pending").length;

  const roleStats = teamMembers.reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {});

  // Lower level = more privileged (super_admin=0, org_admin=10, manager=50, member=100, viewer=200)
  const myLevel = useMemo(() => {
    let best = Infinity;
    for (const r of myRoles) {
      const orgCode = PERM_TO_ORG_ROLE[r] ?? r;
      const lvl = roleLevelMap[orgCode] ?? Infinity;
      if (lvl < best) best = lvl;
    }
    return best;
  }, [myRoles, roleLevelMap]);

  const canManageMember = useCallback(
    (member: TeamMember): boolean => {
      if (member.roleCode === "owner") return false;
      if (member.userId === user?.id) return false;
      const memberLevel = roleLevelMap[member.roleCode] ?? Infinity;
      return myLevel < memberLevel;
    },
    [user?.id, myLevel, roleLevelMap],
  );

  const assignableRoles = useMemo(
    () => roleOptions.filter((opt) => (roleLevelMap[opt.value] ?? 0) > myLevel),
    [roleOptions, roleLevelMap, myLevel],
  );

  const handleInviteMember = inviteForm.handleSubmit(async (data) => {
    try {
      await membersApi.inviteMember(data.email, data.role);
      showSuccessToast(`Invitation sent to ${data.email}`);
      setShowInviteModal(false);
      inviteForm.reset();
      fetchMembers();
    } catch {
      showErrorToast("Failed to send invitation");
    }
  });

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    const roleValue =
      Object.entries(roleDisplay).find(([, v]) => v === member.role)?.[0] || member.role;
    editRoleForm.reset({ role: roleValue });
    setShowEditRoleModal(true);
  };

  const handleSaveRole = editRoleForm.handleSubmit(async (data) => {
    try {
      if (selectedMember) {
        await membersApi.updateRole(selectedMember.userId, data.role);
        showSuccessToast(
          `${selectedMember.name}'s role updated to ${roleDisplay[data.role] || data.role}`
        );
        setShowEditRoleModal(false);
        setSelectedMember(null);
        editRoleForm.reset();
        fetchMembers();
      }
    } catch {
      showErrorToast("Failed to update role");
    }
  });

  const handleRemoveMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  const confirmRemoveMember = async () => {
    if (selectedMember) {
      try {
        await membersApi.removeMember(selectedMember.userId);
        showSuccessToast(`${selectedMember.name} removed from team`);
        setShowRemoveModal(false);
        setSelectedMember(null);
        fetchMembers();
      } catch {
        showErrorToast("Failed to remove member");
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Team Members</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your team and control access
            </p>
          </div>
          {canInvite && (
            <Button
              onClick={() => setShowInviteModal(true)}
              size="sm"
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90 shrink-0"
            >
              <UserPlus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Invite Member</span>
            </Button>
          )}
        </div>

        {/* Stats row */}
        {!loading && teamMembers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="border border-border p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{teamMembers.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>
            </Card>
            <Card className="border border-border p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{activeCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Active</p>
              </div>
            </Card>
            {pendingCount > 0 && (
              <Card className="border border-border p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground leading-none">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Search */}
        {!loading && teamMembers.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            />
          </div>
        )}

        {/* Member list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading team members...
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 opacity-40" />
            </div>
            <p className="font-medium text-foreground">No team members yet</p>
            <p className="text-sm mt-1">Invite someone to get started.</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 opacity-40 mb-2" />
            <p className="text-sm">No members match &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="group p-3 sm:p-4 border border-border rounded-lg hover:border-primary/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple flex items-center justify-center text-white text-xs sm:text-sm font-semibold shrink-0">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground text-sm sm:text-base truncate">{member.name}</div>
                      {member.email && (
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">{member.email}</div>
                      )}
                      {/* Mobile-only badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 sm:hidden">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getRoleBadgeStyle(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            member.status === "Active"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {member.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Desktop badges */}
                    <span
                      className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                    <span
                      className={`hidden sm:inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === "Active"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {member.status}
                    </span>
                    {(canAssignRole || canRemoveMember) && canManageMember(member) && (
                      <ActionMenu
                        items={[
                          ...(canAssignRole
                            ? [{
                                label: "Edit Role",
                                icon: Edit,
                                onClick: () => handleEditRole(member),
                              }]
                            : []),
                          ...(canRemoveMember
                            ? [{
                                label: "Remove",
                                icon: Trash2,
                                variant: "danger" as const,
                                onClick: () => handleRemoveMember(member),
                              }]
                            : []),
                        ]}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Role Summary */}
        {Object.keys(roleStats).length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Role Distribution
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(roleStats).map(([role, count]) => (
                <div
                  key={role}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border ${getRoleBadgeStyle(
                    role
                  )}`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">{role}</span>
                  <span className="text-xs opacity-70">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Invite Team Member</h3>
              </div>
              <button
                onClick={() => { setShowInviteModal(false); inviteForm.reset(); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    {...inviteForm.register("email")}
                    placeholder="colleague@company.com"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      inviteForm.formState.errors.email ? "border-destructive" : "border-border"
                    }`}
                  />
                </div>
                {inviteForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {inviteForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    {...inviteForm.register("role")}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none ${
                      inviteForm.formState.errors.role ? "border-destructive" : "border-border"
                    }`}
                  >
                    {assignableRoles.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {inviteForm.formState.errors.role && (
                  <p className="text-sm text-destructive mt-1">
                    {inviteForm.formState.errors.role.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowInviteModal(false); inviteForm.reset(); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteForm.formState.isSubmitting}
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                >
                  {inviteForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {inviteForm.formState.isSubmitting ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && selectedMember && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Edit Role</h3>
              <button
                onClick={() => { setShowEditRoleModal(false); editRoleForm.reset(); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRole}>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple flex items-center justify-center text-white text-sm font-semibold">
                  {selectedMember.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{selectedMember.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Current role: <span className={`font-medium ${getRoleBadgeStyle(selectedMember.role).split(" ").slice(1).join(" ")}`}>{selectedMember.role}</span>
                  </p>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  New Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    {...editRoleForm.register("role")}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none ${
                      editRoleForm.formState.errors.role ? "border-destructive" : "border-border"
                    }`}
                  >
                    {assignableRoles.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {editRoleForm.formState.errors.role && (
                  <p className="text-sm text-destructive mt-1">
                    {editRoleForm.formState.errors.role.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowEditRoleModal(false); editRoleForm.reset(); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editRoleForm.formState.isSubmitting}
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                >
                  {editRoleForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editRoleForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      <ConfirmationModal
        isOpen={showRemoveModal && !!selectedMember}
        onClose={() => { setShowRemoveModal(false); setSelectedMember(null); }}
        onConfirm={confirmRemoveMember}
        title="Remove Team Member"
        description={
          selectedMember
            ? `Are you sure you want to remove ${selectedMember.name} from your team? They will lose access to all team resources immediately.`
            : ""
        }
        confirmLabel="Remove Member"
        cancelLabel="Cancel"
        icon={AlertTriangle}
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        confirmClassName="bg-destructive hover:bg-destructive/90 text-white"
      />
    </>
  );
}
