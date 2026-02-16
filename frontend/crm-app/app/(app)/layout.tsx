"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Target,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  HelpCircle,
  Moon,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Building,
  DollarSign,
  CheckSquare,
  Calendar,
  Phone,
  // Phase 2 Icons - Uncomment when enabling Phase 2 features
  // FileText,
  // LineChart,
  // FolderOpen,
  // Megaphone,
  // Package,
  // HeadphonesIcon,
  // Plug,
  // BookOpen,
  // ClipboardList,
  // ShoppingCart,
  // Receipt,
  // Store,
  // Ticket,
  // Lightbulb,
  // Mail,
  // Share2,
  // MapPin,
  // Wrench,
  // FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationPanel from "@/components/NotificationPanel";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useKeyboardShortcuts } from "@/hooks";
import { useUIStore } from "@/stores";

type NavigationLink = {
  name: string;
  href: string;
  icon: any;
  type: "link";
};

type NavigationSection = {
  name: string;
  icon: any;
  type: "section";
  children: {
    name: string;
    href: string;
    icon: any;
  }[];
};

type NavigationItem = NavigationLink | NavigationSection;

const navigation: NavigationItem[] = [
  { 
    name: "Home", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    type: "link"
  },
  { 
    name: "Reports", 
    href: "/reports", 
    icon: BarChart3,
    type: "link"
  },
  { 
    name: "Analytics", 
    href: "/analytics", 
    icon: PieChart,
    type: "link"
  },
  {
    name: "Sales",
    icon: TrendingUp,
    type: "section",
    children: [
      { name: "Leads", href: "/sales/leads", icon: Target },
      { name: "Contacts", href: "/sales/contacts", icon: Users },
      { name: "Accounts", href: "/sales/accounts", icon: Building },
      { name: "Deals", href: "/sales/deals", icon: DollarSign },
      // Phase 2: Forecasts, Documents, Campaigns
      // { name: "Forecasts", href: "/sales/forecasts", icon: LineChart },
      // { name: "Documents", href: "/sales/documents", icon: FolderOpen },
      // { name: "Campaigns", href: "/sales/campaigns", icon: Megaphone },
    ],
  },
  {
    name: "Activities",
    icon: CheckSquare,
    type: "section",
    children: [
      { name: "Calendar", href: "/activities/calendar", icon: Calendar },
      { name: "Tasks", href: "/activities/tasks", icon: CheckSquare },
      { name: "Meetings", href: "/activities/meetings", icon: Calendar },
      { name: "Calls", href: "/activities/calls", icon: Phone },
    ],
  },
  // Phase 2: Inventory Management
  // {
  //   name: "Inventory",
  //   icon: Package,
  //   type: "section",
  //   children: [
  //     { name: "Products", href: "/inventory/products", icon: Package },
  //     { name: "Price Books", href: "/inventory/price-books", icon: BookOpen },
  //     { name: "Quotes", href: "/inventory/quotes", icon: FileText },
  //     { name: "Sales Orders", href: "/inventory/sales-orders", icon: ShoppingCart },
  //     { name: "Purchase Orders", href: "/inventory/purchase-orders", icon: ClipboardList },
  //     { name: "Invoices", href: "/inventory/invoices", icon: Receipt },
  //     { name: "Vendors", href: "/inventory/vendors", icon: Store },
  //   ],
  // },
  // Phase 2: Support/Help Desk
  // {
  //   name: "Support",
  //   icon: HeadphonesIcon,
  //   type: "section",
  //   children: [
  //     { name: "Cases", href: "/support/cases", icon: Ticket },
  //     { name: "Solutions", href: "/support/solutions", icon: Lightbulb },
  //   ],
  // },
  // Phase 2: Integrations
  // {
  //   name: "Integrations",
  //   icon: Plug,
  //   type: "section",
  //   children: [
  //     { name: "Overview", href: "/integrations", icon: Plug },
  //     { name: "Email", href: "/integrations/email", icon: Mail },
  //     { name: "Social", href: "/integrations/social", icon: Share2 },
  //     { name: "Visits", href: "/integrations/visits", icon: MapPin },
  //   ],
  // },
  // Phase 2: Services
  // { 
  //   name: "Services", 
  //   href: "/services", 
  //   icon: Wrench,
  //   type: "link", 
  // },
  // Phase 2: Projects
  // {
  //   name: "Projects",
  //   href: "/projects",
  //   icon: FolderKanban,
  //   type: "link",
  // },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings,
    type: "link"
  },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, organization, getInitials, signOut, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Use Zustand for sidebar state (persisted)
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const isSidebarOpen = !sidebarCollapsed;

  const sidebarWidth = isSidebarOpen ? 260 : 100;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileDropdownOpen]);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "k",
        meta: true,
        ctrl: true,
        description: "Focus search",
        action: () => {
          searchInputRef.current?.focus();
        },
      },
      {
        key: "/",
        meta: true,
        ctrl: true,
        description: "Show shortcuts help",
        action: () => {
          setShowShortcutsHelp(true);
        },
      },
      {
        key: "Escape",
        description: "Close modals",
        action: () => {
          if (showShortcutsHelp) {
            setShowShortcutsHelp(false);
          } else if (isNotificationOpen) {
            setIsNotificationOpen(false);
          } else if (isProfileDropdownOpen) {
            setIsProfileDropdownOpen(false);
          } else if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
          }
        },
        preventDefault: false,
      },
    ],
  });

  // Show loading state while auth is initializing (AFTER all hooks)
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((name) => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Full Height with Logo */}
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="hidden lg:block fixed top-0 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 shadow-sm z-40 overflow-visible"
      >
        <div className="flex flex-col h-full">
          {/* Logo Section with Toggle */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 h-16 gap-2 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center flex-1">
              {isSidebarOpen ? (
                <Image
                  src="/logo-full.png"
                  alt="TruevalueCRM"
                  width={140}
                  height={35}
                  className="object-contain"
                  priority
                />
              ) : (
                <Image
                  src="/just-logo.png"
                  alt="TruevalueCRM"
                  width={40}
                  height={40}
                  className="object-contain mx-auto"
                  priority
                />
              )}
            </Link>
            
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleSidebar()}
              className="hover:bg-gray-100 flex-shrink-0"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide" style={{ maxHeight: "calc(100vh - 128px)" }}>
            {navigation.map((item) => {
              if (item.type === "link") {
                const linkItem = item as NavigationLink;
                const isActive = pathname === linkItem.href || pathname.startsWith(linkItem.href + '/');
                return (
                  <Link key={linkItem.name} href={linkItem.href}>
                    <motion.div
                      whileHover={{ scale: !isSidebarOpen ? 1.05 : 1, x: isSidebarOpen ? 2 : 0 }}
                      className={`flex ${isSidebarOpen ? 'flex-row' : 'flex-col'} items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'} ${isSidebarOpen ? 'gap-3 px-4 py-3' : 'gap-2 px-2 py-3'} rounded-lg transition-all relative group ${
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <linkItem.icon className="h-5 w-5 flex-shrink-0" />
                      {isSidebarOpen ? (
                        <span className="text-sm font-medium whitespace-nowrap">
                          {linkItem.name}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-center leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                          {linkItem.name}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                );
              }

              // Section with children
              if (item.type === "section") {
                const sectionItem = item as NavigationSection;
                const isExpanded = expandedSections.includes(sectionItem.name);
                const hasActiveChild = sectionItem.children.some(
                  (child) => pathname === child.href || pathname.startsWith(child.href + '/')
                );

                return (
                  <div key={sectionItem.name} className="relative">
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(sectionItem.name)}
                      className={`flex ${isSidebarOpen ? 'flex-row' : 'flex-col'} items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'} ${isSidebarOpen ? 'gap-3 px-4 py-3' : 'gap-2 px-2 py-3'} rounded-lg transition-all w-full relative ${
                        hasActiveChild
                          ? "text-primary bg-primary/5"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <sectionItem.icon className="h-5 w-5 flex-shrink-0" />
                      {isSidebarOpen ? (
                        <>
                          <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">
                            {sectionItem.name}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.div>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-semibold text-center leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                            {sectionItem.name}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </motion.div>
                        </>
                      )}
                    </button>

                    {/* Children Links - Collapsible with Animation */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {isSidebarOpen ? (
                            <div className="mt-2 space-y-1 pl-4">
                              {sectionItem.children.map((child) => {
                                const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                return (
                                  <Link key={child.name} href={child.href}>
                                    <motion.div
                                      whileHover={{ x: 2 }}
                                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                        isChildActive
                                          ? "bg-primary text-white shadow-sm"
                                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                      }`}
                                    >
                                      <child.icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-sm font-medium whitespace-nowrap">
                                        {child.name}
                                      </span>
                                    </motion.div>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-1 space-y-1">
                              {sectionItem.children.map((child) => {
                                const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                return (
                                  <Link key={child.name} href={child.href}>
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      className={`flex flex-col items-center justify-center gap-2 px-2 py-3 rounded-lg transition-all ${
                                        isChildActive
                                          ? "bg-primary text-white shadow-sm"
                                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                      }`}
                                    >
                                      <child.icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-[10px] font-semibold text-center leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                        {child.name}
                                      </span>
                                    </motion.div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return null;
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            <button
              className={`flex ${isSidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center ${isSidebarOpen ? 'gap-3 px-4 py-3' : 'gap-2 px-2 py-3'} rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all w-full`}
            >
              <LogOut className={`${isSidebarOpen ? 'h-5 w-5' : 'h-5 w-5'} flex-shrink-0`} />
              {isSidebarOpen ? (
                <span className="font-medium whitespace-nowrap">Logout</span>
              ) : (
                <span className="text-[10px] font-semibold text-center leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Responsive */}
      <div
        className="flex-1 min-h-screen transition-all duration-300 lg:ml-[var(--sidebar-width)]"
        style={{ 
          '--sidebar-width': `${sidebarWidth}px`
        } as React.CSSProperties}
      >
        {/* Top Header Bar - Sticky */}
        <header className="sticky top-0 h-16 bg-white border-b border-gray-200 z-[60] shadow-sm backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Left - Search Bar - Hidden on small mobile, visible on tablet+ */}
            <div className="hidden sm:flex flex-1 max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search..."
                  className="pl-10 bg-gray-50 border-gray-200 w-full"
                />
              </div>
            </div>

            {/* Mobile - Show menu button and essential icons */}
            <div className="flex sm:hidden flex-1">
              <button
                className="p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </div>

            {/* Right - Action Icons & Profile - Responsive */}
            <div className="flex items-center gap-2 sm:gap-4 relative">
              {/* Help - Hidden on mobile */}
              <div className="hidden md:block relative group/help">
                <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                  <HelpCircle className="h-5 w-5 text-gray-600" />
                </Button>
                <div className="absolute top-full right-0 mt-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg invisible group-hover/help:visible transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                  Help & Support
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>

              {/* Dark Mode - Hidden on mobile */}
              <div className="hidden md:block relative group/dark">
                <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                  <Moon className="h-5 w-5 text-gray-600" />
                </Button>
                <div className="absolute top-full right-0 mt-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg invisible group-hover/dark:visible transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                  Dark Mode
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>

              {/* Notifications */}
              <NotificationPanel
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                onToggle={() => setIsNotificationOpen(!isNotificationOpen)}
                notificationCount={3}
              />

              {/* User Profile with Dropdown - Click to toggle */}
              <div className="relative" ref={profileDropdownRef}>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-gray-100 p-2"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-teal to-brand-purple flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials()}
                  </div>
                  <ChevronDown className="hidden sm:block h-4 w-4 text-gray-600" />
                </Button>
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[100]">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">
                        {user?.first_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {organization && (
                        <p className="text-xs text-gray-400 mt-1">{organization.name}</p>
                      )}
                    </div>
                    <div className="p-2">
                      <Link href="/settings/profile">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md text-gray-700"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          My Profile
                        </button>
                      </Link>
                      <Link href="/settings">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md text-gray-700"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          Settings
                        </button>
                      </Link>
                      <Link href="/settings/billing">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md text-gray-700"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          Billing
                        </button>
                      </Link>
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          if (confirm("Are you sure you want to sign out?")) {
                            signOut();
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 rounded-md text-red-600 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - Responsive padding */}
        <main className="p-3 sm:p-4 md:p-6 max-w-full">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-[90]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-[95] shadow-2xl overflow-y-auto"
            >
              <div className="flex flex-col h-full overflow-y-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <Image
                    src="/logo-full.png"
                    alt="TruevalueCRM"
                    width={140}
                    height={35}
                    className="object-contain"
                    priority
                  />
                </div>

                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                  {navigation.map((item) => {
                    if (item.type === "link") {
                      const linkItem = item as NavigationLink;
                      const isActive = pathname === linkItem.href || pathname.startsWith(linkItem.href + '/');
                      return (
                        <Link key={linkItem.name} href={linkItem.href}>
                          <div
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                              isActive
                                ? "bg-primary text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <linkItem.icon className="h-5 w-5" />
                            <span className="font-medium">{linkItem.name}</span>
                          </div>
                        </Link>
                      );
                    }

                    if (item.type === "section") {
                      const sectionItem = item as NavigationSection;
                      const isExpanded = expandedSections.includes(sectionItem.name);

                      return (
                        <div key={sectionItem.name}>
                          <button
                            onClick={() => toggleSection(sectionItem.name)}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-gray-700 hover:bg-gray-100"
                          >
                            <sectionItem.icon className="h-5 w-5" />
                            <span className="font-medium flex-1 text-left">
                              {sectionItem.name}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-1 space-y-1 pl-4">
                                  {sectionItem.children.map((child) => {
                                    const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                    return (
                                      <Link key={child.name} href={child.href}>
                                        <div
                                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                            isChildActive
                                              ? "bg-primary text-white"
                                              : "text-gray-600 hover:bg-gray-100"
                                          }`}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                          <child.icon className="h-4 w-4" />
                                          <span>{child.name}</span>
                                        </div>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    return null;
                  })}
                </nav>

                <div className="p-3 border-t border-gray-200">
                  <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all w-full">
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}
