"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Database,
  Shield,
  Users,
  Zap,
  GitBranch,
  Lock,
  Tag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import {
  NotificationsSettings,
  SecuritySettings,
  IntegrationsSettings,
  TeamManagementSettings,
  DataManagementSettings,
  PipelinesSettings,
  RolesPermissionsSettings,
  TagManagementSettings,
} from "@/components/Settings";
import { usePermission, ORG_MANAGE_MEMBERS, DEALS_MANAGE_PIPELINE, CONTACTS_WRITE } from "@/lib/permissions";

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
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    color: "from-secondary to-brand-purple",
  },
  {
    id: "security",
    label: "Security & Privacy",
    icon: Shield,
    color: "from-destructive to-brand-coral",
  },
  {
    id: "integrations",
    label: "API & Integrations",
    icon: Zap,
    color: "from-brand-coral to-brand-teal",
  },
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
    id: "data",
    label: "Data Management",
    icon: Database,
    color: "from-primary to-brand-teal",
  },
];

export default function SettingsPage() {
  const { can, isAdmin } = usePermission();

  const settingsSections = useMemo(() => {
    return allSettingsSections.filter((s) => {
      if (s.id === "team") return isAdmin || can(ORG_MANAGE_MEMBERS);
      if (s.id === "roles") return isAdmin || can(ORG_MANAGE_MEMBERS);
      if (s.id === "pipelines") return can(DEALS_MANAGE_PIPELINE);
      if (s.id === "tags") return can(CONTACTS_WRITE);
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
      case "notifications":
        return <NotificationsSettings />;
      case "security":
        return <SecuritySettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "team":
        return <TeamManagementSettings />;
      case "roles":
        return <RolesPermissionsSettings />;
      case "data":
        return <DataManagementSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences"
        icon={Settings}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="border border-border p-4 h-fit">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.color} text-white flex items-center justify-center`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{section.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card className="border border-border p-6">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </Card>
        </div>
      </div>
    </div>
  );
}
