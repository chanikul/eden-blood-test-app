import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
    return NextResponse.json(
      { error: 'Failed to fetch blood tests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
