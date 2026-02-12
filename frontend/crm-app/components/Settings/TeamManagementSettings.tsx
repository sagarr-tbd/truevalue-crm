"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Edit, Trash2, X, Mail, UserPlus, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActionMenu from "@/components/ActionMenu";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

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
  name: string;
  email: string;
  role: string;
  status: string;
}

const initialTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    role: "Administrator",
    status: "Active",
  },
  {
    id: "2",
    name: "Mike Wilson",
    email: "mike.w@company.com",
    role: "Manager",
    status: "Active",
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily.d@company.com",
    role: "User",
    status: "Active",
  },
  {
    id: "4",
    name: "Tom Harris",
    email: "tom.h@company.com",
    role: "User",
    status: "Pending",
  },
];

const roles = [
  { id: "admin", role: "Administrator", users: 1, description: "Full system access" },
  { id: "manager", role: "Manager", users: 1, description: "Manage team and settings" },
  { id: "user", role: "User", users: 2, description: "Standard access" },
];

export default function TeamManagementSettings() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Invite Member Form
  const inviteForm = useForm<z.infer<typeof inviteMemberSchema>>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "User",
    },
  });

  // Edit Role Form
  const editRoleForm = useForm<z.infer<typeof editRoleSchema>>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      role: "",
    },
  });

  const handleInviteMember = inviteForm.handleSubmit(async (data) => {
    try {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: data.email.split("@")[0],
        email: data.email,
        role: data.role,
        status: "Pending",
      };
      
      setTeamMembers([...teamMembers, newMember]);
      showSuccessToast(`Invitation sent to ${data.email}`);
      setShowInviteModal(false);
      inviteForm.reset();
    } catch (error) {
      showErrorToast("Failed to send invitation");
    }
  });

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    editRoleForm.reset({ role: member.role });
    setShowEditRoleModal(true);
  };

  const handleSaveRole = editRoleForm.handleSubmit(async (data) => {
    try {
      if (selectedMember) {
        setTeamMembers(
          teamMembers.map((m) =>
            m.id === selectedMember.id ? { ...m, role: data.role } : m
          )
        );
        showSuccessToast(`${selectedMember.name}'s role updated to ${data.role}`);
        setShowEditRoleModal(false);
        setSelectedMember(null);
        editRoleForm.reset();
      }
    } catch (error) {
      showErrorToast("Failed to update role");
    }
  });

  const handleRemoveMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  const confirmRemoveMember = () => {
    if (selectedMember) {
      setTeamMembers(teamMembers.filter((m) => m.id !== selectedMember.id));
      showSuccessToast(`${selectedMember.name} removed from team`);
      setShowRemoveModal(false);
      setSelectedMember(null);
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
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-purple flex items-center justify-center text-white text-sm font-semibold">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
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
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Roles & Permissions
          </h3>
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{role.role}</div>
                    <div className="text-sm text-muted-foreground">{role.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{role.users} users</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedRole(role.role);
                        setShowEditPermissionsModal(true);
                      }}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
                  <option value="User">User</option>
                  <option value="Manager">Manager</option>
                  <option value="Administrator">Administrator</option>
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
                  Change the role for <span className="font-semibold text-foreground">{selectedMember.name}</span>
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
                  <option value="User">User</option>
                  <option value="Manager">Manager</option>
                  <option value="Administrator">Administrator</option>
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
                Are you sure you want to remove <span className="font-semibold text-foreground">{selectedMember.name}</span> from your team? 
                They will lose access to all team resources immediately.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRemoveModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmRemoveMember}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Member
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showEditPermissionsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-[10000]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Edit Permissions</h3>
              <button
                onClick={() => setShowEditPermissionsModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Configure permissions for <span className="font-semibold text-foreground">{selectedRole}</span> role
              </p>
              <div className="space-y-3">
                {[
                  "View all data",
                  "Create records",
                  "Edit records",
                  "Delete records",
                  "Manage team members",
                  "Access reports",
                  "Manage integrations",
                  "Access billing"
                ].map((permission) => (
                  <label key={permission} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRole === "Administrator"}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditPermissionsModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  showSuccessToast(`Permissions updated for ${selectedRole}`);
                  setShowEditPermissionsModal(false);
                }}
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              >
                <Shield className="h-4 w-4 mr-2" />
                Save Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
