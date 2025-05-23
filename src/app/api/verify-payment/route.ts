import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('=== VERIFYING PAYMENT ===');
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  console.log('Payment verification params:', {
    sessionId,
    url: request.url
  });

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session ID' },
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
    apiVersion: '2023-10-16' as const
  });

  try {
    console.log('Fetching Stripe session...');
    // Verify the payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['shipping', 'shipping_details', 'customer']
    });
    
    console.log('Stripe session details:', {
      id: session.id,
      paymentStatus: session.payment_status,
      paymentIntent: session.payment_intent,
      customer: session.customer,
      customer_details: session.customer_details,
      shipping_address: session.customer_details?.address
    });
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    console.log('Fetching order from database...');
    // Get the order using the session ID
    const order = await prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
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

    console.log('Updating order status to PAID...');
    // Get shipping details from session
    const shippingAddress = session.customer_details?.address;
    console.log('Shipping details from session:', {
      customer_details: session.customer_details,
      shipping_address: shippingAddress
    });

    // Prepare update data
    const updateData: any = {
      status: 'PAID',
      paymentId: session.payment_intent as string,
      updatedAt: new Date()
    };

    // Add shipping address if present
    if (shippingAddress) {
      updateData.shippingAddress = {
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || null,
        city: shippingAddress.city,
        state: shippingAddress.state || null,
        postal_code: shippingAddress.postal_code,
        country: shippingAddress.country
      };
    }

    console.log('Updating order with data:', updateData);

    // Update order status and shipping address
    let updatedOrder;
    try {
      updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: updateData,
        include: {
          bloodTest: true
        }
      });
      console.log('Order updated successfully:', {
        id: updatedOrder.id,
        shippingAddress: updatedOrder.shippingAddress
      });
    } catch (error) {
      console.error('Error updating order:', {
        error,
        orderId: order.id,
        updateData
      });
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      order: updatedOrder
    });
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
