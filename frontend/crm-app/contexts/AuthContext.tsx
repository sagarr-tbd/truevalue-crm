"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { TokenManager, decodeJWT, JWTClaims } from "@/lib/api/client";

/**
 * User interface matching TrueValueCRM shell
 */
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

/**
 * Organization interface
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
}

/**
 * Auth Context State
 */
interface AuthContextState {
  user: User | null;
  organization: Organization | null;
  claims: JWTClaims | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  signOut: () => void;
  getInitials: () => string;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Redirect to TrueValueCRM shell login
 */
function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    const shellUrl = process.env.NEXT_PUBLIC_SHELL_URL || 'http://localhost:3000';
    const currentUrl = window.location.href;
    window.location.href = `${shellUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;
  }
}

/**
 * Auth Provider Component
 * 
 * Reads authentication state from shared localStorage tokens
 * set by TrueValueCRM shell.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [claims, setClaims] = useState<JWTClaims | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state from stored tokens (cookies)
   */
  useEffect(() => {
    const initAuth = () => {

      const token = TokenManager.getAccessToken();
      
      if (token) {
        const decodedClaims = decodeJWT(token);
        
        if (decodedClaims) {
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (decodedClaims.exp < now) {
            TokenManager.clearTokens();
            redirectToLogin();
            return;
          }

          setClaims(decodedClaims);
          
          // Extract user info from claims
          setUser({
            id: decodedClaims.sub,
            email: decodedClaims.email,
          });
          
          // Extract org info from claims
          setOrganization({
            id: decodedClaims.org_id,
            name: decodedClaims.org_name,
            slug: decodedClaims.org_slug,
          });
        }
      } else {
        // No token - redirect to login
        redirectToLogin();
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Sign out - clear tokens and redirect to shell
   */
  const signOut = useCallback(() => {
    TokenManager.clearTokens();
    setUser(null);
    setOrganization(null);
    setClaims(null);
    
    // Redirect to shell login
    if (typeof window !== 'undefined') {
      const shellUrl = process.env.NEXT_PUBLIC_SHELL_URL || 'http://localhost:3000';
      window.location.href = `${shellUrl}/login`;
    }
  }, []);

  /**
   * Get user initials
   */
  const getInitials = useCallback((): string => {
    if (!user) return '??';
    
    // Try to extract from email if no name
    const email = user.email;
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    
    // Use email parts
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return email.substring(0, 2).toUpperCase();
  }, [user]);

  /**
   * Check if user has permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!claims) return false;
    return claims.permissions?.includes(permission) ?? false;
  }, [claims]);

  /**
   * Check if user has role
   */
  const hasRole = useCallback((role: string): boolean => {
    if (!claims) return false;
    return claims.roles?.includes(role) ?? false;
  }, [claims]);

  const value: AuthContextState = {
    user,
    organization,
    claims,
    isAuthenticated: !!user && !!organization,
    isLoading,
    hasPermission,
    hasRole,
    signOut,
    getInitials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
