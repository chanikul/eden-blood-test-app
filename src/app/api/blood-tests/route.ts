import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Fetching blood tests...');
    const bloodTests = await prisma.bloodTest.findMany();
    console.log('Blood tests fetched:', bloodTests);
    return NextResponse.json(bloodTests);
  } catch (error) {
    console.error('Error fetching blood tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blood tests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
