import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * API Client Configuration
 * 
 * This client integrates with TrueValueCRM's authentication system.
 * It reads tokens from cookies that are shared with the TrueValueCRM shell.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Cookie utilities for cross-subdomain auth sharing
 */
const CookieUtils = {
  /**
   * Get cookie domain for sharing across subdomains
   * - localhost: no domain (same host, different ports share cookies)
   * - production: .example.com (shared across subdomains)
   */
  getCookieDomain(): string {
    if (typeof window === 'undefined') return '';
    
    const hostname = window.location.hostname;
    
    // For localhost, don't set domain - cookies are shared across ports
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }
    
    // For production, extract root domain (e.g., .truevaluecrm.com)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return '.' + parts.slice(-2).join('.');
    }
    
    return '';
  },

  /**
   * Set a cookie with proper attributes for cross-subdomain sharing
   */
  set(name: string, value: string, days: number = 7): void {
    if (typeof window === 'undefined') return;
    
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const domain = this.getCookieDomain();
    const isSecure = window.location.protocol === 'https:';
    
    let cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    
    if (domain) {
      cookie += `; domain=${domain}`;
    }
    
    if (isSecure) {
      cookie += '; Secure';
    }
    
    document.cookie = cookie;
  },

  /**
   * Get a cookie value by name
   */
  get(name: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  },

  /**
   * Delete a cookie
   */
  delete(name: string): void {
    if (typeof window === 'undefined') return;
    
    const domain = this.getCookieDomain();
    let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    
    if (domain) {
      cookie += `; domain=${domain}`;
    }
    
    document.cookie = cookie;
  },
};

/**
 * Token Storage Manager - Uses Cookies for cross-subdomain sharing
 * 
 * Uses the same keys as TrueValueCRM shell for shared authentication.
 * Cookies are automatically shared across subdomains and ports.
 */
class TokenManager {
  // Same keys as TrueValueCRM shell
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly EXPIRES_AT_KEY = 'expires_at';

  static setTokens(tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }): void {
    if (typeof window === 'undefined') return;

    const expiresAt = Date.now() + tokens.expires_in * 1000;
    
    // Store in cookies for cross-subdomain sharing
    CookieUtils.set(this.ACCESS_TOKEN_KEY, tokens.access_token, 7);
    CookieUtils.set(this.REFRESH_TOKEN_KEY, tokens.refresh_token, 30);
    CookieUtils.set(this.EXPIRES_AT_KEY, expiresAt.toString(), 7);
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return CookieUtils.get(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return CookieUtils.get(this.REFRESH_TOKEN_KEY);
  }

  static getExpiresAt(): number | null {
    if (typeof window === 'undefined') return null;
    const expiresAt = CookieUtils.get(this.EXPIRES_AT_KEY);
    return expiresAt ? parseInt(expiresAt, 10) : null;
  }

  static isTokenExpiringSoon(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;
    return Date.now() + TOKEN_REFRESH_THRESHOLD >= expiresAt;
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    CookieUtils.delete(this.ACCESS_TOKEN_KEY);
    CookieUtils.delete(this.REFRESH_TOKEN_KEY);
    CookieUtils.delete(this.EXPIRES_AT_KEY);
  }

  static hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }
}

/**
 * JWT Claims interface
 */
export interface JWTClaims {
  sub: string;
  email: string;
  org_id: string;
  org_slug: string;
  org_name: string;
  roles: string[];
  permissions: string[];
  plan?: string;
  session_id?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

/**
 * Decode JWT token (client-side, no verification)
 */
export function decodeJWT(token: string): JWTClaims | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded as JWTClaims;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * API Response types
 */
export interface APIResponse<T = any> {
  data?: T;
  error?: APIError;
  status: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
}

/**
 * API Client Class with Auto-Refresh
 */
class APIClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Check if token needs refresh
        if (TokenManager.isTokenExpiringSoon() && TokenManager.hasTokens()) {
          try {
            await this.refreshAccessToken();
          } catch (error) {
            console.error('Token refresh failed:', error);
            TokenManager.clearTokens();
            // Redirect to main app login
            if (typeof window !== 'undefined') {
              const shellUrl = process.env.NEXT_PUBLIC_SHELL_URL || 'http://localhost:3000';
              window.location.href = `${shellUrl}/login`;
            }
            throw error;
          }
        }

        const token = TokenManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried, try refreshing token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            const token = TokenManager.getAccessToken();
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            TokenManager.clearTokens();
            // Redirect to main app login
            if (typeof window !== 'undefined') {
              const shellUrl = process.env.NEXT_PUBLIC_SHELL_URL || 'http://localhost:3000';
              window.location.href = `${shellUrl}/login`;
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, wait for that promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<{
          access_token: string;
          refresh_token: string;
          expires_in: number;
        }>(`${API_BASE_URL}/auth/auth/refresh`, { refresh_token: refreshToken });

        const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;

        TokenManager.setTokens({
          access_token,
          refresh_token: new_refresh_token,
          expires_in,
        });

        return access_token;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Generic request method
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await this.client.request<T>(config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: APIError = error.response?.data?.error || {
          code: 'NETWORK_ERROR',
          message: error.message || 'An unexpected error occurred',
        };

        return {
          error: apiError,
          status: error.response?.status || 500,
        };
      }

      return {
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      };
    }
  }

  /**
   * HTTP Methods
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export { TokenManager, CookieUtils };
