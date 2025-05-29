import { NextResponse } from 'next/server';
import { getPatientFromToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(request: Request) {
  console.log('=== PAYMENT METHODS API DEBUG ===');
  try {
    const patient = await getPatientFromToken();
    if (!patient) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentMethodId } = await request.json();

    // Attach payment method to customer
    const stripeCustomerId = patient.stripeCustomerId || await createStripeCustomer(patient);
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

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

export async function GET(request: Request) {
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

export async function DELETE(request: Request) {
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
