import { NextRequest, NextResponse } from 'next/server';

// NOTE: We no longer use static mapping since testName is now included in the metadata
// This is kept for backward compatibility with older sessions
const STRIPE_PRICE_ID_TO_TEST_NAME: Record<string, string> = {
  'price_1RVUrBEaVUA3G0SJzJoO7QPZ': 'Essential Blood Test',
  'price_1RVUzMEaVUA3G0SJW3z1Y0XC': 'Advanced Blood Test',
  'price_1RVV0REaVUA3G0SJmLsgKQOB': 'Premium Blood Test',
  'price_1RVV1kEaVUA3G0SJ6lU2ddyJ': 'Ultimate Blood Test',
};

import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';
import { createClientUser, findClientUserByEmail } from '../../../lib/services/client-user';
import { sendOrderNotificationEmail, sendPaymentConfirmationEmail } from '../../../lib/services/email';
import { sendWelcomeEmail } from '../../../lib/services/email';
import { getSupabaseClient } from '../../../lib/supabase-client';

// Create a request deduplication cache to prevent duplicate processing
// This prevents multiple identical requests from processing the same order multiple times
const processedSessions = new Set<string>();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any });

// Get the Supabase client singleton
const supabase = getSupabaseClient();

export const GET = async (request: NextRequest) => { {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }
  
  // Check if this session has already been processed to prevent duplicate emails
  if (processedSessions.has(sessionId)) {
    console.log(`Session ${sessionId} already processed. Preventing duplicate processing.`);
    return NextResponse.json({ 
      success: true, 
      redirectTo: '/client',
      message: 'Order already processed. Redirecting to your dashboard...'
    });
  }
  
  // Mark this session as being processed
  processedSessions.add(sessionId);
  
  try {
    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata || {};

    // Extract metadata
    const {
      orderId,
      fullName,
      email,
      dateOfBirth,
      testSlug,
      stripePriceId,
      notes,
      mobile,
      createAccount,
      password
    } = metadata;

    // Fetch the order
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Transactional logic
    let welcomeEmailShouldBeSent = false;
    let welcomeEmailParams: {
      email: string;
      name: string;
      password: string;
      orderId: string;
      testName: string;
    } | null = null;
    // Get testName directly from metadata, fall back to static mapping if not available
    let testName = metadata.testName;
    
    // Fallback to static mapping for backward compatibility
    if (!testName && stripePriceId) {
      testName = STRIPE_PRICE_ID_TO_TEST_NAME[stripePriceId];
      if (!testName) {
        console.error('Could not find testName for stripePriceId:', stripePriceId);
        // Continue anyway, don't block the order completion
        testName = 'Blood Test'; // Generic fallback
      }
    }
    
    console.log('Order details:', {
      orderId,
      testName,
      email,
      fullName,
      createAccount: createAccount === 'true' ? 'Yes' : 'No'
    });

    await prisma.$transaction(async (tx) => {
      let clientUser = null;
      let newPatientSessionToken: string | undefined = undefined;
      if (createAccount === 'true' && email && password) {
        // Check if user exists
        clientUser = await findClientUserByEmail(email);
        if (!clientUser) {
          clientUser = await createClientUser({
            email,
            name: fullName,
            password,
            dateOfBirth
          });
          // Mark to send welcome email after transaction
          welcomeEmailShouldBeSent = true;
          welcomeEmailParams = {
            email,
            name: fullName,
            password,
            orderId,
            testName: testName
          };
        }
        // Generate session token for new patient
        if (clientUser && clientUser.id && clientUser.email) {
          // @ts-expect-error - Module resolution in Next.js doesn't require extensions despite TypeScript config
          const { generateSessionToken, setAuthCookie } = await import('../../../lib/auth');
          newPatientSessionToken = await generateSessionToken({
            id: clientUser.id,
            email: clientUser.email,
            role: 'PATIENT',
            stripeCustomerId: clientUser.stripeCustomerId || undefined,
          });
          setAuthCookie(newPatientSessionToken, true);
        }
      }

      // Save address to Supabase (example, adapt as needed)
      if (order.shippingAddress) {
        await supabase.from('addresses').insert({
          user_email: email,
          ...(typeof order.shippingAddress === 'object' ? order.shippingAddress as any : {}),
        });
      }

      // Update order with finalized status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          clientId: clientUser?.id,
        },
      });
    });

    // Send emails using testName and shippingAddress object - SINGLE EMAIL BLOCK
    console.log('Starting email sequence for order:', orderId);
    
    try {
      // Track email sending to prevent duplicates
      const emailTracker = new Set<string>();
      
      // 1. Send payment confirmation email to customer
      const customerEmailKey = `payment_confirmation_${email}`;
      if (!emailTracker.has(customerEmailKey)) {
        await sendPaymentConfirmationEmail({
          fullName,
          email,
          testName: testName,
          orderId,
          shippingAddress: order.shippingAddress && typeof order.shippingAddress === 'object' && order.shippingAddress !== null ? (order.shippingAddress as any) : undefined,
        });
        emailTracker.add(customerEmailKey);
        console.log('EMAIL 1/3: Payment confirmation email sent to', email);
      }
      
      // 2. Send order notification to admin
      const adminEmailKey = `order_notification_${orderId}`;
      if (!emailTracker.has(adminEmailKey)) {
        await sendOrderNotificationEmail({
          fullName,
          email,
          dateOfBirth,
          testName: testName,
          notes,
          orderId,
          shippingAddress: order.shippingAddress && typeof order.shippingAddress === 'object' && order.shippingAddress !== null ? (order.shippingAddress as any) : undefined,
        });
        emailTracker.add(adminEmailKey);
        console.log('EMAIL 2/3: Order notification email sent to admin for', email);
      }
      
      // 3. Send welcome email if this is a new account
      if (welcomeEmailShouldBeSent && welcomeEmailParams) {
        // Type assertion to ensure TypeScript knows this is not null
        const params = welcomeEmailParams as {
          email: string;
          name: string;
          password: string;
          orderId: string;
          testName: string;
        };
        
        const welcomeEmailKey = `welcome_${params.email}`;
        if (!emailTracker.has(welcomeEmailKey)) {
          await sendWelcomeEmail({
            email: params.email,
            name: params.name,
            password: params.password,
            orderId: params.orderId,
            testName: params.testName
          });
          emailTracker.add(welcomeEmailKey);
          console.log('EMAIL 3/3: Welcome email sent to', params.email);
        }
      } else {
        console.log('Welcome email not needed - user already exists or no account created');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      // Don't throw here - we still want to redirect the user even if email sending fails
    }

    // Always redirect to the order success page first
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${request.headers.get('host') || 'localhost:3000'}`;
    
    // Pass the account creation status to the success page
    return NextResponse.json({ 
      success: true, 
      redirectTo: '/order-success',
      accountCreated: createAccount === 'true',
      message: 'Order completed successfully!'
    });
  } catch (error) {
    console.error('Error finalizing order:', error);
    return NextResponse.json({ error: 'Failed to finalize order' }, { status: 500 });
  }
}

}