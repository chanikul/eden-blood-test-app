import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Check if Stripe key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const hasValidStripeKey = stripeSecretKey && stripeSecretKey.startsWith('sk_');

// Initialize Stripe with the secret key if available
const stripe = hasValidStripeKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15', // Using the version expected by the type definition
}) : null;

// Mock data for fallback
const mockProducts = [
  {
    id: 'mock_prod_1',
    name: 'Complete Blood Count',
    description: 'Comprehensive blood test that checks for a variety of conditions',
    price: 9900,
    stripePriceId: 'price_mock_1', // Using price_prefix for mock data too
    isActive: true,
    slug: 'complete-blood-count',
  },
  {
    id: 'mock_prod_2',
    name: 'Liver Function Test',
    description: 'Checks how well your liver is working',
    price: 7900,
    stripePriceId: 'price_mock_2', // Using price_prefix for mock data too
    isActive: true,
    slug: 'liver-function-test',
  },
  {
    id: 'mock_prod_3',
    name: 'Hormone Panel',
    description: 'Comprehensive hormone level testing',
    price: 12900,
    stripePriceId: 'price_mock_3', // Using price_prefix for mock data too
    isActive: true,
    slug: 'hormone-panel',
  }
];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET handler for fetching active blood test products
export async function GET() {
  try {
    // Add CORS headers to the response
    const headers = { ...corsHeaders };

    // Log environment status
    console.log('=== STRIPE ENVIRONMENT CHECK ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Has valid Stripe key:', hasValidStripeKey ? 'Yes' : 'No');
    
    // If we don't have a valid Stripe key, throw an error to use mock data
    if (!hasValidStripeKey || !stripe) {
      console.log('No valid Stripe key found, using mock data');
      throw new Error('Missing or invalid Stripe API key');
    }

    // Fetch all products from Stripe with expanded price data
    const { data: products } = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    console.log(`Fetched ${products.length} products from Stripe`);

    // Filter for blood test products and format the response
    const bloodTestProducts = products
      .filter(product => {
        // Check if product has metadata indicating it's a blood test
        const isBloodTest = product.metadata && product.metadata.type === 'blood_test';
        if (!isBloodTest) {
          console.log(`Skipping product ${product.id} (${product.name}): Not a blood test`);
        }
        return isBloodTest;
      })
      .map(product => {
        // Get the price object
        const price = product.default_price as Stripe.Price;
        const priceId = price?.id || '';
        
        // Log price information for debugging
        if (!priceId || !priceId.startsWith('price_')) {
          console.log(`Warning: Product ${product.id} (${product.name}) has invalid price ID: ${priceId}`);
        }
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: price?.unit_amount || 0,
          stripePriceId: priceId,
          isActive: product.active,
          slug: product.metadata?.slug || product.id.toLowerCase(),
        };
      });

    console.log(`Found ${bloodTestProducts.length} blood test products`);
    console.log(`Products with valid price IDs: ${bloodTestProducts.filter(p => p.stripePriceId && p.stripePriceId.startsWith('price_')).length}`);

    // If no valid blood tests found, use mock data
    if (bloodTestProducts.length === 0) {
      console.log('No blood test products found in Stripe, using mock data');
      return NextResponse.json(mockProducts, { headers });
    }

    // Return the formatted blood test products
    return NextResponse.json(bloodTestProducts, { headers });
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    
    // Return mock data as fallback with clear indication it's mock data
    console.log('Returning mock blood test data due to error');
    return NextResponse.json(mockProducts, {
      headers: corsHeaders,
      status: 200,
    });
  }
}
