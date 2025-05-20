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
    );
  }

  try {
    console.log('=== WEBHOOK REQUEST RECEIVED ===');
    
    // Get the raw body and signature
    const body = await req.text();
    const signature = headers().get('stripe-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'No signature in request' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = await stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session) {
        console.error('No session found in event');
        return NextResponse.json(
          { error: 'No session found in event' },
          { status: 400 }
        );
      }

      // Skip if already processed
      if (processedSessions.has(session.id)) {
        return handleSessionAlreadyProcessed(session.id);
      }

      // Get order ID from metadata
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        return handleMissingOrderId();
      }

      // Get order from database with all required fields
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          bloodTest: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      }) as OrderWithRelations | null;

      if (!order || !order.bloodTest) {
        return handleOrderNotFound(orderId);
      }

      // Check if order is already paid
      if (order.status === 'PAID') {
        return handleOrderAlreadyPaid(orderId);
      }

      // Get shipping address from session
      const shippingDetails = (session as any).shipping_details as StripeShippingDetails | null;
      const shippingAddress = shippingDetails ? {
        name: shippingDetails.name,
        address: {
          line1: shippingDetails.address.line1,
          line2: shippingDetails.address.line2 || null,
          city: shippingDetails.address.city,
          state: shippingDetails.address.state || null,
          postal_code: shippingDetails.address.postal_code,
          country: shippingDetails.address.country
        }
      } : null;

      // Update order with payment details
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          stripePaymentIntentId: typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : null,
          shippingAddress: shippingAddress ? (shippingAddress as Prisma.InputJsonValue) : null,
          updatedAt: new Date()
        }
      });

      try {
        // Send confirmation email to customer
        const customerDetails = session.customer_details;
        if (!customerDetails?.email || !customerDetails?.name) {
          console.error('Missing customer details');
          return NextResponse.json(
            { error: 'Missing customer details' },
            { status: 400 }
          );
        }

        // Log event details
        console.log('Event details:', {
          type: event.type,
          id: session.id,
          status: session.status,
          customerEmail: customerDetails.email,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
          metadata: session.metadata
        });

        // Send confirmation email
        await sendEmail({
          to: customerDetails.email,
          subject: `Blood Test Kit Order Confirmation - ${order.bloodTest.name}`,
          text: `Dear ${customerDetails.name},

Thank you for ordering the ${order.bloodTest.name} test kit.

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

        emailPromises.push(
          await sendOrderNotificationEmail({
            fullName: order.patientName,
            email: supportEmail,
            dateOfBirth: order.patientDateOfBirth,
            testName: order.bloodTest.name,
            notes: order.notes || undefined,
            orderId: order.id,
            shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : undefined,
          }).catch(error => {
            console.error('❌ Failed to send admin notification email:', error);
            throw new Error('Failed to send admin notification email');
          })
        );

        try {
          await Promise.all(emailPromises);
          console.log('✅ All notification emails sent successfully');
        } catch (error) {
          console.error('=== EMAIL SENDING ERROR ===');
          if (error instanceof Error) {
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
          }
          // Remove the session from processed set if email sending fails
          processedSessions.delete(session.id);
          throw error;
        }

        return NextResponse.json({ received: true });
      } else {
        console.log('⏭️ Skipping non-checkout event:', event.type);
        return NextResponse.json({ received: true });
      }
    } catch (err) {
      console.error('Error processing webhook:', err instanceof Error ? err.message : 'Unknown error');
      return NextResponse.json(
        {
          error: {
            message: 'Webhook handler failed',
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler failed' },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
