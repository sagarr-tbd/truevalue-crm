"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  // Bell,
  // Database,
  // Shield,
  Users,
  // Zap,
  GitBranch,
  Lock,
  Tag,
  UserCog,
  Network,
  Map,
  Share2,
  Sliders,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import {
  // NotificationsSettings,
  // SecuritySettings,
  // IntegrationsSettings,
  TeamManagementSettings,
  // DataManagementSettings,
  PipelinesSettings,
  RolesPermissionsSettings,
  TagManagementSettings,
  ProfilesSettings,
  RoleHierarchySettings,
  TerritoriesSettings,
  DataSharingSettings,
  CustomFieldsSettings,
} from "@/components/Settings";
import {
  usePermission,
  ORG_MANAGE_MEMBERS,
  ROLES_READ,
  DEALS_MANAGE_PIPELINE,
  CONTACTS_WRITE,
  PROFILES_READ,
  TERRITORIES_READ,
  SHARING_RULES_READ,
} from "@/lib/permissions";

const allSettingsSections = [
  {
    id: "pipelines",
    label: "Sales Pipelines",
    icon: GitBranch,
    color: "from-brand-teal to-brand-purple",
  },
  {
    id: "tags",
    label: "Tags",
    icon: Tag,
    color: "from-brand-teal to-secondary",
  },
  {
    id: "customFields",
    label: "Custom Fields",
    icon: Sliders,
    color: "from-brand-purple to-brand-coral",
  },
  // { id: "notifications", label: "Notifications", icon: Bell, color: "from-secondary to-brand-purple" },
  // { id: "security", label: "Security & Privacy", icon: Shield, color: "from-destructive to-brand-coral" },
  // { id: "integrations", label: "API & Integrations", icon: Zap, color: "from-brand-coral to-brand-teal" },
  {
    id: "team",
    label: "Team Management",
    icon: Users,
    color: "from-brand-purple to-secondary",
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    icon: Lock,
    color: "from-brand-coral to-destructive",
  },
  {
    id: "profiles",
    label: "Security Profiles",
    icon: UserCog,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "hierarchy",
    label: "Role Hierarchy",
    icon: Network,
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "territories",
    label: "Territories",
    icon: Map,
    color: "from-teal-500 to-cyan-600",
  },
  {
    id: "sharing",
    label: "Data Sharing",
    icon: Share2,
    color: "from-orange-500 to-amber-600",
  },
  // { id: "data", label: "Data Management", icon: Database, color: "from-primary to-brand-teal" },
];

export default function SettingsPage() {
  const { can, isAdmin } = usePermission();

  const settingsSections = useMemo(() => {
    return allSettingsSections.filter((s) => {
      if (s.id === "team") return isAdmin || can(ORG_MANAGE_MEMBERS);
      if (s.id === "roles") return isAdmin || can(ROLES_READ);
      if (s.id === "pipelines") return can(DEALS_MANAGE_PIPELINE);
      if (s.id === "tags") return can(CONTACTS_WRITE);
      if (s.id === "profiles") return isAdmin || can(PROFILES_READ);
      if (s.id === "hierarchy") return isAdmin || can(ROLES_READ);
      if (s.id === "territories") return isAdmin || can(TERRITORIES_READ);
      if (s.id === "sharing") return isAdmin || can(SHARING_RULES_READ);
      if (s.id === "customFields") return can(CONTACTS_WRITE);
      return true;
    });
  }, [can, isAdmin]);

  const [activeSection, setActiveSection] = useState(
    settingsSections[0]?.id || "pipelines"
  );

  const renderContent = () => {
    switch (activeSection) {
      case "pipelines":
        return <PipelinesSettings />;
      case "tags":
        return <TagManagementSettings />;
      case "customFields":
        return <CustomFieldsSettings />;
      // case "notifications":
      //   return <NotificationsSettings />;
      // case "security":
      //   return <SecuritySettings />;
      // case "integrations":
      //   return <IntegrationsSettings />;
      case "team":
        return <TeamManagementSettings />;
      case "roles":
        return <RolesPermissionsSettings />;
      case "profiles":
        return <ProfilesSettings />;
      case "hierarchy":
        return <RoleHierarchySettings />;
      case "territories":
        return <TerritoriesSettings />;
      case "sharing":
        return <DataSharingSettings />;
      // case "data":
      //   return <DataManagementSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:h-[calc(100vh-8.5rem)]">
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences"
        icon={Settings}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 lg:flex-1 lg:min-h-0">
        {/* Settings Navigation */}
        <Card className="border border-border p-2 sm:p-4">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-hide">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg transition-colors whitespace-nowrap lg:w-full ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${section.color} text-white flex items-center justify-center shrink-0`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 min-w-0 lg:min-h-0">
          <Card className="border border-border p-3 sm:p-4 md:p-6 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden"
            >
              {renderContent()}
            </motion.div>
          </Card>
        </div>
      </div>
    </div>
  );
}
