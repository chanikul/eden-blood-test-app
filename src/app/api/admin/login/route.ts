import { NextResponse } from 'next/server';
import { validateAdminPassword, updateLastLogin } from '@/lib/services/admin';
import { generateSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const admin = await validateAdminPassword(email, password);
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login time
    await updateLastLogin(admin.id);

    // Generate session token
    const token = generateSessionToken({ email: admin.email, role: admin.role });

    const response = NextResponse.json({ success: true, admin });

    // Set session cookie
    response.cookies.set('eden_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
