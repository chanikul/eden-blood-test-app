import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const bloodTests = await prisma.bloodTest.findMany();
    return NextResponse.json(bloodTests);
  } catch (error) {
    console.error('Error fetching blood tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blood tests' },
      { status: 500 }
    );
  }
}
