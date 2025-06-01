import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createClientUser, findClientUserByEmail } from '@/lib/services/client-user';
import { sendOrderNotificationEmail, sendPaymentConfirmationEmail } from '@/lib/services/email';
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
      testName,
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
        }
        // Generate session token for new patient
        if (clientUser && clientUser.id && clientUser.email) {
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
          ...(typeof order.shippingAddress === 'object' ? order.shippingAddress : {}),
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

    // Send emails
    await Promise.all([
      sendPaymentConfirmationEmail({
        fullName,
        email,
        testName,
        orderId,
        shippingAddress: order.shippingAddress ? JSON.stringify(order.shippingAddress) : undefined,
      }),
      sendOrderNotificationEmail({
        fullName,
        email,
        dateOfBirth,
        testName,
        notes,
        orderId,
        shippingAddress: order.shippingAddress ? JSON.stringify(order.shippingAddress) : undefined,
      })
    ]);

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
