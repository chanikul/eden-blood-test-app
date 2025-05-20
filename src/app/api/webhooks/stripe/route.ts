import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/email';
import { Order, Prisma } from '@prisma/client';

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

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

type WebhookError = {
  message: string;
  statusCode: number;
  details?: unknown;
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

function handleWebhookError(err: unknown): NextResponse {
  const errorMessage = err instanceof Error ? err.message : 'Unknown webhook error';
  console.error('Webhook Error:', errorMessage);
  return NextResponse.json(
    { error: errorMessage },
    { status: 400 }
  );
}

function handleSessionAlreadyProcessed(sessionId: string): NextResponse {
  console.log('⚠️ Session already processed, skipping:', sessionId);
  return NextResponse.json({ success: true });
}

function handleOrderNotFound(orderId: string): NextResponse {
  const errorMessage = `Order not found: ${orderId}`;
  console.error(errorMessage);
  return NextResponse.json(
    { error: errorMessage },
    { status: 404 }
  );
};

function handleOrderAlreadyPaid(orderId: string): NextResponse {
  const errorMessage = `Order already paid: ${orderId}`;
  console.error(errorMessage);
  return NextResponse.json(
    { error: errorMessage },
    { status: 409 }
  );
};

function handleMissingOrderId(): NextResponse {
  const errorMessage = 'Missing orderId in session metadata';
  console.error(errorMessage);
  return NextResponse.json(
    { error: errorMessage },
    { status: 400 }
  );
}

type SendPaymentConfirmationEmailParams = {
  email: string;
  fullName: string;
  testName: string;
  orderId: string;
  shippingAddress?: string;
};

type SendOrderNotificationEmailParams = {
  orderId: string;
  testName: string;
  email: string;
  fullName: string;
  dateOfBirth: string;
  shippingAddress?: string;
};

const sendPaymentConfirmationEmail = async (params: SendPaymentConfirmationEmailParams) => {
  await sendEmail({
    to: params.email,
    subject: 'Order Confirmation - Eden Blood Test',
    text: `Thank you for your order ${params.orderId}`,
    html: `<p>Thank you for your order ${params.orderId}</p>`
  });
};

const sendOrderNotificationEmail = async (params: SendOrderNotificationEmailParams) => {
  await sendEmail({
    to: process.env.SUPPORT_EMAIL!,
    subject: 'New Blood Test Order',
    text: `New order ${params.orderId}`,
    html: `<p>New order ${params.orderId}</p>`
  });
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? '';

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPPORT_EMAIL) {
  throw new Error('Missing required environment variables');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil' as const
});

type StripeShippingAddress = {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
};

interface ExtendedStripeSession extends Omit<Stripe.Checkout.Session, 'metadata'> {
  shipping_details?: {
    name: string;
    address: StripeShippingAddress;
  };
  metadata: {
    orderId?: string;
  } | null;
  payment_intent: string;
}

// Keep track of processed sessions to avoid duplicates
const processedSessions = new Set<string>();

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: { message: 'Missing stripe-signature header' } },
        { status: 400 }
      );
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: { message: 'Missing Stripe webhook secret' } },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Error verifying webhook signature:', err instanceof Error ? err.message : 'Unknown error');
      return NextResponse.json(
        { error: { message: 'Invalid signature' } },
        { status: 400 }
      );
    }

    console.log('✅ Successfully constructed event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as ExtendedStripeSession;

      // Check if we've already processed this session
      if (processedSessions.has(session.id)) {
        console.log('⏭️ Session already processed:', session.id);
        return handleSessionAlreadyProcessed(session.id);
      }

      // Add session to processed set
      processedSessions.add(session.id);

      // Extract orderId from session metadata
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        return handleMissingOrderId();
      }

      // Find the order in the database
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          bloodTest: true,
          user: true,
        },
      });

      if (!order) {
        return handleOrderNotFound(orderId);
      }

      if (order.paid) {
        return handleOrderAlreadyPaid(orderId);
      }

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paid: true,
          paymentId: session.payment_intent,
          shippingAddress: session.shipping_details
            ? `${session.shipping_details.name}\n${session.shipping_details.address.line1}${session.shipping_details.address.line2 ? '\n' + session.shipping_details.address.line2 : ''}\n${session.shipping_details.address.city}${session.shipping_details.address.state ? ', ' + session.shipping_details.address.state : ''}\n${session.shipping_details.address.postal_code}\n${session.shipping_details.address.country}`
            : null,
        },
      });

      // Prepare email notifications
      const emailPromises: Promise<void>[] = [];

      // Add customer confirmation email
      emailPromises.push(
        sendPaymentConfirmationEmail({
          email: order.user.email,
          fullName: order.patientName,
          testName: order.bloodTest.name,
          orderId: order.id,
          shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : undefined,
        })
      );

      // Add admin notification email
      const supportEmail = SUPPORT_EMAIL;
      if (!supportEmail) {
        throw new Error('SUPPORT_EMAIL environment variable is not set');
Order Details:
- Order ID: ${order.id}
- Test: ${order.bloodTest.name}
- Amount: ${session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00'} ${session.currency?.toUpperCase() || 'GBP'}
- Status: Paid

Your blood test kit will be shipped to the provided address soon.

If you have any questions, please don't hesitate to contact us.

Best regards,
Eden Clinic Team`
        });

        console.log('✅ Confirmation email sent successfully');

        return NextResponse.json({ success: true });
      } catch (err: unknown) {
        console.error('Webhook error:', err instanceof Error ? err.message : 'Unknown error');
        return NextResponse.json(
          { error: { message: err instanceof Error ? err.message : 'Unknown error', code: 400 } },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    } else {
      console.log('⏭️ Skipping non-checkout event:', event.type);
      return NextResponse.json({ success: true });

        // Prepare email data
        const emailPromises = [];
        
        // Send confirmation email to customer
        emailPromises.push(
          await sendPaymentConfirmationEmail({
            fullName: order.patientName,
            email: order.patientEmail,
            testName: order.bloodTest.name,
            orderId: order.id,
            shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : undefined,
          }).catch(error => {
            console.error('❌ Failed to send customer confirmation email:', error);
            throw new Error('Failed to send customer confirmation email');
          })
        );

        // Send notification to clinic
        const supportEmail = process.env.SUPPORT_EMAIL;
        if (!supportEmail) {
          throw new Error('SUPPORT_EMAIL environment variable is not set');
        }

        // Add admin notification email to promises
        emailPromises.push(
          sendOrderNotificationEmail({
            fullName: order.patientName,
            email: supportEmail,
            dateOfBirth: order.patientDateOfBirth,
            testName: order.bloodTest.name,
            notes: order.notes || undefined,
            orderId: order.id,
            shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : undefined,
          })
        );

        // Send all emails
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : 'Unknown error', code: 400 } },
      { status: 400 }
    );
    await prisma.$disconnect();
  }
}
