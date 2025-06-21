import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  console.log('=== MIDDLEWARE DEBUG ===');
  console.log('Path:', request.nextUrl.pathname);
  console.log('Method:', request.method);
  console.log('Cookies:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value })));
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  // Create a response object that we'll modify with headers
  const response = NextResponse.next();
  
  // Add Content Security Policy headers to allow hCaptcha, Google Fonts, and other services
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com https://js.stripe.com https://fonts.googleapis.com; " +
    "style-src-elem 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com https://fonts.googleapis.com; " +
    "frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://js.stripe.com https://payments.stripe.com https://checkout.link.com; " +
    "img-src 'self' data: blob: https://*.stripe.com https://hcaptcha.com https://*.hcaptcha.com; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://api.hcaptcha.com " +
    "https://newassets.hcaptcha.com https://www.google-analytics.com https://analytics.google.com " +
    "https://play.google.com https://www.recaptcha.net https://www.gstatic.com https://*.ingest.sentry.io " +
    "https://api.segment.io https://csp.withgoogle.com https://api.stripe.com " +
    "https://*.supabase.co https://*.supabase.in https://dlzfhnnwyvddaoikrung.supabase.co; " +
    "object-src 'self' data: blob:;"
  );
  
  // Don't protect public pages
  if (
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname === '/forgot-password' ||
    request.nextUrl.pathname === '/reset-password'
  ) {
    return response;
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Bypass authentication in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing admin authentication in middleware');
      return response;
    }
    
    const token = request.cookies.get('eden_admin_token')?.value

    if (!token) {
      const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
      // Copy CSP headers to redirect response
      redirectResponse.headers.set('Content-Security-Policy', response.headers.get('Content-Security-Policy') || '');
      return redirectResponse;
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET || '')
      )
      
      if (
        typeof payload !== 'object' ||
        !payload ||
        !('role' in payload) ||
        !['ADMIN', 'SUPER_ADMIN'].includes(String(payload.role))
      ) {
        const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
        redirectResponse.headers.set('Content-Security-Policy', response.headers.get('Content-Security-Policy') || '');
        return redirectResponse;
      }
    } catch (error) {
      console.error('Admin token verification failed:', error);
      const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
      redirectResponse.headers.set('Content-Security-Policy', response.headers.get('Content-Security-Policy') || '');
      return redirectResponse;
    }

    return response
  }

  // Protect client routes, change-password, and payment methods API
  if (
    request.nextUrl.pathname.startsWith('/client') ||
    request.nextUrl.pathname === '/change-password' ||
    request.nextUrl.pathname.startsWith('/api/payment-methods')
  ) {
    const token = request.cookies.get('eden_patient_token')?.value
    console.log('Patient token present:', !!token);

    if (!token) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.headers.set('Content-Security-Policy', response.headers.get('Content-Security-Policy') || '');
      return redirectResponse;
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET || '')
      )
      
      console.log('Session verification result:', { 
        success: !!payload,
        role: payload?.role,
        email: payload?.email,
        isPatient: payload?.role === 'PATIENT',
        patientId: payload?.role === 'PATIENT' ? String(payload.id) : undefined
      });

      if (
        typeof payload !== 'object' ||
        !payload ||
        !('role' in payload) ||
        String(payload.role) !== 'PATIENT'
      ) {
        const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
        redirectResponse.headers.set('Content-Security-Policy', response.headers.get('Content-Security-Policy') || '');
        return redirectResponse;
      }
    } catch (error) {
      console.error('Client token verification failed:', error);
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.headers.set('Content-Security-Policy', response.headers.get('Content-Security-Policy') || '');
      return redirectResponse;
    }

    return response;
  }

  return response;
}

export const config = {
  matcher: [
    // BEFORE: The problematic pattern '/((?!api/|_next/|.netlify/functions/).)*' was matching
    // all routes EXCEPT those starting with the listed prefixes, which actually INCLUDED
    // API routes in middleware processing, causing redirects.
    
    // AFTER: We now explicitly list only the routes that should be protected by middleware
    // This ensures API routes are completely excluded from middleware processing
    
    // Test cases:
    // /admin/dashboard - Will be protected by middleware
    // /client/profile - Will be protected by middleware
    // /change-password - Will be protected by middleware
    // /api/payment-methods/* - Will be protected by middleware (special case)
    // /api/products - Will NOT be processed by middleware
    // /api/create-checkout-session - Will NOT be processed by middleware
    // /_next/* - Will NOT be processed by middleware
    
    // Protected routes
    '/admin/:path*',
    '/client/:path*',
    '/change-password',
    
    // Special case - only this specific API route needs protection
    '/api/payment-methods/:path*'
  ],
}
