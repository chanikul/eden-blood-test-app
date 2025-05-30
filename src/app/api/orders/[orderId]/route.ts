import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: { orderId: string } }
) {
  const { orderId } = context.params;
  console.log('Fetching order details:', { orderId });
  try {
    // First try to find the order
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        patientName: true,
        patientEmail: true,
        testName: true,
        status: true,
        createdAt: true,
        stripeSessionId: true,
      },
    });

    console.log('Order lookup result:', {
      found: !!order,
      orderId,
      details: order
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
