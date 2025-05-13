import { NextResponse } from 'next/server';
import { syncStripeProducts } from '@/lib/services/stripe';
import { verifySessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Force dynamic route to prevent static optimization
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    console.log('\n=== SYNCING STRIPE PRODUCTS ===');

    // Check if user is authenticated as admin
    const cookieStore = cookies();
    const token = cookieStore.get('eden_admin_token')?.value;
    if (!token) {
      console.log('No auth token found');
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    // Verify the token
    const user = verifySessionToken(token);
    if (!user) {
      console.log('Invalid auth token');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('Starting sync with Stripe...');
    const result = await syncStripeProducts();
    console.log('Sync completed:', result);

    // Verify database state after sync
    // const activeTests = await prisma.bloodTest.findMany({
    //   where: { isActive: true },
    // });
    // console.log('\nActive blood tests after sync:', activeTests.map(test => ({
    //   name: test.name,
    //   price: test.price,
    //   stripePriceId: test.stripePriceId,
    // })));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync Stripe products',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
