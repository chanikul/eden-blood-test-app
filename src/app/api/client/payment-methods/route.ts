import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getClientSession } from '../../../../lib/auth/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function GET(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.clientUser.findUnique({
      where: { id: session.id },
      select: { stripeCustomerId: true },
    });

    if (!client?.stripeCustomerId) {
      return NextResponse.json([]);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: client.stripeCustomerId,
      type: 'card',
    });

    // Get default payment method
    const customer = await stripe.customers.retrieve(client.stripeCustomerId);
    const defaultPaymentMethodId = typeof customer === 'object' ? customer.invoice_settings?.default_payment_method : null;

    const formattedPaymentMethods = paymentMethods.data.map(method => ({
      id: method.id,
      type: method.type,
      brand: method.card?.brand,
      last4: method.card?.last4,
      expMonth: method.card?.exp_month,
      expYear: method.card?.exp_year,
      isDefault: method.id === defaultPaymentMethodId,
    }));

    return NextResponse.json(formattedPaymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { paymentMethodId } = data;

    let client = await prisma.clientUser.findUnique({
      where: { id: session.id },
      select: { stripeCustomerId: true, email: true },
    });

    // Create Stripe customer if it doesn't exist
    if (!client?.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client?.email || session.email,
        metadata: {
          clientId: session.id,
        },
      });

      await prisma.clientUser.update({
        where: { id: session.id },
        data: { stripeCustomerId: customer.id },
      });

      client = {
        ...client,
        stripeCustomerId: customer.id,
      };
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: client.stripeCustomerId,
    });

    // Set as default if it's the first payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: client.stripeCustomerId,
      type: 'card',
    });

    if (paymentMethods.data.length === 1) {
      await stripe.customers.update(client.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { paymentMethodId } = data;

    const client = await prisma.clientUser.findUnique({
      where: { id: session.id },
      select: { stripeCustomerId: true },
    });

    if (!client?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Verify payment method belongs to customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== client.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Set as default payment method
    await stripe.customers.update(client.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const client = await prisma.clientUser.findUnique({
      where: { id: session.id },
      select: { stripeCustomerId: true },
    });

    if (!client?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Verify payment method belongs to customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== client.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Check if it's the default payment method
    const customer = await stripe.customers.retrieve(client.stripeCustomerId);
    if (typeof customer === 'object' && customer.invoice_settings?.default_payment_method === paymentMethodId) {
      return NextResponse.json(
        { error: 'Cannot delete default payment method' },
        { status: 400 }
      );
    }

    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
