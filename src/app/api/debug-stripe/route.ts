// /src/app/api/debug-stripe/route.ts - Debug route for Stripe configuration
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  console.log('Stripe debug API route called');
  
  // Check if Stripe API key is available
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({
      error: 'Stripe API key is missing',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
  
  try {
    // Initialize Stripe with the API key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    // Get Stripe account info to verify the key works
    const account = await stripe.accounts.retrieve();
    
    // Get all products
    const productsResponse = await stripe.products.list({
      limit: 100,
      active: true,
    });
    
    // Filter for blood test products
    const bloodTestProducts = productsResponse.data.filter(
      (product) => product.metadata && product.metadata.type === 'blood_test'
    );
    
    // Get all prices
    const pricesResponse = await stripe.prices.list({
      limit: 100,
      active: true,
    });
    
    // Format products with their prices
    const formattedProducts = bloodTestProducts.map((product) => {
      const price = pricesResponse.data.find((p) => p.product === product.id);
      
      return {
        id: product.id,
        name: product.name,
        active: product.active,
        metadata: product.metadata || {},
        price: price
          ? {
              id: price.id,
              unit_amount: price.unit_amount,
              currency: price.currency,
            }
          : null,
      };
    });
    
    // Return Stripe configuration and products
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      stripeAccount: {
        id: account.id,
        email: account.email,
        country: account.country,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
      },
      products: {
        total: productsResponse.data.length,
        bloodTests: bloodTestProducts.length,
        withPrices: formattedProducts.filter((p) => p.price).length,
        active: formattedProducts.filter((p) => p.active).length,
      },
      bloodTestProducts: formattedProducts,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('Error in Stripe debug API:', error);
    
    return NextResponse.json({
      error: error.message || 'An unknown error occurred',
      type: error.type || 'unknown',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      stripeKeyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 8) + '...' : 'missing',
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}
