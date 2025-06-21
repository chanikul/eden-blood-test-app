import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const orderId = searchParams.get('orderId');

    if (!sessionId || !orderId) {
      return NextResponse.json(
        { error: 'Session ID and Order ID are required' },
        { status: 400 }
      );
    }



    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not successful', status: session.payment_status },
        { status: 400 }
      );
    }

    // Verify the order ID matches
    if (session.metadata?.orderId !== orderId) {
      return NextResponse.json(
        { error: 'Order ID mismatch' },
        { status: 400 }
      );
    }

    // Update order status in database
    try {
      console.log('Updating order status:', { orderId, sessionId });
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          stripeSessionId: sessionId
        },
        select: {
          id: true,
          status: true,
          stripeSessionId: true
        }
      });
      console.log('Order updated successfully:', updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}