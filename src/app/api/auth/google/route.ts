import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSessionToken } from '../../../../lib/auth';
import { AdminRole } from '@prisma/client';
import { getSupabaseClient } from '../../../../lib/supabase-client';
import { getPrismaClient } from '../../../../lib/prisma-edge';

// Get the appropriate Prisma client based on environment
const prisma = getPrismaClient();

// Get the Supabase client singleton
const supabase = getSupabaseClient();

// Domain restriction for Eden Clinic staff
const ALLOWED_DOMAINS = ['edenclinicformen.com', 'edenclinic.co.uk'];

// Configure for edge runtime
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Using named export for compatibility with Netlify
export const POST = async (request: NextRequest) => {
  try {
    console.log('Google auth attempt started');
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Development mode bypass for easier testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing Google auth validation');
      // Set a mock admin cookie
      const response = NextResponse.json({ 
        success: true, 
        user: { email: 'admin@edenclinic.co.uk', role: 'SUPER_ADMIN' } 
      });
      
      // Set cookies for development mode
      response.cookies.set('eden_admin_token', 'dev_mode_token', { 
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Fix TypeScript error
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      
      return response;
    }
    
    // Parse the request body
    let code;
    try {
      const body = await request.json();
      code = body.code;
      console.log('Received code (first 10 chars):', code ? code.substring(0, 10) + '...' : 'undefined');
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Check if this is an access token rather than an authorization code
    const isAccessToken = code.startsWith('eyJ') && code.includes('.');
    
    let sessionData;
    let sessionError;
    
    if (isAccessToken) {
      console.log('Received what appears to be an access token, using getUser instead');
      // If it's an access token, use it directly to get the user
      const { data, error } = await supabase.auth.getUser(code);
      sessionData = { user: data?.user, session: { access_token: code } };
      sessionError = error;
    } else {
      console.log('Exchanging authorization code for session');
      // Exchange the code for a session with Supabase
      const result = await supabase.auth.exchangeCodeForSession(code);
      sessionData = result.data;
      sessionError = result.error;
    }
    
    if (sessionError || !sessionData?.user) {
      console.error('Error with authentication:', sessionError);
      return NextResponse.json(
        { error: 'Authentication failed: ' + (sessionError?.message || 'Unknown error') },
        { status: 401 }
      );
    }
    
    console.log('Authentication successful, user:', {
      id: sessionData.user.id,
      email: sessionData.user.email,
      provider: sessionData.user.app_metadata?.provider
    });

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
      console.log(`Creating new admin account for ${email}`);
      
      // Auto-create admin account for valid domain users
      try {
        admin = await prisma.admin.create({
          data: {
            email,
            name: user.user_metadata.full_name || email.split('@')[0],
            passwordHash: '', // No password needed for Google auth
            role: AdminRole.ADMIN, // Default role
            active: true, // Always create as active
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true
          }
        });
        console.log(`Successfully created admin account for ${email}`);
      } catch (error) {
        console.error(`Failed to create admin account for ${email}:`, error);
        return NextResponse.json({ error: 'Failed to create admin account. Please contact support.' }, { status: 500 });
      }
    }

    // Auto-activate admin accounts with valid domain emails
    if (!admin.active) {
      console.log(`Auto-activating admin account for ${email}`);
      try {
        admin = await prisma.admin.update({
          where: { email },
          data: { active: true },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true
          }
        });
        console.log(`Successfully activated admin account for ${email}`);
      } catch (error) {
        console.error(`Failed to activate admin account for ${email}:`, error);
        // Continue anyway - we'll try to use the account as is
        console.log('Attempting to proceed with login despite activation failure');
      }
    }

    // Update last login time
    await prisma.admin.update({
      where: { email },
      data: { lastLoginAt: new Date() }
    });

    // Generate a JWT token for the admin
    let token;
    try {
      // Only include email and role as per AdminUser type
      token = await generateSessionToken({
        email: admin.email,
        role: admin.role
      });
      
      // Set the token in a cookie
      cookies().set('eden_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
      
      console.log(`Successfully set authentication cookie for ${email}`);
    } catch (error) {
      console.error(`Failed to generate or set token for ${email}:`, error);
      return NextResponse.json({ error: 'Authentication error. Please try again.' }, { status: 500 });
    }

    // Also set the Supabase session for future API calls
    const supabaseAuthCookie = sessionData.session?.access_token;
    if (supabaseAuthCookie) {
      const cookieStore = cookies();
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