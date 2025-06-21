import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../lib/prisma';
import { verifyPassword } from '../../../../../lib/utils/password';
import { generateSessionToken } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Force Node.js runtime to ensure proper Prisma functionality

// Using named export for compatibility with Netlify
export const POST = async (request: NextRequest) => {
  console.log('=== PATIENT LOGIN REQUEST ===');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'Set (truncated for security)' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set (truncated for security)' : 'Not set'
  });
  
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the patient
    const patient = await prisma.clientUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        active: true,
        resetToken: true,
        resetTokenExpires: true,
        must_reset_password: true
      }
    });

    if (!patient) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!patient.active) {
      return NextResponse.json(
        { message: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, patient.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if password change is required
    const passwordChangeRequired = 
      // Either there's an active reset token
      (!!patient.resetToken && 
       patient.resetTokenExpires && 
       new Date() < patient.resetTokenExpires) || 
      // Or the must_reset_password flag is set (for admin-created accounts)
      !!patient.must_reset_password;

    // Generate session token
    const token = await generateSessionToken({ 
      id: patient.id,
      email: patient.email,
      role: 'PATIENT'
    });

    // Set the token in an HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set('eden_patient_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Update last login time
    await prisma.clientUser.update({
      where: { id: patient.id },
      data: { lastLoginAt: new Date() }
    });

    return NextResponse.json({ 
      success: true,
      passwordChangeRequired
    });
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      prismaConnected: false
    };
    
    // Try to check Prisma connection status
    try {
      // Simple query to test database connection
      await prisma.$queryRaw`SELECT 1 as result`;
      errorDetails.prismaConnected = true;
      console.error('Patient login error (database connection is working):', errorDetails);
    } catch (dbError) {
      errorDetails.prismaConnected = false;
      console.error('Patient login error with database connection failure:', {
        ...errorDetails,
        dbError: dbError instanceof Error ? dbError.message : String(dbError)
      });
    }
    
    return NextResponse.json(
      { 
        message: 'An error occurred during login',
        error: process.env.NODE_ENV === 'development' ? errorDetails.message : undefined
      },
      { status: 500 }
    );
  }
}