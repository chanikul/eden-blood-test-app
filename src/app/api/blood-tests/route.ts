import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Successfully connected to database');
    } catch (connError) {
      console.error('Database connection error:', connError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    console.log('\n=== FETCHING BLOOD TESTS ===');
    console.log('Database URL configured:', !!process.env.DATABASE_URL);
    console.log('Direct URL configured:', !!process.env.DIRECT_URL);
    
    // First try a simple count query
    console.log('Attempting count query...');
    const count = await prisma.bloodTest.count();
    console.log('Total blood tests:', count);
    
    // Then get all blood tests with minimal fields
    console.log('Fetching blood tests...');
    const tests = await prisma.bloodTest.findMany({
      select: {
        id: true,
        name: true,
        price: true
      }
    });

    console.log('Successfully fetched', tests.length, 'blood tests');
    console.log('Sample test:', tests[0]);
    
    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching blood tests:', error);
    // More detailed error response
    return NextResponse.json(
      { error: 'Failed to fetch blood tests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
