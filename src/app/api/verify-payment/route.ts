import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';


export async function GET(request: Request) {
  console.log('=== VERIFYING PAYMENT ===');
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('sessionId');

  console.log('Payment verification params:', {
    orderId,
    sessionId,
    url: request.url
  });

  if (!orderId || !sessionId) {
    return NextResponse.json(
      { error: 'Missing orderId or sessionId' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY');
    return NextResponse.json(
      { error: 'Configuration error' },
      { status: 500 }
    );
  }



  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil' as const
  });

  try {
    console.log('Fetching order from database...');
    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        bloodTest: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Fetching Stripe session...');
    // Verify the payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('Stripe session details:', {
      id: session.id,
      paymentStatus: session.payment_status,
      paymentIntent: session.payment_intent,
      customer: session.customer
    });
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    console.log('Updating order status to PAID...');
    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentId: session.payment_intent as string,
        updatedAt: new Date()
      }
    });


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying payment:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
