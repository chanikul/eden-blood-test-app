import { NextRequest, NextResponse } from 'next/server';
import { getPatientFromToken } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import Stripe from 'stripe';
import { getSupabaseClient } from '../../../lib/supabase-client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export const POST = async (request) => { {
  console.log('=== PAYMENT METHODS API DEBUG ===');
  try {
    const patient = await getPatientFromToken();
    if (!patient) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentMethodId, billingAddress } = await request.json();

    // Attach payment method to customer
    const stripeCustomerId = patient.stripeCustomerId || await createStripeCustomer(patient);
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // If billingAddress is provided, save it to the user's addresses (Supabase or Prisma)
    if (billingAddress) {
      // Save to Supabase 'addresses' table if available, otherwise Prisma
      try {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
          // Use the already imported Supabase client singleton
          const supabase = getSupabaseClient();
          await supabase.from('addresses').insert({
            user_email: patient.email,
            ...billingAddress
          });
        } else {
          // Save to Prisma Address model
          await prisma.address.create({
            data: {
              type: 'BILLING',
              name: billingAddress.name || 'Billing Address',
              line1: billingAddress.line1,
              line2: billingAddress.line2 || null,
              city: billingAddress.city,
              postcode: billingAddress.postalCode,
              country: billingAddress.country,
              isDefault: true,
              clientId: patient.id
            }
          });
        }
      } catch (err) {
        console.error('Failed to save billing address:', err);
      }
    }

    // Set as default payment method if it's the first one
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    if (paymentMethods.data.length === 1) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Update patient's stripeCustomerId if it was just created
    if (!patient.stripeCustomerId) {
      await prisma.clientUser.update({
        where: { id: patient.id },
        data: { stripeCustomerId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add payment method' },
      { status: 500 }
    );
  }
}

export const GET = async (request) => { {
  try {
    const patient = await getPatientFromToken();
    if (!patient || !patient.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: patient.stripeCustomerId,
      type: 'card',
    });

    const customer = await stripe.customers.retrieve(patient.stripeCustomerId) as Stripe.Customer;
    const defaultPaymentMethodId = customer.invoice_settings.default_payment_method;

    return NextResponse.json({
      paymentMethods: paymentMethods.data.map(method => ({
        id: method.id,
        type: method.type,
        brand: method.card?.brand,
        last4: method.card?.last4,
        expMonth: method.card?.exp_month,
        expYear: method.card?.exp_year,
        isDefault: method.id === defaultPaymentMethodId,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

export const DELETE = async (request) => { {
  try {
    const patient = await getPatientFromToken();
    if (!patient) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentMethodId } = await request.json();
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}

async function createStripeCustomer(patient: any) {
  const customer = await stripe.customers.create({
    email: patient.email,
    name: `${patient.firstName} ${patient.lastName}`,
    metadata: {
      patientId: patient.id,
    },
  });
  return customer.id;
}

}