import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  console.log('Middleware executing for path:', request.nextUrl.pathname);
  
  // Don't protect the login page
  if (request.nextUrl.pathname === '/admin/login') {
    console.log('Login page access - allowing');
    return NextResponse.next()
  }

  // Protect all other /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Admin route access - checking authentication');
    const token = request.cookies.get('eden_admin_token')?.value
    console.log('Token present:', !!token);

    if (!token) {
      console.log('No token found - redirecting to login');
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Verify the session token and role
    try {
      const user = await verifySessionToken(token)
      console.log('Token verification result:', { user: !!user, role: user?.role });
      
      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        console.log('Invalid token or insufficient permissions - redirecting to login');
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    console.log('Authentication successful');

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
