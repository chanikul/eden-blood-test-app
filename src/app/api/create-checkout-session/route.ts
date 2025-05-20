import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import sgMail from '@sendgrid/mail';



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

  // Initialize SendGrid
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Missing SENDGRID_API_KEY environment variable');
    return NextResponse.json(
      { error: 'SendGrid configuration missing' },
      { status: 500 }
    );
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  }) as any;

  try {
    const requestSchema = z.object({
      fullName: z.string(),
      email: z.string().email(),
      dateOfBirth: z.string(),
      testSlug: z.string(),
      testName: z.string(),
      notes: z.string().optional(),
      mobile: z.string().optional(),
      stripePriceId: z.string(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url()
    });

    const data = requestSchema.parse(await request.json());

    // Verify that the blood test exists and has a valid Stripe price ID
    const bloodTest = await prisma.bloodTest.findFirst({
      where: {
        slug: data.testSlug,
        isActive: true,
        stripePriceId: data.stripePriceId
      }
    });

    if (!bloodTest) {
      console.error('Blood test validation failed:', {
        requestedSlug: data.testSlug,
        requestedPriceId: data.stripePriceId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Blood test not found or invalid Stripe price' },
        { status: 400 }
      );
    }

    // Log blood test details
    console.log('Creating checkout for blood test:', {
      name: bloodTest.name,
      price: bloodTest.price,
      stripePriceId: bloodTest.stripePriceId,
      stripeProductId: bloodTest.stripeProductId,
      timestamp: new Date().toISOString()
    });

    // Create an order record
    let order;
    try {
      order = await prisma.order.create({
        data: {
          status: 'PENDING',
          testName: data.testName,
          patientName: data.fullName,
          patientEmail: data.email,
          patientDateOfBirth: data.dateOfBirth,
          patientMobile: data.mobile || null,
          notes: data.notes || null,
          bloodTestId: bloodTest.id
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
    console.log('Creating Stripe checkout session with price:', data.stripePriceId);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'gbp' },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
      ],
      success_url: `${new URL(data.successUrl).origin}/order-success/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl,
      metadata: {
        orderId: order.id,
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        testName: data.testName,
        testSlug: data.testSlug,
        stripePriceId: data.stripePriceId,
        notes: data.notes || '',
        mobile: data.mobile || '',
        orderCreatedAt: new Date().toISOString(),
      },
      customer_email: data.email,
      line_items: [
        {
          price: data.stripePriceId,
          quantity: 1,
        },
      ],
    });

    // Update order with session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id }
    });

    // Log successful session creation
    console.log('Checkout session created:', {
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
      priceId: data.stripePriceId,
      timestamp: new Date().toISOString()
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
