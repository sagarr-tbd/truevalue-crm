"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Edit, Trash2, X, Mail, UserPlus, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActionMenu from "@/components/ActionMenu";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { membersApi, type OrganizationMember } from "@/lib/api/members";

// Form Schemas
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
  status: string;
}

// Map Org Service roles to display names
const ROLE_DISPLAY: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer" },
  { value: "member", label: "Member" },
  { value: "admin", label: "Administrator" },
];

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
    role: ROLE_DISPLAY[m.role] || m.role,
    status: m.status === "active" ? "Active" : m.status === "pending" ? "Pending" : m.status,
  };
}

export default function TeamManagementSettings() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Invite Member Form
  const inviteForm = useForm<z.infer<typeof inviteMemberSchema>>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  // Edit Role Form
  const editRoleForm = useForm<z.infer<typeof editRoleSchema>>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      role: "",
    },
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

  // Compute role stats from real data
  const roleStats = teamMembers.reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {});

  const roles = Object.entries(roleStats).map(([role, count]) => ({
    role,
    users: count,
  }));

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
    // Reverse-map display name to actual role value
    const roleValue =
      Object.entries(ROLE_DISPLAY).find(([, v]) => v === member.role)?.[0] || member.role;
    editRoleForm.reset({ role: roleValue });
    setShowEditRoleModal(true);
  };

  const handleSaveRole = editRoleForm.handleSubmit(async (data) => {
    try {
      if (selectedMember) {
        await membersApi.updateRole(selectedMember.userId, data.role);
        showSuccessToast(
          `${selectedMember.name}'s role updated to ${ROLE_DISPLAY[data.role] || data.role}`
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No team members found. Invite someone to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple flex items-center justify-center text-white text-sm font-semibold">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{member.name}</div>
                        {member.email && (
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground">{member.role}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === "Active"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {member.status}
                      </span>
                      <ActionMenu
                        items={[
                          {
                            label: "Edit Role",
                            icon: Edit,
                            onClick: () => handleEditRole(member),
                          },
                          {
                            label: "Remove",
                            icon: Trash2,
                            variant: "danger",
                            onClick: () => handleRemoveMember(member),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Summary */}
        {roles.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Roles & Permissions
            </h3>
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.role} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{role.role}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {role.users} {role.users === 1 ? "user" : "users"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Invite Team Member</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  inviteForm.reset();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  {...inviteForm.register("email")}
                  placeholder="colleague@company.com"
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    inviteForm.formState.errors.email ? "border-destructive" : "border-border"
                  }`}
                />
                {inviteForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {inviteForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Role
                </label>
                <select
                  {...inviteForm.register("role")}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    inviteForm.formState.errors.role ? "border-destructive" : "border-border"
                  }`}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {inviteForm.formState.errors.role && (
                  <p className="text-sm text-destructive mt-1">
                    {inviteForm.formState.errors.role.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    inviteForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteForm.formState.isSubmitting}
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-[10000]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Edit Role</h3>
              <button
                onClick={() => {
                  setShowEditRoleModal(false);
                  editRoleForm.reset();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRole}>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Change the role for{" "}
                  <span className="font-semibold text-foreground">{selectedMember.name}</span>
                </p>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Select Role
                </label>
                <select
                  {...editRoleForm.register("role")}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    editRoleForm.formState.errors.role ? "border-destructive" : "border-border"
                  }`}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                  onClick={() => {
                    setShowEditRoleModal(false);
                    editRoleForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editRoleForm.formState.isSubmitting}
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                >
                  {editRoleForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveModal && selectedMember && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-[10000]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Remove Team Member</h3>
              </div>
              <button
                onClick={() => setShowRemoveModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-foreground">{selectedMember.name}</span> from
                your team? They will lose access to all team resources immediately.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRemoveModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmRemoveMember}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Member
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
