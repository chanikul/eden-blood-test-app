import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

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
    const token = request.cookies.get('eden_admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const user = await verifySessionToken(token)
      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
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
      const user = await verifySessionToken(token)
      console.log('Session verification result:', { 
        success: !!user, 
        role: user?.role,
        email: user?.email,
        isPatient: user?.role === 'PATIENT',
        patientId: user?.role === 'PATIENT' ? (user as { id: string }).id : undefined
      });
      if (!user || user.role !== 'PATIENT') {
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
