import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000';
const BILLING_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Middleware to check CRM subscription before allowing access
 * Redirects to platform product page if no active subscription
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and API calls
  const publicPaths = ['/login', '/register', '/_next', '/api', '/static', '/favicon.ico', '/logo'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get access token from cookies
  const accessToken = request.cookies.get('access_token')?.value;

  // If no token, redirect to platform login
  if (!accessToken) {
    const loginUrl = new URL('/login', PLATFORM_URL);
    loginUrl.searchParams.set('redirect', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Check CRM subscription via billing API
    const response = await fetch(`${BILLING_API_URL}/billing/api/v1/services/crm/subscription`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // If subscription check fails or no subscription found, redirect to products page
    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        // No subscription found - redirect to product selection
        const productsUrl = new URL('/onboarding/products', PLATFORM_URL);
        return NextResponse.redirect(productsUrl);
      }

      // Other errors (network, etc.) - let them through but log
      console.error('Subscription check failed:', response.status);
      return NextResponse.next();
    }

    const subscription = await response.json();

    // Check if subscription is active
    const validStatuses = ['active', 'trialing'];
    if (!subscription || !validStatuses.includes(subscription.status)) {
      // Subscription not active - redirect to products page
      const productsUrl = new URL('/onboarding/products', PLATFORM_URL);
      return NextResponse.redirect(productsUrl);
    }

    // Valid subscription - allow access
    return NextResponse.next();
  } catch (error) {
    // On error, log but allow access (fail open for better UX)
    console.error('Error checking subscription:', error);
    return NextResponse.next();
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png (metadata files)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|logo|public).*)',
  ],
};
