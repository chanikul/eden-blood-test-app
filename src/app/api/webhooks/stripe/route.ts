import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma, ClientUser } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { sendEmail } from '@/lib/services/email';
import { createPatientAccount } from '@/lib/services/patient';
import { generateOrderConfirmationEmail } from '@/lib/email-templates/order-confirmation';
import { generateAdminNotificationEmail } from '@/lib/email-templates/admin-notification';
import { generateWelcomeEmail, WelcomeEmailProps } from '@/lib/email-templates/welcome';

interface EmailTemplateResponse {
  subject: string;
  html: string;
}

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

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
  apiVersion: '2022-11-15'
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

const orderSelect = {
  select: {
    id: true,
    status: true,
    paymentId: true,
    stripeSessionId: true,
    shippingAddress: true,
    patientEmail: true,
    patientName: true,
    patientDateOfBirth: true,
    patientMobile: true,
    testName: true,
    createAccount: true,
    createdAt: true,
    updatedAt: true,
    notes: true,
    internalNotes: true,
    dispatchedAt: true,
    dispatchedById: true,
    bloodTestId: true,
    clientId: true,
  }
} satisfies Prisma.OrderDefaultArgs;

type OrderSelect = NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>>;
interface EmailShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}

type OrderWithAmount = OrderSelect & {
  amount: number;
};

type Order = OrderSelect;

interface OrderInput extends Prisma.OrderGetPayload<typeof orderSelect> {
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

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

interface EmailShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}

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

async function sendWelcomeEmail({
  email,
  name,
  password,
}: WelcomeEmailProps) {
  const welcomeEmailData: EmailTemplateResponse = await sendWelcomeEmail({
    email,
    name,
    password
  });

  const { subject, html } = welcomeEmailData;

  await sendEmail({
    to: email,
    subject,
    html,
    text: 'Welcome to Eden Clinic! Your account has been created.',
  });
}

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
    throw new WebhookError({
      message: 'No Stripe signature found',
      code: 'missing_signature',
      statusCode: 400,
      name: 'WebhookError'
    });
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new WebhookError({
        message: 'Missing Stripe webhook secret',
        code: 'missing_webhook_secret',
        statusCode: 500,
        name: 'WebhookError'
      });
    }

    return stripeClient.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    const error = new WebhookError({
      message: err instanceof Error ? err.message : 'Invalid signature',
      code: 'invalid_signature',
      statusCode: 400,
      name: 'WebhookError'
    });
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
    // Handle errors
    const body = await request.text();
    event = stripeClient.webhooks.constructEvent(
      body,
      signature || '',
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Error verifying webhook signature:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(`Unhandled event type: ${event.type}`, { status: 400 });
  }

  const session = event.data.object as StripeSession;

  try {
    // Get or create user account
    let clientUser = null;
    if (session.metadata?.createAccount === 'true' && session.metadata?.password) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: session.metadata.orderId }
        });

        if (!order) {
          throw new Error(`Order not found: ${session.metadata.orderId}`);
        }

        clientUser = await createPatientAccount({
          email: order.patientEmail,
          name: order.patientName,
          dateOfBirth: order.patientDateOfBirth,
          password: session.metadata.password
        });
      } catch (error) {
        console.error('Error creating client user:', error);
      }
    }

    // Create address record if shipping details exist
    if (session.shipping_details && clientUser?.id) {
      try {
        const shippingDetails = session.shipping_details;
        const shippingAddress = shippingDetails.address;

        const formattedShippingAddress: ShippingAddress | null = shippingAddress ? {
          line1: shippingAddress.line1 ?? '',
          line2: shippingAddress.line2 ?? undefined,
          city: shippingAddress.city ?? '',
          state: shippingAddress.state ?? undefined,
          postal_code: shippingAddress.postal_code ?? '',
          country: shippingAddress.country ?? ''
        } : null;

        await prisma.address.create({
          data: {
            line1: formattedShippingAddress.line1,
            line2: formattedShippingAddress.line2,
            city: formattedShippingAddress.city,
            postcode: formattedShippingAddress.postal_code,
            country: formattedShippingAddress.country,
            type: 'SHIPPING',
            name: session.metadata.orderName,
            isDefault: true,
            clientId: clientUser.id
          }
        });
      } catch (error) {
        console.error('Error creating address:', error);
      }
    }

    // Update order status
    const order = await prisma.order.findUnique({
      where: { id: session.metadata.orderId }
    });

    if (!order) {
      throw new Error(`Order not found: ${session.metadata.orderId}`);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paymentId: session.payment_intent as string,
        paidAt: new Date()
      }
    });

    // Send welcome email
    try {
      const welcomeEmailData = await generateWelcomeEmail({
        email: order.patientEmail,
        name: order.patientName,
        password: session.metadata.password,
        order: order
      });

      await sendEmail({
        to: order.patientEmail,
        subject: welcomeEmailData.subject,
        html: welcomeEmailData.html,
        text: 'Welcome to Eden Clinic'
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }

    // Send order confirmation email
    try {
      const emailShippingAddress: EmailShippingAddress = {
        line1: session.shipping_details.address.line1 || '',
        line2: session.shipping_details.address.line2,
        city: session.shipping_details.address.city || '',
        postcode: session.shipping_details.address.postal_code || ''
      };

      const emailData = await generateOrderConfirmationEmail({
        name: order.patientName,
        orderId: order.id,
        testName: order.testName,
        shippingAddress: emailShippingAddress,
        orderStatus: 'Confirmed',
        orderDate: new Date().toLocaleDateString('en-GB')
      });

      await sendEmail({
        to: order.patientEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: `Order confirmation for order ${order.id}`
      });
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
    }

    // Send admin notification email
    try {
      const adminEmailHtml = await generateAdminNotificationEmail({
        email: order.patientEmail,
        name: order.patientName,
        orderId: order.id,
        testName: order.testName,
        shippingAddress: emailShippingAddress,
        notes: order.notes || undefined,
        paymentStatus: 'PAID'
      });

      await sendEmail({
        to: process.env.SUPPORT_EMAIL || '',
        subject: 'New Order Notification - Eden Clinic',
        html: adminEmailHtml,
        text: `New order notification: ${order.id}`
      });
    } catch (error) {
      console.error('Error sending admin notification email:', error);
    }

    return new Response('Webhook processed successfully', { status: 200 });
      default:
        try {
          console.log(`Unhandled event type: ${event.type}`);
          return new Response(`Unhandled event type: ${event.type}`, { status: 200 });
        } catch (error) {
          console.error('Error handling unhandled event type:', error);
          return new Response('Error handling unhandled event type', { status: 500 });
        }
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response('Error', { status: 500 });
  }
}
