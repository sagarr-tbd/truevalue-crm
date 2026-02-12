"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Link href="/" className="inline-block">
              <Image
                src="/logo-full.png"
                alt="TruevalueCRM"
                width={200}
                height={50}
                className="mx-auto"
              />
            </Link>
          </motion.div>

          {/* 404 Illustration */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <h1 className="text-[180px] md:text-[240px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-teal via-brand-coral to-brand-purple leading-none">
                404
              </h1>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="absolute -top-8 -right-8 text-6xl"
              >
                🔍
              </motion.div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Don&apos;t worry, even the best CRM systems have pages that go missing sometimes. Let&apos;s get you back on track!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:shadow-lg transition-all group"
              >
                <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Go to Dashboard
              </Button>
            </Link>

            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
              className="border-2 hover:border-primary hover:text-primary transition-all group"
            >
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Dashboard</h3>
                <p className="text-sm text-gray-500">
                  View your CRM overview
                </p>
              </motion.div>
            </Link>

            <Link href="/dashboard/contacts">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Search</h3>
                <p className="text-sm text-gray-500">
                  Find contacts & leads
                </p>
              </motion.div>
            </Link>

            <Link href="/dashboard/settings">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Help Center</h3>
                <p className="text-sm text-gray-500">
                  Get support & guides
                </p>
              </motion.div>
            </Link>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <Link
                href="/dashboard/settings"
                className="text-primary hover:text-primary/80 font-medium underline"
              >
                Contact Support
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
