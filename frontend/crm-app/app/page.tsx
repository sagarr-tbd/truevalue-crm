"use client";

import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Users, 
  TrendingUp, 
  BarChart3,
  Package,
  Headphones,
  Briefcase,
  Calendar,
  Plug
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  const features = [
    {
      icon: TrendingUp,
      title: "Sales Management",
      description: "Manage leads, contacts, accounts, deals, and campaigns efficiently",
      color: "teal",
      link: "/sales/leads",
    },
    {
      icon: Calendar,
      title: "Activity Tracking",
      description: "Track tasks, schedule calls and meetings seamlessly",
      color: "coral",
      link: "/activities/tasks",
    },
    {
      icon: Package,
      title: "Inventory Control",
      description: "Manage products, vendors, orders, quotes, and invoices",
      color: "purple",
      link: "/inventory/products",
    },
    {
      icon: Headphones,
      title: "Customer Support",
      description: "Handle support cases and maintain knowledge base solutions",
      color: "teal",
      link: "/support/cases",
    },
    {
      icon: Briefcase,
      title: "Projects & Services",
      description: "Plan and deliver projects and services to your clients",
      color: "coral",
      link: "/projects",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Get insights with comprehensive analytics and reporting",
      color: "purple",
      link: "/analytics",
    },
    {
      icon: Plug,
      title: "Integrations",
      description: "Connect with email, social media, and visitor tracking tools",
      color: "teal",
      link: "/integrations",
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Manage user profiles, teams, permissions and settings",
      color: "coral",
      link: "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50">
      {/* Header/Nav */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-6"
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-full.png"
              alt="TruevalueCRM Logo"
              width={200}
              height={50}
              className="object-contain"
              priority
            />
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
          >
            Welcome to{" "}
            <span className="bg-gradient-to-r from-brand-teal via-brand-coral to-brand-purple bg-clip-text text-transparent">
              TruevalueCRM
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 mb-8"
          >
            The modern CRM solution that helps you build better customer relationships,
            close more deals, and grow your business.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4 justify-center"
          >
            <Link href="/dashboard">
              <Button size="lg" className="text-lg">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg">
                View Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="container mx-auto px-4 py-20"
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          Complete CRM Solution for Your Business
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const colorClasses = {
              teal: "bg-primary/10 text-primary",
              coral: "bg-accent/10 text-accent",
              purple: "bg-secondary/10 text-secondary",
            };
            
            return (
              <Link key={feature.title} href={feature.link}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
