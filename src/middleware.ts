import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  console.log('=== MIDDLEWARE DEBUG ===');
  console.log('Path:', request.nextUrl.pathname);
  console.log('Method:', request.method);
  console.log('Cookies:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value })));
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  // Don't protect public pages
  if (
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname === '/forgot-password' ||
    request.nextUrl.pathname === '/reset-password'
  ) {
    return NextResponse.next()
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Bypass authentication in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing admin authentication in middleware');
      return NextResponse.next();
    }
    
    const token = request.cookies.get('eden_admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
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
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch (error) {
      console.error('Admin token verification failed:', error);
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
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
      return NextResponse.redirect(new URL('/login', request.url))
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
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      console.error('Client token verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client/:path*',
    '/change-password',
    '/api/payment-methods(.*)*'
  ],
}
