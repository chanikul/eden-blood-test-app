import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    // Bypass auth check in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        authenticated: true,
        user: {
          email: 'admin@example.com',
          role: 'ADMIN'
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

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.user.email,
        role: session.user.role
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
