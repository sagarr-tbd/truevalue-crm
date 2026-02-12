import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

// Optimized Inter font configuration
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Prevent invisible text during font load
  variable: "--font-inter", // CSS variable for Tailwind
  weight: ["400", "500", "600", "700"], // Only load weights we use
  preload: true, // Preload for better performance
});

export const metadata: Metadata = {
  title: "TruevalueCRM - Customer Relationship Management",
  description: "Modern CRM solution for managing contacts, leads, and deals",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
