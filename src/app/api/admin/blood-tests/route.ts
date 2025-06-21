import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';

// Import PrismaClient directly to avoid any import issues
const { PrismaClient } = require('@prisma/client');

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Only verify authentication in production
    if (process.env.NODE_ENV === 'production') {
      // Verify admin authentication
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const session = await verifySessionToken(token);
      // Fix TypeScript error by checking the role property directly on session
      if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      console.log('Development mode: Bypassing authentication for blood-tests API');
    }
    
    console.log('Fetching blood tests...');
    
    try {
      // Fetch all blood tests
      const bloodTests = await prisma.bloodTest.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      
      console.log(`Found ${bloodTests.length} blood tests`);
      
      // Return a properly formatted JSON response
      return new NextResponse(JSON.stringify(bloodTests), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (dbError) {
      console.error('Database error fetching blood tests:', dbError);
      return NextResponse.json(
        { error: 'Database error fetching blood tests', details: String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching blood tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blood tests' },
      { status: 500 }
    );
  }
}
