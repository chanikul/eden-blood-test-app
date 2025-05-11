import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';



export async function POST(request: Request) {
  // Debug environment variables and database connection
  console.log('Database connection details:', {
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    nodeEnv: process.env.NODE_ENV,
    prismaVersion: 'unknown',
    prismaQueryEngineVersion: 'unknown',
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version
  });

  console.log('Other environment variables:', {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
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
    let order;
    try {
      order = await prisma.order.create({
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
    } catch (dbError) {
      console.error('Prisma error details:', {
        error: dbError,
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined,
        code: (dbError as any)?.code,
        meta: (dbError as any)?.meta,
        clientVersion: (dbError as any)?.clientVersion
      });
      
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      return NextResponse.json(
        { 
          error: `Failed to create order: ${errorMessage}`,
          details: dbError instanceof Error ? {
            name: dbError.name,
            code: (dbError as any)?.code,
            clientVersion: (dbError as any)?.clientVersion
          } : undefined
        },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      success_url: `${request.headers.get('origin')}/payment-status?success=true&orderId=${order.id}`,
      cancel_url: `${request.headers.get('origin')}/payment-status?error=payment_failed`,
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
