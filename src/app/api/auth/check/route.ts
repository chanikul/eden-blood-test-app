import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// Simple session getter function
async function getServerSession() {
  // In development mode, return a mock admin session
  if (process.env.NODE_ENV === 'development') {
    return {
      user: {
        email: 'admin@edenclinic.co.uk',
        role: 'SUPER_ADMIN'
      }
    };
  }
  
  // In production, this would normally fetch the session
  // This is a simplified version to avoid complex imports
  return null;
}
// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Domain restrictions for Eden Clinic staff
const ALLOWED_DOMAINS = ['edenclinicformen.com', 'edenclinic.co.uk'];

// Using named export for compatibility with Netlify
export const GET = async () => {
  try {
    // Bypass auth check in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        authenticated: true,
        user: {
          email: 'admin@edenclinicformen.com',
          role: 'SUPER_ADMIN'
        }
      });
    }

    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    
    // Check if user has an allowed email domain
    if (!userEmail || !(ALLOWED_DOMAINS.some(domain => userEmail.endsWith(`@${domain}`)))) {
      return NextResponse.json(
        { error: `Access restricted to @${ALLOWED_DOMAINS.join(' or @')} email addresses` },
        { status: 403 }
      );
    }

    // Check if user exists in Admin table
    const admin = await prisma.admin.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true
      }
    });

    if (!admin || !admin.active) {
      return NextResponse.json(
        { error: 'Your admin account is not active or does not exist' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
