import { NextResponse } from 'next/server';
import { syncStripeProducts } from '@/lib/services/stripe';
import { getServerSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await syncStripeProducts();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing Stripe products:', error);
    return NextResponse.json(
      { error: 'Failed to sync Stripe products' },
      { status: 500 }
    );
  }
}
