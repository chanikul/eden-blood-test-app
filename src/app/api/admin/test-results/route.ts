import { NextRequest, NextResponse } from 'next/server';

// Direct imports without path aliases
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple session getter function
async function getSession() {
  // In development mode, return a mock admin session
  if (process.env.NODE_ENV === 'development') {
    return {
      user: {
        role: 'SUPER_ADMIN'
      }
    };
  }
  
  // In production, this would normally fetch the session
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Skip authentication check in development mode or when testing is forced
    const isTesting = process.env.NODE_ENV === 'development' || process.env.FORCE_TESTING === 'true';
    
    if (!isTesting) {
      // Check admin authentication in production
      const session = await getSession();
      if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch all test results with related data
    const results = await prisma.testResult.findMany({
      include: {
        bloodTest: {
          select: {
            name: true,
            slug: true,
          },
        },
        order: {
          select: {
            createdAt: true,
            testName: true,
            patientName: true,
            patientEmail: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}
