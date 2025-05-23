import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bloodTestOrderSchema } from '@/lib/validations/blood-test-order';
import { sendOrderNotificationEmail } from '@/lib/services/email';
import { createClientUser, findClientUserByEmail } from '@/lib/services/client-user';
import { ZodError } from 'zod';
import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function getBloodTestPrice(slug: string) {
  const test = await prisma.bloodTest.findFirst({
    where: {
      slug,
      isActive: true,
      stripePriceId: { not: null }
    }
  });

  if (!test || !test.stripePriceId) {
    throw new Error(`Blood test not found or not available: ${slug}`);
  }

  return {
    price: test.stripePriceId,
    name: test.name
  };
}

type StripeSessionData = {
  line_items: Array<{
    price: string;
    quantity: number;
  }>;
  mode: 'payment';
  success_url: string;
  cancel_url: string;
  customer_email: string;
  metadata: {
    orderId: string;
    fullName: string;
    email: string;
    dateOfBirth: string;
    mobile?: string;
    testSlug: string;
    testName: string;
    notes?: string;
  };
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      patientName,
      patientEmail,
      patientDateOfBirth,
      patientMobile,
      testSlug,
      notes,
      createAccount,
      password,
      shippingAddress
    } = data;

    // Create client account if requested
    let clientId: string | undefined;
    if (createAccount && password) {
      try {
        const client = await createClientUser({
          email: patientEmail,
          password,
          name: patientName,
          dateOfBirth: patientDateOfBirth,
          mobile: patientMobile,
        });
        clientId = client.id;
      } catch (error: any) {
        if (error.message === 'User with this email already exists') {
          const existingClient = await findClientUserByEmail(patientEmail);
          if (existingClient) {
            clientId = existingClient.id;
          }
        } else {
          throw error;
        }
      }
    }

    // Get blood test details
    const { price: stripePriceId, name: testName } = await getBloodTestPrice(testSlug);

    // Create order
    const order = await prisma.order.create({
      data: {
        patientName,
        patientEmail,
        patientDateOfBirth,
        patientMobile,
        testName,
        notes,
        status: 'PENDING',
        shippingAddress,
        clientId,
        bloodTest: {
          connect: {
            slug: testSlug
          }
        }
      }
    });
    console.log('\n=== CREATING ORDER ===');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate request data
    const validatedData = bloodTestOrderSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Get blood test from database
    const bloodTest = await prisma.bloodTest.findFirst({
      where: {
        slug: validatedData.testSlug,
        isActive: true,
      },
    });

    if (!bloodTest) {
      console.error('Blood test not found or not active:', validatedData.testSlug);
      return NextResponse.json(
        { error: 'Blood test not found or not active' },
        { status: 404 }
      );
    }

    if (!bloodTest.stripePriceId) {
      console.error('Blood test has no Stripe price ID:', bloodTest.name);
      return NextResponse.json(
        { error: 'Blood test configuration error' },
        { status: 500 }
      );
    }

    console.log('Found blood test:', {
      name: bloodTest.name,
      price: bloodTest.price,
      stripePriceId: bloodTest.stripePriceId,
    });

    // Create order in database
    const order = await prisma.order.create({
      data: {
        patientName: validatedData.fullName,
        patientEmail: validatedData.email,
        patientDateOfBirth: validatedData.dateOfBirth,
        patientMobile: validatedData.mobile,
        testName: bloodTest.name,
        notes: validatedData.notes,
        status: 'PENDING',
      },
    });
    console.log('Created order:', order);

    // Create Stripe checkout session
    const sessionData: StripeSessionData = {
      line_items: [
        {
          price: bloodTest.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order-success/${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-status?success=false`,
      customer_email: validatedData.email,
      metadata: {
        orderId: order.id,
        fullName: validatedData.fullName,
        email: validatedData.email,
        dateOfBirth: validatedData.dateOfBirth,
        mobile: validatedData.mobile,
        testSlug: validatedData.testSlug,
        testName: bloodTest.name,
        notes: validatedData.notes,
      },
    };

    console.log('Creating Stripe session with data:', sessionData);
    const session = await stripe.checkout.sessions.create(sessionData);
    console.log('Created Stripe session:', session.id);

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    await sendOrderNotificationEmail({
      fullName: validatedData.fullName,
      email: validatedData.email,
      dateOfBirth: validatedData.dateOfBirth,
      testName: test.name,
      notes: validatedData.notes || undefined,
      orderId: order.id,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutUrl: session.url,
    });

    // Update order with session ID
    console.log('Updating order with session ID...');
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });
    console.log('Order updated with session ID');

    console.log('=== END CREATING ORDER AND SESSION ===\n');

    return NextResponse.json(
      {
        success: true,
        message: 'Blood test order created successfully',
        orderId: order.id,
        checkoutUrl: session.url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('\n=== ERROR CREATING ORDER ===');
    console.error('Error:', error);

    if (error instanceof ZodError) {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    // Check if it's a Stripe error
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error:', error.message);
      return NextResponse.json(
        {
          success: false,
          message: `Payment error: ${error.message}`,
        },
        { status: 400 }
      );
    }

    // For any other error
    const message = error instanceof Error ? error.message : 'Error creating blood test order';
    console.error('Error message:', message);
    console.error('=== END ERROR ===\n');

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
