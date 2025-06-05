import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// Domain restrictions for Eden Clinic staff
const ALLOWED_DOMAINS = ['edenclinicformen.com', 'edenclinic.co.uk'];

export async function GET() {
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
