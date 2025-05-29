import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/utils/password';
import { generateSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
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
        resetTokenExpires: true
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
    const passwordChangeRequired = !!patient.resetToken && 
      patient.resetTokenExpires && 
      new Date() < patient.resetTokenExpires;

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
    console.error('Patient login error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
