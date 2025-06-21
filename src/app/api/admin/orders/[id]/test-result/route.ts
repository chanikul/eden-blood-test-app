import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromToken } from '@/lib/auth';

// GET handler for fetching test result associated with an order
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const admin = await getAdminFromToken();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch associated test result
    const testResult = await prisma.testResult.findFirst({
      where: {
        orderId: params.id,
      },
    });

    return NextResponse.json({ result: testResult || null });
  } catch (error) {
    console.error('Error fetching test result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test result' },
      { status: 500 }
    );
  }
}
