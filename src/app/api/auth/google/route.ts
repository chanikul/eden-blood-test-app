import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { generateSessionToken } from '../../../../lib/auth';
// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { AdminRole } from '@prisma/client';

// Use string literals for client-side environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dlzfhnnwyvddaoikrung.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Domain restriction for Eden Clinic staff
const ALLOWED_DOMAINS = ['edenclinicformen.com', 'edenclinic.co.uk'];

export async function POST(request: NextRequest) {
  try {
    console.log('Google auth attempt started');
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange the code for a session with Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError || !sessionData.user) {
      console.error('Error exchanging code for session:', sessionError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const { user } = sessionData;
    const email = user.email;

    // Validate email domain
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => email?.endsWith(`@${domain}`));
    if (!email || !isAllowedDomain) {
      console.log(`Invalid email domain: ${email}`);
      return NextResponse.json(
        { error: `Access restricted to @edenclinicformen.com or @edenclinic.co.uk email addresses` },
        { status: 403 }
      );
    }

    // Check if the user exists in the Admin table
    let admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true
      }
    });

    // If admin doesn't exist, create a new admin record
    if (!admin) {
      // Optional: You could return an error here if you want to manually approve admins
      // return NextResponse.json({ error: 'Admin account not approved yet' }, { status: 403 });
      
      // Auto-create admin account for valid domain users
      admin = await prisma.admin.create({
        data: {
          email,
          name: user.user_metadata.full_name || email.split('@')[0],
          passwordHash: '', // No password needed for Google auth
          role: AdminRole.ADMIN, // Default role
          active: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true
        }
      });
    }

    // Check if admin is active
    if (!admin.active) {
      return NextResponse.json(
        { error: 'Your admin account is inactive. Please contact a super admin.' },
        { status: 403 }
      );
    }

    // Update last login time
    await prisma.admin.update({
      where: { email },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token for our app
    const token = await generateSessionToken({ 
      email: admin.email, 
      role: admin.role 
    });
    
    // Set the token in an HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set('eden_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Also set the Supabase session for future API calls
    const supabaseAuthCookie = sessionData.session?.access_token;
    if (supabaseAuthCookie) {
      cookieStore.set('sb-access-token', supabaseAuthCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
    }

    const response = NextResponse.json({ 
      success: true,
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
    
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
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
