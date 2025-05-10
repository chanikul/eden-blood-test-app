import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { sendEmail, sendPaymentConfirmationEmail } from '@/lib/services/email';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Cache to track processed sessions and prevent duplicates
const processedSessions = new Set<string>();

interface CustomerDetails extends Stripe.Checkout.Session.CustomerDetails {}

interface CheckoutSession extends Stripe.Checkout.Session {
  shipping: {
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    name: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    console.log('✅ Webhook request received');
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: { message: 'Missing stripe-signature header' } },
        { status: 400 }
      );
    }

    try {
      console.log('Verifying webhook signature...');
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );

      console.log('Received webhook event:', event.type);

      // Log all event types for debugging
      console.log('🔍 Processing event type:', event.type);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as CheckoutSession;
        
        // Check if we've already processed this session
        if (processedSessions.has(session.id)) {
          console.log('⚠️ Session already processed, skipping:', session.id);
          return NextResponse.json({ received: true });
        }

        console.log('✨ Processing new checkout session:', session.id);

        // Extract customer details and metadata
        const customerDetails = (session.customer_details || {}) as CustomerDetails;
        const metadata = session.metadata || {};

        // Find order and check if it's already processed
        const order = await prisma.order.findFirst({
          where: { id: metadata.orderId },
        });

        if (!order) {
          console.error('❌ No order found for session:', session.id);
          return NextResponse.json(
            { error: { message: 'Order not found' } },
            { status: 404 }
          );
        }

        // Check if order is already paid
        if (order.status === 'PAID') {
          console.log('⚠️ Order already marked as paid, skipping:', order.id);
          return NextResponse.json({ received: true });
        }

        // Mark session as processed early
        processedSessions.add(session.id);
        console.log('✅ Session marked as processed:', session.id);

        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: 'PAID',
            stripeSessionId: session.id, // Store the session ID for future reference
          },
        });

        // Prepare email data
        const orderDetails = {
          fullName: metadata.fullName || customerDetails.name || 'Not provided',
          email: metadata.email || customerDetails.email || 'Not provided',
          dateOfBirth: metadata.dateOfBirth || 'Not provided',
          testName: metadata.testName || 'Not provided',
          mobile: metadata.mobile || 'Not provided',
          notes: metadata.notes || '',
          orderId: order.id,
          shippingAddress: session.shipping ? {
            line1: session.shipping.address?.line1 || '',
            line2: session.shipping.address?.line2 || '',
            city: session.shipping.address?.city || '',
            state: session.shipping.address?.state || '',
            postal_code: session.shipping.address?.postal_code || '',
            country: session.shipping.address?.country || '',
          } : undefined,
        };

        console.log('✅ Calling SendGrid with:', orderDetails);

        try {
          // Send confirmation email to customer
          await sendPaymentConfirmationEmail(orderDetails);
          console.log('✅ Customer confirmation email sent');

          // Send notification email to admin
          await sendEmail({
            to: process.env.SUPPORT_EMAIL || 'no-reply@edenclinic.co.uk',
            subject: 'New Blood Test Order',
            text: `A new blood test order has been received.

Order ID: ${orderDetails.orderId}

Patient Details:
Name: ${orderDetails.fullName}
Email: ${orderDetails.email}
Date of Birth: ${orderDetails.dateOfBirth}
Mobile: ${orderDetails.mobile}

Test Details:
Test Name: ${orderDetails.testName}
Notes: ${orderDetails.notes || 'No notes provided'}

Shipping Address:
${orderDetails.shippingAddress ? `${orderDetails.shippingAddress.line1}
${orderDetails.shippingAddress.line2 ? orderDetails.shippingAddress.line2 + '\n' : ''}${orderDetails.shippingAddress.city}
${orderDetails.shippingAddress.state}
${orderDetails.shippingAddress.postal_code}
${orderDetails.shippingAddress.country}` : 'No shipping address provided'}`,
          });
          console.log('✅ Admin notification email sent');
          
          // Emails sent successfully
        } catch (err) {
          const sendGridError = err as { response?: { body?: any } };
          console.error('❌ SendGrid error:', sendGridError?.response?.body || err);
          throw err;
        }

        return NextResponse.json({ received: true });
      }

      console.log(`Unhandled event type ${event.type}`);
      return NextResponse.json({ received: true });
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
