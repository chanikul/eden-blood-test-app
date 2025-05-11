import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bloodTestOrderSchema } from '@/lib/validations/blood-test-order';
import { sendOrderNotificationEmail } from '@/lib/services/email';
import { ZodError } from 'zod';
import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const BLOOD_TEST_PRICES: { [key: string]: { price: string; name: string } } = {
  'eden-well-man': { price: 'price_1RMtUvCSWTNipsrPXXXXXXXX', name: 'Eden Well Man' },
  'eden-well-man-plus': { price: 'price_1RMtUvCSWTNipsrPXXXXXXXX', name: 'Eden Well Man Plus' },
  'eden-well-woman': { price: 'price_1RMtUvCSWTNipsrPXXXXXXXX', name: 'Eden Well Woman' },
  'trt-review': { price: 'price_1RMtUvCSWTNipsrPXXXXXXXX', name: 'TRT Review' },
  'advanced-thyroid-panel': { price: 'price_1RMtUvCSWTNipsrPXXXXXXXX', name: 'Advanced Thyroid Panel' },
  'weight-management-blood-test': { price: 'price_1RMtUvCSWTNipsrPXXXXXXXX', name: 'Weight Management Blood Test' },
  'venous-testosterone-panel': { price: 'price_1RMtUvCSWTNipsrPXXXXXXXX', name: 'Venous Testosterone Panel' },
  'ultimate-sporting-performance-blood-test': { price: 'price_1RMtUvCSWTNipsrPXXXXXXXX', name: 'Ultimate Sporting Performance Blood Test' },
};

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
    console.log('\n=== CREATING ORDER ===');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate request data
    const validatedData = bloodTestOrderSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    // Check if test exists
    const test = BLOOD_TEST_PRICES[validatedData.testSlug];
    if (!test) {
      console.error('❌ Invalid test slug:', validatedData.testSlug);
      console.error('❌ Available test slugs:', Object.keys(BLOOD_TEST_PRICES));
      return NextResponse.json(
        { success: false, message: `Invalid test: ${validatedData.testSlug}` },
        { status: 400 }
      );
    }

    // Create order in database first
    const order = await prisma.order.create({
      data: {
        patientName: validatedData.fullName,
        patientEmail: validatedData.email,
        patientDateOfBirth: validatedData.dateOfBirth,
        patientMobile: validatedData.mobile,
        testName: test.name,
        notes: validatedData.notes,
        status: 'PENDING',
      },
    });

    // Create Stripe checkout session with order ID
    const sessionData: StripeSessionData = {
      line_items: [{
        price: test.price,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/cancel`,
      customer_email: validatedData.email,
      metadata: {
        orderId: order.id,
        fullName: validatedData.fullName,
        email: validatedData.email,
        dateOfBirth: validatedData.dateOfBirth,
        mobile: validatedData.mobile || '',
        testSlug: validatedData.testSlug,
        testName: test.name,
        notes: validatedData.notes || '',
      },
    };

    console.log('Creating Stripe session with data:', JSON.stringify(sessionData, null, 2));
    const session = await stripe.checkout.sessions.create(sessionData);

    // Update order with session ID
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
