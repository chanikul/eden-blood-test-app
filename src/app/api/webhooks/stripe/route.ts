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
  apiVersion: '2023-10-16'
});

type StripeCheckoutSession = Stripe.Checkout.Session & {
  shipping_details?: {
    name: string;
    address: Stripe.Address;
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
      ) as Stripe.Event;
    } catch (error) {
      return handleWebhookError(error);
    }

    console.log('✅ Successfully constructed event:', event.type);

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

      let formattedShippingAddress: string | undefined = undefined;
      if (session.shipping_details?.address && session.shipping_details.name) {
        const address = session.shipping_details.address;
        formattedShippingAddress = `${session.shipping_details.name}\n${[
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postal_code,
          address.country
        ].filter(Boolean).join('\n')}`;
      }

      try {
        // Send confirmation email to customer
        if (order.patientEmail) {
          await sendPaymentConfirmationEmail({
            email: order.patientEmail,
            orderId: order.id,
            name: order.patientName || '',
            shippingAddress: formattedShippingAddress,
            testName: order.testName || ''
          });
        }

        // Send notification email to admin
        if (SUPPORT_EMAIL) {
          await sendOrderNotificationEmail({
            orderId: order.id,
            name: order.patientName || '',
            shippingAddress: formattedShippingAddress,
            testName: order.testName || ''
          });
        }

        // Update order status and payment details
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            paymentId: paymentIntent,
            shippingAddress: formattedShippingAddress,
            updatedAt: new Date()
          }
        });

        // Add session to processed set
        processedSessions.add(session.id);

        console.log('✅ Payment processed successfully for order:', orderId);
        return NextResponse.json({ received: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error processing payment:', errorMessage);
        return NextResponse.json(
          { error: { message: 'Failed to process payment', details: errorMessage } },
          { status: 500 }
        );
      }
    }

    // Handle non-checkout events
    if (event) {
      console.log('⏭️ Skipping non-checkout event:', event.type);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error handling webhook:', errorMessage);
    return NextResponse.json(
      { error: { message: 'Webhook handler failed', details: errorMessage } },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
await prisma.order.update({
where: { id: orderId },
data: {
status: 'PAID',
stripePaymentIntentId: session.payment_intent,
shippingAddress: session.shipping_details
? `${session.shipping_details.name}\n${session.shipping_details.address.line1}${session.shipping_details.address.line2 ? '\n' + session.shipping_details.address.line2 : ''}\n${session.shipping_details.address.city}${session.shipping_details.address.state ? ', ' + session.shipping_details.address.state : ''}\n${session.shipping_details.address.postal_code}\n${session.shipping_details.address.country}`
: null,
},
});

// Prepare email data
const emailPromises = [];

// Add customer confirmation email
emailPromises.push(
sendPaymentConfirmationEmail({
email: order.patientEmail,
fullName: order.patientName,
testName: order.testName,
orderId: order.id,
shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : undefined,
})
);

// Add admin notification email
const supportEmail = SUPPORT_EMAIL;
if (!supportEmail) {
throw new Error('SUPPORT_EMAIL environment variable is not set');
}

// Add admin notification email to promises
emailPromises.push(
sendOrderNotificationEmail({
fullName: order.patientName,
email: supportEmail,
dateOfBirth: order.patientDateOfBirth,
testName: order.testName,
notes: order.notes || undefined,
orderId: order.id,
shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : undefined,
})
);

// Send all emails
await Promise.all(emailPromises);
console.log(' All notification emails sent successfully');
return NextResponse.json({ received: true });
} else {
console.log(' Skipping non-checkout event:', event.type);
return NextResponse.json({ success: true });
}
} catch (err) {
console.error(' Error handling webhook:', err instanceof Error ? err.message : 'Unknown error');
return NextResponse.json(
{ error: { message: err instanceof Error ? err.message : 'Unknown error', code: 400 } },
{ status: 400 }
);
}
await prisma.$disconnect();
}
