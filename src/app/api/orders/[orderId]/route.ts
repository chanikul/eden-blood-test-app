import { NextRequest, NextResponse } from 'next/server';
// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export async function GET(request: NextRequest,
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
