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
  apiVersion: '2025-04-30.basil'
});

type StripeCheckoutSession = Stripe.Checkout.Session & {
  shipping_details?: {
    name: string;
    address: {
      line1: string;
      line2?: string | null;
      city: string;
      state?: string | null;
      postal_code: string;
      country: string;
    };
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
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return handleWebhookError(new Error('No signature in request'));
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      return handleWebhookError(new Error('Missing Stripe webhook secret'));
    }

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      return handleWebhookError(error);
    }

    console.log('✅ Successfully constructed event:', event.type);

    // Handle checkout session completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as StripeCheckoutSession;
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
        shipping_details: session.shipping_details,
        customer_details: session.customer_details,
        payment_status: session.payment_status,
        mode: session.mode,
        metadata: session.metadata
      });

      // Get shipping details from session
      const shipping = (session as any).shipping_details;
      const address = shipping?.address;
      console.log('Raw shipping info:', JSON.stringify(shipping, null, 2));
      
      console.log('Shipping address to save:', JSON.stringify(address, null, 2));

      // Initialize email promises array
      const emailPromises: Promise<void>[] = [];

      // Add customer confirmation email
      if (order.patientEmail) {
        emailPromises.push(
          sendPaymentConfirmationEmail({
            email: order.patientEmail,
            name: order.patientName || '',
            testName: order.testName || '',
            orderId: order.id,
            shippingAddress: formattedShippingAddress
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
            shippingAddress: formattedShippingAddress
          })
        );
      }

      // Send all emails and update order
      try {
        // Update order status and shipping address
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            paymentId: paymentIntent,
            shippingAddress: address ? JSON.stringify(address) : Prisma.JsonNull
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
  } catch (err) {
    console.error('Error handling webhook:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : 'Unknown error', code: 400 } },
      { status: 400 }
    );
  }
}
