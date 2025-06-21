import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { mockBloodTests } from '../../../lib/mock-data';

// Cache control settings
const CACHE_MAX_AGE = 60 * 60; // 1 hour in seconds

// Fallback Stripe key for production
const FALLBACK_STRIPE_KEY = process.env.NEXT_PUBLIC_FALLBACK_STRIPE_KEY;

// Helper function to safely initialize Stripe
function getStripeClient(): Stripe | null {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || FALLBACK_STRIPE_KEY;
    
    if (!stripeKey) {
      console.warn('Missing Stripe secret key - products API will use mock data');
      return null;
    }
    
    return new Stripe(stripeKey, {
      apiVersion: '2022-11-15' as any, // Using type assertion to avoid TypeScript errors
    });
  } catch (error) {
    console.warn('Failed to initialize Stripe client - products API will use mock data:', error);
    return null;
  }
}

// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  console.log('GET /api/products - Fetching blood test products');
  console.log('Request URL:', request.url);
  
  try {
    // Check if we have a Stripe key
    const hasStripeKey = !!(process.env.STRIPE_SECRET_KEY || FALLBACK_STRIPE_KEY);
    console.log('Stripe API key present:', hasStripeKey);
    
    // Initialize Stripe client
    const stripe = getStripeClient();
    
    if (!stripe) {
      console.warn('Using mock data due to missing Stripe configuration');
      return NextResponse.json(mockBloodTests, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Fetch all active products from Stripe with expanded price data
    console.log('Fetching active products from Stripe with expanded price data...');
    const productsResponse = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ['data.default_price']
    });
    
    console.log(`Found ${productsResponse.data.length} total active products`);
    
    // Filter for blood test products only
    const bloodTestProducts = productsResponse.data.filter(
      (product) => product.metadata?.type === 'blood_test'
    );
    
    console.log(`Found ${bloodTestProducts.length} blood test products`);
    
    // If no blood test products found, return mock data
    if (bloodTestProducts.length === 0) {
      console.log('No blood test products found, returning mock data');
      return NextResponse.json(mockBloodTests, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Format the response as requested
    const formattedProducts = bloodTestProducts.map(product => {
      const price = product.default_price as Stripe.Price;
      const priceAmount = price?.unit_amount ? (price.unit_amount / 100).toFixed(2) : '0.00';
      
      return {
        value: product.id,
        label: `${product.name} - $${priceAmount}`,
        // Include additional data that might be useful for the frontend
        price_id: price?.id || '',
        price_amount: price?.unit_amount || 0,
        description: product.description || '',
        image: product.images?.[0] || ''
      };
    });
    
    console.log(`Successfully formatted ${formattedProducts.length} blood test products`);
    
    // Return the formatted blood test products
    return NextResponse.json(formattedProducts, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching blood test products:', error);
    
    // Always return JSON even in error cases
    return NextResponse.json(
      { 
        error: 'Failed to fetch blood test products',
        message: error instanceof Error ? error.message : 'Unknown error',
        fallback: true,
        products: [] // Don't return mock data in error case as requested
      },
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
