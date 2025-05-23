import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/email';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

const stripeClient = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as const
});

type StripeCheckoutSession = Stripe.Checkout.Session & {
  shipping?: {
    address: {
      line1: string;
      line2?: string | null;
      city: string;
      state?: string | null;
      postal_code: string;
      country: string;
    };
    name: string;
  };
  customer_details?: {
    email: string;
    name?: string;
    phone?: string;
  };
  metadata?: {
    orderId?: string;
  };
  payment_intent: string;
};

type StripeShippingAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
};

type Order = {
  id: string;
  status: string;
  patientEmail: string;
  patientName: string;
  patientDateOfBirth: string;
  testName: string;
  notes: string | null;
  shippingAddress?: string;
  stripePaymentIntentId?: string;
};

type OrderWithRelations = Order & {
  bloodTest: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
  };
};

type OrderWithShipping = Order & {
  shippingAddress: string | null;
};

type StripeShippingDetails = {
  name: string;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postal_code: string;
    country: string;
  };
};

type WebhookError = {
  message: string;
  statusCode: number;
  details?: unknown;
};

type EmailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type SendPaymentConfirmationEmailParams = {
  email: string;
  orderId: string;
  name: string;
  shippingAddress?: string;
  testName: string;
};

type SendOrderNotificationEmailParams = {
  orderId: string;
  name: string;
  shippingAddress?: string;
  testName: string;
};

const orderSelect = {
  id: true,
  status: true,
  patientEmail: true,
  patientName: true,
  testName: true,
  paymentId: true,
  stripeSessionId: true,
  createdAt: true,
  patientDateOfBirth: true,
  internalNotes: true,
  shippingAddress: true
} as const;

type OrderSelect = Prisma.OrderGetPayload<{
  select: typeof orderSelect;
}>;

const sendPaymentConfirmationEmail = async (params: SendPaymentConfirmationEmailParams) => {
  const emailParams: EmailParams = {
    to: params.email,
    subject: `Order Confirmation - ${params.orderId}`,
    text: `Thank you for your order ${params.orderId}\n\nTest: ${params.testName}\n${params.shippingAddress ? `\nShipping Address:\n${params.shippingAddress}` : ''}`,
    html: `
      <h1>Order Confirmation</h1>
      <p>Thank you for your order, ${params.name}!</p>
      <p><strong>Order ID:</strong> ${params.orderId}</p>
      <p><strong>Test:</strong> ${params.testName}</p>
      ${params.shippingAddress ? `<p><strong>Shipping Address:</strong><br>${params.shippingAddress.replace(/\n/g, '<br>')}</p>` : ''}
    `,
  };
  await sendEmail(emailParams);
};

const sendOrderNotificationEmail = async (params: SendOrderNotificationEmailParams) => {
  if (!SUPPORT_EMAIL) return;
  const emailParams: EmailParams = {
    to: SUPPORT_EMAIL,
    subject: `New Order - ${params.orderId}`,
    text: `New order received\n\nOrder ID: ${params.orderId}\nPatient: ${params.name}\nTest: ${params.testName}\n${params.shippingAddress ? `\nShipping Address:\n${params.shippingAddress}` : ''}`,
    html: `
      <h1>New Order Received</h1>
      <p><strong>Order ID:</strong> ${params.orderId}</p>
      <p><strong>Patient:</strong> ${params.name}</p>
      <p><strong>Test:</strong> ${params.testName}</p>
      ${params.shippingAddress ? `<p><strong>Shipping Address:</strong><br>${params.shippingAddress.replace(/\n/g, '<br>')}</p>` : ''}
    `,
  };
  await sendEmail(emailParams);
};

const handleWebhookError = (err: unknown): NextResponse => {
  const errorMessage = err instanceof Error ? err.message : 'Unknown webhook error';
  console.error('Webhook Error:', errorMessage);
  return NextResponse.json(
    { error: errorMessage },
    { status: 400 }
  );
};

const handleSessionAlreadyProcessed = (sessionId: string): NextResponse => {
  console.log('Session already processed:', sessionId);
  return NextResponse.json({ received: true });
};

const handleMissingOrderId = (): NextResponse => {
  console.error('No orderId found in session metadata');
  return NextResponse.json(
    { error: { message: 'No orderId found in session metadata' } },
    { status: 400 }
  );
};

const handleOrderNotFound = (orderId: string): NextResponse => {
  console.error('Order not found:', orderId);
  return NextResponse.json(
    { error: { message: 'Order not found' } },
    { status: 404 }
  );
};

const handleOrderAlreadyPaid = (orderId: string): NextResponse => {
  console.log('Order already paid:', orderId);
  return NextResponse.json({ received: true });
};

// Keep track of processed sessions to avoid duplicates
const processedSessions = new Set<string>();

export async function POST(req: NextRequest): Promise<NextResponse> {
  let event: Stripe.Event;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook secret is not set');
    return NextResponse.json({ error: 'Webhook secret is not set' }, { status: 500 });
  }

  try {
    console.log('Verifying Stripe signature...');
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
      console.error('No Stripe signature found in headers');
      throw new Error('No Stripe signature found');
    }

    const body = await req.text();
    event = stripeClient.webhooks.constructEvent(
      body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook verified. Event type:', event.type);
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    console.log('✅ Successfully constructed event:', event.type);

    // Handle checkout session completed event
    if (event.type === 'checkout.session.completed') {
    // Retrieve full session data
    const sessionId = event.data.object.id;
    const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
      expand: ['shipping', 'shipping_details', 'shipping_address', 'customer']
    }) as StripeCheckoutSession;
    const orderId = session.metadata?.orderId;
    const paymentIntent = session.payment_intent;

    if (!orderId || !paymentIntent) {
      console.log('❌ Missing orderId or paymentIntent in session:', session.id);
      return NextResponse.json(
        { error: { message: 'Missing orderId or paymentIntent in session' } },
        { status: 400 }
      );
    }

    // Skip if session was already processed
    if (processedSessions.has(session.id)) {
      console.log('ℹ️ Session already processed:', session.id);
      return NextResponse.json({ received: true });
    }

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: orderSelect,
    });

    if (!order) {
      return handleOrderNotFound(orderId);
    }

    // Skip if order is already paid
    if (order.status === 'PAID') {
      console.log('ℹ️ Order already paid:', orderId);
      return NextResponse.json({ received: true });
    }

    console.log('=== PROCESSING CHECKOUT SESSION ===');
    console.log('Session details:', {
      id: session.id,
      customer_details: session.customer_details,
      payment_status: session.payment_status,
      mode: session.mode,
      metadata: session.metadata
    });

    console.log('=== DEBUG: SHIPPING ADDRESS HANDLING ===');
    console.log('1. Full session:', {
      id: session.id,
      shipping: session.shipping,
      customer: session.customer,
      customer_details: session.customer_details,
      metadata: session.metadata
    });

    // Get shipping details from session
    const shippingAddress = session.customer_details?.address;
    console.log('2. Shipping address:', shippingAddress);
    
    // Log the current order state
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, shippingAddress: true }
    });
    console.log('4. Current order state:', currentOrder);

    // Save shipping address if present
    if (shippingAddress) {
      const shippingData = {
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || null,
        city: shippingAddress.city,
        state: shippingAddress.state || null,
        postal_code: shippingAddress.postal_code,
        country: shippingAddress.country
      };
      
      console.log('5. Saving shipping data:', shippingData);
      
      try {
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            shippingAddress: shippingData
          },
          select: {
            id: true,
            shippingAddress: true
          }
        });
        console.log('6. Order updated with shipping address:', updatedOrder);
      } catch (error) {
        console.error('Error updating order with shipping address:', {
          error,
          orderId,
          shippingData
        });
        throw error;
      }
      
      // Verify the update
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, shippingAddress: true }
      });
      console.log('6. Order after update:', updatedOrder);
    }

    // Initialize email promises array
    const emailPromises = [];

    // Add customer confirmation email
    if (order.patientEmail) {
      emailPromises.push(
        sendPaymentConfirmationEmail({
          email: order.patientEmail,
          name: order.patientName || '',
          testName: order.testName || '',
          orderId: order.id,
          shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : ''
        })
      );
    }

    // Add admin notification email
    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail) {
      emailPromises.push(
        sendOrderNotificationEmail({
          orderId: order.id,
          name: order.patientName || '',
          testName: order.testName || '',
          shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : ''
        })
      );
    }

    // Send all emails and update order
    try {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentId: paymentIntent
        }
      });
      console.log('Order updated with shipping address:', {
        orderId: order.id,
        shippingAddress: order.shippingAddress
      });

      // Send notification emails
      await Promise.all(emailPromises);
      console.log('All notification emails sent successfully');

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing order:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { error: { message: 'Error processing order', code: 500 } },
        { status: 500 }
      );
    }
    } else {
      console.log('Skipping non-checkout event:', event.type);
      return NextResponse.json({ success: true });
    }
  } catch (err: any) {
    console.error('Error in webhook handler:', {
      error: err.message,
      stack: err.stack
    });
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
