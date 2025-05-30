import { NextResponse } from 'next/server';
import Stripe from 'stripe';
// Using raw buffer from req.text() instead of micro package
import { prisma } from '@/lib/prisma';
import { generateWelcomeEmail } from '@/lib/email-templates/welcome';
import { generateOrderConfirmationEmail } from '@/lib/email-templates/order-confirmation';
import { generateAdminNotificationEmail } from '@/lib/email-templates/admin-notification';
import { sendEmail } from '@/lib/services/email';
import { createPatientAccount } from '@/lib/services/patient';
// Keep bcrypt as fallback
import bcrypt from 'bcryptjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
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
          id: (event.data.object as any).id,
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
    if (!shippingAddress && (session as any).shipping) {
      shippingAddress = (session as any).shipping.address;
    }

    // Create user account if requested
    let clientId = order.clientId;
    
    // Log values for debugging
    console.log('🔑 [AUTH CHECK] Account creation parameters:', {
      createAccount,
      passwordProvided: !!password,
      clientIdExists: !!clientId,
      email: order.patientEmail
    });
    
    if (createAccount === 'true' && password && !clientId) {
      console.log('🔑 [AUTH INIT] ===== ACCOUNT CREATION REQUESTED =====');
      console.log('🔑 [AUTH INIT] Patient account details:', {
        name: order.patientName,
        email: order.patientEmail,
        passwordLength: password ? password.length : 0,
        dateOfBirth: order.patientDateOfBirth,
        mobile: order.patientMobile
      });
      
      try {
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
          // Use the dedicated service function to create a complete account
          // This handles Supabase Auth, ClientUser creation, and Address creation
          console.log('Creating new patient account with complete flow...');
          
          // Process the shipping address
          const patientAddress = shippingAddress ? {
            line1: shippingAddress.line1 || '',
            line2: shippingAddress.line2 || undefined,
            city: shippingAddress.city || '',
            postalCode: shippingAddress.postal_code || shippingAddress.postalCode || '',
            country: shippingAddress.country || 'GB'
          } : undefined;
          
          console.log('Using patient address:', patientAddress);
          
          // Create the complete user account (Supabase Auth + Database + Address)
          const newUser = await createPatientAccount({
            name: order.patientName,
            email: order.patientEmail,
            dateOfBirth: order.patientDateOfBirth,
            password: password,
            mobile: order.patientMobile,
            address: patientAddress,
            orders: [{
              id: order.id,
              testName: order.testName,
              status: 'PAID',
              createdAt: new Date()
            }]
          });
          
          clientId = newUser.id;
          
          console.log('✅ Complete patient account created successfully:', {
            userId: newUser.id,
            email: newUser.email,
            hasAddress: !!patientAddress
          });
          
          // Note: Welcome email is sent by createPatientAccount function
          console.log('Welcome email triggered through patient account creation');
        }
      } catch (error) {
        console.error('❌ Error creating patient account:', error);
        // Continue processing so order confirmation still works
      }
    }

    // Send order confirmation email to customer
    try {
      console.log('📧 [EMAIL 1/3] Generating order confirmation email for customer...');
      
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

      console.log('📧 [EMAIL 1/3] Styled confirmation email generated, sending via SendGrid...');
      
      await sendEmail({
        to: order.patientEmail,
        subject,
        text: `Thank you for your order at Eden Clinic. Your blood test (${order.testName}) has been confirmed. Order ID: ${order.id}`,
        html,
      });

      console.log('✅ [EMAIL 1/3] Order confirmation email sent successfully to:', order.patientEmail);
    } catch (error) {
      console.error('❌ [EMAIL 1/3] Error sending order confirmation email:', error);
      // Continue processing, just log the error
    }

    // Send admin notification email
    try {
      console.log('📧 [EMAIL 2/3] Generating admin notification email...');
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

        console.log('📧 [EMAIL 2/3] Styled admin notification email generated, sending to:', adminEmail);
        
        await sendEmail({
          to: adminEmail,
          subject,
          text: `New paid order received: ${order.testName} for ${order.patientName} (${order.patientEmail}). Order ID: ${order.id}`,
          html,
        });

        console.log('✅ [EMAIL 2/3] Admin notification email sent successfully to:', adminEmail);
      } else {
        console.warn('⚠️ [EMAIL 2/3] No admin email configured for notifications. Set ADMIN_EMAIL or SUPPORT_EMAIL in .env');
      }
    } catch (error) {
      console.error('❌ [EMAIL 2/3] Error sending admin notification email:', error);
      // Continue processing, just log the error
    }

    console.log('Checkout session processing completed successfully');
  } catch (error) {
    console.error('Error processing checkout session:', error);
    throw error; // Re-throw to record the failure
  }
}

// This is needed for the webhook handler to properly parse the request body
// Using the new Next.js route segment config format
export const config = {
  runtime: 'nodejs',
  dynamic: 'force-dynamic'
};

// Disable body parsing as we need the raw body for Stripe signature verification
export const bodyParser = false;
