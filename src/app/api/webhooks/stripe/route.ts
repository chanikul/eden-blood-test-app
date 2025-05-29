import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { sendEmail } from '@/lib/services/email';
import { createPatientAccount } from '@/lib/services/patient';

// Environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

const stripeClient = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil' as const
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

interface Order {
  id: string;
  status: OrderStatus;
  paymentId: string | null;
  stripeSessionId: string | null;
  shippingAddress: JsonValue;
  patientEmail: string;
  patientName: string;
  testName: string;
  createAccount: boolean;
  dateOfBirth: string | null;
}

interface StripeSession extends Omit<Stripe.Checkout.Session, 'payment_intent' | 'metadata' | 'shipping_details'> {
  shipping_details?: {
    address?: {
      line1?: string;
      line2?: string | null;
      city?: string;
      state?: string | null;
      postal_code?: string;
      country?: string;
    };
  };
  metadata: {
    orderId: string;
    password?: string;
  } | null;
  payment_intent?: string | Stripe.PaymentIntent;
}

type ShippingAddress = {
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
};

type CreatePatientAccountParams = {
  email: string;
  name: string;
  dateOfBirth?: string;
  password?: string;
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
  shippingAddress: ShippingAddress | null;
};

type StripeShippingDetails = {
  address?: ShippingAddress;
};

interface WebhookErrorParams {
  message: string;
  code: string;
  statusCode: number;
  name?: string;
}

class WebhookError extends Error {
  code: string;
  statusCode: number;
  name: string;

  constructor({ message, code, statusCode, name }: WebhookErrorParams) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = name ?? 'WebhookError';
  }
}
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
  stripeSessionId: true,
  paymentId: true,
  shippingAddress: true,
  patientEmail: true,
  patientName: true,
  testName: true,
  createAccount: true,
  dateOfBirth: true
} as const satisfies Record<keyof Order, boolean>;

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

const verifyWebhookSignature = async (request: Request): Promise<Stripe.Event> => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    const error: WebhookError = {
      message: 'No Stripe signature found',
      code: 'missing_signature',
      statusCode: 400
    };
    throw error;
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      const error: WebhookError = {
        message: 'Missing Stripe webhook secret',
        code: 'missing_webhook_secret',
        statusCode: 500
      };
      throw error;
    }

    return stripeClient.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    const error: WebhookError = {
      message: err instanceof Error ? err.message : 'Invalid signature',
      code: 'invalid_signature',
      statusCode: 400
    };
    console.error('Error verifying webhook signature:', error);
    throw error;
  }
};

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook secret is not set');
    return new Response('Webhook secret is not set', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      throw new WebhookError({
        message: 'No Stripe signature found',
        code: 'missing_signature',
        statusCode: 400,
        name: 'WebhookError'
      });
    }

    event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    if (!event?.data?.object) {
      throw new WebhookError({
        message: 'Invalid event data',
        code: 'invalid_event',
        statusCode: 400,
        name: 'WebhookError'
      });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as StripeSession;

        if (!session?.metadata?.orderId) {
          throw new WebhookError({
            message: 'Missing orderId in session metadata',
            code: 'missing_order_id',
            statusCode: 400,
            name: 'WebhookError'
          });
        }

        const order = await prisma.order.findUnique({
          where: { id: session.metadata.orderId },
          select: orderSelect
        });

        if (!order) {
          throw new WebhookError({
            message: 'Order not found',
            code: 'order_not_found',
            statusCode: 404,
            name: 'WebhookError'
          });
        }

        const shippingDetails = session.shipping_details;
        const shippingAddress = shippingDetails?.address;

        const formattedShippingAddress: ShippingAddress | null = shippingAddress ? {
          line1: shippingAddress.line1 ?? '',
          line2: shippingAddress.line2 ?? null,
          city: shippingAddress.city ?? '',
          state: shippingAddress.state ?? null,
          postal_code: shippingAddress.postal_code ?? '',
          country: shippingAddress.country ?? ''
        } : null;

        // Create patient account if needed
        if (order.createAccount && order.dateOfBirth && session.metadata.password) {
          try {
            await createPatientAccount({
              email: order.patientEmail,
              name: order.patientName,
              dateOfBirth: order.dateOfBirth,
              password: session.metadata.password
            });
          } catch (error) {
            console.error('Error creating patient account:', error);
          }
        }

        const updateData: Prisma.OrderUpdateInput = {
          status: 'PAID',
          stripeSessionId: session.id,
          paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
          shippingAddress: formattedShippingAddress ? formattedShippingAddress as Prisma.JsonObject : Prisma.JsonNull,
          updatedAt: new Date()
        };

        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: updateData,
          select: orderSelect
        });

        // Send confirmation emails
        if (updatedOrder.patientEmail && updatedOrder.patientName && updatedOrder.testName) {
          await sendPaymentConfirmationEmail({
            email: updatedOrder.patientEmail,
            name: updatedOrder.patientName,
            testName: updatedOrder.testName,
            orderId: updatedOrder.id,
            shippingAddress: updatedOrder.shippingAddress ? String(updatedOrder.shippingAddress) : ''
          });

          const supportEmail = process.env.SUPPORT_EMAIL;
          if (supportEmail) {
            await sendOrderNotificationEmail({
              orderId: updatedOrder.id,
              name: updatedOrder.patientName,
              testName: updatedOrder.testName,
              shippingAddress: updatedOrder.shippingAddress ? String(updatedOrder.shippingAddress) : ''
            });
          }
        }
        return new Response('Webhook processed successfully', { status: 200 });
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(`Unhandled event type: ${event.type}`, { status: 200 });
    }
  } catch (err: unknown) {
    if (err instanceof WebhookError) {
      console.error('Webhook error:', err);
      return new Response(err.message, { status: err.statusCode });
    }
    const error = err as Error;
    console.error('Error processing webhook:', error.message);
    return new Response('Error processing webhook', { status: 500 });
  }
}
}
