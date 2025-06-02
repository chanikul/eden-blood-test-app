import { NextResponse } from 'next/server';

// NOTE: We no longer use static mapping since testName is now included in the metadata
// This is kept for backward compatibility with older sessions
const STRIPE_PRICE_ID_TO_TEST_NAME: Record<string, string> = {
  'price_1RVUrBEaVUA3G0SJzJoO7QPZ': 'Essential Blood Test',
  'price_1RVUzMEaVUA3G0SJW3z1Y0XC': 'Advanced Blood Test',
  'price_1RVV0REaVUA3G0SJmLsgKQOB': 'Premium Blood Test',
  'price_1RVV1kEaVUA3G0SJ6lU2ddyJ': 'Ultimate Blood Test',
};

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createClientUser, findClientUserByEmail } from '@/lib/services/client-user';
import { sendOrderNotificationEmail, sendPaymentConfirmationEmail } from '@/lib/services/email';
import { sendWelcomeEmail } from '@/lib/services/email';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' });

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

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

    // Send emails using testName and shippingAddress object
    const emailPromises = [
      sendPaymentConfirmationEmail({
        fullName,
        email,
        testName: testName,
        orderId,
        shippingAddress: order.shippingAddress && typeof order.shippingAddress === 'object' && order.shippingAddress !== null ? (order.shippingAddress as any) : undefined,
      }).then(() => {
        console.log('EMAIL 1/3: Payment confirmation email sent to', email);
      }),
      sendOrderNotificationEmail({
        fullName,
        email,
        dateOfBirth,
        testName: testName,
        notes,
        orderId,
        shippingAddress: order.shippingAddress && typeof order.shippingAddress === 'object' && order.shippingAddress !== null ? (order.shippingAddress as any) : undefined,
      }).then(() => {
        console.log('EMAIL 2/3: Order notification email sent to admin for', email);
      })
    ];
    if (welcomeEmailShouldBeSent && welcomeEmailParams) {
      emailPromises.push(
        (async () => {
          await sendWelcomeEmail(welcomeEmailParams!);
          console.log('EMAIL 3/3: Welcome email sent to', (welcomeEmailParams as any).email);
        })()
      );
    }
    await Promise.all(emailPromises);

    // Redirect to dashboard or login (must use absolute URL)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${request.headers.get('host') || 'localhost:3000'}`;
    const redirectPath = createAccount === 'true' ? '/client' : `/login?email=${encodeURIComponent(email)}`;
    const absoluteRedirectUrl = baseUrl.replace(/\/$/, '') + redirectPath;
    return NextResponse.redirect(absoluteRedirectUrl);
  } catch (error) {
    console.error('Error finalizing order:', error);
    return NextResponse.json({ error: 'Failed to finalize order' }, { status: 500 });
  }
}
