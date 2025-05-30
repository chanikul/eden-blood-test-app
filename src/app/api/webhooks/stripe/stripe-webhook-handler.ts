import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { prisma } from '@/lib/prisma';
import { generateWelcomeEmail } from '@/lib/email-templates/welcome';
import { generateOrderConfirmationEmail } from '@/lib/email-templates/order-confirmation';
import { generateAdminNotificationEmail } from '@/lib/email-templates/admin-notification';
import { sendEmail } from '@/lib/services/email';
import bcrypt from 'bcryptjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    console.log('=== STRIPE WEBHOOK RECEIVED ===');
    
    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    console.log('Verifying webhook signature with secret:', STRIPE_WEBHOOK_SECRET.substring(0, 5) + '...');
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
      console.log('Webhook signature verified successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`⚠️ Webhook signature verification failed: ${errorMessage}`);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Log event details
    console.log(`✅ Event received: ${event.type}`, {
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
      data: {
        object: {
          id: event.data.object.id,
        }
      }
    });

    // Check if we've already processed this event
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id }
    });

    if (existingEvent) {
      console.log(`Event ${event.id} has already been processed. Skipping.`);
      return NextResponse.json({ message: 'Event already processed' });
    }

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event);
        break;
      }
      // Add other event handlers as needed
    }

    // Record that we've processed this event
    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  try {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Processing completed checkout session:', {
      id: session.id,
      customerId: session.customer,
      customerEmail: session.customer_email,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    });

    // Extract metadata
    const { orderId, createAccount, password } = session.metadata || {};
    
    if (!orderId) {
      console.error('Missing orderId in session metadata');
      return;
    }

    // Update order status to PAID
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentId: session.payment_intent as string,
      },
      include: {
        bloodTest: true,
      },
    });

    console.log('Order marked as PAID:', {
      orderId: order.id,
      status: order.status,
      paymentId: order.paymentId,
    });

    // Get shipping address from Stripe
    let shippingAddress = order.shippingAddress as any;

    // If a shipping address doesn't exist on the order but exists in session, use that
    if (!shippingAddress && session.shipping) {
      shippingAddress = session.shipping.address;
    }

    // Create user account if requested
    let clientId = order.clientId;
    
    if (createAccount === 'true' && password && !clientId) {
      console.log('Creating user account as requested in metadata');
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Look for existing user with this email
        const existingUser = await prisma.clientUser.findUnique({
          where: { email: order.patientEmail }
        });

        if (existingUser) {
          // User exists, just link the order
          clientId = existingUser.id;
          await prisma.order.update({
            where: { id: order.id },
            data: { clientId: existingUser.id }
          });
          console.log('Order linked to existing user:', existingUser.id);
        } else {
          // Create new user
          const newUser = await prisma.clientUser.create({
            data: {
              email: order.patientEmail,
              name: order.patientName,
              passwordHash: hashedPassword,
              dateOfBirth: order.patientDateOfBirth,
              mobile: order.patientMobile,
              active: true,
              stripeCustomerId: session.customer as string,
            }
          });
          clientId = newUser.id;
          
          // Link order to new user
          await prisma.order.update({
            where: { id: order.id },
            data: { clientId: newUser.id }
          });
          
          console.log('Created new user account:', {
            userId: newUser.id,
            email: newUser.email,
          });
          
          // Save shipping address if present
          if (shippingAddress) {
            try {
              const address = await prisma.address.create({
                data: {
                  type: 'SHIPPING',
                  name: order.patientName,
                  line1: shippingAddress.line1,
                  line2: shippingAddress.line2,
                  city: shippingAddress.city,
                  postcode: shippingAddress.postal_code || shippingAddress.postalCode,
                  country: shippingAddress.country,
                  isDefault: true,
                  clientId: newUser.id,
                }
              });
              console.log('Created shipping address:', address.id);
            } catch (error) {
              console.error('Error creating shipping address:', error);
              // Don't fail the entire process if address creation fails
            }
          }
          
          // Send welcome email
          try {
            const { subject, html } = await generateWelcomeEmail({
              name: order.patientName,
              email: order.patientEmail,
              tempPassword: password,
            });
            
            await sendEmail({
              to: order.patientEmail,
              subject,
              text: `Welcome to Eden Clinic! Your account has been created. Email: ${order.patientEmail}, Password: ${password}`,
              html,
            });
            
            console.log('Welcome email sent to:', order.patientEmail);
          } catch (error) {
            console.error('Error sending welcome email:', error);
            // Don't fail the entire process if email sending fails
          }
        }
      } catch (error) {
        console.error('Error creating user account:', error);
        // Continue processing, just log the error
      }
    }

    // Send order confirmation email to customer
    try {
      const { subject, html } = await generateOrderConfirmationEmail({
        name: order.patientName,
        orderId: order.id,
        testName: order.testName,
        shippingAddress: {
          line1: shippingAddress?.line1 || '',
          line2: shippingAddress?.line2,
          city: shippingAddress?.city || '',
          postcode: shippingAddress?.postal_code || shippingAddress?.postalCode || '',
        },
        orderStatus: 'Paid',
        orderDate: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });

      await sendEmail({
        to: order.patientEmail,
        subject,
        text: `Thank you for your order at Eden Clinic. Your blood test (${order.testName}) has been confirmed. Order ID: ${order.id}`,
        html,
      });

      console.log('Order confirmation email sent to:', order.patientEmail);
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      // Continue processing, just log the error
    }

    // Send admin notification email
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL;
      if (adminEmail) {
        const { subject, html } = await generateAdminNotificationEmail({
          name: order.patientName,
          email: order.patientEmail,
          orderId: order.id,
          testName: order.testName,
          shippingAddress: {
            line1: shippingAddress?.line1 || '',
            line2: shippingAddress?.line2,
            city: shippingAddress?.city || '',
            postcode: shippingAddress?.postal_code || shippingAddress?.postalCode || '',
          },
          notes: order.notes || undefined,
          paymentStatus: 'paid',
        });

        await sendEmail({
          to: adminEmail,
          subject,
          text: `New paid order received: ${order.testName} for ${order.patientName} (${order.patientEmail}). Order ID: ${order.id}`,
          html,
        });

        console.log('Admin notification email sent to:', adminEmail);
      } else {
        console.warn('No admin email configured for notifications');
      }
    } catch (error) {
      console.error('Error sending admin notification email:', error);
      // Continue processing, just log the error
    }

    console.log('Checkout session processing completed successfully');
  } catch (error) {
    console.error('Error processing checkout session:', error);
    throw error; // Re-throw to record the failure
  }
}

// This is needed for the webhook handler to properly parse the request body
export const config = {
  api: {
    bodyParser: false,
  },
};
