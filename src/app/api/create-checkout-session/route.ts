import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Debug environment variables
  console.log('Environment check:', {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
    nodeEnv: process.env.NODE_ENV,
  });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json(
      { error: 'Stripe configuration missing' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil'
  });

  try {
    const {
      fullName,
      email,
      dateOfBirth,
      testName,
      notes,
      mobile,
      price,
      successUrl,
      cancelUrl
    } = await request.json();

    // Create an order record
    const order = await prisma.order.create({
      data: {
        status: 'PENDING',
        testName,
        patientName: fullName,
        patientEmail: email,
        patientDateOfBirth: dateOfBirth,
        patientMobile: mobile || null,
        notes: notes || null,
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      success_url: `${successUrl}/${order.id}`,
      cancel_url: cancelUrl,
      metadata: {
        orderId: order.id,
        fullName,
        email,
        dateOfBirth,
        testName,
        notes: notes || '',
        mobile: mobile || '',
      },
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: testName,
              description: `Blood Test: ${testName}`,
            },
            unit_amount: price, // Price in pence
          },
          quantity: 1,
        },
      ],
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    let errorMessage = 'Failed to create checkout session';
    
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Unknown error type:', error);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
