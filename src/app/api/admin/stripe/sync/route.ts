export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { syncStripeProducts } from '../../../../../lib/services/stripe';
import { getServerSession } from '../../../../../lib/auth';

export const POST = async () => {
  console.log('Starting sync request...');
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('STRIPE_SECRET_KEY is not set - Stripe sync functionality will be disabled');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    console.log('Getting server session...');
    const session = await getServerSession();
    console.log('Session:', session);
    
    if (!session?.user) {
      console.log('No session user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Calling syncStripeProducts...');
    const result = await syncStripeProducts();
    console.log('Sync result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing Stripe products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        error: 'Failed to sync Stripe products',
        details: errorMessage,
        env: process.env.NODE_ENV,
        stripeKeySet: !!process.env.STRIPE_SECRET_KEY
      },
      { status: 500 }
    );
  }
}
