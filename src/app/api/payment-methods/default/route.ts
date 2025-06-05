import { NextRequest, NextResponse } from 'next/server';
import { getPatientFromToken } from '../../../../lib/auth';
import { PatientUser } from '../../../../lib/types/patient';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export const POST = async (request) => { {
  try {
    const patient = await getPatientFromToken();
    if (!patient) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const patientUser = patient as unknown as PatientUser;
    if (!patientUser.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentMethodId } = await request.json();

    await stripe.customers.update(patientUser.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set default payment method' },
      { status: 500 }
    );
  }
}

}