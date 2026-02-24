"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Share2,
  Lock,
  Eye,
  Edit,
  Loader2,
  Info,
  Save,
  Users,
  Building2,
  UserPlus,
  Handshake,
  Calendar,
  CheckSquare,
  StickyNote,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import {
  useSharingRules,
  useSharingRuleByModule,
  useCreateSharingRule,
  useUpdateSharingRule,
} from "@/lib/queries/useSharingRules";
import { useRoles } from "@/lib/queries/useRolesPermissions";
import { useTerritories } from "@/lib/queries/useTerritories";
import type { SharingRuleDetail, SharingType, SharingException } from "@/lib/api/sharing-rules-api";
import { CRM_MODULES, SHARING_TYPE_OPTIONS } from "@/lib/api/sharing-rules-api";
import { usePermission, ROLE_SUPER_ADMIN } from "@/lib/permissions";
import { SHARING_RULES_READ, SHARING_RULES_WRITE } from "@/lib/permissions";

// Icons for modules
const MODULE_ICONS: Record<string, React.ElementType> = {
  contacts: Users,
  companies: Building2,
  leads: UserPlus,
  deals: Handshake,
  activities: Calendar,
  tasks: CheckSquare,
  notes: StickyNote,
  documents: FileText,
};

const SHARING_TYPE_ICONS: Record<SharingType, React.ElementType> = {
  private: Lock,
  public_read: Eye,
  public_read_write: Edit,
};

const SHARING_TYPE_COLORS: Record<SharingType, string> = {
  private: "bg-red-500/10 text-red-600 border-red-500/20",
  public_read: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  public_read_write: "bg-green-500/10 text-green-600 border-green-500/20",
};

interface ModuleCardProps {
  module: (typeof CRM_MODULES)[number];
  rule: SharingRuleDetail | null;
  isSelected: boolean;
  onSelect: () => void;
}

function ModuleCard({ module, rule, isSelected, onSelect }: ModuleCardProps) {
  const Icon = MODULE_ICONS[module.code] || FileText;
  const sharingType = rule?.default_sharing || "private";
  const SharingIcon = SHARING_TYPE_ICONS[sharingType];
  const sharingColor = SHARING_TYPE_COLORS[sharingType];
  const sharingLabel = SHARING_TYPE_OPTIONS.find((o) => o.value === sharingType)?.label || "Private";

  return (
    <Card
      className={`border p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground">{module.label}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <SharingIcon className="h-3.5 w-3.5" />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sharingColor}`}>
              {sharingLabel}
            </span>
          </div>
          {rule?.exceptions && rule.exceptions.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {rule.exceptions.length} exception{rule.exceptions.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <ChevronRight
          className={`h-5 w-5 shrink-0 transition-transform ${
            isSelected ? "text-primary rotate-90" : "text-muted-foreground"
          }`}
        />
      </div>
    </Card>
  );
}

interface ExceptionEditorProps {
  exceptions: SharingException[];
  onChange: (exceptions: SharingException[]) => void;
  disabled: boolean;
  roles: { id: string; name: string }[];
  territories: { id: string; name: string }[];
}

function ExceptionEditor({ exceptions, onChange, disabled, roles, territories }: ExceptionEditorProps) {
  const addException = () => {
    onChange([
      ...exceptions,
      { share_with: "roles", role_ids: [], access: "read" },
    ]);
  };

  const removeException = (index: number) => {
    onChange(exceptions.filter((_, i) => i !== index));
  };

  const updateException = (index: number, updates: Partial<SharingException>) => {
    onChange(
      exceptions.map((ex, i) => (i === index ? { ...ex, ...updates } : ex))
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Sharing Exceptions</p>
        {!disabled && (
          <Button variant="outline" size="sm" onClick={addException}>
            <Plus className="h-4 w-4 mr-1" />
            Add Exception
          </Button>
        )}
      </div>

      {exceptions.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm bg-muted/30 rounded-lg">
          No exceptions configured. The default sharing applies to all users.
        </div>
      ) : (
        <div className="space-y-2">
          {exceptions.map((exception, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border bg-background space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Exception {index + 1}
                </span>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeException(index)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Share With</label>
                  <select
                    value={exception.share_with}
                    onChange={(e) =>
                      updateException(index, {
                        share_with: e.target.value as SharingException["share_with"],
                        role_ids: [],
                        territory_ids: [],
                      })
                    }
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="all">All Users</option>
                    <option value="roles">Specific Roles</option>
                    <option value="roles_and_subordinates">Roles & Subordinates</option>
                    <option value="territories">Territories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Access Level</label>
                  <select
                    value={exception.access}
                    onChange={(e) =>
                      updateException(index, { access: e.target.value as "read" | "write" })
                    }
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="read">Read Only</option>
                    <option value="write">Read & Write</option>
                  </select>
                </div>
              </div>

              {(exception.share_with === "roles" ||
                exception.share_with === "roles_and_subordinates") && (
                <div>
                  <label className="block text-xs font-medium mb-1.5">Select Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => {
                      const isSelected = exception.role_ids?.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          onClick={() => {
                            if (disabled) return;
                            const newIds = isSelected
                              ? (exception.role_ids || []).filter((id) => id !== role.id)
                              : [...(exception.role_ids || []), role.id];
                            updateException(index, { role_ids: newIds });
                          }}
                          disabled={disabled}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-muted text-muted-foreground border border-transparent hover:bg-muted/80"
                          } disabled:opacity-50`}
                        >
                          {role.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {exception.share_with === "territories" && (
                <div>
                  <label className="block text-xs font-medium mb-1.5">Select Territories</label>
                  <div className="flex flex-wrap gap-2">
                    {territories.map((territory) => {
                      const isSelected = exception.territory_ids?.includes(territory.id);
                      return (
                        <button
                          key={territory.id}
                          onClick={() => {
                            if (disabled) return;
                            const newIds = isSelected
                              ? (exception.territory_ids || []).filter((id) => id !== territory.id)
                              : [...(exception.territory_ids || []), territory.id];
                            updateException(index, { territory_ids: newIds });
                          }}
                          disabled={disabled}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-muted text-muted-foreground border border-transparent hover:bg-muted/80"
                          } disabled:opacity-50`}
                        >
                          {territory.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DataSharingSettings() {
  const { roles: userRoles, can } = usePermission();
  const isSuperAdmin = userRoles.includes(ROLE_SUPER_ADMIN);
  const canReadSharing = can(SHARING_RULES_READ) || isSuperAdmin;
  const canWriteSharing = can(SHARING_RULES_WRITE) || isSuperAdmin;

  const { data: allRules = [], isLoading: loadingRules } = useSharingRules(false);
  const { data: roles = [] } = useRoles();
  const { data: territories = [] } = useTerritories();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const { data: moduleRule, isLoading: loadingModuleRule } = useSharingRuleByModule(selectedModule);

  const [localSharingType, setLocalSharingType] = useState<SharingType>("private");
  const [localExceptions, setLocalExceptions] = useState<SharingException[]>([]);
  const [dirty, setDirty] = useState(false);

  const createRuleMutation = useCreateSharingRule();
  const updateRuleMutation = useUpdateSharingRule();

  // Map rules by module
  const rulesByModule = useMemo(() => {
    const map: Record<string, SharingRuleDetail> = {};
    for (const rule of allRules as SharingRuleDetail[]) {
      map[rule.module] = rule;
    }
    return map;
  }, [allRules]);

  // Initialize local state from selected rule
  useEffect(() => {
    if (selectedModule) {
      const rule = rulesByModule[selectedModule];
      if (rule) {
        setLocalSharingType(rule.default_sharing);
        setLocalExceptions(rule.exceptions || []);
      } else {
        setLocalSharingType("private");
        setLocalExceptions([]);
      }
      setDirty(false);
    }
  }, [selectedModule, rulesByModule]);

  const handleSharingTypeChange = (type: SharingType) => {
    setLocalSharingType(type);
    setDirty(true);
  };

  const handleExceptionsChange = (exceptions: SharingException[]) => {
    setLocalExceptions(exceptions);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedModule) return;

    const existingRule = rulesByModule[selectedModule];

    try {
      if (existingRule) {
        await updateRuleMutation.mutateAsync({
          ruleId: existingRule.id,
          data: {
            default_sharing: localSharingType,
            exceptions: localExceptions,
          },
        });
      } else {
        await createRuleMutation.mutateAsync({
          module: selectedModule,
          default_sharing: localSharingType,
          exceptions: localExceptions,
        });
      }
      showSuccessToast("Sharing rules updated");
      setDirty(false);
    } catch {
      showErrorToast("Failed to update sharing rules");
    }
  };

  const selectedModuleInfo = CRM_MODULES.find((m) => m.code === selectedModule);
  const isLoading = loadingRules;
  const isSaving = createRuleMutation.isPending || updateRuleMutation.isPending;

  if (!canReadSharing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Share2 className="h-10 w-10 opacity-30 mb-3" />
        <p>You don&apos;t have permission to view data sharing rules</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading sharing rules...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Data Sharing Rules</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Control how records are shared across your organization
          </p>
        </div>
        {dirty && canWriteSharing && (
          <Button
            onClick={handleSave}
            size="sm"
            disabled={isSaving}
            className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Save Changes</span>
          </Button>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Data sharing rules determine the default visibility of records. Private means only the owner
          and users higher in the role hierarchy can access. You can add exceptions to share with
          specific roles or territories.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:flex-1 lg:min-h-0">
        {/* Module cards */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            CRM Modules
          </p>
          <div className="space-y-3">
            {CRM_MODULES.map((module) => (
              <ModuleCard
                key={module.code}
                module={module}
                rule={rulesByModule[module.code] || null}
                isSelected={selectedModule === module.code}
                onSelect={() => setSelectedModule(module.code)}
              />
            ))}
          </div>
        </div>

        {/* Rule editor */}
        <div className="lg:col-span-2">
          <Card className="border border-border p-4 lg:p-6 h-full">
            {!selectedModule ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                <Share2 className="h-10 w-10 opacity-30 mb-3" />
                <p className="text-sm">Select a module to configure sharing rules</p>
              </div>
            ) : loadingModuleRule ? (
              <div className="flex items-center justify-center h-full py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Module header */}
                <div className="flex items-center gap-3">
                  {selectedModuleInfo && (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {(() => {
                          const Icon = MODULE_ICONS[selectedModuleInfo.code] || FileText;
                          return <Icon className="h-6 w-6 text-primary" />;
                        })()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">
                          {selectedModuleInfo.label}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Configure sharing rules for {selectedModuleInfo.label.toLowerCase()}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <hr className="border-border" />

                {/* Default sharing type */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Default Sharing</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SHARING_TYPE_OPTIONS.map((option) => {
                      const Icon = SHARING_TYPE_ICONS[option.value];
                      const isSelected = localSharingType === option.value;
                      const colorClass = SHARING_TYPE_COLORS[option.value];

                      return (
                        <button
                          key={option.value}
                          onClick={() => canWriteSharing && handleSharingTypeChange(option.value)}
                          disabled={!canWriteSharing}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            isSelected
                              ? `${colorClass} border-current`
                              : "border-border hover:border-muted-foreground/30"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium text-sm">{option.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Exceptions */}
                <ExceptionEditor
                  exceptions={localExceptions}
                  onChange={handleExceptionsChange}
                  disabled={!canWriteSharing}
                  roles={roles.map((r) => ({ id: r.id, name: r.name }))}
                  territories={territories.map((t) => ({ id: t.id, name: t.name }))}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
