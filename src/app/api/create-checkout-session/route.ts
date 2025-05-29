import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
}) as Stripe;

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
  cancelUrl: z.string().url(),
  createAccount: z.boolean().default(false),
  password: z.string().optional(),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string()
  })
});

type CheckoutSessionData = z.infer<typeof requestSchema>;

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json(
      { error: 'Stripe configuration missing' },
      { status: 500 }
    );
  }

  try {
    const data: CheckoutSessionData = requestSchema.parse(await request.json());

    // First find the blood test by slug
    const bloodTest = await prisma.bloodTest.findFirst({
      where: {
        slug: data.testSlug,
        isActive: true
      }
    });

    if (!bloodTest) {
      return NextResponse.json(
        { error: 'Blood test not found' },
        { status: 404 }
      );
    }

    // Then verify the Stripe price ID
    if (bloodTest.stripePriceId !== data.stripePriceId) {
      console.error('Stripe price ID mismatch:', {
        expected: bloodTest.stripePriceId,
        received: data.stripePriceId
      });
      return NextResponse.json(
        { error: 'Invalid blood test selected' },
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
          patientName: data.fullName,
          patientEmail: data.email,
          patientDateOfBirth: data.dateOfBirth,
          patientMobile: data.mobile,
          testName: data.testName,
          notes: data.notes,
          bloodTestId: bloodTest.id,
          createAccount: data.createAccount,
          shippingAddress: data.shippingAddress
        }
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Log account creation data
    console.log('=== DEBUG: CHECKOUT SESSION ACCOUNT DATA ===');
    console.log('Account creation details:', {
      createAccount: data.createAccount,
      hasPassword: !!data.password,
      email: data.email,
      name: data.fullName
    });

    // Create Stripe checkout session
    try {
      const params: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        customer_email: data.email,
        line_items: [
          {
            price: data.stripePriceId,
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${new URL(data.successUrl).origin}/order-success?orderId=${order.id}&sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: data.cancelUrl,
        shipping_address_collection: {
          allowed_countries: ['GB']
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 0, currency: 'gbp' },
              display_name: 'Free shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 3 },
                maximum: { unit: 'business_day', value: 5 }
              }
            }
          }
        ],
        metadata: {
          orderId: order.id.toString(),
          fullName: data.fullName,
          email: data.email,
          dateOfBirth: data.dateOfBirth,
          testName: data.testName,
          testSlug: data.testSlug,
          stripePriceId: data.stripePriceId,
          notes: data.notes || '',
          mobile: data.mobile || '',
          orderCreatedAt: new Date().toISOString(),
          createAccount: data.createAccount.toString(),
          password: data.createAccount && data.password ? data.password : ''
        }
      };

      console.log('Creating Stripe session with metadata:', params.metadata);
      const session = await stripe.checkout.sessions.create(params);
      console.log('Stripe session created:', {
        id: session.id,
        metadata: session.metadata
      });

      if (!session.url) {
        return NextResponse.json(
          { error: 'Failed to create checkout session' },
          { status: 500 }
        );
      }

      // Update order with session ID
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id }
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
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
  } catch (error: unknown) {
    console.error('Error in request:', error);
    let errorMessage = 'Invalid request data';

    if (error instanceof Error) {
      errorMessage = error.message;
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
      { status: 400 }
    );
  }


}
