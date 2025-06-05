import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import shared prisma instance
import { prisma } from '../../../../lib/prisma';

// Simple JWT token generation function
async function generateSessionToken(user: { email: string; role: string; id?: string }) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  const { SignJWT } = await import('jose');
  
  // Include ID in token payload for patient users
  const payload: { email: string; role: string; id?: string } = {
    email: user.email,
    role: user.role
  };
  if (user.role === 'PATIENT') {
    payload.id = user.id;
  }
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  
  return token;
}

// Simple password validation function
async function validateAdminPassword(email: string, password: string) {
  if (process.env.NODE_ENV === 'development') {
    // In development, allow a test admin account
    if (email === 'admin@edenclinic.co.uk' && password === 'admin') {
      return { email, role: 'SUPER_ADMIN' };
    }
  }

  try {
    const { compare } = require('bcryptjs');
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.passwordHash) return null;
    
    const isValid = await compare(password, admin.passwordHash);
    return isValid ? admin : null;
  } catch (error) {
    console.error('Error validating password:', error);
    return null;
  }
}

// Using named export for compatibility with Netlify
export const POST = async (request) => { {
  try {
    console.log('Login attempt started');
    const { email, password } = await request.json();
    console.log('Received credentials:', { email, passwordLength: password?.length });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('About to validate password...');
    const admin = await validateAdminPassword(email, password);
    console.log('Credentials validation result:', { 
      isValid: !!admin,
      adminFound: !!admin,
      email: admin?.email,
      role: admin?.role
    });
    if (!admin) {
      console.log('Invalid credentials');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await generateSessionToken({ email: admin.email, role: admin.role });
    console.log('Generated token:', token.substring(0, 20) + '...');
    
    // Set the token in an HTTP-only cookie
    const cookieStore = await cookies();
    console.log('Setting cookie...');
    // Use development-friendly cookie settings
    cookieStore.set('eden_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    console.log('Cookie set successfully');

    const response = NextResponse.json({ success: true });
    
    // Explicitly set the cookie in the response headers
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

}