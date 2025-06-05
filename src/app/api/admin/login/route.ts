import { NextRequest, NextResponse } from 'next/server';
import { validateAdminPassword, updateLastLogin } from '../../../../lib/services/admin';
import { generateSessionToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import * as bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Successfully connected to database for admin login');
    } catch (connError) {
      console.error('Database connection error in admin login:', connError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Direct database query for debugging
    await prisma.$connect();
    const adminRecord = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        active: true,
        role: true,
        name: true
      }
    });

    if (!adminRecord) {
      console.error('Admin not found:', email);
      return NextResponse.json(
        { error: 'Invalid email or password', debug: 'Admin not found' },
        { status: 401 }
      );
    }

    if (!adminRecord.active) {
      console.error('Admin account not active:', email);
      return NextResponse.json(
        { error: 'Invalid email or password', debug: 'Account not active' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, adminRecord.passwordHash);
    if (!isValid) {
      console.error('Invalid password for:', email);
      return NextResponse.json(
        { error: 'Invalid email or password', debug: 'Invalid password' },
        { status: 401 }
      );
    }

    // Update last login time
    const loginUpdate = await updateLastLogin(adminRecord.id);
    if (!loginUpdate) {
      return NextResponse.json(
        { error: 'Failed to update login time' },
        { status: 500 }
      );
    }

    // Generate session token
    const token = generateSessionToken({ email: adminRecord.email, role: adminRecord.role });

    const { passwordHash, ...adminData } = adminRecord;
    const response = NextResponse.json({ success: true, admin: adminData });

    // Set the session cookie
    response.cookies.set('eden_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
