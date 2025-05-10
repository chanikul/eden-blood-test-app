import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCredentials, generateSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    console.log('Login attempt started');
    const { email, password } = await request.json();
    console.log('Received credentials:', { email });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const isValid = await validateCredentials(email, password);
    console.log('Credentials validation:', { isValid });
    if (!isValid) {
      console.log('Invalid credentials');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateSessionToken({ email, role: 'admin' });
    console.log('Generated token:', token.substring(0, 20) + '...');
    
    // Set the token in an HTTP-only cookie
    const cookieStore = await cookies();
    console.log('Setting cookie...');
    // Use development-friendly cookie settings
    cookieStore.set('eden_admin_token', token, {
      httpOnly: true,
      secure: false, // Allow non-HTTPS in development
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    console.log('Cookie set successfully');

    const response = NextResponse.json({ success: true });
    
    // Explicitly set the cookie in the response headers
    response.cookies.set('eden_admin_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
