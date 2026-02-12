"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Database,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import {
  NotificationsSettings,
  SecuritySettings,
  IntegrationsSettings,
  TeamManagementSettings,
  DataManagementSettings,
} from "@/components/Settings";

const settingsSections = [
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
    id: "data",
    label: "Data Management",
    icon: Database,
    color: "from-primary to-brand-teal",
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("notifications");

  const renderContent = () => {
    switch (activeSection) {
      case "notifications":
        return <NotificationsSettings />;
      case "security":
        return <SecuritySettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "team":
        return <TeamManagementSettings />;
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
