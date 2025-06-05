import { NextRequest, NextResponse } from 'next/server';
import { syncStripeProducts } from '../../../../lib/services/stripe';
import { verifySessionToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';

// Force dynamic route to prevent static optimization
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const runtime = 'nodejs'

export const POST = async (request: NextRequest) => {
  try {
    console.log('\n=== SYNCING STRIPE PRODUCTS ===');

    // Bypass auth check for local development
    if (process.env.NODE_ENV === 'production') {
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
    } else {
      console.log('Bypassing auth check for local development');
    }

    console.log('Starting sync with Stripe...');
    const result = await syncStripeProducts();
    console.log('Sync completed:', result);

    const summary = {
      success: result.success,
      message: result.message,
      details: {
        created: result.products.filter(p => p.status === 'created').length,
        updated: result.products.filter(p => p.status === 'updated').length,
        archived: result.products.filter(p => p.status === 'archived').length,
      },
      products: result.products.map(p => ({
        name: p.name,
        status: p.status,
        oldPrice: p.oldPrice ? (p.oldPrice / 100).toFixed(2) : undefined,
        newPrice: (p.newPrice / 100).toFixed(2),
      })),
    };

    //   price: test.price,
    //   stripePriceId: test.stripePriceId,
    // })));

    return NextResponse.json({
      message: `Sync completed: ${summary.details.created} created, ${summary.details.updated} updated, ${summary.details.archived} archived`,
      success: summary.success,
      details: summary.details,
      products: summary.products,
    });
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
