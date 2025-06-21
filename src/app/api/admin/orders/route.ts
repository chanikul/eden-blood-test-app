export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromToken } from '@/lib/auth';

// GET handler for fetching all orders
export async function GET(request: Request) {
  try {
    // Check authentication
    const admin = await getAdminFromToken();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');
    const testType = url.searchParams.get('testType');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { patientName: { contains: search, mode: 'insensitive' } },
        { patientEmail: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (testType) {
      where.testName = { contains: testType, mode: 'insensitive' };
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate),
      };
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
