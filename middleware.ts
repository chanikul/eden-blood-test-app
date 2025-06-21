import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const PROTECTED_ROUTES = {
  PATIENT: {
    paths: ['/dashboard', '/profile', '/test-results', '/appointments'],
    role: 'patient'
  },
  DOCTOR: {
    paths: ['/admin', '/admin/patients', '/admin/tests', '/admin/reports'],
    role: 'doctor'
  }
};

// Define public routes that should bypass auth
const PUBLIC_ROUTES = [
  '/login',
  '/admin-login',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get auth tokens and user role
  const authToken = request.cookies.get('auth-token');
  const userRole = request.cookies.get('user-role');
  const refreshToken = request.cookies.get('refresh-token');

  // Create response object for setting headers
  const response = NextResponse.next();

  // Check token expiration and set headers
  if (authToken) {
    try {
      // Add auth headers to upstream requests
      response.headers.set('X-User-Role', userRole?.value || '');
      response.headers.set('X-Auth-Token', authToken.value);
    } catch (error) {
      console.error('Error processing auth token:', error);
    }
  }

  // Check patient dashboard routes
  if (PROTECTED_ROUTES.PATIENT.paths.some(path => pathname.startsWith(path))) {
    if (!authToken || !refreshToken) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole?.value !== PROTECTED_ROUTES.PATIENT.role) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Check admin routes
  if (PROTECTED_ROUTES.DOCTOR.paths.some(path => pathname.startsWith(path))) {
    if (!authToken || !refreshToken) {
      // Redirect to admin login with return URL
      const adminLoginUrl = new URL('/admin-login', request.url);
      adminLoginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    if (userRole?.value !== PROTECTED_ROUTES.DOCTOR.role) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // Set Content Security Policy with proper configuration for hCaptcha and Stripe
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com 'unsafe-inline'; " +
    "style-src 'self' https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com 'unsafe-inline'; " +
    "connect-src 'self' https://api.stripe.com https://api.hcaptcha.com https://hcaptcha.com https://*.hcaptcha.com https://newassets.hcaptcha.com https://www.google-analytics.com https://analytics.google.com https://play.google.com https://www.recaptcha.net https://www.gstatic.com https://*.ingest.sentry.io https://api.segment.io https://csp.withgoogle.com; " +
    "frame-src 'self' https://js.stripe.com https://payments.stripe.com https://checkout.link.com https://hcaptcha.com https://*.hcaptcha.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:;"
  );
  
  // Only allow HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

// Update matcher to include all protected routes
export const config = {
  matcher: [
    /*
     * Match all protected routes:
     * - /dashboard/*
     * - /profile/*
     * - /test-results/*
     * - /appointments/*
     * - /admin/*
     */
    '/dashboard/:path*',
    '/profile/:path*',
    '/test-results/:path*',
    '/appointments/:path*',
    '/admin/:path*',
  ]
};
