"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department?: string;
  company: string;
  location?: string;
  bio?: string;
  joinDate?: string;
  profileImage?: string | null;
}

interface UserContextType {
  user: User;
  updateUser: (userData: Partial<User>) => void;
  getInitials: () => string;
  signOut: () => void;
}

const defaultUser: User = {
  firstName: "Sagar",
  lastName: "Ramani",
  email: "sagar@truevaluecrm.com",
  phone: "+1 (555) 123-4567",
  jobTitle: "Sales Manager",
  department: "Sales",
  company: "TrueValue CRM",
  location: "San Francisco, CA",
  bio: "Experienced sales professional with a passion for building customer relationships and driving revenue growth.",
  joinDate: "January 2024",
  profileImage: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);

  // Load user data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user data");
      }
    }
  }, []);

  const updateUser = (userData: Partial<User>) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("crm_user", JSON.stringify(updatedUser));
  };

  const getInitials = () => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const signOut = () => {
    localStorage.removeItem("crm_user");
    localStorage.removeItem("crm_auth_token");
    // In production, clear all user-related data and redirect to login
    window.location.href = "/";
  };

  return (
    <UserContext.Provider value={{ user, updateUser, getInitials, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
