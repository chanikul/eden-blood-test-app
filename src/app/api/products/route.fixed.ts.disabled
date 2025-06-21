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
      console.error('Missing Stripe secret key');
      return null;
    }
    
    return new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
    });
  } catch (error) {
    console.error('Failed to initialize Stripe client:', error);
    return null;
  }
}

export async function GET() {
  console.log('GET /api/products - Fetching blood test products');
  
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
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Fetch all active products from Stripe
    console.log('Fetching products from Stripe...');
    const productsResponse = await stripe.products.list({
      active: true,
      limit: 100,
    });
    
    console.log(`Found ${productsResponse.data.length} total products`);
    
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
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Fetch prices for each product
    const bloodTestsWithPrices = await Promise.all(
      bloodTestProducts.map(async (product) => {
        try {
          const pricesResponse = await stripe.prices.list({
            product: product.id,
            active: true,
          });
          
          const price = pricesResponse.data[0];
          
          return {
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: price ? price.unit_amount : 0,
            priceId: price ? price.id : '',
            image: product.images?.[0] || '',
            metadata: product.metadata || {},
          };
        } catch (priceError) {
          console.error(`Error fetching price for product ${product.id}:`, priceError);
          return {
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: 0,
            priceId: '',
            image: product.images?.[0] || '',
            metadata: product.metadata || {},
          };
        }
      })
    );
    
    console.log(`Successfully processed ${bloodTestsWithPrices.length} blood test products with prices`);
    
    // Return the blood tests with prices
    return NextResponse.json(bloodTestsWithPrices, {
      status: 200,
      headers: {
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
        products: mockBloodTests 
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
