import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { sendEmail } from '@/lib/services/email';
import { createPatientAccount } from '@/lib/services/patient';
import { generateOrderConfirmationEmailHtml } from '@/lib/email-templates/order-confirmation';
import { generateWelcomeEmail } from '@/lib/email-templates/welcome';
import { generateAdminNotificationEmail } from '@/lib/email-templates/admin-notification';

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

type OrderSelect = Prisma.OrderGetPayload<typeof orderSelect> & {
  patientDateOfBirth: string;
  patientMobile: string | null;
};

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



async function sendWelcomeEmail({
  email,
  name,
  password,
  order,
}: {
  email: string;
  name: string;
  password?: string;
  order: Order;
}) {
  const { subject, html } = generateWelcomeEmail({
    order,
    email,
    password,
    name,
  });

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
          where: { stripeSessionId: session.id },
          ...orderSelect
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

        // Create patient account and address if needed
        let clientUser = null;
        if (order.createAccount && order.patientDateOfBirth && session.metadata.password) {
          try {
            // Create the user account
            // First create the user account using the existing function
            clientUser = await createPatientAccount({
              email: order.patientEmail,
              name: order.patientName,
              dateOfBirth: order.patientDateOfBirth,
              password: session.metadata.password
            });

            if (!clientUser) {
              throw new Error('Failed to create client user');
            }

            console.log('Created client user:', {
              id: clientUser.id,
              email: clientUser.email,
              name: clientUser.name
            });
          } catch (error) {
            console.error('Error creating client user:', error);
            // Don't throw - we still want to process the order
          }
        }

        // Create address record if shipping details exist
        let address = null;
        if (formattedShippingAddress) {
          try {
            if (clientUser) {
              // Only create address if we have a user
              address = await prisma.address.create({
                data: {
                  type: 'SHIPPING',
                  name: order.patientName,
                  line1: formattedShippingAddress.line1,
                  line2: formattedShippingAddress.line2,
                  city: formattedShippingAddress.city,
                  postcode: formattedShippingAddress.postal_code,
                  country: formattedShippingAddress.country,
                  isDefault: true,
                  clientId: clientUser.id
                }
              });
            }

            if (address) {
              console.log('Created address:', {
                id: address.id,
                line1: address.line1,
                city: address.city,
                type: address.type,
                clientId: address.clientId
              });
            }
          } catch (error) {
            console.error('Error creating address:', error);
            // Don't throw - we still want to process the order
          }
        }

        const updateData: Prisma.OrderUpdateInput = {
          status: 'PAID',
          stripeSessionId: session.id,
          paymentId: session.payment_intent as string,
          shippingAddress: formattedShippingAddress ? formattedShippingAddress as Prisma.JsonObject : Prisma.JsonNull,
          updatedAt: new Date(),
          // Link the order to the user and address if they were created
          ...(clientUser && { clientId: clientUser.id })
        };

        console.log('Updating order with:', {
          orderId: order.id,
          clientId: clientUser?.id,
          hasShippingAddress: !!formattedShippingAddress,
          status: 'PAID'
        });

        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
            paymentId: session.payment_intent as string,
          },
          ...orderSelect
        });

        // No need to update patient date of birth as it's part of the order

        // Update client profile if needed
        if (updatedOrder.clientId && updatedOrder.createAccount) {
          const clientUserData = {
            dateOfBirth: updatedOrder.patientDateOfBirth,
            mobile: updatedOrder.patientMobile ?? '',
            name: updatedOrder.patientName,
            email: updatedOrder.patientEmail,
          } satisfies Prisma.ClientUserUpdateInput;

          await prisma.clientUser.update({
            where: { id: updatedOrder.clientId },
            data: clientUserData,
          });
        }

        // Create shipping address if provided
        if (updatedOrder.shippingAddress && updatedOrder.createAccount && updatedOrder.clientId) {
          try {
            const address = JSON.parse(updatedOrder.shippingAddress as string);
            await prisma.address.create({
              data: {
                type: 'SHIPPING',
                name: updatedOrder.patientName,
                line1: address.line1,
                line2: address.line2 || null,
                city: address.city,
                postcode: address.postal_code,
                country: address.country,
                isDefault: true,
                clientId: updatedOrder.clientId,
              },
            });
            console.log(`Created address for order ${updatedOrder.id}`);
          } catch (error) {
            console.error('Error creating address:', error);
          }
        }

        // Send welcome email if account was created
        if (updatedOrder.createAccount) {
          try {
            await sendWelcomeEmail({
              email: updatedOrder.patientEmail,
              name: updatedOrder.patientName,
              password: session.metadata?.password,
              order: updatedOrder,
            });
          } catch (error) {
            console.error('Error sending welcome email:', error);
          }
        }

        // Send confirmation email
        try {
          await sendPaymentConfirmationEmail({
            email: updatedOrder.patientEmail,
            orderId: updatedOrder.id,
            name: updatedOrder.patientName,
            shippingAddress: updatedOrder.shippingAddress as string,
            testName: updatedOrder.testName,
          });
        } catch (error) {
          console.error('Error sending confirmation email:', error);
        }

        // Send admin notification
        try {
          // Get amount from Stripe session
          const paymentIntent = typeof session.payment_intent === 'string' 
            ? await stripeClient.paymentIntents.retrieve(session.payment_intent)
            : session.payment_intent;

          const orderWithAmount = {
            ...updatedOrder,
            amount: paymentIntent?.amount ?? 0
          };

          const { subject, html } = generateAdminNotificationEmail({
            order: orderWithAmount,
            customerEmail: updatedOrder.patientEmail,
            customerName: updatedOrder.patientName,
            shippingAddress: updatedOrder.shippingAddress as string,
            accountCreated: updatedOrder.createAccount,
          });

          await sendEmail({
            to: SUPPORT_EMAIL || 'support@edenclinic.co.uk',
            subject,
            html,
            text: `New order received: ${updatedOrder.id}`,
          });
        } catch (error) {
          console.error('Error sending admin notification:', error);
        }

        return new Response('Webhook processed successfully', { status: 200 });
      } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Error processing webhook', { status: 500 });
      }
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
