import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

// Mock data for fallback
const mockProducts = [
  {
    id: 'mock_prod_1',
    name: 'Complete Blood Count',
    description: 'Comprehensive blood test that checks for a variety of conditions',
    price: 9900,
    stripePriceId: 'mock_price_1',
    isActive: true,
    slug: 'complete-blood-count',
  },
  {
    id: 'mock_prod_2',
    name: 'Liver Function Test',
    description: 'Checks how well your liver is working',
    price: 7900,
    stripePriceId: 'mock_price_2',
    isActive: true,
    slug: 'liver-function-test',
  },
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

    // Fetch all products from Stripe with expanded price data
    const { data: products } = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    // Filter for blood test products and format the response
    const bloodTestProducts = products
      .filter(product => {
        // Check if product has metadata indicating it's a blood test
        return product.metadata.type === 'blood_test';
      })
      .map(product => {
        // Get the price object
        const price = product.default_price as Stripe.Price;
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: price?.unit_amount || 0,
          stripePriceId: price?.id || '',
          isActive: product.active,
          slug: product.metadata.slug || product.id.toLowerCase(),
        };
      });

    // Return the formatted blood test products
    return NextResponse.json(bloodTestProducts, { headers });
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    
    // Return mock data as fallback
    return NextResponse.json(mockProducts, {
      headers: corsHeaders,
      status: 200,
    });
  }
}
