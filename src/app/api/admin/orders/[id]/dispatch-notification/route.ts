import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromToken } from '@/lib/auth';
import { sendDispatchNotificationEmail } from '@/lib/services/email';

// POST handler for sending dispatch notification
export async function POST(
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

    // Send dispatch notification email
    try {
      await sendDispatchNotificationEmail({
        email: order.patientEmail,
        name: order.patientName,
        testName: order.testName,
        orderId: order.id,
        dispatchDate: new Date().toISOString(),
      });
      
      return NextResponse.json({ success: true });
    } catch (emailError) {
      console.error('Error sending dispatch notification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send dispatch notification email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing dispatch notification:', error);
    return NextResponse.json(
      { error: 'Failed to process dispatch notification' },
      { status: 500 }
    );
  }
}
